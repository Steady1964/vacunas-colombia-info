import type { Catalog, Product } from '../../data/catalog/types';
import type { VaccineAdministration } from '../types';
import type { CoverageResult } from './resolveCoverage';
import type { RequirementView, ScheduleSummary } from './summarizeSchedule';

export type AppliedAdministrationGroup = {
  administration: VaccineAdministration;
  product: Product;
  requirements: RequirementView[];
};

export function getAppliedAdministrationGroups(
  profileId: string,
  administrations: readonly VaccineAdministration[],
  summary: ScheduleSummary,
  catalog: Catalog,
  coverage: CoverageResult,
): AppliedAdministrationGroup[] {
  const requirements = new Map(summary.items.map((item) => [item.id, item]));
  const products = new Map(
    catalog.products.map((product) => [product.id, product]),
  );
  const groups: AppliedAdministrationGroup[] = [];
  for (const administration of administrations) {
    if (
      administration.childId !== profileId ||
      administration.coverageStatus !== 'verified' ||
      administration.reviewReasons.length > 0 ||
      coverage.reviewByAdministrationId.has(administration.id)
    )
      continue;
    const product = products.get(administration.productId);
    if (!product) continue;
    const confirmed: RequirementView[] = [];
    const seen = new Set<string>();
    for (const id of administration.coveredRequirementIds) {
      const requirement = requirements.get(id);
      if (
        !seen.has(id) &&
        requirement?.status === 'applied' &&
        coverage.coveredRequirementIds.has(id)
      ) {
        confirmed.push(requirement);
        seen.add(id);
      }
    }
    if (confirmed.length > 0)
      groups.push({ administration, product, requirements: confirmed });
  }
  return groups.sort(
    (a, b) =>
      a.administration.appliedDate.localeCompare(
        b.administration.appliedDate,
      ) || a.administration.id.localeCompare(b.administration.id),
  );
}
