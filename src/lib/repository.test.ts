import Dexie, { liveQuery } from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CURRENT_CATALOG_VERSION, getCatalog } from '../data/catalog'
import { ADMIN_A, CHILD_A, CHILD_B, FIXED_NOW, FIXED_TODAY, makeAdministration, makeProfile } from '../test/fixtures'
import { makeLegacyFamily, seedLegacyDatabase } from '../test/legacyDatabase'
import { openDatabase, REVISION_KEY, type VaccineDB } from './db'
import { changeCatalogVersion, clearFamily, deleteAdministration, deleteMigrationIssue, deleteProfile, readFamily, repairMigrationIssue, saveAdministration, saveProfile, setPreference } from './repository'
import type { AdministrationCommand, AdministrationInput, MutationContext, ProfileCommand } from './types'

let sequence = 0
let db: VaccineDB
let name: string
const context: MutationContext = { today: FIXED_TODAY, now: FIXED_NOW, catalog: getCatalog(CURRENT_CATALOG_VERSION)! }
const profileCommand: ProfileCommand = { id: CHILD_A, mode: 'create', input: { nickname: 'Luna', birthDate: '2026-01-31', primaryScheduleId: 'CO-PAI-PRIMARY-6-12-18-WEEKS-2026' } }
const administrationInput: AdministrationInput = { productId: 'unidentified', productName: 'Carné manual', appliedDate: '2026-03-14', accessType: 'unknown', paiwebStatus: 'unknown', brand: 'Marca', lot: 'Lote', provider: 'IPS', notes: 'Nota' }
const administrationCommand: AdministrationCommand = { id: ADMIN_A, childId: CHILD_A, mode: 'create', input: administrationInput }

beforeEach(async () => {
  name = `test-repository-${++sequence}`
  db = await openDatabase(name)
})
afterEach(async () => { db.close(); await Dexie.delete(name) })

