import type { Catalog, Projection, Requirement } from './types';

const poster = ['minsalud-poster-july-2026'];

export const sharedRequirements: Requirement[] = [
  { id: 'bcg', name: 'BCG — dosis única', disease: 'Meningitis tuberculosa', doseNumber: 1, milestoneId: 'birth', access: 'pai', sourceIds: poster },
  { id: 'hep-b-birth', name: 'Hepatitis B — neonatal', disease: 'Hepatitis B', doseNumber: 1, milestoneId: 'birth', access: 'pai', sourceIds: poster, note: 'Requisito neonatal distinto de las dosis de hepatitis B incluidas en vacunas combinadas posteriores.' },
  { id: 'influenza-1', name: 'Influenza estacional — primera dosis', disease: 'Enfermedad respiratoria causada por influenza', doseNumber: 1, milestoneId: 'month-6', access: 'pai', sourceIds: [...poster, 'minsalud-childhood-2026'], note: 'Referencia de primovacunación; confirmar cepa, antecedentes y programación con el vacunador. No representa toda la vacunación anual posterior.' },
  { id: 'influenza-2', name: 'Influenza estacional — segunda dosis', disease: 'Enfermedad respiratoria causada por influenza', doseNumber: 2, milestoneId: 'month-7', access: 'pai', sourceIds: [...poster, 'minsalud-childhood-2026'], note: 'Referencia de primovacunación con la misma cepa. La fecha a siete meses es orientativa; no calcula intervalos desde aplicaciones tardías.' },
  { id: 'yellow-fever', name: 'Fiebre amarilla', disease: 'Fiebre amarilla', doseNumber: 1, milestoneId: 'month-9', access: 'pai', sourceIds: [...poster, 'minsalud-childhood-2026'], note: 'Referencia desde nueve meses en el contexto de emergencia sanitaria. Elegibilidad, antecedentes, riesgos y eventuales refuerzos requieren valoración profesional.' },
  { id: 'srp-1', name: 'Triple viral (SRP) — primera dosis', disease: 'Sarampión, rubéola y paperas', doseNumber: 1, milestoneId: 'month-12', access: 'pai', sourceIds: poster },
  { id: 'varicella-1', name: 'Varicela — primera dosis', disease: 'Varicela', doseNumber: 1, milestoneId: 'month-12', access: 'pai', sourceIds: poster },
  { id: 'pcv-booster', name: 'Neumococo conjugada — refuerzo', disease: 'Neumonía, otitis, meningitis y bacteriemia por neumococo', doseNumber: 3, milestoneId: 'month-12', access: 'pai', sourceIds: poster, note: 'Refuerzo tras las dos dosis primarias de referencia; no es una tercera dosis primaria universal.' },
  { id: 'hep-a-1', name: 'Hepatitis A — dosis única', disease: 'Hepatitis A', doseNumber: 1, milestoneId: 'month-12', access: 'pai', sourceIds: poster },
  { id: 'dpt-booster-1', name: 'Primer refuerzo DPT (en pentavalente)', disease: 'Difteria, tosferina y tétanos; la pentavalente también incluye hepatitis B y Hib', doseNumber: 4, milestoneId: 'month-18', access: 'pai', sourceIds: [...poster, 'minsalud-january-2026'], note: 'El ID conserva la identidad estable del requisito DPT. La referencia PAI leída utiliza pentavalente a los 18 meses, no supone equivalencia de DPT aislada en este hito.' },
  { id: 'ipv-booster-1', name: 'Polio inactivada — primer refuerzo', disease: 'Poliomielitis', doseNumber: 4, milestoneId: 'month-18', access: 'pai', sourceIds: poster },
  { id: 'srp-2', name: 'Triple viral (SRP) — segunda dosis', disease: 'Sarampión, rubéola y paperas', doseNumber: 2, milestoneId: 'month-18', access: 'pai', sourceIds: [...poster, 'minsalud-january-2026'], note: 'Referencia a 18 meses desde el 1 de enero de 2023. No vuelve a programarse a los cinco años al elegir el modo tradicional.' },
  { id: 'dpt-booster-2', name: 'DPT — segundo refuerzo', disease: 'Difteria, tosferina y tétanos', doseNumber: 5, milestoneId: 'year-5', access: 'pai', sourceIds: poster },
  { id: 'ipv-booster-2', name: 'Polio inactivada — segundo refuerzo', disease: 'Poliomielitis', doseNumber: 5, milestoneId: 'year-5', access: 'pai', sourceIds: poster },
  { id: 'varicella-2', name: 'Varicela — refuerzo', disease: 'Varicela', doseNumber: 2, milestoneId: 'year-5', access: 'pai', sourceIds: poster },
];

