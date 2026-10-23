import { describe, expect, it } from 'vitest';
import { CURRENT_CATALOG_VERSION, getCatalog } from '../../data/catalog';
import { makeAdministration, makeProfile } from '../../test/fixtures';
import { calculateSchedule } from './calculateSchedule';
import { resolveCoverage, resolveSelection } from './resolveCoverage';

const FIXED_TODAY = '2026-10-16';

describe('cobertura por producto, dosis y etapa', () => {
  it('una hexavalente cubre penta/IPV de una sola etapa sin doble conteo', () => {
    const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
    const profile = makeProfile({ referenceCatalogVersion: catalog.version });
    const selection = resolveSelection(
      {
        productId: 'hexavalent-acellular',
        doseNumber: 1,
        milestoneId: 'primary-1',
      },
      catalog,
    );
    expect(selection.coveredRequirementIds.slice().sort()).toEqual([
      'ipv-1',
      'penta-1',
    ]);
    const event = makeAdministration({
      childId: profile.id,
      appliedDate: '2026-03-14',
      productId: 'hexavalent-acellular',
      doseNumber: 1,
      milestoneId: 'primary-1',
      ...selection,
    });
    const events = [
      event,
      { ...event, id: '10000000-0000-4000-8000-000000000002' },
    ];
    const before = structuredClone(events);
    const result = resolveCoverage(
      profile,
      events,
      calculateSchedule(profile, catalog, FIXED_TODAY, []),
      catalog,
      FIXED_TODAY,
    );
    expect([...result.coveredRequirementIds].sort()).toEqual([
      'ipv-1',
      'penta-1',
    ]);
    expect(result.coveredRequirementIds.has('penta-2')).toBe(false);
    expect(events).toEqual(before);
  });

  it('uses the selected biologic, not its laboratory text, to link one hexavalent dose', () => {
    const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
    const profile = makeProfile({ birthDate: '2026-07-10' });
    const input = {
      productId: 'hexavalent-acellular',
      brand: 'Sanofi',
      doseNumber: 1,
      milestoneId: 'primary-1',
    };
    const selection = resolveSelection(input, catalog);
    expect(selection).toEqual({
      coveredRequirementIds: ['penta-1', 'ipv-1'],
      coverageStatus: 'verified',
      reviewReasons: [],
    });
    const event = makeAdministration({
      ...input,
      ...selection,
      productName: 'Hexaxim',
      appliedDate: '2026-08-25',
    });
    const result = resolveCoverage(
      profile,
      [event],
      calculateSchedule(profile, catalog, FIXED_TODAY, []),
      catalog,
      FIXED_TODAY,
    );
    expect([...result.coveredRequirementIds].sort()).toEqual([
      'ipv-1',
      'penta-1',
    ]);
    expect(result.reviewByAdministrationId.has(event.id)).toBe(false);
  });

  it('does not identify a manual biologic from a commercial brand alone', () => {
    const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
    const result = resolveSelection(
      {
        productId: 'unidentified',
        brand: 'Hexaxim',
        doseNumber: 1,
        milestoneId: 'primary-1',
      },
      catalog,
    );
    expect(result.coveredRequirementIds).toEqual([]);
    expect(result.reviewReasons).toContain('unidentified-product');
  });

  it('nunca promociona registros heredados, futuros o pertenecientes a otro niño', () => {
    const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
    const profile = makeProfile({ referenceCatalogVersion: catalog.version });
    const valid = makeAdministration({
      childId: profile.id,
      appliedDate: '2026-03-14',
      productId: 'hexavalent-acellular',
      doseNumber: 1,
      milestoneId: 'primary-1',
      ...resolveSelection(
        {
          productId: 'hexavalent-acellular',
          doseNumber: 1,
          milestoneId: 'primary-1',
        },
        catalog,
      ),
    });
    const legacy = {
      ...valid,
      coverageStatus: 'needs-review' as const,
      reviewReasons: ['legacy-unconfirmed' as const],
    };
    const future = {
      ...valid,
      id: '10000000-0000-4000-8000-000000000002',
      appliedDate: '2099-01-01',
    };
    const sibling = {
      ...valid,
      id: '10000000-0000-4000-8000-000000000003',
      childId: '00000000-0000-4000-8000-000000000002',
    };
    const result = resolveCoverage(
      profile,
      [legacy, future, sibling],
      calculateSchedule(profile, catalog, FIXED_TODAY, []),
      catalog,
      FIXED_TODAY,
    );
    expect([...result.coveredRequirementIds]).toEqual([]);
    expect(result.reviewByAdministrationId.get(legacy.id)).toContain(
      'legacy-unconfirmed',
    );
    expect(result.reviewByAdministrationId.get(future.id)).toContain(
      'future-date',
    );
    expect(result.reviewByAdministrationId.has(sibling.id)).toBe(false);
  });

  it('dos aplicaciones de Rotateq no satisfacen una tercera ni un curso mixto', () => {
    const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
    const profile = makeProfile({ referenceCatalogVersion: catalog.version });
    const events = [1, 2].map((n) =>
      makeAdministration({
        id: `10000000-0000-4000-8000-00000000000${n}`,
        childId: profile.id,
        appliedDate: n === 1 ? '2026-03-14' : '2026-04-25',
        productId: 'rotateq',
        doseNumber: n,
        milestoneId: `primary-${n}`,
        ...resolveSelection(
          { productId: 'rotateq', doseNumber: n, milestoneId: `primary-${n}` },
          catalog,
        ),
      }),
    );
    const scheduled = calculateSchedule(profile, catalog, FIXED_TODAY, [
      'rotateq',
    ]);
    const result = resolveCoverage(
      profile,
      events,
      scheduled,
      catalog,
      FIXED_TODAY,
    );
    expect(result.coveredRequirementIds.has('rota-1')).toBe(true);
    expect(result.coveredRequirementIds.has('rota-2')).toBe(true);
    expect(result.coveredRequirementIds.has('rota-private-3')).toBe(false);
    const mixed = resolveCoverage(
      profile,
      [
        ...events,
        {
          ...events[0],
          id: '10000000-0000-4000-8000-000000000003',
          productId: 'rotarix',
        },
      ],
      scheduled,
      catalog,
      FIXED_TODAY,
    );
    expect(mixed.reviewByAdministrationId.get(events[0].id)).toContain(
      'mixed-course',
    );
    expect(mixed.coveredRequirementIds.has('rota-1')).toBe(false);
  });

  it('no concede cobertura sin producto/etapa o con fuente no verificada', () => {
    const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
    expect(
      resolveSelection(
        { productId: 'unidentified', doseNumber: 1, milestoneId: 'primary-1' },
        catalog,
      ).coverageStatus,
    ).toBe('needs-review');
    expect(
      resolveSelection({ productId: 'hexavalent-acellular' }, catalog)
        .coveredRequirementIds,
    ).toEqual([]);
    const unverified = {
      ...catalog,
      sources: catalog.sources.map((s) => ({
        ...s,
        verification: 'needs-review' as const,
      })),
    };
    expect(
      resolveSelection(
        {
          productId: 'hexavalent-acellular',
          doseNumber: 1,
          milestoneId: 'primary-1',
        },
        unverified,
      ).coveredRequirementIds,
    ).toEqual([]);
  });
});