describe('profile-scoped atomic writes', () => {
  it('makes create retries idempotent and rejects a different payload under the same ID', async () => {
    const firstProfile = await saveProfile(db, profileCommand, context)
    expect(await saveProfile(db, profileCommand, { ...context, now: '2026-10-16T16:00:00.000Z' })).toEqual(firstProfile)
    const first = await saveAdministration(db, administrationCommand, context)
    expect(await saveAdministration(db, administrationCommand, { ...context, now: '2026-10-16T16:00:00.000Z' })).toEqual(first)
    expect(await db.administrations.count()).toBe(1)
    const before = await readFamily(db)
    await expect(saveAdministration(db, { ...administrationCommand, input: { ...administrationInput, lot: 'Otro' } }, context)).rejects.toThrow('conflict')
    await expect(saveProfile(db, { ...profileCommand, input: { ...profileCommand.input, nickname: 'Otra' } }, context)).rejects.toThrow('conflict')
    expect(await readFamily(db)).toEqual(before)
  })

  it('preserves creation and identity on edits while resolving coverage itself', async () => {
    await saveProfile(db, profileCommand, context)
    const original = await saveAdministration(db, administrationCommand, context)
    const edited = await saveAdministration(db, { ...administrationCommand, mode: 'edit', input: { ...administrationInput, productId: 'hexavalent-acellular', brand: 'Hexaxim', doseNumber: 1, milestoneId: 'primary-1' } }, { ...context, now: '2026-10-16T16:00:00.000Z' })
    expect(edited.id).toBe(original.id)
    expect(edited.createdAt).toBe(original.createdAt)
    expect(edited.updatedAt).toBe('2026-10-16T16:00:00.000Z')
    expect(edited.coverageStatus).toBe('verified')
    expect([...edited.coveredRequirementIds].sort()).toEqual(['ipv-1', 'penta-1'])
    expect(await db.administrations.count()).toBe(1)
  })

  it('keeps contradictory product and brand editable without granting coverage', async () => {
    await saveProfile(db, profileCommand, context)
    const event = await saveAdministration(db, { ...administrationCommand, input: { ...administrationInput, productId: 'hexavalent-acellular', brand: 'Rotarix', doseNumber: 1, milestoneId: 'primary-1' } }, context)
    expect(event.coverageStatus).toBe('needs-review')
    expect(event.coveredRequirementIds).toEqual([])
    expect(event.brand).toBe('Rotarix')
    expect(event.reviewReasons).toContain('unidentified-product')
  })

  it('captures A explicitly despite a later preference selecting B and rejects reassignment', async () => {
    await saveProfile(db, profileCommand, context)
    await saveProfile(db, { ...profileCommand, id: CHILD_B, input: { ...profileCommand.input, nickname: 'Sol' } }, context)
    await setPreference(db, 'activeProfileId', CHILD_B)
    expect((await saveAdministration(db, administrationCommand, context)).childId).toBe(CHILD_A)
    const before = await readFamily(db)
    await expect(saveAdministration(db, { ...administrationCommand, childId: CHILD_B, mode: 'edit' }, context)).rejects.toThrow('ownership-conflict')
    await expect(deleteAdministration(db, CHILD_B, ADMIN_A)).rejects.toThrow('ownership-conflict')
    expect(await readFamily(db)).toEqual(before)
    await deleteProfile(db, CHILD_A)
    await expect(saveAdministration(db, administrationCommand, context)).rejects.toThrow('missing-profile')
    expect(await db.administrations.count()).toBe(0)
    expect((await db.preferences.get('activeProfileId'))?.value).toBe(CHILD_B)
  })

  it.each([['2099-01-01', 'future-date'], ['2026-01-30', 'before-birth'], ['2026-02-30', 'invalid-date']])('rejects %s without a partial write', async (appliedDate, code) => {
    await saveProfile(db, profileCommand, context)
    const before = await readFamily(db)
    const operation = saveAdministration(db, { ...administrationCommand, input: { ...administrationInput, appliedDate } }, context)
    if (code === 'invalid-date') await expect(operation).rejects.toThrow()
    else await expect(operation).rejects.toThrow(code)
    expect(await readFamily(db)).toEqual(before)
  })

  it('rolls back an event when the revision write fails in the same transaction', async () => {
    await saveProfile(db, profileCommand, context)
    const before = await readFamily(db)
    const fail = (_changes: unknown, key: string) => { if (key === REVISION_KEY) throw new Error('injected-revision-failure') }
    db.preferences.hook('updating', fail)
    try { await expect(saveAdministration(db, administrationCommand, context)).rejects.toThrow('injected-revision-failure') }
    finally { db.preferences.hook('updating').unsubscribe(fail) }
    expect(await readFamily(db)).toEqual(before)
  })

  it('never rewrites physical administrations when birth, scheme or catalog changes', async () => {
    await saveProfile(db, profileCommand, context)
    await saveAdministration(db, administrationCommand, context)
    const before = await db.administrations.toArray()
    await saveProfile(db, { ...profileCommand, mode: 'edit', input: { ...profileCommand.input, birthDate: '2026-04-01', primaryScheduleId: 'CO-PAI-PRIMARY-2-4-6' } }, context)
    await changeCatalogVersion(db, CHILD_A, CURRENT_CATALOG_VERSION, context)
    expect(await db.administrations.toArray()).toEqual(before)
    await expect(changeCatalogVersion(db, CHILD_A, 'not-available', context)).rejects.toThrow('catalog-unavailable')
    expect(await db.administrations.toArray()).toEqual(before)
  })

  it('deletes only A and its issues/preferences, and clear keeps the revision monotonic', async () => {
    await db.profiles.bulkPut([makeProfile(), makeProfile({ id: CHILD_B, nickname: 'Sol' })])
    await db.administrations.bulkPut([makeAdministration(), makeAdministration({ id: 'administration-b', childId: CHILD_B })])
    await setPreference(db, 'activeProfileId', CHILD_A)
    await setPreference(db, `optional-products:${CHILD_A}`, ['rotateq'])
    await setPreference(db, `optional-products:${CHILD_B}`, [])
    await db.migrationIssues.bulkPut([
      { id: 'administration:issue-a', entityId: 'issue-a', childId: CHILD_A, kind: 'administration', raw: { id: 'issue-a' }, reasons: ['invalid-date'], migratedAt: FIXED_NOW },
      { id: 'administration:issue-b', entityId: 'issue-b', childId: CHILD_B, kind: 'administration', raw: { id: 'issue-b' }, reasons: ['invalid-date'], migratedAt: FIXED_NOW },
    ])
    await deleteProfile(db, CHILD_A)
    const family = await readFamily(db)
    expect(family.profiles.map(profile => profile.id)).toEqual([CHILD_B])
    expect(family.administrations.map(record => record.childId)).toEqual([CHILD_B])
    expect(family.migrationIssues.map(issue => issue.entityId)).toEqual(['issue-b'])
    expect(family.preferences.some(preference => preference.key === `optional-products:${CHILD_A}`)).toBe(false)
    await deleteMigrationIssue(db, 'administration:issue-b')
    const revision = (await readFamily(db)).revision
    await clearFamily(db)
    expect(await readFamily(db)).toEqual({ profiles: [], administrations: [], preferences: [], migrationIssues: [], revision: revision + 1 })
    await clearFamily(db)
    expect((await readFamily(db)).revision).toBe(revision + 2)
  })

  it('repairs one issue with the original ID and provenance; only orphan repair can choose a new child', async () => {
    db.close()
    await Dexie.delete(name)
    await seedLegacyDatabase(name, makeLegacyFamily())
    db = await openDatabase(name)
    const issueCount = await db.migrationIssues.count()
    const invalidCommand: AdministrationCommand = { ...administrationCommand, id: 'invalid-date', childId: CHILD_B }
    await expect(repairMigrationIssue(db, 'administration:invalid-date', invalidCommand, context)).rejects.toThrow('ownership-conflict')
    await expect(repairMigrationIssue(db, 'administration:orphan', { ...administrationCommand, id: 'different-id' }, context)).rejects.toThrow('identity-conflict')
    await repairMigrationIssue(db, 'administration:orphan', { ...administrationCommand, id: 'orphan', childId: CHILD_B }, context)
    expect(await db.administrations.get('orphan')).toMatchObject({ id: 'orphan', childId: CHILD_B, legacy: { raw: makeLegacyFamily().doses[4] } })
    expect(await db.migrationIssues.count()).toBe(issueCount - 1)
    const before = await readFamily(db)
    await expect(repairMigrationIssue(db, 'administration:invalid-date', { ...administrationCommand, id: 'invalid-date', input: { ...administrationInput, appliedDate: '2099-01-01' } }, context)).rejects.toThrow('future-date')
    expect(await readFamily(db)).toEqual(before)
  })

  it('publishes committed snapshots through real Dexie liveQuery', async () => {
    let resolveInitial!: () => void
    let resolveChanged!: () => void
    const initial = new Promise<void>(resolve => { resolveInitial = resolve })
    const changed = new Promise<void>(resolve => { resolveChanged = resolve })
    const subscription = liveQuery(() => readFamily(db)).subscribe(snapshot => {
      if (snapshot.revision === 0) resolveInitial()
      if (snapshot.profiles.some(profile => profile.id === CHILD_A) && snapshot.revision === 1) resolveChanged()
    })
    try { await initial; await saveProfile(db, profileCommand, context); await changed }
    finally { subscription.unsubscribe() }
  })
})
