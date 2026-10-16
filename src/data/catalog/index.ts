import { primaryRequirements, traditionalProjections, TRADITIONAL_SCHEDULE_ID } from './primary-traditional-2-4-6';
import { shortenedProjections, SHORTENED_SCHEDULE_ID } from './primary-shortened-6-12-18-weeks-2026';
import { products } from './products';
import { optionalRequirements, sharedProjections, sharedRequirements } from './shared-requirements-co-2026-10';
import { REVIEWED_AT, sources } from './sources';
import type { Catalog } from './types';

export type { Catalog, CoverageRule, Product, Projection, Requirement, Source } from './types';

export const CURRENT_CATALOG_VERSION = 'CO-PAI-SHARED-2026-10';
export const UNIDENTIFIED_PRODUCT_ID = 'unidentified';

const currentCatalog: Catalog = {
  version: CURRENT_CATALOG_VERSION,
  reviewedAt: REVIEWED_AT,
  sources,
  requirements: [...primaryRequirements, ...sharedRequirements],
  primarySchedules: {
    [TRADITIONAL_SCHEDULE_ID]: traditionalProjections,
    [SHORTENED_SCHEDULE_ID]: shortenedProjections,
  },
  sharedProjections,
  products,
  optionalRequirements,
};

// Reference data is shared, not profile state. Consumers must not mutate it.
export function getCatalog(version: string): Catalog | undefined {
  return version === CURRENT_CATALOG_VERSION ? currentCatalog : undefined;
}
