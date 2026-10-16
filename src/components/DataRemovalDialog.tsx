'use client'
import { useRef, useState } from 'react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { FamilySnapshot } from '@/lib/types'
import { downloadBackup } from './downloadBackup'
import { operationError } from './presentation'
export type RemovalScope = 'administration' | 'migration-issue' | 'profile' | 'all'
export function DataRemovalDialog({ scope, label, snapshot, onDelete, onClose }: { scope: RemovalScope; label: string; snapshot: FamilySnapshot; onDelete: () => Promise<void>; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const didDelete = useRef(false)
  async function remove() { if (inFlight.current) return; if (scope === 'all' && step === 1) { setStep(2); return } inFlight.current = true; setBusy(true); setError(''); try { await onDelete(); didDelete.current = true; onClose() } catch (err) { setError(operationError(err)) } finally { inFlight.current = false; setBusy(false) } }
  return <AlertDialog open onOpenChange={open => { if (!open && !busy) onClose() }}><AlertDialogContent onCloseAutoFocus={event => { if (!didDelete.current) return; const main = document.querySelector<HTMLElement>('main[tabindex]'); if (main) { event.preventDefault(); main.focus({ preventScroll: true }) } }}><AlertDialogHeader><AlertDialogTitle>{scope === 'all' ? step === 1 ? '¿Eliminar todos los datos familiares?' : 'Segunda confirmación: borrado total irreversible' : `¿Eliminar ${label}?`}</AlertDialogTitle><AlertDialogDescription>{scope === 'profile' ? 'Se eliminarán este perfil, sus aplicaciones y sus incidencias en una única operación. Los otros perfiles permanecen intactos.' : scope === 'all' ? 'Se eliminarán todos los perfiles, aplicaciones, preferencias e incidencias de este navegador. No se borrarán los archivos de respaldo descargados ni la aplicación offline.' : 'Se eliminará únicamente este registro. No se puede deshacer sin un respaldo.'} Puedes descargar antes una copia privada sin cifrar.</AlertDialogDescription></AlertDialogHeader><Button disabled={busy} variant="outline" onClick={() => { try { downloadBackup(snapshot) } catch { setError('No se pudo preparar el respaldo. Reintenta antes de borrar.') } }}>Descargar copia antes de eliminar</Button>{error && <p role="alert">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar y conservar datos</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={() => void remove()}>{busy ? 'Eliminando…' : scope === 'all' && step === 1 ? 'Continuar al segundo paso' : scope === 'all' ? 'Sí, eliminar definitivamente toda la familia' : 'Confirmar eliminación'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
}
