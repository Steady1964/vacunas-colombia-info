import type { Projection, Requirement } from './types';

export const TRADITIONAL_SCHEDULE_ID = 'CO-PAI-PRIMARY-2-4-6' as const;

export const primaryRequirements: Requirement[] = [1, 2, 3].flatMap((doseNumber) => {
  const milestoneId = `primary-${doseNumber}`;
  const stage: Requirement[] = [
    {
      id: `penta-${doseNumber}`,
      name: `Pentavalente — dosis ${doseNumber}`,
      disease: 'Difteria, tosferina, tétanos, hepatitis B e infecciones por Haemophilus influenzae tipo b',
      doseNumber,
      milestoneId,
      access: 'pai',
      sourceIds: ['minsalud-poster-july-2026', 'minsalud-january-2026'],
    },
    {
      id: `ipv-${doseNumber}`,
      name: `Polio inactivada (IPV/VIP) — dosis ${doseNumber}`,
      disease: 'Poliomielitis',
      doseNumber,
      milestoneId,
      access: 'pai',
      sourceIds: ['minsalud-poster-july-2026', 'minsalud-childhood-2026'],
    },
  ];
  if (doseNumber <= 2) {
    stage.push(
      {
        id: `rota-${doseNumber}`,
        name: `Rotavirus — dosis ${doseNumber}`,
        disease: 'Gastroenteritis causada por rotavirus',
        doseNumber,
        milestoneId,
        access: 'pai',
        sourceIds: ['minsalud-poster-july-2026', 'minsalud-childhood-2026'],
        note: 'El curso y los límites de edad dependen del producto. No calcular recuperación ni mezclar fabricantes sin revisión del vacunador.',
      },
      {
        id: `pcv-${doseNumber}`,
        name: `Neumococo conjugada — dosis ${doseNumber}`,
        disease: 'Neumonía, otitis, meningitis y bacteriemia por neumococo',
        doseNumber,
        milestoneId,
        access: 'pai',
        sourceIds: ['minsalud-poster-july-2026', 'minsalud-childhood-2026'],
      },
    );
  }
  return stage;
});

export const traditionalProjections: Projection[] = primaryRequirements.map((requirement) => ({
  requirementId: requirement.id,
  offset: { unit: 'months', value: requirement.doseNumber * 2 },
}));
