'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CivilDate, PrimaryScheduleId, ProfileCommand, StoredProfile } from '@/lib/types'
import { ScheduleSelector } from './ScheduleSelector'
import { operationError, scheduleConfirmation } from './presentation'

export function ProfileForm({ commandId, profile, today, onSave, onCancel, onDirtyChange }: {
  commandId: string; profile?: StoredProfile; today: CivilDate; onSave: (command: ProfileCommand) => Promise<void>; onCancel: () => void; onDirtyChange: (dirty: boolean) => void
}) {
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '')
  const [schedule, setSchedule] = useState<PrimaryScheduleId | ''>(profile?.primaryScheduleId ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const inFlight = useRef(false)
  const pending = useRef<ProfileCommand | null>(null)
  function changed() { onDirtyChange(true); setConfirm(false); pending.current = null }
  async function submit(confirmed = false) {
    if (inFlight.current) return
    if (!nickname.trim() || !birthDate || !schedule) { setError('Completa apodo, nacimiento y esquema.'); return }
    if (profile?.primaryScheduleId && profile.primaryScheduleId !== schedule && !confirmed) { setConfirm(true); return }
    const command = pending.current ?? { id: commandId, mode: profile ? 'edit' as const : 'create' as const, input: { nickname: nickname.trim(), birthDate, primaryScheduleId: schedule } }
    pending.current = command
    inFlight.current = true; setBusy(true); setError('')
    try { await onSave(command) } catch (err) { setError(operationError(err)) } finally { inFlight.current = false; setBusy(false) }
  }
  return <form className="form" onSubmit={e => { e.preventDefault(); void submit() }}>
    <fieldset disabled={busy}><legend>{profile ? 'Editar perfil' : 'Crear perfil'}</legend>
      <div className="field"><Label htmlFor="nickname">Nombre o apodo</Label><Input autoFocus id="nickname" value={nickname} maxLength={100} required onChange={e => { changed(); setNickname(e.target.value) }} /></div>
      <div className="field"><Label htmlFor="birth-date">Fecha de nacimiento</Label><Input id="birth-date" type="date" value={birthDate} max={today} required onChange={e => { changed(); setBirthDate(e.target.value) }} /></div>
      <ScheduleSelector value={schedule} onChange={v => { changed(); setSchedule(v) }} id="profile-schedule" />
      {profile && <p>Editar el nacimiento recalcula las fechas orientativas; las aplicaciones permanecen intactas y las fechas contradictorias quedarán por revisar.</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {confirm && <div className="notice" role="group" aria-label="Confirmar cambio de esquema"><p>{scheduleConfirmation}</p><Button type="button" onClick={() => void submit(true)}>Confirmar cambio y guardar</Button><Button type="button" variant="outline" onClick={() => setConfirm(false)}>Cancelar cambio</Button></div>}
      <div className="actions"><Button type="submit">{busy ? 'Guardando…' : profile ? 'Guardar perfil' : 'Comenzar'}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button></div>
    </fieldset>
  </form>
}
