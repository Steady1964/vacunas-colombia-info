import { primaryRequirements } from './primary-traditional-2-4-6';
import type { Projection } from './types';

export const SHORTENED_SCHEDULE_ID =
  'CO-PAI-PRIMARY-6-12-18-WEEKS-2026' as const;

// Six-week intervals are exact civil days, not fractional calendar months.
export const shortenedProjections: Projection[] = primaryRequirements.map(
  (requirement) => ({
    requirementId: requirement.id,
    offset: { unit: 'days', value: requirement.doseNumber * 42 },
  }),
);
