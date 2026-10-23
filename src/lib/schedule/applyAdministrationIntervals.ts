import { CURRENT_CATALOG_VERSION } from '../../data/catalog';
import { SHORTENED_SCHEDULE_ID } from '../../data/catalog/primary-shortened-6-12-18-weeks-2026';
import type { Catalog } from '../../data/catalog/types';
import { addCivil, parseCivilDate } from '../civilDate';
import type { ChildProfile, CivilDate, VaccineAdministration } from '../types';
import type { ScheduledRequirement } from './calculateSchedule';
import { resolveSelection, type CoverageResult } from './resolveCoverage';

const INTERVAL_DAYS = 42;
const INTERVAL_SOURCE = 'minsalud-january-2026';
const COMPOSITION_SOURCE = 'minsalud-hexavalent-2025';
type Component = 'penta' | 'ipv';

// This overlays requirement timing, not permission to change products. The January
// 2026 p. 28 interval applies to the selected shortened primary scheme under one
// year; it is not a universal clinical minimum or a catch-up algorithm.
export function applyAdministrationIntervals(
  profile: ChildProfile,
  catalog: Catalog,
  scheduled: readonly ScheduledRequirement[],
  applications: readonly VaccineAdministration[],
  coverage: CoverageResult,
  today: CivilDate,
): ScheduledRequirement[] {
  if (
    profile.primaryScheduleId !== SHORTENED_SCHEDULE_ID ||
    profile.referenceCatalogVersion !== CURRENT_CATALOG_VERSION ||
    catalog.version !== CURRENT_CATALOG_VERSION
  )
    return [...scheduled];

  parseCivilDate(profile.birthDate);
  parseCivilDate(today);
  const firstPermittedDate = addCivil(profile.birthDate, {
    unit: 'days',
    value: INTERVAL_DAYS,
  });
  const firstBirthday = addCivil(profile.birthDate, {
    unit: 'years',
    value: 1,
  });
  const verifiedSources = new Set(
    catalog.sources
      .filter((source) => source.verification === 'verified')
      .map((source) => source.id),
  );
  const products = new Map(
    catalog.products.map((product) => [product.id, product]),
  );
  const requirements = new Map(
    catalog.requirements.map((requirement) => [requirement.id, requirement]),
  );
  const sameChild = applications.filter(
    (application) => application.childId === profile.id,
  );

  const result = scheduled.map((row): ScheduledRequirement => {
    const match = /^(penta|ipv)-([23])$/.exec(row.id);
    if (
      !match ||
      row.access !== 'pai' ||
      row.doseNumber !== Number(match[2]) ||
      row.milestoneId !== `primary-${match[2]}` ||
      coverage.coveredRequirementIds.has(row.id)
    )
      return row;
    const component = match[1] as Component;
    const predecessorStage = Number(match[2]) - 1;
    const course = sameChild.filter((application) => {
      const knownComponent =
        application.productId === 'hexavalent-acellular' ||
        application.productId ===
          (component === 'penta' ? 'pentavalent-cellular' : 'ipv');
      const storedComponent = application.coveredRequirementIds.some((id) =>
        new RegExp(`^${component}-[123]$`).test(id),
      );
      if (!knownComponent && !storedComponent) return false;
      // Do not interpret boosters as unlabelled primary doses.
      if (
        application.doseNumber !== undefined &&
        application.doseNumber > 3 &&
        application.milestoneId &&
        !/^primary-/.test(application.milestoneId)
      )
        return false;
      return true;
    });
    if (course.length === 0) return row;

    const stages = new Map<number, VaccineAdministration[]>();
    let unknownStage = false;
    for (const application of course) {
      const stage = application.doseNumber;
      if (
        stage === undefined ||
        !Number.isInteger(stage) ||
        stage < 1 ||
        stage > 3 ||
        application.milestoneId !== `primary-${stage}`
      ) {
        unknownStage = true;
        continue;
      }
      const entries = stages.get(stage) ?? [];
      entries.push(application);
      stages.set(stage, entries);
    }
    const sourceIds = new Set([INTERVAL_SOURCE, ...row.sourceIds]);
    for (const application of course) {
      const product = products.get(application.productId);
      for (const id of product?.sourceIds ?? []) sourceIds.add(id);
      const rule = product?.coverageRules.find(
        (candidate) =>
          candidate.doseNumber === application.doseNumber &&
          candidate.milestoneId === application.milestoneId,
      );
      for (const id of rule?.sourceIds ?? []) sourceIds.add(id);
      for (const id of rule?.requirementIds ?? []) {
        for (const sourceId of requirements.get(id)?.sourceIds ?? [])
          sourceIds.add(sourceId);
      }
      if (application.productId === 'hexavalent-acellular')
        sourceIds.add(COMPOSITION_SOURCE);
    }
    const review = (reason: string): ScheduledRequirement => ({
      ...row,
      estimatedDate: null,
      timing: {
        kind: 'needs-review',
        referenceDate: row.estimatedDate,
        reason,
        sourceIds: [...sourceIds],
      },
    });
    const requirement = requirements.get(row.id);
    if (
      !requirement ||
      requirement.access !== 'pai' ||
      requirement.doseNumber !== row.doseNumber ||
      requirement.milestoneId !== row.milestoneId ||
      requirement.sourceIds.length === 0 ||
      row.sourceIds.length === 0 ||
      requirement.sourceIds.some((id) => !verifiedSources.has(id))
    )
      return review(
        'El requisito de destino no tiene una regla y fuentes confirmadas en el catálogo actual.',
      );
    if ([...sourceIds].some((id) => !verifiedSources.has(id)))
      return review(
        'Las fuentes necesarias para calcular el intervalo no están verificadas en el catálogo actual.',
      );
    if (unknownStage)
      return review(
        'Hay una aplicación de esta serie sin dosis y etapa primaria coincidentes; confirma el antecedente con el vacunador.',
      );

    let previous: VaccineAdministration | undefined;
    let anchor: VaccineAdministration | undefined;
    let courseProduct: string | undefined;
    let courseBrand: string | undefined;
    // Validate all recorded stages, including later conflicting records, without
    // selecting a latest/earliest duplicate or manufacturing a missing injection.
    const lastStage = Math.max(...stages.keys());
    for (let stage = 1; stage <= lastStage; stage++) {
      const entries = stages.get(stage);
      if (!entries || entries.length !== 1)
        return review(
          'La serie tiene etapas ausentes o aplicaciones duplicadas; no se puede elegir automáticamente un antecedente.',
        );
      const application = entries[0];
      const product = products.get(application.productId);
      const rule = product?.coverageRules.find(
        (candidate) =>
          candidate.doseNumber === stage &&
          candidate.milestoneId === `primary-${stage}`,
      );
      const expectedIds =
        application.productId === 'hexavalent-acellular'
          ? [`penta-${stage}`, `ipv-${stage}`]
          : application.productId === 'pentavalent-cellular'
            ? [`penta-${stage}`]
            : application.productId === 'ipv'
              ? [`ipv-${stage}`]
              : [];
      const selection = resolveSelection(application, catalog);
      const snapshot = new Set(application.coveredRequirementIds);
      if (
        !product ||
        product.sourceIds.length === 0 ||
        !rule ||
        rule.sourceIds.length === 0 ||
        expectedIds.length === 0 ||
        application.coverageStatus !== 'verified' ||
        application.reviewReasons.length > 0 ||
        coverage.reviewByAdministrationId.has(application.id) ||
        selection.coverageStatus !== 'verified' ||
        selection.coveredRequirementIds.length !== expectedIds.length ||
        !expectedIds.every((id) =>
          selection.coveredRequirementIds.includes(id),
        ) ||
        snapshot.size !== expectedIds.length ||
        snapshot.size !== application.coveredRequirementIds.length ||
        !expectedIds.every(
          (id) => snapshot.has(id) && coverage.coveredRequirementIds.has(id),
        )
      )
        return review(
          'El producto, la etapa o la correspondencia guardada de una aplicación no están confirmados por las reglas actuales.',
        );
      try {
        parseCivilDate(application.appliedDate);
      } catch {
        return review(
          'Una fecha de aplicación no es válida; confirma el antecedente antes de calcular la siguiente dosis.',
        );
      }
      if (
        application.appliedDate < profile.birthDate ||
        application.appliedDate > today
      )
        return review(
          'Una aplicación está antes del nacimiento o en el futuro; confirma la fecha real.',
        );
      if (
        application.appliedDate < firstPermittedDate ||
        application.appliedDate >= firstBirthday
      )
        return review(
          'El antecedente queda fuera del alcance de esta pauta: desde seis semanas y antes de cumplir un año.',
        );
      const recordedBrand = application.brand?.trim().toLocaleLowerCase('es');
      const brand = product.brands.find(
        (known) => known.toLocaleLowerCase('es') === recordedBrand,
      );
      if (
        (courseProduct !== undefined &&
          courseProduct !== application.productId) ||
        (courseBrand !== undefined &&
          brand !== undefined &&
          courseBrand !== brand)
      )
        return review(
          'La serie combina productos o marcas; el intervalo no confirma permiso para intercambiarlos. Revisa la continuación con el vacunador.',
        );
      if (
        previous &&
        application.appliedDate <
          addCivil(previous.appliedDate, { unit: 'days', value: INTERVAL_DAYS })
      )
        return review(
          'Las aplicaciones no siguen el orden y el intervalo de seis semanas de la pauta seleccionada; requiere revisión, no reinicio automático.',
        );
      courseProduct = application.productId;
      if (brand !== undefined) courseBrand = brand;
      previous = application;
      if (stage === predecessorStage) anchor = application;
    }
    // Once a component's course has started, a later birth reference cannot
    // masquerade as a dated continuation without its real predecessor.
    if (!anchor)
      return review(
        'Falta la aplicación real de la dosis anterior; no se encadenan fechas estimadas.',
      );
    const estimatedDate = addCivil(anchor.appliedDate, {
      unit: 'days',
      value: INTERVAL_DAYS,
    });
    if (estimatedDate >= firstBirthday)
      return review(
        'La siguiente fecha alcanza o supera los doce meses; la continuación necesita otras indicaciones técnicas del vacunador.',
      );
    return {
      ...row,
      estimatedDate,
      timing: {
        kind: 'after-administration',
        referenceDate: row.estimatedDate,
        appliedDate: anchor.appliedDate,
        administrationId: anchor.id,
        intervalDays: INTERVAL_DAYS,
        sourceIds: [...sourceIds],
      },
    };
  });
  return result.sort((a, b) => {
    if (a.estimatedDate === b.estimatedDate) return a.id.localeCompare(b.id);
    if (!a.estimatedDate) return 1;
    if (!b.estimatedDate) return -1;
    return a.estimatedDate.localeCompare(b.estimatedDate);
  });
}
