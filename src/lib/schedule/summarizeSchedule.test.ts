import { describe, expect, it } from 'vitest';
import type { ScheduledRequirement } from './calculateSchedule';
import { summarizeSchedule } from './summarizeSchedule';
import { getCatalog } from '../../data/catalog';
import { makeAdministration, makeProfile } from '../../test/fixtures';
import { calculateSchedule } from './calculateSchedule';
import { resolveCoverage, resolveSelection } from './resolveCoverage';

const base = {
  name: 'Requisito de prueba',
  disease: 'Referencia',
  doseNumber: 1,
  milestoneId: 'primary-1',
  access: 'pai' as const,
  sourceIds: ['fixture'],
  conditional: false,
};

describe('resumen de requisitos, no de eventos ni hitos', () => {
  it('calcula 2/3 hasta hoy y mantiene las demás vacunas del mismo hito', () => {
    const scheduled: ScheduledRequirement[] = [
      { ...base, id: 'a', estimatedDate: '2026-10-01' },
      { ...base, id: 'b', estimatedDate: '2026-10-02' },
      { ...base, id: 'c', estimatedDate: '2026-10-03' },
      { ...base, id: 'future', estimatedDate: '2026-10-17' },
      { ...base, id: 'uncertain', estimatedDate: null },
    ];
    const result = summarizeSchedule(
      scheduled,
      {
        coveredRequirementIds: new Set(['a', 'b']),
        reviewByAdministrationId: new Map(),
      },
      '2026-10-16',
    );
    expect(result.progressPercent).toBe(67);
    expect(result.due).toBe(3);
    expect(result.dueCovered).toBe(2);
    expect(result.applied).toBe(2);
    expect(result.past).toBe(1);
    expect(result.needsReview).toBe(1);
    expect(result.items.find((r) => r.id === 'c')?.status).toBe('past');
    expect(result.nextRequirementIds).toEqual(['c']);
  });

  it('incluye hoy y 30 días en próximas, excluye 31 y no inventa 100% sin denominador', () => {
    const scheduled: ScheduledRequirement[] = [
      { ...base, id: 'today', estimatedDate: '2026-10-16' },
      { ...base, id: 'thirty', estimatedDate: '2026-11-15' },
      { ...base, id: 'thirty-one', estimatedDate: '2026-11-16' },
    ];
    const coverage = {
      coveredRequirementIds: new Set<string>(),
      reviewByAdministrationId: new Map(),
    };
    const result = summarizeSchedule(scheduled, coverage, '2026-10-16');
    expect(result.upcoming).toBe(2);
    expect(result.pending).toBe(1);
    expect(result.items.map((r) => r.status)).toEqual([
      'upcoming',
      'upcoming',
      'pending',
    ]);
    expect(
      summarizeSchedule(scheduled.slice(1), coverage, '2026-10-16')
        .progressPercent,
    ).toBeNull();
  });

  it('agrupa la siguiente fecha completa sin contar dos veces IDs repetidos', () => {
    const requirement = { ...base, id: 'a', estimatedDate: '2026-10-17' };
    const scheduled = [
      requirement,
      { ...base, id: 'b', estimatedDate: '2026-10-17' },
      requirement,
    ];
    const result = summarizeSchedule(
      scheduled,
      {
        coveredRequirementIds: new Set<string>(),
        reviewByAdministrationId: new Map(),
      },
      '2026-10-16',
    );
    expect(result.nextDate).toBe('2026-10-17');
    expect(result.nextRequirementIds).toEqual(['a', 'b']);
    expect(result.upcoming).toBe(2);
  });

  it('no salta las primeras dosis sin aplicar de un bebé nacido el 10 de julio', () => {
    const profile = makeProfile({ birthDate: '2026-07-10' });
    const catalog = getCatalog(profile.referenceCatalogVersion)!;
    const applications = ['bcg', 'hepatitis-b'].map((productId, index) => {
      const selection = {
        productId,
        doseNumber: 1,
        milestoneId: 'birth',
      };
      return makeAdministration({
        ...selection,
        id: `birth-${index}`,
        appliedDate: '2026-07-10',
        ...resolveSelection(selection, catalog),
      });
    });
    const scheduled = calculateSchedule(profile, catalog, '2026-10-20', []);
    const result = summarizeSchedule(
      scheduled,
      resolveCoverage(profile, applications, scheduled, catalog, '2026-10-20'),
      '2026-10-20',
    );

    expect(result.nextDate).toBe('2026-08-21');
    expect(result.nextRequirementIds).toContain('penta-1');
    expect(result.nextRequirementIds).toContain('ipv-1');
    expect(result.nextRequirementIds).not.toContain('penta-3');
    expect(result.items.find((item) => item.id === 'penta-1')?.status).toBe(
      'past',
    );
    expect(
      result.items.find((item) => item.id === 'penta-3')?.estimatedDate,
    ).toBe('2026-11-13');
  });

  it('avanza al siguiente grupo solo al cubrir completamente el anterior', () => {
    const scheduled: ScheduledRequirement[] = [
      { ...base, id: 'first-a', estimatedDate: '2026-08-21' },
      { ...base, id: 'first-b', estimatedDate: '2026-08-21' },
      { ...base, id: 'second', doseNumber: 2, estimatedDate: '2026-10-02' },
      { ...base, id: 'unknown', estimatedDate: null },
    ];
    const partial = summarizeSchedule(
      scheduled,
      {
        coveredRequirementIds: new Set(['first-a']),
        reviewByAdministrationId: new Map(),
      },
      '2026-10-20',
    );
    expect(partial.nextDate).toBe('2026-08-21');
    expect(partial.nextRequirementIds).toEqual(['first-b']);

    const complete = summarizeSchedule(
      scheduled,
      {
        coveredRequirementIds: new Set(['first-a', 'first-b']),
        reviewByAdministrationId: new Map(),
      },
      '2026-10-20',
    );
    expect(complete.nextDate).toBe('2026-10-02');
    expect(complete.nextRequirementIds).toEqual(['second']);
  });
});
