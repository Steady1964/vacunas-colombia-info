import type { ReviewReason } from '@/lib/types';

export const SCHEDULE_CONFIRMATION =
  'El calendario estimado cambiará; las vacunas que ya registraste permanecerán intactas.';

export const milestoneLabels: Record<string, string> = {
  birth: 'Nacimiento',
  'primary-1': 'Serie primaria · primera etapa',
  'primary-2': 'Serie primaria · segunda etapa',
  'primary-3': 'Serie primaria · tercera etapa',
  'month-6': 'Referencia de 6 meses',
  'month-7': 'Referencia de 7 meses',
  'month-9': 'Referencia de 9 meses',
  'month-12': 'Referencia de 12 meses',
  'month-18': 'Referencia de 18 meses',
  'year-5': 'Referencia de 5 años',
};

export const reviewLabels: Record<ReviewReason, string> = {
  'unknown-schedule': 'Esquema sin identificar',
  'unidentified-product': 'Biológico sin identificar o marca de otro producto',
  'unidentified-stage': 'Dosis o etapa sin identificar',
  'unverified-rule': 'Correspondencia o fuente por verificar',
  'invalid-date': 'Fecha inválida',
  'future-date': 'Fecha futura',
  'before-birth': 'Fecha anterior al nacimiento',
  'mixed-course': 'Curso con productos diferentes: confirmar con el vacunador',
  'missing-profile': 'Perfil de origen no disponible',
  'legacy-unconfirmed': 'Registro guardado sin enlace confirmado al esquema',
};

export const STATUS_LABELS = {
  applied: 'Aplicada',
  upcoming: 'Próxima',
  pending: 'Pendiente',
  past: 'Fecha pasada / por confirmar',
  'needs-review': 'Por verificar con el vacunador',
} as const;

export function operationError(error: unknown): string {
  const code = error instanceof Error ? error.message : '';
  if (code.includes('stale-preview'))
    return 'Los datos cambiaron desde la previsualización. Cancela y vuelve a seleccionar el archivo antes de importar.';
  if (code.includes('conflict'))
    return 'Hay un conflicto con los datos guardados. No se realizó la operación; revisa el registro o prepara una nueva previsualización.';
  if (code === 'future-date')
    return 'La fecha no puede ser posterior a hoy. Corrígela y vuelve a guardar; tus campos se conservan.';
  if (code === 'before-birth')
    return 'La aplicación no puede ser anterior al nacimiento de este perfil. Revisa ambas fechas; tus campos se conservan.';
  if (code === 'invalid-date')
    return 'La fecha no existe. Revisa el día, mes y año; tus campos se conservan.';
  if (code === 'missing-profile')
    return 'El perfil original ya no está disponible. No se asignó el registro a otro niño. Conserva una copia de los campos antes de cerrar.';
  if (
    code === 'catalog-unavailable' ||
    code === 'unknown-catalog' ||
    code === 'schedule-reference-unavailable'
  )
    return 'La referencia seleccionada no está disponible para este perfil. Elige Esquema 2026 o Esquema anterior a 2026; tus campos se conservan.';
  return 'No se pudo completar la operación. Revisa los campos y el almacenamiento del navegador. Tus datos e inputs se conservan; puedes reintentar.';
}
