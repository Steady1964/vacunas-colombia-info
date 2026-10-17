import { primaryRequirements, traditionalProjections } from './primary-traditional-2-4-6';
import { products } from './products';
import { sharedProjections, sharedRequirements } from './shared-requirements-co-2026-10';
import type { Product, Projection, Requirement } from './types';

export const HISTORICAL_SOURCE_ID = 'eps-sanitas-schedule-undated';

export const historicalPrimaryRequirements: Requirement[] = primaryRequirements.map((requirement) => {
  if (requirement.id.startsWith('ipv-')) {
    return {
      ...requirement,
      name: `Polio — dosis ${requirement.doseNumber}`,
      sourceIds: [HISTORICAL_SOURCE_ID],
      note: 'La pieza histórica indica polio sin identificar formulación. Registrar el producto real y confirmar correspondencia con el vacunador.',
    };
  }
  return { ...requirement, sourceIds: [HISTORICAL_SOURCE_ID] };
});

export const historicalSharedRequirements: Requirement[] = sharedRequirements.map((requirement) => {
  const sourceIds = [HISTORICAL_SOURCE_ID];
  if (requirement.id === 'yellow-fever') {
    return {
      ...requirement,
      milestoneId: 'month-18',
      sourceIds,
      note: 'Referencia histórica a 18 meses según la pieza de EPS Sanitas, edición 2, sin fecha editorial visible. Confirmar vigencia y elegibilidad con el vacunador.',
    };
  }
  if (requirement.id === 'ipv-booster-1' || requirement.id === 'ipv-booster-2') {
    return {
      ...requirement,
      name: requirement.id === 'ipv-booster-1' ? 'Polio — primer refuerzo' : 'Polio — segundo refuerzo',
      sourceIds,
      note: 'La pieza histórica indica polio sin identificar formulación. Registrar el producto real y confirmar correspondencia con el vacunador.',
    };
  }
  if (requirement.id === 'srp-2') {
    return {
      ...requirement,
      sourceIds,
      note: 'La pieza histórica indica triple viral a los 18 meses. Las indicaciones adicionales por edad o antecedente no se convierten en requisitos universales.',
    };
  }
  return { ...requirement, sourceIds };
});

export const historicalPrimaryProjections: Projection[] = traditionalProjections;

export const historicalSharedProjections: Projection[] = sharedProjections.map((projection) => {
  if (projection.requirementId === 'yellow-fever') {
    return { ...projection, offset: { unit: 'months', value: 18 } };
  }
  return projection;
});

const historicalPolioRequirementIds: Record<string, true> = {
  'ipv-1': true,
  'ipv-2': true,
  'ipv-3': true,
  'ipv-booster-1': true,
  'ipv-booster-2': true,
};

export const historicalProducts: Product[] = [];
for (const product of products) {
  const coverageRules: typeof product.coverageRules = [];
  for (const rule of product.coverageRules) {
    const requirementIds: string[] = [];
    for (const requirementId of rule.requirementIds) {
      if (!historicalPolioRequirementIds[requirementId]) requirementIds.push(requirementId);
    }
    if (requirementIds.length > 0) coverageRules.push({ ...rule, requirementIds });
  }
  historicalProducts.push({ ...product, coverageRules });
}
