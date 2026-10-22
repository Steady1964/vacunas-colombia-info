import { describe, expect, it } from 'vitest';
import { formatCivilDate } from './datePresentation';

describe('fechas civiles legibles en español', () => {
  it.each([
    ['2026-07-10', '10 / julio / 2026'],
    ['2026-08-21', '21 / agosto / 2026'],
    ['2024-02-29', '29 / febrero / 2024'],
    ['2026-12-01', '1 / diciembre / 2026'],
    ['0001-01-01', '1 / enero / 0001'],
  ])('muestra %s sin convertirla a UTC', (value, expected) => {
    expect(formatCivilDate(value)).toBe(expected);
  });

  it.each(['2026-02-30', '2026-13-01', '2026-00-10', '31/02/2026'])(
    'conserva el dato inválido %s para su revisión sin inventar una fecha',
    (value) => {
      expect(formatCivilDate(value)).toContain(value);
      expect(formatCivilDate(value)).toMatch(/inválida/);
    },
  );
});
