import { describe, expect, it } from 'vitest';
import { calculateSchedule } from '../../lib/schedule/calculateSchedule';
import { resolveSelection } from '../../lib/schedule/resolveCoverage';
import { makeProfile } from '../../test/fixtures';
import { CURRENT_CATALOG_VERSION, getCatalog, UNIDENTIFIED_PRODUCT_ID } from './index';
import type { Catalog } from './types';

const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
const today = '2026-10-16';

const modes = [
  'CO-PAI-PRIMARY-2-4-6',
  'CO-PAI-PRIMARY-6-12-18-WEEKS-2026',
] as const;

describe('catálogo Colombia con evidencia y límites explícitos', () => {
  it('no sustituye una versión no disponible por la actual', () => {
    expect(catalog.version).toBe(CURRENT_CATALOG_VERSION);
    for (const version of ['desconocido', '', '__proto__', 'CO-PAI-SHARED-2026-11']) {
      expect(getCatalog(version)).toBeUndefined();
    }
  });

  it.each(modes)('conserva las tres etapas penta/IPV y solo dos primarias PCV/rotavirus en %s', (primaryScheduleId) => {
    const schedule = calculateSchedule(makeProfile({ primaryScheduleId }), catalog, today, []);
    for (const component of ['penta', 'ipv']) {
      for (const doseNumber of [1, 2, 3]) {
        const requirement = schedule.find((item) => item.id === `${component}-${doseNumber}`);
        expect(requirement?.milestoneId).toBe(`primary-${doseNumber}`);
        expect(requirement?.estimatedDate).not.toBeNull();
      }
    }
    expect(schedule.filter((item) => /^pcv-\d$/.test(item.id))).toHaveLength(2);
    expect(schedule.filter((item) => /^rota-\d$/.test(item.id))).toHaveLength(2);
    expect(schedule.some((item) => item.id === 'pcv-booster')).toBe(true);
    expect(schedule.some((item) => item.id === 'rota-private-3')).toBe(false);
    expect(schedule.some((item) => item.id === 'measles-zero')).toBe(false);
  });

  it('cambia solo el ritmo primario y mantiene hitos compartidos reales en ambos modos', () => {
    const [traditional, shortened] = modes.map((primaryScheduleId) =>
      calculateSchedule(makeProfile({ primaryScheduleId }), catalog, today, []));
    const dates = [traditional, shortened].map((schedule) =>
      Object.fromEntries(schedule.map((item) => [item.id, item.estimatedDate])));
    expect(dates[0]['penta-3']).toBe('2026-07-31');
    expect(dates[1]['penta-3']).toBe('2026-06-06');
    for (const reference of dates) {
      expect(reference['influenza-1']).toBe('2026-07-31');
      expect(reference['influenza-2']).toBe('2026-08-31');
      expect(reference['yellow-fever']).toBe('2026-10-31');
      expect(reference['srp-2']).toBe('2027-07-31');
      expect(reference['pcv-booster']).toBe('2027-01-31');
    }
    for (const schedule of [traditional, shortened]) {
      expect(schedule.filter((item) => item.id === 'srp-2')).toHaveLength(1);
      expect(schedule.some((item) => item.milestoneId === 'year-5' && item.disease.includes('Sarampión'))).toBe(false);
    }
  });

  it('distingue un curso de tres dosis de una tercera dosis universal', () => {
    const profile = makeProfile();
    const selected = calculateSchedule(profile, catalog, today, ['rotateq']);
    expect(selected.find((item) => item.id === 'rota-private-3')?.estimatedDate).toBeNull();
    expect(calculateSchedule(profile, catalog, today, ['rotarix']).some((item) => item.id === 'rota-private-3')).toBe(false);
    const firstTwo = [1, 2].flatMap((doseNumber) => resolveSelection({
      productId: 'rotateq', doseNumber, milestoneId: `primary-${doseNumber}`,
    }, catalog).coveredRequirementIds);
    expect(firstTwo).not.toContain('rota-private-3');
    expect(resolveSelection({ productId: 'rotateq', doseNumber: 3, milestoneId: 'primary-3' }, catalog).coveredRequirementIds).toEqual(['rota-private-3']);
    expect(resolveSelection({ productId: 'rotarix', doseNumber: 3, milestoneId: 'primary-3' }, catalog).coveredRequirementIds).toEqual([]);
  });

  it('limita la hexavalente a componentes y etapa confirmados, sin hepatitis B neonatal o refuerzos inferidos', () => {
    for (const doseNumber of [1, 2, 3]) {
      const selection = resolveSelection({ productId: 'hexavalent-acellular', doseNumber, milestoneId: `primary-${doseNumber}` }, catalog);
      expect(selection.coverageStatus).toBe('verified');
      expect(new Set(selection.coveredRequirementIds)).toEqual(new Set([`penta-${doseNumber}`, `ipv-${doseNumber}`]));
      expect(selection.coveredRequirementIds).not.toContain('hep-b-birth');
    }
    expect(resolveSelection({ productId: 'hexavalent-acellular', doseNumber: 1, milestoneId: 'primary-2' }, catalog).coveredRequirementIds).toEqual([]);
    expect(resolveSelection({ productId: 'hexavalent-acellular', doseNumber: 4, milestoneId: 'month-18' }, catalog).coveredRequirementIds).toEqual([]);
    expect(resolveSelection({ productId: 'Hexaxim', doseNumber: 1, milestoneId: 'primary-1' }, catalog).coveredRequirementIds).toEqual([]);
  });

  it('el refuerzo a 18 meses usa pentavalente y no asume DPT aislada', () => {
    expect(resolveSelection({ productId: 'pentavalent-cellular', doseNumber: 4, milestoneId: 'month-18' }, catalog).coveredRequirementIds).toEqual(['dpt-booster-1']);
    expect(resolveSelection({ productId: 'dpt', doseNumber: 4, milestoneId: 'month-18' }, catalog).coveredRequirementIds).toEqual([]);
    expect(resolveSelection({ productId: 'dpt', doseNumber: 5, milestoneId: 'year-5' }, catalog).coveredRequirementIds).toEqual(['dpt-booster-2']);
  });

  it('una sola fuente de regla por revisar o ausente impide conceder cobertura', () => {
    const selection = { productId: 'hexavalent-acellular', doseNumber: 1, milestoneId: 'primary-1' };
    const needsReview: Catalog = {
      ...catalog,
      sources: catalog.sources.map((source) => source.id === 'sanofi-hexaxim'
        ? { ...source, verification: 'needs-review' } : source),
    };
    const missing: Catalog = { ...catalog, sources: catalog.sources.filter((source) => source.id !== 'sanofi-hexaxim') };
    for (const reference of [needsReview, missing]) {
      const result = resolveSelection(selection, reference);
      expect(result.coverageStatus).toBe('needs-review');
      expect(result.coveredRequirementIds).toEqual([]);
    }
  });

  it('mantiene opcionales no verificadas visibles sin inventar fechas o cobertura', () => {
    const optional = calculateSchedule(makeProfile(), catalog, today, ['meningococcal-acwy', 'meningococcal-b', 'measles-zero']);
    for (const productId of ['meningococcal-acwy', 'meningococcal-b', 'measles-zero']) {
      const entries = catalog.optionalRequirements[productId];
      expect(entries.length).toBeGreaterThan(0);
      for (const { requirement } of entries) {
        expect(optional.find((item) => item.id === requirement.id)?.estimatedDate).toBeNull();
        expect(resolveSelection({ productId, doseNumber: requirement.doseNumber, milestoneId: requirement.milestoneId }, catalog).coveredRequirementIds).toEqual([]);
      }
    }
    expect(catalog.optionalRequirements['measles-zero'][0].requirement.access).toBe('conditional');
  });

  it('captura un producto no identificado sin asignarle composición ni correspondencias', () => {
    const unidentified = catalog.products.find((product) => product.id === UNIDENTIFIED_PRODUCT_ID)!;
    expect(unidentified.components).toEqual([]);
    expect(unidentified.coverageRules).toEqual([]);
    expect(resolveSelection({ productId: unidentified.id, doseNumber: 1, milestoneId: 'birth' }, catalog).coverageStatus).toBe('needs-review');
  });

  it('todas las proyecciones y reglas referencian entidades existentes, fuentes y etapas coherentes', () => {
    const allRequirements = [...catalog.requirements, ...Object.values(catalog.optionalRequirements).flatMap((entries) => entries.map((entry) => entry.requirement))];
    const ids = new Set(allRequirements.map((item) => item.id));
    expect(ids.size).toBe(allRequirements.length);
    const sourceIds = new Set(catalog.sources.map((source) => source.id));
    for (const requirement of allRequirements) {
      expect(requirement.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of requirement.sourceIds) expect(sourceIds.has(sourceId)).toBe(true);
    }
    for (const projection of [...Object.values(catalog.primarySchedules).flat(), ...catalog.sharedProjections]) {
      expect(ids.has(projection.requirementId)).toBe(true);
      expect(projection.offset).toBeDefined();
    }
    for (const product of catalog.products) {
      for (const sourceId of product.sourceIds) expect(sourceIds.has(sourceId)).toBe(true);
      for (const rule of product.coverageRules) {
        expect(rule.sourceIds.length).toBeGreaterThan(0);
        for (const sourceId of rule.sourceIds) expect(sourceIds.has(sourceId)).toBe(true);
        for (const requirementId of rule.requirementIds) {
          const requirement = allRequirements.find((item) => item.id === requirementId)!;
          expect(requirement).toBeDefined();
          expect(rule.milestoneId).toBe(requirement.milestoneId);
          expect(rule.doseNumber).toBe(requirement.doseNumber);
        }
      }
    }
  });
});
