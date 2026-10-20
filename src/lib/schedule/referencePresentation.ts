import type {
  Catalog,
  Projection,
  Requirement,
} from '../../data/catalog/types';
import type { StoredProfile } from '../types';

type ReferenceProfile = Pick<
  StoredProfile,
  'primaryScheduleId' | 'referenceCatalogVersion'
>;

export type RequirementReference = {
  requirement: Requirement;
  projection: Projection;
};

export type RegistrationStage = {
  id: string;
  label: string;
  retained: boolean;
};

function supportsReference(
  profile: ReferenceProfile,
  catalog: Catalog,
): boolean {
  return (
    profile.referenceCatalogVersion === catalog.version &&
    profile.primaryScheduleId !== null &&
    Boolean(catalog.primarySchedules[profile.primaryScheduleId])
  );
}

export function getScheduleReferences(
  profile: ReferenceProfile,
  catalog: Catalog,
): RequirementReference[] {
  if (!supportsReference(profile, catalog) || !profile.primaryScheduleId)
    return [];
  const requirements = new Map(
    catalog.requirements.map((requirement) => [requirement.id, requirement]),
  );
  const references: RequirementReference[] = [];
  for (const projection of [
    ...catalog.primarySchedules[profile.primaryScheduleId]!,
    ...catalog.sharedProjections,
  ]) {
    const requirement = requirements.get(projection.requirementId);
    if (requirement) references.push({ requirement, projection });
  }
  return references;
}

export function getProductReferences(
  profile: ReferenceProfile,
  catalog: Catalog,
  productId: string,
): RequirementReference[] {
  if (!supportsReference(profile, catalog)) return [];
  const product = catalog.products.find((entry) => entry.id === productId);
  const optional = catalog.optionalRequirements[productId] ?? [];
  const references = new Map(
    [...getScheduleReferences(profile, catalog), ...optional].map(
      (reference) => [reference.requirement.id, reference],
    ),
  );
  const selected = new Map<string, RequirementReference>();
  for (const rule of product?.coverageRules ?? []) {
    // A shared milestone ID alone does not establish a product's schedule.
    if (
      rule.requirementIds.length === 0 ||
      !rule.requirementIds.every((id) => {
        const requirement = references.get(id)?.requirement;
        return (
          requirement?.milestoneId === rule.milestoneId &&
          requirement.doseNumber === rule.doseNumber
        );
      })
    )
      continue;
    for (const id of rule.requirementIds) selected.set(id, references.get(id)!);
  }
  for (const reference of optional)
    selected.set(reference.requirement.id, reference);
  return [...selected.values()];
}

export function referenceAgeLabel(
  reference: RequirementReference,
  catalog: Catalog,
): string {
  const { requirement, projection } = reference;
  const verified =
    requirement.sourceIds.length > 0 &&
    requirement.sourceIds.every((id) =>
      catalog.sources.some(
        (source) => source.id === id && source.verification === 'verified',
      ),
    );
  if (!verified || !projection.offset) return 'Edad por confirmar';
  const { unit, value } = projection.offset;
  if (value === 0) return 'Nacimiento';
  if (unit === 'days' && value % 7 === 0)
    return `${value / 7} ${value === 7 ? 'semana' : 'semanas'}`;
  if (unit === 'days') return `${value} ${value === 1 ? 'día' : 'días'}`;
  if (unit === 'months') return `${value} ${value === 1 ? 'mes' : 'meses'}`;
  return `${value} ${value === 1 ? 'año' : 'años'}`;
}

export function getRegistrationStages(
  profile: ReferenceProfile,
  catalog: Catalog,
  productId: string,
  storedMilestoneId?: string,
): RegistrationStage[] {
  const references =
    productId === 'unidentified'
      ? getScheduleReferences(profile, catalog)
      : getProductReferences(profile, catalog, productId);
  const stages = new Map<string, { ages: Set<string>; doses: Set<number> }>();
  for (const reference of references) {
    const { milestoneId, doseNumber } = reference.requirement;
    let stage = stages.get(milestoneId);
    if (!stage) {
      stage = { ages: new Set(), doses: new Set() };
      stages.set(milestoneId, stage);
    }
    stage.ages.add(referenceAgeLabel(reference, catalog));
    stage.doses.add(doseNumber);
  }
  const options: RegistrationStage[] = [...stages].map(([id, stage]) => ({
    id,
    label: `${[...stage.ages].join(' / ')} · Dosis ${[...stage.doses]
      .sort((a, b) => a - b)
      .join(' / ')}`,
    retained: false,
  }));
  if (storedMilestoneId && !stages.has(storedMilestoneId))
    options.push({
      id: storedMilestoneId,
      label: storedMilestoneId,
      retained: true,
    });
  return options;
}
