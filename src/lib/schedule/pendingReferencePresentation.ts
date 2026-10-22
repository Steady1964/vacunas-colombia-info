import type { Catalog, CoverageRule, Product } from '../../data/catalog/types';
import { addCivil, ageAt } from '../civilDate';
import type { ChildProfile, CivilDate } from '../types';
import {
  getProductReferences,
  getScheduleReferences,
  referenceAgeLabel,
  type RequirementReference,
} from './referencePresentation';
import type { RequirementView } from './summarizeSchedule';

type InitialReference = {
  doseNumber: number;
  estimatedDate: CivilDate | null;
  sourceAgeLabel: string;
};

type DocumentedTotal =
  | { doseCount: number; scope: 'primary-series' }
  | { doseCount: number; scope: 'selected-reference' }
  | { doseCount: number; scope: 'product-course'; productName: string };

export type PendingReference = {
  requirement: RequirementView;
  sourceAgeLabel: string;
  calendarAgeLabel: string | null;
  initialReference: InitialReference | null;
  documentedTotal: DocumentedTotal | null;
};

export type PendingReferenceGroups = Record<
  'pai' | 'private' | 'conditional',
  PendingReference[]
>;

function calendarAgeLabel(birthDate: CivilDate, date: CivilDate): string {
  const age = ageAt(birthDate, date);
  const parts: string[] = [];
  if (age.years) parts.push(`${age.years} ${age.years === 1 ? 'año' : 'años'}`);
  if (age.months)
    parts.push(`${age.months} ${age.months === 1 ? 'mes' : 'meses'}`);
  if (age.days || parts.length === 0)
    parts.push(`${age.days} ${age.days === 1 ? 'día' : 'días'}`);
  return parts.join(' y ');
}

