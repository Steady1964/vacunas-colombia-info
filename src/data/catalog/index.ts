import type { ChildProfile, PrimaryScheduleId, ScheduleReferenceId } from '../../lib/types';
import {
  historicalPrimaryProjections,
  historicalPrimaryRequirements,
  historicalProducts,
  historicalSharedProjections,
  historicalSharedRequirements,
} from './historical-requirements-co-undated';
import { primaryRequirements, traditionalProjections, TRADITIONAL_SCHEDULE_ID } from './primary-traditional-2-4-6';
import { shortenedProjections, SHORTENED_SCHEDULE_ID } from './primary-shortened-6-12-18-weeks-2026';
import { products } from './products';
import { optionalRequirements, sharedProjections, sharedRequirements } from './shared-requirements-co-2026-10';
import { REVIEWED_AT, sources } from './sources';
import type { Catalog } from './types';

export type { Catalog, CoverageRule, Product, Projection, Requirement, Source } from './types';

export const CURRENT_CATALOG_VERSION = 'CO-PAI-SHARED-2026-10';
export const HISTORICAL_CATALOG_VERSION = 'CO-PAI-EPS-SANITAS-UNDATED-ED2';
export const UNIDENTIFIED_PRODUCT_ID = 'unidentified';

export interface ScheduleReference {
  readonly id: ScheduleReferenceId;
  readonly primaryScheduleId: PrimaryScheduleId;
  readonly catalogVersion: string;
  readonly label: string;
  readonly selectable: boolean;
}

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

const historicalCatalog: Catalog = {
  version: HISTORICAL_CATALOG_VERSION,
  reviewedAt: REVIEWED_AT,
  sources,
  requirements: [...historicalPrimaryRequirements, ...historicalSharedRequirements],
  primarySchedules: {
    [TRADITIONAL_SCHEDULE_ID]: historicalPrimaryProjections,
  },
  sharedProjections: historicalSharedProjections,
  products: historicalProducts,
  optionalRequirements,
};

const currentReference: ScheduleReference = Object.freeze({
  id: 'CO-PAI-REFERENCE-2026',
  primaryScheduleId: SHORTENED_SCHEDULE_ID,
  catalogVersion: CURRENT_CATALOG_VERSION,
  label: 'Esquema 2026 · 6, 12 y 18 semanas',
  selectable: true,
});
const historicalReference: ScheduleReference = Object.freeze({
  id: 'CO-PAI-REFERENCE-PRE-2026',
  primaryScheduleId: TRADITIONAL_SCHEDULE_ID,
  catalogVersion: HISTORICAL_CATALOG_VERSION,
  label: 'Esquema anterior a 2026 · 2, 4 y 6 meses',
  selectable: true,
});
const legacyReference: ScheduleReference = Object.freeze({
  id: 'CO-PAI-REFERENCE-LEGACY-2-4-6-2026',
  primaryScheduleId: TRADITIONAL_SCHEDULE_ID,
  catalogVersion: CURRENT_CATALOG_VERSION,
  label: 'Referencia legada · 2, 4 y 6 meses con hitos 2026',
  selectable: false,
});
const allScheduleReferences: readonly ScheduleReference[] = Object.freeze([currentReference, historicalReference, legacyReference]);
export const selectableScheduleReferences: readonly ScheduleReference[] = Object.freeze([currentReference, historicalReference]);

export function getCatalog(version: string): Catalog | undefined {
  if (version === CURRENT_CATALOG_VERSION) return currentCatalog;
  if (version === HISTORICAL_CATALOG_VERSION) return historicalCatalog;
  return undefined;
}

export function getScheduleReference(id: string): ScheduleReference | undefined {
  if (id === currentReference.id) return currentReference;
  if (id === historicalReference.id) return historicalReference;
  if (id === legacyReference.id) return legacyReference;
  return undefined;
}

export function identifyScheduleReference(
  profile: Pick<ChildProfile, 'primaryScheduleId' | 'referenceCatalogVersion'>,
): ScheduleReferenceId | undefined {
  for (const reference of allScheduleReferences) {
    if (reference.primaryScheduleId === profile.primaryScheduleId
      && reference.catalogVersion === profile.referenceCatalogVersion) return reference.id;
  }
  return undefined;
}

export function supportsSchedule(catalog: Catalog, schedule: PrimaryScheduleId): boolean {
  return Boolean(catalog.primarySchedules[schedule]);
}
