import { describe, expect, it } from 'vitest';
import { CURRENT_CATALOG_VERSION, getCatalog } from '../../data/catalog';
import {
  CHILD_B,
  FIXED_TODAY,
  makeAdministration,
  makeProfile,
} from '../../test/fixtures';
import { calculateSchedule } from './calculateSchedule';
import { getCalendarRecordReviews } from './calendarAdministrationPresentation';
import { resolveCoverage, resolveSelection } from './resolveCoverage';
import { summarizeSchedule } from './summarizeSchedule';

const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
const profile = makeProfile({ referenceCatalogVersion: catalog.version });
const scheduled = calculateSchedule(profile, catalog, FIXED_TODAY, []);

function present(events: Parameters<typeof resolveCoverage>[1]) {
  const coverage = resolveCoverage(
    profile,
    events,
    scheduled,
    catalog,
    FIXED_TODAY,
  );
  const summary = summarizeSchedule(scheduled, coverage, FIXED_TODAY);
  return {
    summary,
    records: getCalendarRecordReviews(
      profile.id,
      events,
      summary,
      coverage.reviewByAdministrationId,
    ),
  };
}

describe('aplicaciones sin enlace confirmado en el calendario', () => {
  it('mantiene visible una etapa incompleta y al corregirla aplica solo sus requisitos', () => {
    const incomplete = makeAdministration({
      productId: 'hexavalent-acellular',
      productName: 'Hexavalente acelular',
      doseNumber: 1,
      ...resolveSelection(
        { productId: 'hexavalent-acellular', doseNumber: 1 },
        catalog,
      ),
    });
    const before = present([incomplete]);
    expect(before.records).toHaveLength(1);
    expect(before.records[0].kind).toBe('needs-review');
    expect(before.records[0].reasons).toContain('unidentified-stage');
    expect(
      before.summary.items.find((item) => item.id === 'penta-1')?.status,
    ).toBe('past');

    const corrected = {
      ...incomplete,
      milestoneId: 'primary-1',
      ...resolveSelection(
        {
          productId: 'hexavalent-acellular',
          doseNumber: 1,
          milestoneId: 'primary-1',
        },
        catalog,
      ),
    };
    const after = present([corrected]);
    expect(after.records).toEqual([]);
    expect(
      after.summary.items
        .filter((item) => item.status === 'applied')
        .map((item) => item.id)
        .sort(),
    ).toEqual(['ipv-1', 'penta-1']);
    expect(
      after.summary.items.find((item) => item.id === 'penta-2')?.status,
    ).toBe('past');
  });

  it('usa la revisión contextual aunque el registro guardado diga verificado', () => {
    const future = makeAdministration({
      appliedDate: '2026-10-17',
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
    const result = present([future]);
    expect(result.records[0].kind).toBe('needs-review');
    expect(result.records[0].reasons).toContain('future-date');
    expect(result.summary.applied).toBe(0);
    expect(
      getCalendarRecordReviews(profile.id, [future], result.summary),
    ).toEqual([{ administration: future, kind: 'unlinked', reasons: [] }]);
  });

  it('no muestra ni modifica registros de otro perfil ni reutiliza sus motivos', () => {
    const own = makeAdministration();
    const sibling = makeAdministration({
      id: 'sibling-record',
      childId: CHILD_B,
    });
    const events = [own, sibling];
    const before = structuredClone(events);
    const summary = present([]).summary;
    const records = getCalendarRecordReviews(
      profile.id,
      events,
      summary,
      new Map([[sibling.id, ['future-date']]]),
    );
    expect(records.map(({ administration }) => administration.id)).toEqual([
      own.id,
    ]);
    expect(records[0].reasons).toEqual(['unidentified-product']);
    expect(events).toEqual(before);
  });

  it('distingue una dosis documentada fuera de la referencia de una aplicación incompleta', () => {
    const optional = makeAdministration({
      productId: 'rotateq',
      productName: 'RotaTeq',
      doseNumber: 3,
      milestoneId: 'primary-3',
      ...resolveSelection(
        { productId: 'rotateq', doseNumber: 3, milestoneId: 'primary-3' },
        catalog,
      ),
    });
    const result = present([optional]);
    expect(result.records).toEqual([
      { administration: optional, kind: 'outside-reference', reasons: [] },
    ]);
    expect(result.summary.applied).toBe(0);
  });
});
