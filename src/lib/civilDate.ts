import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
} from 'date-fns';
import type { CivilDate } from './types';

export function parseCivilDate(value: string): CivilDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('invalid-date');
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1])
    throw new Error('invalid-date');
  return value;
}

function localDate(value: CivilDate): Date {
  parseCivilDate(value);
  const result = new Date(0);
  result.setFullYear(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)) - 1,
    Number(value.slice(8, 10)),
  );
  result.setHours(12, 0, 0, 0);
  return result;
}

export function todayCivil(now: Date = new Date()): CivilDate {
  if (
    !Number.isFinite(now.getTime()) ||
    now.getFullYear() < 1 ||
    now.getFullYear() > 9999
  )
    throw new Error('invalid-date');
  return parseCivilDate(
    `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  );
}

export function addCivil(
  birth: CivilDate,
  offset: { unit: 'days' | 'months' | 'years'; value: number },
): CivilDate {
  if (!Number.isSafeInteger(offset.value)) throw new Error('invalid-offset');
  const date = localDate(birth);
  const result =
    offset.unit === 'days'
      ? addDays(date, offset.value)
      : offset.unit === 'months'
        ? addMonths(date, offset.value)
        : addYears(date, offset.value);
  return todayCivil(result);
}

export function ageAt(
  birth: CivilDate,
  today: CivilDate,
): { years: number; months: number; days: number } {
  parseCivilDate(birth);
  parseCivilDate(today);
  if (birth > today) throw new Error('before-birth');
  let years = Number(today.slice(0, 4)) - Number(birth.slice(0, 4));
  if (addCivil(birth, { unit: 'years', value: years }) > today) years--;
  const anniversary = addCivil(birth, { unit: 'years', value: years });
  const availableMonths = Math.min(
    11,
    (Number(today.slice(0, 4)) - Number(anniversary.slice(0, 4))) * 12 +
      Number(today.slice(5, 7)) -
      Number(anniversary.slice(5, 7)),
  );
  let months = availableMonths;
  while (
    months > 0 &&
    addCivil(anniversary, { unit: 'months', value: months }) > today
  )
    months--;
  const anchor = addCivil(anniversary, { unit: 'months', value: months });
  return {
    years,
    months,
    days: differenceInCalendarDays(localDate(today), localDate(anchor)),
  };
}

export function millisecondsUntilNextLocalDay(now: Date): number {
  if (!Number.isFinite(now.getTime())) throw new Error('invalid-date');
  const next = new Date(now.getTime());
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
