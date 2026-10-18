import type {
  Catalog,
  Projection,
  Requirement,
} from '../../data/catalog/types';
import { addCivil, parseCivilDate } from '../civilDate';
import type { ChildProfile, CivilDate } from '../types';

export type ScheduledRequirement = Requirement & {
  estimatedDate: CivilDate | null;
  conditional: boolean;
};

export function calculateSchedule(
  profile: ChildProfile,
  catalog: Catalog,
  today: CivilDate,
  selectedOptionalProductIds: readonly string[],
): ScheduledRequirement[] {
  parseCivilDate(profile.birthDate);
  parseCivilDate(today);
  if (profile.birthDate > today) throw new Error('before-birth');
  if (profile.referenceCatalogVersion !== catalog.version)
    throw new Error('catalog-unavailable');
  const primary = catalog.primarySchedules[profile.primaryScheduleId];
  if (!primary) throw new Error('unknown-schedule');
  const requirements = new Map(
    catalog.requirements.map((requirement) => [requirement.id, requirement]),
  );
  const verifiedSources = new Set(
    catalog.sources
      .filter((source) => source.verification === 'verified')
      .map((source) => source.id),
  );
  const projections: Projection[] = [...primary, ...catalog.sharedProjections];
  for (const productId of new Set(selectedOptionalProductIds)) {
    for (const optional of catalog.optionalRequirements[productId] ?? []) {
      requirements.set(optional.requirement.id, optional.requirement);
      projections.push(optional.projection);
    }
  }
  const scheduled = new Map<string, ScheduledRequirement>();
  for (const projection of projections) {
    if (scheduled.has(projection.requirementId))
      throw new Error('duplicate-requirement');
    const requirement = requirements.get(projection.requirementId);
    if (!requirement) throw new Error('invalid-catalog');
    const verified =
      requirement.sourceIds.length > 0 &&
      requirement.sourceIds.every((id) => verifiedSources.has(id));
    scheduled.set(requirement.id, {
      ...requirement,
      estimatedDate:
        verified && projection.offset
          ? addCivil(profile.birthDate, projection.offset)
          : null,
      conditional: requirement.access === 'conditional' || !verified,
    });
  }
  return [...scheduled.values()].sort((a, b) => {
    if (a.estimatedDate === b.estimatedDate) return a.id.localeCompare(b.id);
    if (!a.estimatedDate) return 1;
    if (!b.estimatedDate) return -1;
    return a.estimatedDate.localeCompare(b.estimatedDate);
  });
}
