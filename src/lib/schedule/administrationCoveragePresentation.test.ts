import { describe, expect, it } from 'vitest';
import { CURRENT_CATALOG_VERSION, getCatalog } from '../../data/catalog';
import type { Catalog } from '../../data/catalog/types';
import { makeAdministration, makeProfile } from '../../test/fixtures';
import type { VaccineAdministration } from '../types';
import { getAppliedAdministrationGroups } from './administrationCoveragePresentation';
import { calculateSchedule } from './calculateSchedule';
import { resolveCoverage, resolveSelection } from './resolveCoverage';
import { summarizeSchedule } from './summarizeSchedule';

const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;
const profile = makeProfile({ birthDate: '2026-07-10' });
const today = '2026-10-16';

function application(
  productId: string,
  overrides: Partial<VaccineAdministration> = {},
) {
  const input = {
    productId,
    doseNumber: 1,
    milestoneId: 'primary-1',
    brand: 'Sanofi',
    ...overrides,
  };
  return makeAdministration({
    id: productId,
    productName: productId,
    appliedDate: '2026-08-25',
    ...input,
    ...resolveSelection(input, catalog),
  });
}

function present(
  events: VaccineAdministration[],
  optional: string[] = [],
  reference: Catalog = catalog,
) {
  const schedule = calculateSchedule(profile, reference, today, optional);
  const coverage = resolveCoverage(profile, events, schedule, reference, today);
  const summary = summarizeSchedule(schedule, coverage, today);
  return {
    summary,
    groups: getAppliedAdministrationGroups(
      profile.id,
      events,
      summary,
      reference,
      coverage,
    ),
  };
}

describe('actual applications and their confirmed current requirements', () => {
  it('presents one real hexavalent with both requirements, never two injections', () => {
    const event = application('hexavalent-acellular', {
      productName: 'Hexaxim',
      accessType: 'private',
    });
    const { groups, summary } = present([event]);
    expect(groups.map((group) => group.administration.id)).toEqual([event.id]);
    expect(groups[0].product.id).toBe('hexavalent-acellular');
    expect(groups[0].administration.appliedDate).toBe('2026-08-25');
    expect(groups[0].requirements.map((row) => row.id)).toEqual([
      'penta-1',
      'ipv-1',
    ]);
    expect(groups[0].requirements.every((row) => row.access === 'pai')).toBe(
      true,
    );
    expect(summary.items.find((row) => row.id === 'penta-2')?.status).not.toBe(
      'applied',
    );
  });

  it('keeps separate penta and IPV applications on the same date separate', () => {
    const { groups } = present([
      application('pentavalent-cellular'),
      application('ipv'),
    ]);
    expect(groups.map((group) => group.administration.id).sort()).toEqual([
      'ipv',
      'pentavalent-cellular',
    ]);
    expect(
      groups.map((group) => group.requirements.map((row) => row.id)),
    ).toEqual([['ipv-1'], ['penta-1']]);
  });

  it('never merges two reported applications by identical date or product', () => {
    const first = application('hexavalent-acellular', { id: 'first' });
    const second = { ...first, id: 'second' };
    expect(
      present([second, first]).groups.map((group) => group.administration.id),
    ).toEqual(['first', 'second']);
  });

  it('does not borrow another application’s aggregate coverage for a reviewed record', () => {
    const valid = application('hexavalent-acellular', { id: 'valid' });
    const future = { ...valid, id: 'future', appliedDate: '2099-01-01' };
    const sibling = { ...valid, id: 'sibling', childId: 'other-child' };
    const incomplete = application('hexavalent-acellular', {
      id: 'incomplete',
      milestoneId: undefined,
    });
    const { groups } = present([future, sibling, incomplete, valid]);
    expect(groups.map((group) => group.administration.id)).toEqual(['valid']);
  });

  it('requires the active reference and current source verification', () => {
    const event = application('hexavalent-acellular');
    const changed: Catalog = {
      ...catalog,
      sources: catalog.sources.map((source) =>
        source.id === 'sanofi-hexaxim'
          ? { ...source, verification: 'needs-review' }
          : source,
      ),
    };
    expect(present([event], [], changed).groups).toEqual([]);
    const optional = application('rotateq', {
      doseNumber: 3,
      milestoneId: 'primary-3',
      brand: 'RotaTeq',
      appliedDate: '2026-10-01',
    });
    expect(present([optional]).groups).toEqual([]);
    expect(
      present([optional], ['rotateq']).groups[0].requirements.map(
        (row) => row.id,
      ),
    ).toEqual(['rota-private-3']);
  });

  it('keeps different stages and real-date order without changing any source data', () => {
    const first = application('hexavalent-acellular', { id: 'dose-1' });
    const second = application('hexavalent-acellular', {
      id: 'dose-2',
      doseNumber: 2,
      milestoneId: 'primary-2',
      appliedDate: '2026-10-06',
    });
    const events = [second, first];
    const before = structuredClone({ events, catalog, profile });
    const { groups } = present(events);
    expect(
      groups.map((group) => group.requirements.map((row) => row.id)),
    ).toEqual([
      ['penta-1', 'ipv-1'],
      ['penta-2', 'ipv-2'],
    ]);
    expect({ events, catalog, profile }).toEqual(before);
  });
});
