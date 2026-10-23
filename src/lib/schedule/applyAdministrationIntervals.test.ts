import { describe, expect, it } from 'vitest';
import {
  CURRENT_CATALOG_VERSION,
  HISTORICAL_CATALOG_VERSION,
  getCatalog,
} from '../../data/catalog';
import type { Catalog } from '../../data/catalog/types';
import { makeAdministration, makeProfile } from '../../test/fixtures';
import type { ChildProfile, VaccineAdministration } from '../types';
import { applyAdministrationIntervals } from './applyAdministrationIntervals';
import { calculateSchedule } from './calculateSchedule';
import { resolveCoverage, resolveSelection } from './resolveCoverage';
import { summarizeSchedule } from './summarizeSchedule';

const TODAY = '2026-12-01';
const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
const profile = makeProfile({ birthDate: '2026-07-10' });

function injection(
  doseNumber: number,
  appliedDate: string,
  overrides: Partial<VaccineAdministration> = {},
): VaccineAdministration {
  const selection = {
    productId: overrides.productId ?? 'hexavalent-acellular',
    doseNumber,
    milestoneId: `primary-${doseNumber}`,
    brand: overrides.brand,
  };
  return makeAdministration({
    id: `application-${doseNumber}`,
    childId: profile.id,
    appliedDate,
    ...selection,
    ...resolveSelection(selection, catalog),
    ...overrides,
  });
}

function pipeline(
  applications: readonly VaccineAdministration[],
  selectedProfile: ChildProfile = profile,
  selectedCatalog: Catalog = catalog,
  today = TODAY,
) {
  const base = calculateSchedule(selectedProfile, selectedCatalog, today, [
    'rotateq',
    'meningococcal-acwy',
  ]);
  const coverage = resolveCoverage(
    selectedProfile,
    applications,
    base,
    selectedCatalog,
    today,
  );
  const result = applyAdministrationIntervals(
    selectedProfile,
    selectedCatalog,
    base,
    applications,
    coverage,
    today,
  );
  return { base, result, coverage };
}

