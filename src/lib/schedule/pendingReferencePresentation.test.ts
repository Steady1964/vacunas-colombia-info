import { describe, expect, it } from 'vitest';
import { getCatalog, HISTORICAL_CATALOG_VERSION } from '../../data/catalog';
import type { Catalog } from '../../data/catalog/types';
import { makeProfile } from '../../test/fixtures';
import { calculateSchedule } from './calculateSchedule';
import { getPendingReferenceGroups } from './pendingReferencePresentation';
import { summarizeSchedule, type RequirementView } from './summarizeSchedule';

const profile = makeProfile({ birthDate: '2026-07-10' });
const catalog = getCatalog(profile.referenceCatalogVersion)!;
const today = '2026-10-20';

function itemsFor(
  selected: string[] = [],
  sourceCatalog = catalog,
  sourceProfile = profile,
): RequirementView[] {
  return summarizeSchedule(
    calculateSchedule(sourceProfile, sourceCatalog, today, selected),
    {
      coveredRequirementIds: new Set(['bcg', 'hep-b-birth']),
      reviewByAdministrationId: new Map(),
    },
    today,
  ).items;
}

describe('referencias pendientes del inicio', () => {
  it('ordena todas las pendientes, incluso pasadas y a más de treinta días, sin reintroducir cubiertas', () => {
    const items = itemsFor(['rotateq']);
    const groups = getPendingReferenceGroups(
      profile,
      catalog,
      [...items].reverse(),
    );
    expect(groups.pai[0].requirement.estimatedDate).toBe('2026-08-21');
    expect(
      groups.pai.some(({ requirement }) => requirement.id === 'penta-3'),
    ).toBe(true);
    expect(
      groups.pai.some(({ requirement }) => requirement.id === 'varicella-2'),
    ).toBe(true);
    expect(groups.pai.some(({ requirement }) => requirement.id === 'bcg')).toBe(
      false,
    );
    expect(groups.private[0].requirement.id).toBe('rota-private-3');
    expect(groups.private[0].requirement.estimatedDate).toBeNull();
  });

  it.each([
    [
      'CO-PAI-PRIMARY-6-12-18-WEEKS-2026',
      '6 semanas',
      '2026-08-21',
      '1 mes y 11 días',
    ],
    ['CO-PAI-PRIMARY-2-4-6', '2 meses', '2026-09-10', '2 meses'],
  ] as const)(
    'separa edad de fuente y edad calendario en %s',
    (primaryScheduleId, sourceAge, date, calendarAge) => {
      const selectedProfile = { ...profile, primaryScheduleId };
      const groups = getPendingReferenceGroups(
        selectedProfile,
        catalog,
        itemsFor([], catalog, selectedProfile),
      );
      const first = groups.pai.find(
        ({ requirement }) => requirement.id === 'penta-1',
      )!;
      expect(first.sourceAgeLabel).toBe(sourceAge);
      expect(first.calendarAgeLabel).toBe(calendarAge);
      expect(first.requirement.estimatedDate).toBe(date);
      expect(first.initialReference).toMatchObject({
        doseNumber: 1,
        estimatedDate: date,
        sourceAgeLabel: sourceAge,
      });
    },
  );

  it('restringe los totales derivados a etapas verificadas de la serie primaria activa', () => {
    const groups = getPendingReferenceGroups(profile, catalog, itemsFor());
    expect(
      groups.pai.find(({ requirement }) => requirement.id === 'penta-2')
        ?.documentedTotal,
    ).toEqual({ doseCount: 3, scope: 'primary-series' });
    expect(
      groups.pai.find(({ requirement }) => requirement.id === 'pcv-2')
        ?.documentedTotal,
    ).toEqual({ doseCount: 2, scope: 'primary-series' });
    expect(
      groups.pai.find(({ requirement }) => requirement.id === 'pcv-booster')
        ?.documentedTotal,
    ).toEqual({ doseCount: 3, scope: 'selected-reference' });
    expect(
      groups.pai.find(({ requirement }) => requirement.id === 'ipv-booster-1')
        ?.documentedTotal,
    ).toEqual({ doseCount: 5, scope: 'selected-reference' });
  });

  it.each([
    ['srp-2', 2],
    ['varicella-2', 2],
    ['influenza-2', 2],
    ['pcv-booster', 3],
    ['ipv-booster-2', 5],
    ['hep-a-1', 1],
  ] as const)(
    'documenta %s solo dentro de la referencia seleccionada',
    (id, doseCount) => {
      const groups = getPendingReferenceGroups(profile, catalog, itemsFor());
      expect(
        groups.pai.find(({ requirement }) => requirement.id === id)
          ?.documentedTotal,
      ).toEqual({ doseCount, scope: 'selected-reference' });
    },
  );

  it('no convierte una regla aislada de dosis cinco en un curso completo ni toma otra vacuna como inicio', () => {
    const fifth = getPendingReferenceGroups(
      profile,
      catalog,
      itemsFor(),
    ).pai.find(({ requirement }) => requirement.id === 'dpt-booster-2')!;
    expect(fifth.documentedTotal).toBeNull();
    expect(fifth.initialReference).toBeNull();
  });

  it('no omite silenciosamente una regla cuyo requisito falta en la referencia activa', () => {
    const items = itemsFor().filter(({ id }) => id !== 'srp-1');
    const groups = getPendingReferenceGroups(profile, catalog, items);
    expect(
      groups.pai.find(({ requirement }) => requirement.id === 'srp-2')
        ?.documentedTotal,
    ).toBeNull();
    const missingProjection: Catalog = {
      ...catalog,
      sharedProjections: catalog.sharedProjections.filter(
        ({ requirementId }) => requirementId !== 'varicella-1',
      ),
    };
    const withoutProjection = getPendingReferenceGroups(
      profile,
      missingProjection,
      itemsFor([], missingProjection),
    );
    expect(
      withoutProjection.pai.find(
        ({ requirement }) => requirement.id === 'varicella-2',
      )?.documentedTotal,
    ).toBeNull();
  });

  it('rechaza huecos, reglas sin verificar y contradicciones de conteo explícito en cursos compartidos', () => {
    const changed: Catalog = {
      ...catalog,
      products: catalog.products.map((product) => {
        if (product.id === 'srp')
          return {
            ...product,
            coverageRules: product.coverageRules.filter(
              ({ doseNumber }) => doseNumber !== 1,
            ),
          };
        if (product.id === 'varicella')
          return {
            ...product,
            coverageRules: product.coverageRules.map((rule) =>
              rule.doseNumber === 1
                ? { ...rule, sourceIds: ['not-verified'] }
                : rule,
            ),
          };
        if (product.id === 'influenza-seasonal')
          return { ...product, doseCount: 3 };
        return product;
      }),
    };
    const groups = getPendingReferenceGroups(
      profile,
      changed,
      itemsFor([], changed),
    );
    for (const id of ['srp-2', 'varicella-2', 'influenza-2'])
      expect(
        groups.pai.find(({ requirement }) => requirement.id === id)
          ?.documentedTotal,
      ).toBeNull();
  });

  it('exige consenso entre todos los productos que documentan un requisito compartido', () => {
    const srp = catalog.products.find(({ id }) => id === 'srp')!;
    const conflicting: Catalog = {
      ...catalog,
      products: [
        ...catalog.products,
        {
          ...srp,
          id: 'alternate-fixture-course',
          coverageRules: srp.coverageRules.filter(
            ({ doseNumber }) => doseNumber === 1,
          ),
        },
      ],
    };
    const groups = getPendingReferenceGroups(
      profile,
      conflicting,
      itemsFor([], conflicting),
    );
    expect(
      groups.pai.find(({ requirement }) => requirement.id === 'srp-1')
        ?.documentedTotal,
    ).toBeNull();
  });

  it('no adjudica Rotarix a una referencia genérica ni confunde su curso con RotaTeq', () => {
    const groups = getPendingReferenceGroups(
      profile,
      catalog,
      itemsFor(['rotateq']),
    );
    expect(
      groups.pai.find(({ requirement }) => requirement.id === 'rota-1')
        ?.documentedTotal,
    ).toBeNull();
    const third = groups.private.find(
      ({ requirement }) => requirement.id === 'rota-private-3',
    )!;
    expect(third.documentedTotal).toEqual({
      doseCount: 3,
      scope: 'product-course',
      productName: catalog.products.find(({ id }) => id === 'rotateq')!.name,
    });
    expect(third.initialReference).toMatchObject({
      doseNumber: 1,
      estimatedDate: '2026-08-21',
    });
    expect(third.sourceAgeLabel).toBe('Edad por confirmar');
    expect(third.calendarAgeLabel).toBeNull();
  });

  it('mantiene acceso condicional separado y solo muestra opcionales ya presentes en el resumen', () => {
    const noOptional = getPendingReferenceGroups(profile, catalog, itemsFor());
    expect(noOptional.private).toEqual([]);
    expect(noOptional.conditional).toEqual([]);
    const groups = getPendingReferenceGroups(
      profile,
      catalog,
      itemsFor(['measles-zero', 'meningococcal-acwy']),
    );
    expect(groups.conditional.map(({ requirement }) => requirement.id)).toEqual(
      ['measles-zero'],
    );
    expect(groups.private.map(({ requirement }) => requirement.id)).toEqual([
      'meningococcal-acwy-1',
    ]);
    expect(groups.private[0].documentedTotal).toBeNull();
    expect(groups.private[0].sourceAgeLabel).toBe('Edad por confirmar');
    expect(groups.private[0].initialReference?.estimatedDate).toBeNull();
  });

  it('sitúa las referencias sin fecha después de las fechadas dentro de su grupo', () => {
    const items = itemsFor(['rotateq', 'meningococcal-acwy']);
    const dated = {
      ...items.find(({ id }) => id === 'rota-private-3')!,
      estimatedDate: '2026-12-01',
    };
    const groups = getPendingReferenceGroups(profile, catalog, [
      items.find(({ id }) => id === 'meningococcal-acwy-1')!,
      dated,
    ]);
    expect(groups.private.map(({ requirement }) => requirement.id)).toEqual([
      'rota-private-3',
      'meningococcal-acwy-1',
    ]);
  });

  it('no deriva totales de reglas no verificadas ni de etapas faltantes', () => {
    const changed: Catalog = {
      ...catalog,
      products: catalog.products.map((product) => ({
        ...product,
        coverageRules: product.coverageRules.filter(
          (rule) => rule.doseNumber !== 2,
        ),
      })),
    };
    expect(
      getPendingReferenceGroups(
        profile,
        changed,
        itemsFor([], changed),
      ).pai.find(({ requirement }) => requirement.id === 'penta-1')
        ?.documentedTotal,
    ).toBeNull();
    const unverified: Catalog = {
      ...catalog,
      sources: catalog.sources.map((source) => ({
        ...source,
        verification: 'needs-review',
      })),
    };
    const groups = getPendingReferenceGroups(
      profile,
      unverified,
      itemsFor(['rotateq'], unverified),
    );
    expect(groups.pai.every((item) => item.documentedTotal === null)).toBe(
      true,
    );
    expect(
      groups.pai.every((item) => item.sourceAgeLabel === 'Edad por confirmar'),
    ).toBe(true);
    expect(groups.private[0].documentedTotal).toBeNull();
  });

  it('usa las proyecciones históricas sin prestar la fecha del catálogo vigente', () => {
    const historical = getCatalog(HISTORICAL_CATALOG_VERSION)!;
    const selectedProfile = makeProfile({
      birthDate: '2026-07-10',
      referenceCatalogVersion: HISTORICAL_CATALOG_VERSION,
      primaryScheduleId: 'CO-PAI-PRIMARY-2-4-6',
    });
    const groups = getPendingReferenceGroups(
      selectedProfile,
      historical,
      itemsFor([], historical, selectedProfile),
    );
    const yellow = groups.pai.find(
      ({ requirement }) => requirement.id === 'yellow-fever',
    )!;
    expect(yellow.sourceAgeLabel).toBe('18 meses');
    expect(yellow.requirement.estimatedDate).toBe('2028-01-10');
  });
});