const sharedOffsets: Record<string, NonNullable<Projection['offset']>> = {
  birth: { unit: 'days', value: 0 },
  'month-6': { unit: 'months', value: 6 },
  'month-7': { unit: 'months', value: 7 },
  'month-9': { unit: 'months', value: 9 },
  'month-12': { unit: 'months', value: 12 },
  'month-18': { unit: 'months', value: 18 },
  'year-5': { unit: 'years', value: 5 },
};

export const sharedProjections: Projection[] = sharedRequirements.map((requirement) => ({
  requirementId: requirement.id,
  offset: sharedOffsets[requirement.milestoneId],
}));

export const optionalRequirements: Catalog['optionalRequirements'] = {
  'hexavalent-acellular': [],
  rotarix: [],
  rotateq: [
    {
      requirement: {
        id: 'rota-private-3', name: 'RotaTeq — tercera dosis del curso particular',
        disease: 'Gastroenteritis causada por rotavirus', doseNumber: 3, milestoneId: 'primary-3',
        access: 'private', sourceIds: ['msd-rotateq'],
        note: 'Solo referencia al seleccionar explícitamente este producto de tres dosis. No se propone fecha individual ni recuperación; confirmar límites de edad y curso con el vacunador.',
      },
      projection: { requirementId: 'rota-private-3', offset: null },
    },
  ],
  'meningococcal-acwy': [
    {
      requirement: {
        id: 'meningococcal-acwy-1', name: 'Meningococo ACWY — primera dosis, curso por confirmar',
        disease: 'Enfermedad meningocócica invasiva por grupos A, C, W e Y', doseNumber: 1,
        milestoneId: 'private-acwy', access: 'private', sourceIds: ['ema-nimenrix', 'private-course-co-review'],
        note: 'El curso depende de edad, formulación y riesgo. Esta referencia no representa un curso completo ni una indicación individual; sin equivalencia automática ni fechas calculadas.',
      },
      projection: { requirementId: 'meningococcal-acwy-1', offset: null },
    },
  ],
  'meningococcal-b': [
    {
      requirement: {
        id: 'meningococcal-b-1', name: 'Meningococo B — primera dosis, curso por confirmar',
        disease: 'Enfermedad meningocócica invasiva por grupo B', doseNumber: 1,
        milestoneId: 'private-menb', access: 'private', sourceIds: ['ema-bexsero', 'private-course-co-review'],
        note: 'El curso y refuerzos dependen de edad, formulación y riesgo. No se verificó una programación colombiana individual; sin equivalencia automática ni fechas calculadas.',
      },
      projection: { requirementId: 'meningococcal-b-1', offset: null },
    },
  ],
  'measles-zero': [
    {
      requirement: {
        id: 'measles-zero', name: 'Sarampión — dosis cero adicional (condicional)',
        disease: 'Sarampión y rubéola', doseNumber: 0, milestoneId: 'month-6', access: 'conditional',
        sourceIds: ['minsalud-measles-zero-2026'],
        note: 'Medida temporal para población de 6 a 11 meses según lineamientos y vacunador. No sustituye SRP 1 ni SRP 2. Seleccionarla no confirma elegibilidad; fecha por confirmar.',
      },
      projection: { requirementId: 'measles-zero', offset: null },
    },
  ],
};
