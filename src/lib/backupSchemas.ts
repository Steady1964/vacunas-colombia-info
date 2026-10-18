import { z } from 'zod';
import {
  jsonObjectSchema,
  localPreferenceSchema,
  migrationIssueSchema,
  storedProfileSchema,
  timestampSchema,
  vaccineAdministrationSchema,
} from './schemas';

export const legacyFamilyV1Schema = z.strictObject({
  version: z.literal(1),
  profiles: z.array(jsonObjectSchema),
  doses: z.array(jsonObjectSchema),
});

export const backupV2Schema = z.strictObject({
  formatVersion: z.literal(2),
  exportedAt: timestampSchema,
  profiles: z.array(storedProfileSchema),
  administrations: z.array(vaccineAdministrationSchema),
  preferences: z.array(localPreferenceSchema),
  migrationIssues: z.array(migrationIssueSchema),
});
