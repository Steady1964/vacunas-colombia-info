import { parseCivilDate } from './civilDate';

const MONTH_NAMES: Record<string, string> = {
  '01': 'enero',
  '02': 'febrero',
  '03': 'marzo',
  '04': 'abril',
  '05': 'mayo',
  '06': 'junio',
  '07': 'julio',
  '08': 'agosto',
  '09': 'septiembre',
  '10': 'octubre',
  '11': 'noviembre',
  '12': 'diciembre',
};

export function formatCivilDate(value: string): string {
  if (!value) return 'Fecha por confirmar';
  try {
    parseCivilDate(value);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'invalid-date')
      throw error;
    return `${value} (fecha inválida)`;
  }
  return `${Number(value.slice(8, 10))} / ${MONTH_NAMES[value.slice(5, 7)]} / ${value.slice(0, 4)}`;
}