describe('actual-administration primary intervals', () => {
  it.each([
    ['2026-08-21', '2026-10-02'],
    ['2026-09-01', '2026-10-13'],
  ])('uses the actual first injection %s, not a birth offset', (date, want) => {
    const application = injection(1, date);
    const { result } = pipeline([application]);
    for (const id of ['penta-2', 'ipv-2']) {
      expect(result.find((row) => row.id === id)).toMatchObject({
        estimatedDate: want,
        timing: {
          kind: 'after-administration',
          referenceDate: '2026-10-02',
          appliedDate: date,
          administrationId: application.id,
          intervalDays: 42,
          sourceIds: expect.arrayContaining(['minsalud-january-2026']),
        },
      });
    }
  });

  it('anchors the third only to an actual, coherent second injection', () => {
    const { result } = pipeline([
      injection(1, '2026-09-01'),
      injection(2, '2026-10-13'),
    ]);
    for (const id of ['penta-3', 'ipv-3']) {
      expect(result.find((row) => row.id === id)).toMatchObject({
        estimatedDate: '2026-11-24',
        timing: {
          kind: 'after-administration',
          administrationId: 'application-2',
          referenceDate: '2026-11-13',
        },
      });
    }
  });

  it('does not cascade a projected second dose into a fabricated third', () => {
    const { result } = pipeline([injection(1, '2026-09-01')]);
    expect(result.find((row) => row.id === 'penta-2')?.estimatedDate).toBe(
      '2026-10-13',
    );
    for (const id of ['penta-3', 'ipv-3']) {
      expect(result.find((row) => row.id === id)).toMatchObject({
        estimatedDate: null,
        timing: {
          kind: 'needs-review',
          referenceDate: '2026-11-13',
          reason: expect.any(String),
        },
      });
    }
  });

  it('does not feature the third before the actual-dose-based second in summary', () => {
    const { result, coverage } = pipeline(
      [injection(1, '2026-11-01')],
      profile,
      catalog,
      '2026-11-02',
    );
    const summary = summarizeSchedule(result, coverage, '2026-11-02');
    for (const id of ['penta-2', 'ipv-2']) {
      expect(summary.items.find((row) => row.id === id)).toMatchObject({
        estimatedDate: '2026-12-13',
        status: 'pending',
      });
    }
    for (const id of ['penta-3', 'ipv-3']) {
      expect(summary.items.find((row) => row.id === id)).toMatchObject({
        estimatedDate: null,
        status: 'needs-review',
        timing: { referenceDate: '2026-11-13' },
      });
      expect(summary.nextRequirementIds).not.toContain(id);
    }
  });

  it('keeps access metadata out of the biological interval calculation', () => {
    const application = injection(1, '2026-09-01');
    expect(
      pipeline([{ ...application, accessType: 'private' }]).result,
    ).toEqual(pipeline([{ ...application, accessType: 'pai' }]).result);
  });

  it('does not shift IPV from an isolated pentavalent administration', () => {
    const { result, base } = pipeline([
      injection(1, '2026-09-01', { productId: 'pentavalent-cellular' }),
    ]);
    expect(result.find((row) => row.id === 'penta-2')?.estimatedDate).toBe(
      '2026-10-13',
    );
    expect(result.find((row) => row.id === 'ipv-2')).toEqual(
      base.find((row) => row.id === 'ipv-2'),
    );
  });

  it('preserves first doses, newborn anchors and all unrelated biologicals', () => {
    const { result, base } = pipeline([injection(1, '2026-09-01')]);
    for (const row of base) {
      if (['penta-2', 'ipv-2', 'penta-3', 'ipv-3'].includes(row.id)) continue;
      expect(result.find((candidate) => candidate.id === row.id)).toEqual(row);
    }
  });

  it.each([
    [CURRENT_CATALOG_VERSION, 'CO-PAI-PRIMARY-2-4-6'],
    [HISTORICAL_CATALOG_VERSION, 'CO-PAI-PRIMARY-2-4-6'],
  ] as const)(
    'leaves the historical reference %s unchanged',
    (version, scheme) => {
      const selectedProfile = {
        ...profile,
        primaryScheduleId: scheme,
        referenceCatalogVersion: version,
      };
      const { base, result } = pipeline(
        [injection(1, '2026-09-01')],
        selectedProfile,
        getCatalog(version)!,
      );
      expect(result).toEqual(base);
    },
  );

  it('ignores another child completely', () => {
    const { base, result } = pipeline([
      injection(1, '2026-09-01', { childId: 'another-child' }),
    ]);
    expect(result).toEqual(base);
  });

  it.each([
    ['unknown brand', { brand: 'Raw unrecognized lab' }],
    ['unknown stage', { milestoneId: undefined }],
    ['future date', { appliedDate: '2027-01-01' }],
    ['before birth', { appliedDate: '2026-07-09' }],
    ['invalid civil date', { appliedDate: '2026-02-30' }],
    ['unreviewed record', { coverageStatus: 'needs-review' as const }],
    ['stored coverage mismatch', { coveredRequirementIds: ['penta-2'] }],
    ['incomplete stored coverage', { coveredRequirementIds: ['penta-1'] }],
  ])('does not automate unsafe continuation: %s', (_name, overrides) => {
    const { result } = pipeline([injection(1, '2026-09-01', overrides)]);
    const row = result.find((candidate) => candidate.id === 'penta-2');
    expect(row?.estimatedDate).toBeNull();
    expect(row?.timing).toMatchObject({
      kind: 'needs-review',
      referenceDate: '2026-10-02',
      reason: expect.any(String),
      sourceIds: expect.arrayContaining(['minsalud-january-2026']),
    });
  });

  it.each(['missing', 'needs-review'] as const)(
    'rechecks the interval source when it is %s at calculation time',
    (state) => {
      const changed: Catalog = {
        ...catalog,
        sources:
          state === 'missing'
            ? catalog.sources.filter(
                (source) => source.id !== 'minsalud-january-2026',
              )
            : catalog.sources.map((source) =>
                source.id === 'minsalud-january-2026'
                  ? { ...source, verification: 'needs-review' as const }
                  : source,
              ),
      };
      const { result } = pipeline(
        [injection(1, '2026-09-01')],
        profile,
        changed,
      );
      expect(result.find((row) => row.id === 'penta-2')).toMatchObject({
        estimatedDate: null,
        timing: { kind: 'needs-review' },
      });
    },
  );

  it.each([
    [
      'duplicate first stage',
      [
        injection(1, '2026-09-01'),
        injection(1, '2026-09-01', { id: 'duplicate' }),
      ],
      'penta-2',
    ],
    [
      'conflicting first dates',
      [
        injection(1, '2026-09-01'),
        injection(1, '2026-09-02', { id: 'conflict' }),
      ],
      'penta-2',
    ],
    [
      'second before programmatic interval',
      [injection(1, '2026-09-01'), injection(2, '2026-10-12')],
      'penta-3',
    ],
    [
      'out of order',
      [injection(1, '2026-09-01'), injection(2, '2026-08-25')],
      'penta-3',
    ],
    ['missing first stage', [injection(2, '2026-10-13')], 'penta-3'],
    [
      'mixed primary products',
      [
        injection(1, '2026-09-01'),
        injection(2, '2026-10-13', { productId: 'pentavalent-cellular' }),
      ],
      'penta-3',
    ],
    [
      'mixed hexavalent brands',
      [
        injection(1, '2026-09-01', { brand: 'Hexaxim' }),
        injection(2, '2026-10-13', { brand: 'Infanrix hexa' }),
      ],
      'penta-3',
    ],
    ['first before six weeks', [injection(1, '2026-08-20')], 'penta-2'],
  ])('requires review for %s', (_name, applications, requirementId) => {
    const { result } = pipeline(applications as VaccineAdministration[]);
    expect(result.find((row) => row.id === requirementId)).toMatchObject({
      estimatedDate: null,
      timing: { kind: 'needs-review', reason: expect.any(String) },
    });
  });

  it('does not derive an interval from free text or an unrelated biological', () => {
    const { base, result } = pipeline([
      makeAdministration({
        childId: profile.id,
        productName: 'Hexaxim / pentavalente',
        brand: 'Hexaxim',
        appliedDate: '2026-09-01',
      }),
      injection(1, '2026-09-01', { productId: 'rotarix', id: 'rotavirus' }),
    ]);
    expect(result).toEqual(base);
  });

  it('allows a coherent two-injection penta/IPV course without conflating injections', () => {
    const { result } = pipeline([
      injection(1, '2026-09-01', { productId: 'pentavalent-cellular' }),
      injection(1, '2026-09-03', { productId: 'ipv', id: 'ipv-first' }),
      injection(2, '2026-10-13', { productId: 'pentavalent-cellular' }),
      injection(2, '2026-10-15', { productId: 'ipv', id: 'ipv-second' }),
    ]);
    expect(result.find((row) => row.id === 'penta-3')?.estimatedDate).toBe(
      '2026-11-24',
    );
    expect(result.find((row) => row.id === 'ipv-3')?.estimatedDate).toBe(
      '2026-11-26',
    );
  });

  it('requires review when actual+42days reaches the first birthday', () => {
    const olderProfile = { ...profile, birthDate: '2025-11-12' };
    const { result } = pipeline([injection(1, '2026-10-01')], olderProfile);
    expect(result.find((row) => row.id === 'penta-2')).toMatchObject({
      estimatedDate: null,
      timing: { kind: 'needs-review' },
    });
  });

  it('permits the day before the first birthday but not rescue after it', () => {
    const { result } = pipeline([injection(1, '2026-10-01')], {
      ...profile,
      birthDate: '2025-11-13',
    });
    expect(result.find((row) => row.id === 'penta-2')?.estimatedDate).toBe(
      '2026-11-12',
    );
  });

  it('preserves raw input, coverage and catalog and sorts null dates last', () => {
    const applications = [injection(1, '2026-09-01')];
    const saved = structuredClone({ applications, catalog, profile });
    const base = calculateSchedule(profile, catalog, TODAY, []);
    const coverage = resolveCoverage(
      profile,
      applications,
      base,
      catalog,
      TODAY,
    );
    const before = structuredClone({ base, coverage });
    const result = applyAdministrationIntervals(
      profile,
      catalog,
      base,
      applications,
      coverage,
      TODAY,
    );
    expect({ applications, catalog, profile }).toEqual(saved);
    expect({ base, coverage }).toEqual(before);
    expect(result.find((row) => row.id === 'penta-2')?.estimatedDate).toBe(
      '2026-10-13',
    );
    expect(result.map((row) => row.estimatedDate ?? '9999-12-31')).toEqual(
      result.map((row) => row.estimatedDate ?? '9999-12-31').sort(),
    );
  });
});
