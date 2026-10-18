import { describe, expect, it } from 'vitest';
import { CURRENT_CATALOG_VERSION, getCatalog } from '../../data/catalog';
import { makeProfile } from '../../test/fixtures';
import { calculateSchedule } from './calculateSchedule';

const catalog = () => getCatalog(CURRENT_CATALOG_VERSION)!;

describe('calendario real por perfil', () => {
  it('proyecta la serie primaria completa con semanas exactas y meses calendario', () => {
    const profile = makeProfile({
      birthDate: '2026-01-31',
      referenceCatalogVersion: CURRENT_CATALOG_VERSION,
    });
    for (const [primaryScheduleId, dates] of [
      [
        'CO-PAI-PRIMARY-6-12-18-WEEKS-2026',
        ['2026-03-14', '2026-04-25', '2026-06-06'],
      ],
      ['CO-PAI-PRIMARY-2-4-6', ['2026-03-31', '2026-05-31', '2026-07-31']],
    ] as const) {
      const schedule = calculateSchedule(
        { ...profile, primaryScheduleId },
        catalog(),
        '2026-10-16',
        [],
      );
      expect(
        [1, 2, 3].map(
          (n) => schedule.find((r) => r.id === `penta-${n}`)?.estimatedDate,
        ),
      ).toEqual(dates);
      expect(
        [1, 2, 3].map(
          (n) => schedule.find((r) => r.id === `ipv-${n}`)?.estimatedDate,
        ),
      ).toEqual(dates);
    }
  });

  it('mantiene hitos compartidos y no agrega una tercera dosis de rotavirus universal', () => {
    const profile = makeProfile({
      birthDate: '2026-01-31',
      referenceCatalogVersion: CURRENT_CATALOG_VERSION,
    });
    const original = structuredClone(profile);
    const schedule = calculateSchedule(profile, catalog(), '2026-10-16', []);
    expect(schedule.find((r) => r.id === 'yellow-fever')?.estimatedDate).toBe(
      '2026-10-31',
    );
    expect(schedule.find((r) => r.id === 'srp-2')?.estimatedDate).toBe(
      '2027-07-31',
    );
    expect(schedule.filter((r) => r.id === 'srp-2')).toHaveLength(1);
    expect(schedule.some((r) => r.id === 'rota-private-3')).toBe(false);
    expect(profile).toEqual(original);
  });

  it('no sustituye versiones desconocidas ni ofrece fechas para fuentes no verificadas', () => {
    const source = catalog();
    const profile = makeProfile({ referenceCatalogVersion: source.version });
    expect(() =>
      calculateSchedule(
        { ...profile, referenceCatalogVersion: 'not-installed' },
        source,
        '2026-10-16',
        [],
      ),
    ).toThrow();
    const unverified = {
      ...source,
      sources: source.sources.map((s) => ({
        ...s,
        verification: 'needs-review' as const,
      })),
    };
    const schedule = calculateSchedule(profile, unverified, '2026-10-16', []);
    expect(schedule.find((r) => r.id === 'penta-1')?.estimatedDate).toBeNull();
    expect(
      schedule.find((r) => r.id === 'yellow-fever')?.estimatedDate,
    ).toBeNull();
    expect(schedule.find((r) => r.id === 'srp-2')?.conditional).toBe(true);
  });
});
