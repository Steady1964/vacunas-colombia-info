'use client'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PrimaryScheduleId } from '@/lib/types'
import { scheduleLabels } from './presentation'

export function ScheduleSelector({ value, onChange, disabled = false, id = 'schedule' }: {
  value: PrimaryScheduleId | ''; onChange: (value: PrimaryScheduleId) => void; disabled?: boolean; id?: string
}) {
  return <div className="field">
    <Label htmlFor={id}>Esquema indicado por tu vacunador</Label>
    <Select value={value} onValueChange={v => onChange(v as PrimaryScheduleId)} disabled={disabled}>
      <SelectTrigger id={id}><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
      <SelectContent>{Object.entries(scheduleLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
    </Select>
    <p>Elige el esquema que te indicó tu vacunador. Las fechas son orientativas y las medidas pueden cambiar.</p>
    <p>Acortado: referencia transitoria de 2026 ante el brote de tosferina; 6/12/18 semanas (etiquetas 1,5/3/4,5 meses), no una indicación universal.</p>
    {value === 'CO-PAI-PRIMARY-2-4-6' && <p>Referencia de esquema tradicional; confirma con el vacunador si corresponde a tu hijo según los lineamientos actuales.</p>}
  </div>
}
