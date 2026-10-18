import type { ChildProfile, VaccineAdministration } from '../lib/types';

export const CHILD_A = '11111111-1111-4111-8111-111111111111';
export const CHILD_B = '22222222-2222-4222-8222-222222222222';
export const ADMIN_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const FIXED_NOW = '2026-10-16T15:00:00.000Z';
export const FIXED_TODAY = '2026-10-16';

export function makeProfile(
  overrides: Partial<ChildProfile> = {},
): ChildProfile {
  return {
    id: CHILD_A,
    nickname: 'Luna',
    birthDate: '2026-01-31',
    country: 'CO',
    primaryScheduleId: 'CO-PAI-PRIMARY-6-12-18-WEEKS-2026',
    referenceCatalogVersion: 'CO-PAI-SHARED-2026-10',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

export function makeAdministration(
  overrides: Partial<VaccineAdministration> = {},
): VaccineAdministration {
  return {
    id: ADMIN_A,
    childId: CHILD_A,
    productId: 'unidentified',
    productName: 'Registro manual',
    appliedDate: '2026-03-14',
    coveredRequirementIds: [],
    coverageStatus: 'needs-review',
    reviewReasons: ['unidentified-product'],
    accessType: 'unknown',
    paiwebStatus: 'unknown',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}
