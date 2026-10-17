'use client'
import { useState } from 'react'
import type { ChildProfile, PrimaryScheduleId, ScheduleReferenceId } from '@/lib/types'
import type { Catalog } from '@/data/catalog/types'
import type { ScheduleSummary } from '@/lib/schedule/summarizeSchedule'
import { Button } from '@/components/ui/button'
import { ScheduleSelector } from './ScheduleSelector'
import { milestoneLabels, statusLabels } from './presentation'

const primaryAges: Record<PrimaryScheduleId, Record<string, string>> = {
  'CO-PAI-PRIMARY-2-4-6': { 'primary-1': '2 meses', 'primary-2': '4 meses', 'primary-3': '6 meses' },
  'CO-PAI-PRIMARY-6-12-18-WEEKS-2026': { 'primary-1': '6 semanas (1,5 meses)', 'primary-2': '12 semanas (3 meses)', 'primary-3': '18 semanas (4,5 meses)' },
}

export function CalendarView({ profile, referenceId, catalog, summary, optionalIds, onScheduleChange, onOptionalChange }: { profile: ChildProfile; referenceId: ScheduleReferenceId; catalog: Catalog; summary: ScheduleSummary; optionalIds: string[]; onScheduleChange: (id: ScheduleReferenceId) => void; onOptionalChange: (ids: string[]) => Promise<void> }) {
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function toggle(id: string) { if (busy) return; setBusy(true); setError(''); try { await onOptionalChange(optionalIds.includes(id) ? optionalIds.filter(x => x !== id) : [...optionalIds, id]) } catch { setError('No se pudo guardar la selección. Intenta de nuevo; no se cambió la referencia.') } finally { setBusy(false) } }
  return <section className="card"><h2>Calendario de referencia</h2><p>Catálogo {catalog.version} · revisión {catalog.reviewedAt}</p><ScheduleSelector value={referenceId} onChange={onScheduleChange} id="calendar-schedule" />
    <div className="field"><label htmlFor="calendar-filter">Mostrar requisitos</label><select id="calendar-filter" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todas</option><option value="pai">PAI</option><option value="private">Complementarias</option></select></div>
    <div className="timeline">{summary.items.filter(r => filter === 'all' || (filter === 'pai' ? r.access === 'pai' : r.access !== 'pai')).map(r => <article className="event" key={r.id}>
      <div className="event-date"><strong>{primaryAges[profile.primaryScheduleId][r.milestoneId] ?? milestoneLabels[r.milestoneId] ?? 'Etapa por confirmar'}</strong><br /><time dateTime={r.estimatedDate ?? undefined}>{r.estimatedDate ?? 'Fecha por confirmar'}</time></div>
      <div className="dotline" />
      <div className="event-content"><strong>{r.name}</strong><span className={`tag status-${r.status}`}>{statusLabels[r.status]}</span>
        <details><summary>Enfermedad, acceso y fuentes</summary><p>Previene: {r.disease}. Dosis {r.doseNumber}. Etapa: {milestoneLabels[r.milestoneId] ?? 'Por verificar con el vacunador'}.</p><p>{r.access === 'pai' ? 'Referencia PAI, sujeta a elegibilidad.' : r.access === 'private' ? 'Referencia particular / complementaria.' : 'Acceso condicional: confirmar elegibilidad con el vacunador.'}</p>{r.note && <p>{r.note}</p>}
          <ul>{r.sourceIds.map(id => { const source = catalog.sources.find(s => s.id === id); return <li key={id}>{source ? <><a href={source.url} target="_blank" rel="noreferrer">{source.title ?? source.id}</a> · fecha editorial: {source.publishedAt && source.publishedAt !== 'unknown' ? source.publishedAt : 'no visible en el documento'} · consulta/revisión: {source.reviewedAt} · {source.verification === 'verified' ? 'Verificada para las reglas documentadas' : 'Por revisar; no concede equivalencia automática'}</> : 'Fuente no disponible: por revisar'}</li> })}</ul>
        </details>
      </div>
    </article>)}</div>
    <section><h3>Referencias de productos complementarios</h3><p>Selecciona conscientemente los productos que quieres consultar. No se seleccionan a partir de marcas heredadas ni se convierten en obligaciones universales.</p>{Object.keys(catalog.optionalRequirements).map(id => <div className="optional-product" key={id}><strong>{catalog.products.find(p => p.id === id)?.name ?? id}</strong><Button variant="outline" disabled={busy} onClick={() => void toggle(id)}>{optionalIds.includes(id) ? 'Ocultar referencia de este producto' : 'Mostrar referencia de este producto'}</Button></div>)}{error && <p role="alert">{error}</p>}</section>
    <p className="notice">Fechas orientativas. Consulta al vacunador para confirmar la programación. No calculamos rescate clínico ni intervalos mínimos.</p>
  </section>
}
