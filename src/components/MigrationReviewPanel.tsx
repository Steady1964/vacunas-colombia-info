'use client'
import { useRef, useState } from 'react'
import { getCatalog, getScheduleReference } from '@/data/catalog'
import type { VaccineDB } from '@/lib/db'
import type { AdministrationCommand, AdministrationInput, CivilDate, FamilySnapshot, MigrationIssue, ProfileCommand, StoredProfile, VaccineAdministration } from '@/lib/types'
import type { Catalog } from '@/data/catalog/types'
import { repairMigrationIssue, deleteMigrationIssue } from '@/lib/repository'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ProfileForm } from './ProfileForm'
import { AdministrationForm } from './AdministrationForm'
import { DataRemovalDialog } from './DataRemovalDialog'
import { reviewLabels } from './presentation'
function text(issue: MigrationIssue, ...keys: string[]) { for (const key of keys) { const value = issue.raw[key]; if (typeof value === 'string') return value } return '' }
export function MigrationReviewPanel({ db, snapshot, today, catalog, onEditAdministration, onDirtyChange }: { db: VaccineDB; snapshot: FamilySnapshot; today: CivilDate; catalog: Catalog; onEditAdministration: (event: VaccineAdministration) => void; onDirtyChange: (dirty: boolean) => void }) {
  const [issue, setIssue] = useState<MigrationIssue | null>(null)
  const [destinationId, setDestinationId] = useState('')
  const [destinationConfirmed, setDestinationConfirmed] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [remove, setRemove] = useState<MigrationIssue | null>(null)
  const inFlight = useRef(false)
  function close() { setIssue(null); setDirty(false); onDirtyChange(false); setDestinationId(''); setDestinationConfirmed(false) }
  function requestClose() { if (inFlight.current) return; if (!dirty || window.confirm('Hay cambios sin guardar. ¿Descartarlos?')) close() }
  function open(row: MigrationIssue) { setIssue(row); setDestinationId(''); setDestinationConfirmed(false); onDirtyChange(true) }
  async function repair(command: ProfileCommand | AdministrationCommand) {
    if (!issue || inFlight.current) throw new Error('missing-migration-issue')
    const issueId = issue.id
    const profileReference = 'childId' in command ? undefined : getScheduleReference(command.input.scheduleReferenceId)
    const contextCatalog = profileReference ? getCatalog(profileReference.catalogVersion) : catalog
    if (!contextCatalog) throw new Error('unknown-catalog')
    const context = { today, now: new Date().toISOString(), catalog: contextCatalog }
    inFlight.current = true
    try { await repairMigrationIssue(db, issueId, command, context); close() }
    finally { inFlight.current = false }
  }
  const destination = snapshot.profiles.find(p => p.id === destinationId)
  const reviewEvents = snapshot.administrations.filter(a => a.coverageStatus === 'needs-review' || a.reviewReasons.length)
  const repairProfile: StoredProfile | undefined = issue?.kind === 'profile' ? { id: issue.entityId, nickname: text(issue, 'nickname', 'name'), birthDate: text(issue, 'birthDate'), country: 'CO', primaryScheduleId: null, migrationStatus: 'needs-schedule-choice', referenceCatalogVersion: catalog.version, createdAt: issue.migratedAt, updatedAt: issue.migratedAt } : undefined
  const initialInput: Partial<AdministrationInput> | undefined = issue?.kind === 'administration' ? { productName: text(issue, 'productName', 'vaccine'), appliedDate: text(issue, 'appliedDate', 'date'), brand: text(issue, 'brand'), lot: text(issue, 'lot'), provider: text(issue, 'provider', 'point'), notes: text(issue, 'notes') } : undefined
  return <section className="card wide"><h2>Revisar registros conservados</h2><p>Los registros heredados o ambiguos se conservan sin cobertura automática. Confirma producto, dosis y etapa con tu vacunador; no inferimos estos datos desde texto libre.</p>
    {!snapshot.migrationIssues.length && !reviewEvents.length && <p>No hay registros pendientes de revisión guardados.</p>}
    {reviewEvents.map(a => <article key={a.id} className="review-row"><strong>{snapshot.profiles.find(p => p.id === a.childId)?.nickname ?? 'Perfil no disponible'} · {a.productName} · {a.appliedDate}</strong><p>{a.reviewReasons.map(r => reviewLabels[r]).join('. ')}</p><Button variant="outline" onClick={() => onEditAdministration(a)}>Revisar / corregir aplicación</Button></article>)}
    {snapshot.migrationIssues.map(row => <article className="review-row" key={row.id}><strong>{row.kind === 'profile' ? 'Perfil por reparar' : 'Aplicación por reparar'}</strong><p>Identificador conservado: {row.entityId}. Origen: {row.childId ?? 'sin perfil identificado'}.</p><p>{row.reasons.map(r => reviewLabels[r]).join('. ')}</p><details><summary>Ver datos originales conservados</summary><pre>{JSON.stringify(row.raw, null, 2)}</pre></details><div className="actions"><Button variant="outline" onClick={() => open(row)}>Reparar registro</Button><Button variant="outline" onClick={() => setRemove(row)}>Eliminar incidencia…</Button></div></article>)}
    {issue && <Dialog open onOpenChange={open => { if (!open) requestClose() }}><DialogContent className="form-dialog"><DialogHeader><DialogTitle>Reparar registro conservando su identificador</DialogTitle><DialogDescription>El original se conserva como procedencia. Solo esta incidencia se resolverá al guardar una corrección válida.</DialogDescription></DialogHeader><details><summary>Datos originales</summary><pre>{JSON.stringify(issue.raw, null, 2)}</pre></details>
      {repairProfile ?
        <ProfileForm key={issue.id} commandId={issue.entityId} profile={repairProfile} today={today}
          onDirtyChange={value => { setDirty(value); onDirtyChange(true) }} onCancel={requestClose} onSave={repair} /> :
        <>
          <div className="field"><label htmlFor="repair-destination">Perfil destino (elección explícita obligatoria)</label>
            <select id="repair-destination" value={destinationId} disabled={destinationConfirmed} onChange={e => { setDirty(true); setDestinationId(e.target.value) }}>
              <option value="">Selecciona el niño correcto</option>
              {snapshot.profiles.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
            </select>
          </div>
          <p>Origen: {issue.childId ?? 'no identificado'}. Destino: {destination?.nickname ?? 'sin seleccionar'}.</p>
          {!destinationConfirmed && <Button disabled={!destination} onClick={() => setDestinationConfirmed(true)}>Confirmar destino y corregir aplicación</Button>}
          {destinationConfirmed && destination &&
            <AdministrationForm key={`${issue.id}:${destination.id}`} commandId={issue.entityId} child={destination}
              initialInput={initialInput} today={today} catalog={catalog}
              onDirtyChange={v => { setDirty(v); onDirtyChange(true) }} onCancel={requestClose} onSave={repair} />}
          {!snapshot.profiles.length && <p>Crea o repara primero un perfil en Ajustes. No inventamos un niño para asignar esta aplicación.</p>}
        </>}
    </DialogContent></Dialog>}
    {remove && <DataRemovalDialog scope="migration-issue" label="esta incidencia y su fila original" snapshot={snapshot} onClose={() => setRemove(null)} onDelete={() => deleteMigrationIssue(db, remove.id)} />}
  </section>
}
