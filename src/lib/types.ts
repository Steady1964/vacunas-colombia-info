import type { Catalog } from '../data/catalog/types'

export type CivilDate = string
export type Timestamp = string
export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject
export type JsonObject = { [key: string]: JsonValue }
export type PrimaryScheduleId = 'CO-PAI-PRIMARY-2-4-6' | 'CO-PAI-PRIMARY-6-12-18-WEEKS-2026'
export type ScheduleReferenceId = 'CO-PAI-REFERENCE-2026' | 'CO-PAI-REFERENCE-PRE-2026' | 'CO-PAI-REFERENCE-LEGACY-2-4-6-2026'
export type ReviewReason = 'unknown-schedule' | 'unidentified-product' | 'unidentified-stage' | 'unverified-rule' | 'invalid-date' | 'future-date' | 'before-birth' | 'mixed-course' | 'missing-profile' | 'legacy-unconfirmed'
export type LegacyMetadata = { raw: JsonObject; migratedAt: Timestamp; generatedTimestamps: boolean }
export type ChildProfile = {
  id: string
  nickname: string
  birthDate: CivilDate
  country: 'CO'
  primaryScheduleId: PrimaryScheduleId
  referenceCatalogVersion: string
  createdAt: Timestamp
  updatedAt: Timestamp
  legacy?: LegacyMetadata
}
export type PendingProfile = Omit<ChildProfile, 'primaryScheduleId'> & { primaryScheduleId: null; migrationStatus: 'needs-schedule-choice' }
export type StoredProfile = ChildProfile | PendingProfile
export type VaccineAdministration = {
  id: string
  childId: string
  productId: string
  productName: string
  appliedDate: CivilDate
  doseNumber?: number
  milestoneId?: string
  coveredRequirementIds: string[]
  coverageStatus: 'verified' | 'needs-review'
  reviewReasons: ReviewReason[]
  brand?: string
  lot?: string
  provider?: string
  accessType: 'pai' | 'private' | 'unknown'
  paiwebStatus: 'yes' | 'no' | 'unknown'
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  legacy?: LegacyMetadata
}
export type LocalPreference = { key: string; value: JsonValue }
export type MigrationIssue = { id: string; kind: 'profile' | 'administration'; entityId: string; childId?: string; raw: JsonObject; reasons: ReviewReason[]; migratedAt: Timestamp }
export type LegacyFamilyV1 = { version: 1; profiles: JsonObject[]; doses: JsonObject[] }
export type FamilySnapshot = { profiles: StoredProfile[]; administrations: VaccineAdministration[]; preferences: LocalPreference[]; migrationIssues: MigrationIssue[]; revision: number }
export type MutationContext = { today: CivilDate; now: Timestamp; catalog: Catalog }
export type ImportContext = { today: CivilDate; now: Timestamp }
export type ProfileInput = { nickname: string; birthDate: CivilDate; scheduleReferenceId: ScheduleReferenceId }
export type ProfileCommand = { id: string; mode: 'create' | 'edit'; input: ProfileInput }
export type AdministrationInput = { productId: string; productName: string; appliedDate: CivilDate; doseNumber?: number; milestoneId?: string; brand?: string; lot?: string; provider?: string; accessType: 'pai' | 'private' | 'unknown'; paiwebStatus: 'yes' | 'no' | 'unknown'; notes?: string }
export type AdministrationCommand = { id: string; childId: string; mode: 'create' | 'edit'; input: AdministrationInput }
export type BackupV2 = { formatVersion: 2; exportedAt: Timestamp; profiles: StoredProfile[]; administrations: VaccineAdministration[]; preferences: LocalPreference[]; migrationIssues: MigrationIssue[] }
export type ImportPreview = { incoming: BackupV2; baseRevision: number; added: { profiles: number; administrations: number; migrationIssues: number }; identical: { profiles: number; administrations: number; migrationIssues: number }; conflicts: { entity: 'profile' | 'administration' | 'migrationIssue'; id: string }[]; reviewCount: number }
