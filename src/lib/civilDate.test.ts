import { afterEach, describe, expect, it } from 'vitest';
import {
  addCivil,
  ageAt,
  millisecondsUntilNextLocalDay,
  parseCivilDate,
  todayCivil,
} from './civilDate';

const originalTimeZone = process.env.TZ;
afterEach(() => {
  if (originalTimeZone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimeZone;
});

describe('civil dates independent of UTC and DST', () => {
  it.each(['America/Bogota', 'America/New_York', 'Pacific/Kiritimati'])(
    'keeps all reference dates in %s',
    (zone) => {
      process.env.TZ = zone;
      expect(
        [42, 84, 126].map((value) =>
          addCivil('2026-01-31', { unit: 'days', value }),
        ),
      ).toEqual(['2026-03-14', '2026-04-25', '2026-06-06']);
      expect(
        [2, 4, 6].map((value) =>
          addCivil('2026-01-31', { unit: 'months', value }),
        ),
      ).toEqual(['2026-03-31', '2026-05-31', '2026-07-31']);
      expect(
        [6, 7].map((value) =>
          addCivil('2026-01-31', { unit: 'months', value }),
        ),
      ).toEqual(['2026-07-31', '2026-08-31']);
      expect(addCivil('2026-01-31', { unit: 'months', value: 9 })).toBe(
        '2026-10-31',
      );
      expect(addCivil('2026-01-31', { unit: 'months', value: 18 })).toBe(
        '2027-07-31',
      );
      expect(addCivil('2024-02-29', { unit: 'months', value: 12 })).toBe(
        '2025-02-28',
      );
      expect(addCivil('2024-02-29', { unit: 'years', value: 5 })).toBe(
        '2029-02-28',
      );
      expect(addCivil('2026-01-31', { unit: 'months', value: 1 })).toBe(
        '2026-02-28',
      );
      expect(todayCivil(new Date(2026, 0, 31, 23, 30))).toBe('2026-01-31');
    },
  );

  it.each([
    '2026-02-29',
    '1900-02-29',
    '2026-04-31',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '0000-01-01',
    '10000-01-01',
    '2026-1-01',
    '2026-01-01T00:00:00Z',
  ])('rejects nonexistent/noncivil %s', (value) => {
    expect(() => parseCivilDate(value)).toThrow('invalid-date');
  });

  it('handles leap centuries, month ends and year boundaries', () => {
    expect(parseCivilDate('2000-02-29')).toBe('2000-02-29');
    expect(parseCivilDate('0001-01-01')).toBe('0001-01-01');
    expect(addCivil('2024-01-29', { unit: 'months', value: 1 })).toBe(
      '2024-02-29',
    );
    expect(addCivil('2026-01-30', { unit: 'months', value: 1 })).toBe(
      '2026-02-28',
    );
    expect(addCivil('2026-12-31', { unit: 'days', value: 1 })).toBe(
      '2027-01-01',
    );
    expect(addCivil('2026-01-01', { unit: 'days', value: -1 })).toBe(
      '2025-12-31',
    );
    expect(() => addCivil('9999-12-31', { unit: 'days', value: 1 })).toThrow(
      'invalid-date',
    );
    expect(() => addCivil('0001-01-01', { unit: 'years', value: -1 })).toThrow(
      'invalid-date',
    );
    expect(() => addCivil('2026-01-01', { unit: 'days', value: 1.5 })).toThrow(
      'invalid-offset',
    );
  });

  it('decomposes clamped birthdays rather than negative day fields', () => {
    expect(ageAt('2026-01-31', '2026-03-01')).toEqual({
      years: 0,
      months: 1,
      days: 1,
    });
    expect(ageAt('2024-02-29', '2025-03-01')).toEqual({
      years: 1,
      months: 0,
      days: 1,
    });
    expect(ageAt('2026-01-31', '2026-01-31')).toEqual({
      years: 0,
      months: 0,
      days: 0,
    });
    expect(ageAt('9999-12-01', '9999-12-31')).toEqual({
      years: 0,
      months: 0,
      days: 30,
    });
    expect(() => ageAt('2026-01-31', '2026-01-30')).toThrow('before-birth');
  });

  it('schedules local midnight across 23/25-hour days and the last millisecond', () => {
    process.env.TZ = 'America/New_York';
    expect(millisecondsUntilNextLocalDay(new Date(2026, 2, 8))).toBe(
      23 * 60 * 60 * 1000,
    );
    expect(millisecondsUntilNextLocalDay(new Date(2026, 10, 1))).toBe(
      25 * 60 * 60 * 1000,
    );
    expect(
      millisecondsUntilNextLocalDay(new Date(2026, 4, 1, 23, 59, 59, 999)),
    ).toBe(1);
  });
});
