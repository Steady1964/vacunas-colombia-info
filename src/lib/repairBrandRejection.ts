import { getCatalog, supportsSchedule } from '../data/catalog';
import { parseCivilDate } from './civilDate';
import { resolveSelection } from './schedule/resolveCoverage';
import type { CivilDate, StoredProfile, VaccineAdministration } from './types';

/** Repairs only the old rejection of laboratory text on an identified product. */
export function repairBrandRejection(
  application: VaccineAdministration,
  profile: StoredProfile | undefined,
  today: CivilDate,
): VaccineAdministration | undefined {
  if (
    !profile ||
    profile.id !== application.childId ||
    profile.primaryScheduleId === null ||
    application.coverageStatus !== 'needs-review' ||
    application.coveredRequirementIds.length !== 0 ||
    application.reviewReasons.length !== 1 ||
    application.reviewReasons[0] !== 'unidentified-product'
  )
    return;

  const catalog = getCatalog(profile.referenceCatalogVersion);
  if (!catalog || !supportsSchedule(catalog, profile.primaryScheduleId)) return;
  const product = catalog.products.find(
    (entry) => entry.id === application.productId,
  );
  const recordedBrand = application.brand?.trim().toLocaleLowerCase('es');
  if (
    !product ||
    !recordedBrand ||
    product.brands.length === 0 ||
    product.brands.some(
      (brand) => brand.toLocaleLowerCase('es') === recordedBrand,
    )
  )
    return;

  try {
    parseCivilDate(today);
    parseCivilDate(profile.birthDate);
    parseCivilDate(application.appliedDate);
  } catch {
    return;
  }
  if (
    profile.birthDate > today ||
    application.appliedDate < profile.birthDate ||
    application.appliedDate > today
  )
    return;

  const selection = resolveSelection(application, catalog);
  if (selection.coverageStatus !== 'verified') return;
  return { ...application, ...selection };
}
