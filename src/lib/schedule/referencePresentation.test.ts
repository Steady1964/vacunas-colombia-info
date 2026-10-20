import { describe, expect, it } from 'vitest';
import {
  CURRENT_CATALOG_VERSION,
  HISTORICAL_CATALOG_VERSION,
  getCatalog,
} from '../../data/catalog';
import { makeProfile } from '../../test/fixtures';
import {
  getProductReferences,
  getRegistrationStages,
  referenceAgeLabel,
} from './referencePresentation';

const catalog = getCatalog(CURRENT_CATALOG_VERSION)!;

describe('presentación de referencias por perfil y producto', () => {
  it.each([
    ['CO-PAI-PRIMARY-2-4-6', ['2 meses', '4 meses', '6 meses']],
    [
      'CO-PAI-PRIMARY-6-12-18-WEEKS-2026',
      ['6 semanas', '12 semanas', '18 semanas'],
    ],
  ] as const)(
    'deriva edades de las proyecciones de %s',
    (primaryScheduleId, ages) => {
      const stages = getRegistrationStages(
        makeProfile({ primaryScheduleId }),
        catalog,
        'hexavalent-acellular',
      );
      expect(stages.map((stage) => stage.id)).toEqual([
        'primary-1',
        'primary-2',
        'primary-3',
      ]);
      ages.forEach((age, index) => expect(stages[index].label).toContain(age));
      expect(stages.every((stage) => !stage.retained)).toBe(true);
    },
  );

  it('limita Rotarix a sus dos dosis y no le presta la tercera de RotaTeq', () => {
    const stages = getRegistrationStages(makeProfile(), catalog, 'rotarix');
    expect(stages.map((stage) => stage.id)).toEqual(['primary-1', 'primary-2']);
    expect(
      getProductReferences(makeProfile(), catalog, 'rotarix').map(
        ({ requirement }) => requirement.id,
      ),
    ).toEqual(['rota-1', 'rota-2']);
  });

  it('no presta a RotaTeq la edad de la tercera etapa PAI', () => {
    const stages = getRegistrationStages(makeProfile(), catalog, 'rotateq');
    expect(stages[2]).toMatchObject({ id: 'primary-3', retained: false });
    expect(stages[2].label).toContain('Dosis 3');
    expect(stages[2].label).not.toContain('18 semanas');
    const reference = getProductReferences(
      makeProfile(),
      catalog,
      'rotateq',
    )[2];
    expect(reference.projection.offset).toBeNull();
    expect(referenceAgeLabel(reference, catalog)).toBe('Edad por confirmar');
  });

  it('conserva una etapa ajena sin ofrecer otras etapas ajenas al producto', () => {
    const stages = getRegistrationStages(
      makeProfile(),
      catalog,
      'bcg',
      'year-5',
    );
    expect(stages.map(({ id, retained }) => ({ id, retained }))).toEqual([
      { id: 'birth', retained: false },
      { id: 'year-5', retained: true },
    ]);
    expect(
      getRegistrationStages(
        makeProfile(),
        catalog,
        'unknown-product',
        'old-stage',
      ),
    ).toEqual([{ id: 'old-stage', label: 'old-stage', retained: true }]);
  });

  it('no elige un esquema implícito ni sustituye un catálogo incompatible', () => {
    const pending = {
      ...makeProfile(),
      primaryScheduleId: null,
      migrationStatus: 'needs-schedule-choice' as const,
    };
    expect(getRegistrationStages(pending, catalog, 'ipv')).toEqual([]);
    const unsupported = makeProfile({
      referenceCatalogVersion: 'not-installed',
    });
    expect(getProductReferences(unsupported, catalog, 'ipv')).toEqual([]);
    expect(
      getRegistrationStages(unsupported, catalog, 'ipv', 'primary-2'),
    ).toEqual([{ id: 'primary-2', label: 'primary-2', retained: true }]);
  });

  it('presenta referencias propias sin reglas de cobertura, sin inventar edades', () => {
    const references = getProductReferences(
      makeProfile(),
      catalog,
      'meningococcal-acwy',
    );
    expect(references.map(({ requirement }) => requirement.id)).toEqual([
      'meningococcal-acwy-1',
    ]);
    expect(referenceAgeLabel(references[0], catalog)).toBe(
      'Edad por confirmar',
    );
    expect(
      getRegistrationStages(makeProfile(), catalog, 'meningococcal-acwy').map(
        (stage) => stage.id,
      ),
    ).toEqual(['private-acwy']);
    expect(
      getProductReferences(makeProfile(), catalog, 'not-installed'),
    ).toEqual([]);
  });

  it('no usa una fuente no verificada para presentar una edad como documentada', () => {
    const unverified = {
      ...catalog,
      sources: catalog.sources.map((source) => ({
        ...source,
        verification: 'needs-review' as const,
      })),
    };
    const reference = getProductReferences(makeProfile(), unverified, 'bcg')[0];
    expect(referenceAgeLabel(reference, unverified)).toBe('Edad por confirmar');
  });

  it('la captura manual solo ofrece los hitos de la referencia activa, no cursos privados', () => {
    const stages = getRegistrationStages(
      makeProfile(),
      catalog,
      'unidentified',
    );
    expect(stages.some((stage) => stage.id === 'primary-1')).toBe(true);
    expect(stages.some((stage) => stage.id === 'private-acwy')).toBe(false);
    expect(stages.some((stage) => stage.id === 'private-menb')).toBe(false);
  });

  it('respeta las edades y correspondencias propias del catálogo histórico', () => {
    const historicalCatalog = getCatalog(HISTORICAL_CATALOG_VERSION)!;
    const profile = makeProfile({
      primaryScheduleId: 'CO-PAI-PRIMARY-2-4-6',
      referenceCatalogVersion: HISTORICAL_CATALOG_VERSION,
    });
    const historicalStages = getRegistrationStages(
      profile,
      historicalCatalog,
      'yellow-fever',
    );
    expect(historicalStages.map((stage) => stage.id)).toEqual(['month-18']);
    expect(historicalStages[0].label).toContain('18 meses');
    expect(getRegistrationStages(profile, historicalCatalog, 'ipv')).toEqual(
      [],
    );
    expect(
      getRegistrationStages(makeProfile(), catalog, 'yellow-fever').map(
        (stage) => stage.id,
      ),
    ).toEqual(['month-9']);
  });
});
