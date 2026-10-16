import { describe, expect, it } from 'vitest'
import { ADMIN_A, CHILD_A, FIXED_NOW } from '../test/fixtures'
import { makeLegacyFamily } from '../test/legacyDatabase'
import { migrateLegacyFamily } from './migration'

describe('lossless v1 family transformation', () => {
  it('preserves identities, raw fields, known schedules and generated timestamp provenance', () => {
    const input = makeLegacyFamily()
    const untouched = structuredClone(input)
    const family = migrateLegacyFamily(input, FIXED_NOW)
    expect(input).toEqual(untouched)
    const child = family.profiles.find(profile => profile.id === CHILD_A)!
    expect(child.primaryScheduleId).toBe('CO-PAI-PRIMARY-6-12-18-WEEKS-2026')
    expect(child.createdAt).toBe(input.profiles[0].createdAt)
    expect(child.legacy?.raw).toEqual(input.profiles[0])
    const administration = family.administrations.find(record => record.id === ADMIN_A)!
    expect(administration).toMatchObject({ childId: CHILD_A, appliedDate: '2026-03-14', productName: 'Vacuna escrita', provider: 'IPS familiar', lot: 'lote-1', brand: 'Marca libre', notes: 'Nota capturada', accessType: 'unknown', paiwebStatus: 'unknown', coverageStatus: 'needs-review', coveredRequirementIds: [], createdAt: input.doses[0].createdAt })
    expect(administration.doseNumber).toBeUndefined()
    expect(administration.legacy?.raw).toEqual(input.doses[0])
    expect(administration.legacy?.generatedTimestamps).toBe(true)
    expect(family.administrations.some(record => record.id === 'similar-second-id')).toBe(true)
    expect(family.administrations.every(record => record.coverageStatus === 'needs-review' && record.coveredRequirementIds.length === 0)).toBe(true)
  })

  it('keeps missing schedules pending and invalid/orphan rows in their own issues', () => {
    const input = makeLegacyFamily()
    const family = migrateLegacyFamily(input, FIXED_NOW)
    expect(family.profiles.find(profile => profile.id === 'pending')).toMatchObject({ primaryScheduleId: null, migrationStatus: 'needs-schedule-choice' })
    expect(family.migrationIssues.find(issue => issue.id === 'profile:invalid-birth')?.raw).toEqual(input.profiles[3])
    expect(family.migrationIssues.find(issue => issue.id === 'administration:orphan')).toMatchObject({ entityId: 'orphan', childId: 'missing', reasons: ['missing-profile'], raw: input.doses[4] })
    expect(family.migrationIssues.find(issue => issue.id === 'administration:invalid-date')?.reasons).toContain('invalid-date')
    expect(family.administrations.find(record => record.id === 'future')?.reviewReasons).toContain('future-date')
    expect(family.administrations.find(record => record.id === 'before-birth')?.reviewReasons).toContain('before-birth')
    expect(family.profiles.length + family.migrationIssues.filter(issue => issue.kind === 'profile').length).toBe(input.profiles.length)
    expect(family.administrations.length + family.migrationIssues.filter(issue => issue.kind === 'administration').length).toBe(input.doses.length)
  })

  it('does not overwrite duplicate legacy identifiers', () => {
    const input = makeLegacyFamily()
    input.doses.push({ ...input.doses[0], vaccine: 'Otro contenido' })
    expect(() => migrateLegacyFamily(input, FIXED_NOW)).toThrow('invalid-legacy-id')
  })
})
