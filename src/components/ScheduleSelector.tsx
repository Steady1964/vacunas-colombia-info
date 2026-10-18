'use client';

import {
  getScheduleReference,
  SELECTABLE_SCHEDULE_REFERENCES,
} from '@/data/catalog';
import type { ScheduleReferenceId } from '@/lib/types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ScheduleSelector({
  value,
  onChange,
  disabled = false,
  id = 'schedule',
}: {
  value: ScheduleReferenceId | '';
  onChange: (value: ScheduleReferenceId) => void;
  disabled?: boolean;
  id?: string;
}) {
  const selectedReference = value ? getScheduleReference(value) : undefined;
  const references =
    selectedReference && !selectedReference.selectable
      ? [selectedReference, ...SELECTABLE_SCHEDULE_REFERENCES]
      : SELECTABLE_SCHEDULE_REFERENCES;

  return (
    <div className="field">
      <Label htmlFor={id}>Referencia indicada por tu vacunador</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as ScheduleReferenceId)}
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder="Selecciona una referencia" />
        </SelectTrigger>
        <SelectContent>
          {references.map((reference) => (
            <SelectItem
              key={reference.id}
              value={reference.id}
              disabled={!reference.selectable}
            >
              {reference.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p>
        Elige la referencia que te indicó tu vacunador. Las fechas son
        orientativas y los lineamientos pueden cambiar.
      </p>
      {value === 'CO-PAI-REFERENCE-2026' && (
        <p>
          Esquema 2026: serie primaria a las 6, 12 y 18 semanas. Confirma si la
          medida transitoria corresponde a tu hijo.
        </p>
      )}
      {value === 'CO-PAI-REFERENCE-PRE-2026' && (
        <p>
          Esquema anterior a 2026: serie primaria a los 2, 4 y 6 meses según la
          edición 2 de EPS Sanitas, sin fecha editorial visible.
        </p>
      )}
      {value === 'CO-PAI-REFERENCE-LEGACY-2-4-6-2026' && (
        <p>
          Referencia legada: conserva 2, 4 y 6 meses con los demás hitos de
          2026. Solo puedes mantenerla o cambiarla conscientemente; no está
          disponible para perfiles nuevos.
        </p>
      )}
    </div>
  );
}
