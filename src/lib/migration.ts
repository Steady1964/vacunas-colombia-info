import { CURRENT_CATALOG_VERSION, UNIDENTIFIED_PRODUCT_ID } from '../data/catalog'
import { parseCivilDate, todayCivil } from './civilDate'
import { timestampSchema } from './schemas'
import type { FamilySnapshot, JsonObject, LegacyFamilyV1, LegacyMetadata, MigrationIssue, ReviewReason, StoredProfile, Timestamp } from './types'

export function migrateLegacyFamily(input: LegacyFamilyV1, migratedAt: Timestamp): FamilySnapshot {
  timestampSchema.parse(migratedAt)
  const today = todayCivil(new Date(migratedAt))
  const snapshot: FamilySnapshot = { profiles: [], administrations: [], preferences: [], migrationIssues: [], revision: 0 }
  const seenProfiles = new Set<string>()
  const seenAdministrations = new Set<string>()
  function identity(raw: JsonObject, seen: Set<string>): string {
    if (typeof raw.id !== 'string' || !raw.id || seen.has(raw.id)) throw new Error('invalid-legacy-id')
    seen.add(raw.id)
    return raw.id
  }
  function issue(kind: MigrationIssue['kind'], id: string, raw: JsonObject, reasons: ReviewReason[], childId?: string): void {
    snapshot.migrationIssues.push({ id: `${kind}:${id}`, kind, entityId: id, ...(childId ? { childId } : {}), raw: structuredClone(raw), reasons, migratedAt })
  }
  function provenance(raw: JsonObject): { createdAt: Timestamp; updatedAt: Timestamp; legacy: LegacyMetadata } {
    const created = timestampSchema.safeParse(raw.createdAt)
    const updated = timestampSchema.safeParse(raw.updatedAt)
    return {
      createdAt: created.success ? created.data : migratedAt,
      updatedAt: updated.success ? updated.data : created.success ? created.data : migratedAt,
      legacy: { raw: structuredClone(raw), migratedAt, generatedTimestamps: !created.success || !updated.success },
    }
  }
  for (const raw of input.profiles) {
    const id = identity(raw, seenProfiles)
    try { parseCivilDate(String(raw.birthDate)) } catch { issue('profile', id, raw, ['invalid-date']); continue }
    if (String(raw.birthDate) > today) { issue('profile', id, raw, ['future-date']); continue }
    if (typeof raw.name !== 'string' || !raw.name.trim()) { issue('profile', id, raw, ['legacy-unconfirmed']); continue }
    const primaryScheduleId = raw.scheme === 'traditional' ? 'CO-PAI-PRIMARY-2-4-6' : raw.scheme === 'shortened' ? 'CO-PAI-PRIMARY-6-12-18-WEEKS-2026' : null
    const base = { id, nickname: raw.name, birthDate: String(raw.birthDate), country: 'CO' as const, referenceCatalogVersion: CURRENT_CATALOG_VERSION, ...provenance(raw) }
    const profile: StoredProfile = primaryScheduleId ? { ...base, primaryScheduleId } : { ...base, primaryScheduleId: null, migrationStatus: 'needs-schedule-choice' }
    snapshot.profiles.push(profile)
  }
  const profiles = new Map(snapshot.profiles.map(profile => [profile.id, profile]))
  for (const raw of input.doses) {
    const id = identity(raw, seenAdministrations)
    const childId = typeof raw.profileId === 'string' ? raw.profileId : undefined
    const profile = childId ? profiles.get(childId) : undefined
    const reasons: ReviewReason[] = []
    if (!profile) reasons.push('missing-profile')
    try { parseCivilDate(String(raw.date)) } catch { reasons.push('invalid-date') }
    if (reasons.length) { issue('administration', id, raw, reasons, childId); continue }
    if (typeof raw.vaccine !== 'string' || !raw.vaccine.trim()) { issue('administration', id, raw, ['unidentified-product'], childId); continue }
    const reviewReasons: ReviewReason[] = ['legacy-unconfirmed', 'unidentified-product']
    if (String(raw.date) > today) reviewReasons.push('future-date')
    if (profile && String(raw.date) < profile.birthDate) reviewReasons.push('before-birth')
    const optional: { brand?: string; lot?: string; provider?: string; notes?: string } = {}
    if (typeof raw.brand === 'string') optional.brand = raw.brand
    if (typeof raw.lot === 'string') optional.lot = raw.lot
    if (typeof raw.point === 'string') optional.provider = raw.point
    if (typeof raw.notes === 'string') optional.notes = raw.notes
    snapshot.administrations.push({
      id, childId: profile!.id, productId: UNIDENTIFIED_PRODUCT_ID, productName: raw.vaccine, appliedDate: String(raw.date),
      coveredRequirementIds: [], coverageStatus: 'needs-review', reviewReasons, ...optional,
      accessType: raw.access === 'pai' ? 'pai' : raw.access === 'private' ? 'private' : 'unknown',
      paiwebStatus: raw.paiwebStatus === 'yes' ? 'yes' : raw.paiwebStatus === 'no' ? 'no' : 'unknown', ...provenance(raw),
    })
  }
  return snapshot
}