export function getPendingReferenceGroups(
  profile: ChildProfile,
  catalog: Catalog,
  items: readonly RequirementView[],
): PendingReferenceGroups {
  const groups: PendingReferenceGroups = {
    pai: [],
    private: [],
    conditional: [],
  };
  const references = getScheduleReferences(profile, catalog);
  const referencesById = new Map(
    references.map((reference) => [reference.requirement.id, reference]),
  );
  const optionalOwners = new Map<string, Product[]>();
  for (const product of catalog.products) {
    for (const reference of catalog.optionalRequirements[product.id] ?? []) {
      referencesById.set(reference.requirement.id, reference);
      const owners = optionalOwners.get(reference.requirement.id) ?? [];
      owners.push(product);
      optionalOwners.set(reference.requirement.id, owners);
    }
  }
  const verifiedSources = new Set(
    catalog.sources
      .filter((source) => source.verification === 'verified')
      .map((source) => source.id),
  );
  const verified = (sourceIds: readonly string[]) =>
    sourceIds.length > 0 && sourceIds.every((id) => verifiedSources.has(id));
  const primaryIds = new Set(
    (catalog.primarySchedules[profile.primaryScheduleId] ?? []).map(
      (projection) => projection.requirementId,
    ),
  );
  const primaryStages = new Set(
    references
      .filter((reference) => primaryIds.has(reference.requirement.id))
      .map(
        ({ requirement }) =>
          `${requirement.milestoneId}:${requirement.doseNumber}`,
      ),
  );
  const productReferences = new Map(
    catalog.products.map((product) => [
      product.id,
      getProductReferences(profile, catalog, product.id),
    ]),
  );
  const ruleReferences = (product: Product, rule: CoverageRule) => {
    const ownReferences = productReferences.get(product.id) ?? [];
    return rule.requirementIds.map((id) =>
      ownReferences.find((reference) => reference.requirement.id === id),
    );
  };
  const verifiedRule = (product: Product, rule: CoverageRule) =>
    verified(product.sourceIds) &&
    verified(rule.sourceIds) &&
    rule.requirementIds.length > 0 &&
    ruleReferences(product, rule).every(
      (reference) =>
        reference !== undefined &&
        reference.requirement.doseNumber === rule.doseNumber &&
        reference.requirement.milestoneId === rule.milestoneId &&
        verified(reference.requirement.sourceIds),
    );
  const initialFrom = (reference: RequirementReference): InitialReference => ({
    doseNumber: reference.requirement.doseNumber,
    estimatedDate:
      verified(reference.requirement.sourceIds) && reference.projection.offset
        ? addCivil(profile.birthDate, reference.projection.offset)
        : null,
    sourceAgeLabel: referenceAgeLabel(reference, catalog),
  });
  const primaryTotal = (product: Product): number | null => {
    const stages = new Map<number, string>();
    for (const rule of product.coverageRules) {
      if (!primaryStages.has(`${rule.milestoneId}:${rule.doseNumber}`))
        continue;
      // A product-specific stage outside the active primary projection cannot
      // be silently dropped (for example RotaTeq's undated third dose).
      if (
        !verifiedRule(product, rule) ||
        !rule.requirementIds.every((id) => primaryIds.has(id))
      )
        return null;
      const prior = stages.get(rule.doseNumber);
      if (prior && prior !== rule.milestoneId) return null;
      stages.set(rule.doseNumber, rule.milestoneId);
    }
    if (
      stages.size === 0 ||
      [...stages.keys()].some((dose) => dose < 1 || dose > stages.size) ||
      (product.doseCount !== undefined && product.doseCount !== stages.size)
    )
      return null;
    return stages.size;
  };
  const activeIds = new Set(items.map((requirement) => requirement.id));
  const selectedReferenceTotal = (product: Product): number | null => {
    const stages = new Map<number, string>();
    for (const rule of product.coverageRules) {
      // Unlike primary-series totals, this scope cannot drop any product rule,
      // including shared boosters or rules absent from the selected reference.
      if (
        !verifiedRule(product, rule) ||
        !rule.requirementIds.every((id) => activeIds.has(id))
      )
        return null;
      const prior = stages.get(rule.doseNumber);
      if (prior && prior !== rule.milestoneId) return null;
      stages.set(rule.doseNumber, rule.milestoneId);
    }
    if (
      stages.size === 0 ||
      [...stages.keys()].some(
        (dose) => !Number.isSafeInteger(dose) || dose < 1 || dose > stages.size,
      ) ||
      (product.doseCount !== undefined && product.doseCount !== stages.size)
    )
      return null;
    return stages.size;
  };

  const pending = items
    .filter((requirement) => requirement.status !== 'applied')
    .sort((a, b) => {
      if (a.estimatedDate === b.estimatedDate) return a.id.localeCompare(b.id);
      if (!a.estimatedDate) return 1;
      if (!b.estimatedDate) return -1;
      return a.estimatedDate.localeCompare(b.estimatedDate);
    });
  for (const requirement of pending) {
    const reference = referencesById.get(requirement.id);
    const owners = optionalOwners.get(requirement.id) ?? [];
    const candidates = owners.length
      ? owners
      : catalog.products.filter((product) =>
          product.coverageRules.some((rule) =>
            rule.requirementIds.includes(requirement.id),
          ),
        );
    const initials: InitialReference[] = [];
    for (const product of candidates) {
      const firstRules = product.coverageRules.filter(
        (rule) => rule.doseNumber === 1 && verifiedRule(product, rule),
      );
      for (const rule of firstRules) {
        for (const first of ruleReferences(product, rule)) {
          if (first) initials.push(initialFrom(first));
        }
      }
    }
    let initialReference: InitialReference | null = null;
    if (
      initials.length &&
      initials.every(
        (first) =>
          first.doseNumber === initials[0].doseNumber &&
          first.estimatedDate === initials[0].estimatedDate &&
          first.sourceAgeLabel === initials[0].sourceAgeLabel,
      )
    )
      initialReference = initials[0];
    else if (!initials.length && reference && requirement.doseNumber === 1)
      initialReference = initialFrom(reference);

    let documentedTotal: DocumentedTotal | null = null;
    if (owners.length === 1) {
      const product = owners[0];
      if (
        product.doseCount !== undefined &&
        Number.isSafeInteger(product.doseCount) &&
        product.doseCount >= requirement.doseNumber &&
        requirement.doseNumber > 0 &&
        verified(product.sourceIds) &&
        reference &&
        verified(reference.requirement.sourceIds) &&
        product.coverageRules.some(
          (rule) =>
            rule.requirementIds.includes(requirement.id) &&
            verifiedRule(product, rule),
        )
      )
        documentedTotal = {
          doseCount: product.doseCount,
          scope: 'product-course',
          productName: product.name,
        };
    } else if (
      owners.length === 0 &&
      primaryIds.has(requirement.id) &&
      candidates.length
    ) {
      const totals = candidates.map(primaryTotal);
      if (totals[0] !== null && totals.every((total) => total === totals[0]))
        documentedTotal = { doseCount: totals[0], scope: 'primary-series' };
    } else if (owners.length === 0 && candidates.length) {
      const totals = candidates.map(selectedReferenceTotal);
      if (totals[0] !== null && totals.every((total) => total === totals[0]))
        documentedTotal = { doseCount: totals[0], scope: 'selected-reference' };
    }
    groups[requirement.access].push({
      requirement,
      sourceAgeLabel: reference
        ? referenceAgeLabel(reference, catalog)
        : 'Edad por confirmar',
      calendarAgeLabel: requirement.estimatedDate
        ? calendarAgeLabel(profile.birthDate, requirement.estimatedDate)
        : null,
      initialReference,
      documentedTotal,
    });
  }
  return groups;
}
