import { z } from 'zod'
import { parseCivilDate } from './civilDate'
import type { JsonValue } from './types'

export const civilDateSchema = z.string().refine(value => {
  try { parseCivilDate(value); return true } catch { return false }
}, 'invalid-date')
export const timestampSchema = z.iso.datetime({ offset: true })
export const idSchema = z.string().min(1)
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string(), z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)]))
export const jsonObjectSchema = z.record(z.string(), jsonValueSchema)
export const primaryScheduleIdSchema = z.enum(['CO-PAI-PRIMARY-2-4-6', 'CO-PAI-PRIMARY-6-12-18-WEEKS-2026'])
export const scheduleReferenceIdSchema = z.enum(['CO-PAI-REFERENCE-2026', 'CO-PAI-REFERENCE-PRE-2026', 'CO-PAI-REFERENCE-LEGACY-2-4-6-2026'])
export const reviewReasonSchema = z.enum(['unknown-schedule', 'unidentified-product', 'unidentified-stage', 'unverified-rule', 'invalid-date', 'future-date', 'before-birth', 'mixed-course', 'missing-profile', 'legacy-unconfirmed'])
export const legacyMetadataSchema = z.strictObject({ raw: jsonObjectSchema, migratedAt: timestampSchema, generatedTimestamps: z.boolean() })
const profileFields = {
  id: idSchema, nickname: z.string().min(1), birthDate: civilDateSchema, country: z.literal('CO'),
  referenceCatalogVersion: z.string().min(1), createdAt: timestampSchema, updatedAt: timestampSchema, legacy: legacyMetadataSchema.optional(),
}
export const profileInputSchema = z.strictObject({ nickname: z.string().trim().min(1), birthDate: civilDateSchema, scheduleReferenceId: scheduleReferenceIdSchema })
export const childProfileSchema = z.strictObject({ ...profileFields, primaryScheduleId: primaryScheduleIdSchema })
export const pendingProfileSchema = z.strictObject({ ...profileFields, primaryScheduleId: z.null(), migrationStatus: z.literal('needs-schedule-choice') })
export const storedProfileSchema = z.union([childProfileSchema, pendingProfileSchema])
const administrationInputFields = {
  productId: z.string().min(1), productName: z.string().min(1), appliedDate: civilDateSchema,
  doseNumber: z.number().int().positive().optional(), milestoneId: z.string().min(1).optional(),
  brand: z.string().optional(), lot: z.string().optional(), provider: z.string().optional(),
  accessType: z.enum(['pai', 'private', 'unknown']), paiwebStatus: z.enum(['yes', 'no', 'unknown']), notes: z.string().optional(),
}
export const administrationInputSchema = z.strictObject(administrationInputFields)
export const vaccineAdministrationSchema = z.strictObject({
  ...administrationInputFields, id: idSchema, childId: idSchema,
  coveredRequirementIds: z.array(z.string().min(1)), coverageStatus: z.enum(['verified', 'needs-review']), reviewReasons: z.array(reviewReasonSchema),
  createdAt: timestampSchema, updatedAt: timestampSchema, legacy: legacyMetadataSchema.optional(),
}).superRefine((value, ctx) => {
  if (new Set(value.coveredRequirementIds).size !== value.coveredRequirementIds.length) ctx.addIssue({ code: 'custom', message: 'duplicate-coverage' })
  if (value.coverageStatus === 'verified' && (value.reviewReasons.length || !value.coveredRequirementIds.length)) ctx.addIssue({ code: 'custom', message: 'invalid-coverage' })
  if (value.coverageStatus === 'needs-review' && (!value.reviewReasons.length || value.coveredRequirementIds.length)) ctx.addIssue({ code: 'custom', message: 'invalid-coverage' })
})
export const localPreferenceSchema = z.strictObject({ key: z.string().min(1), value: jsonValueSchema })
export const migrationIssueSchema = z.strictObject({ id: idSchema, kind: z.enum(['profile', 'administration']), entityId: idSchema, childId: idSchema.optional(), raw: jsonObjectSchema, reasons: z.array(reviewReasonSchema).min(1), migratedAt: timestampSchema })

/** UI preferences are intentionally a narrow, portable allowlist. */
export function validatePortablePreference(key: string, value: JsonValue): void {
  if (key === 'activeProfileId') {
    if (value !== null && (typeof value !== 'string' || !value)) throw new Error('invalid-preference')
    return
  }
  if (key.startsWith('optional-products:') && key.length > 'optional-products:'.length) {
    if (!Array.isArray(value) || !value.every(item => typeof item === 'string' && item.length > 0) || new Set(value).size !== value.length) throw new Error('invalid-preference')
    return
  }
  throw new Error('invalid-preference')
}
