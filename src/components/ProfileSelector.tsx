'use client'
import type { StoredProfile } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
export function ProfileSelector({ profiles, activeId, onChange, disabled }: { profiles: StoredProfile[]; activeId: string; onChange: (id: string) => void; disabled?: boolean }) {
  return <div className="profile-selector"><Label htmlFor="active-profile">Perfil activo</Label><Select value={activeId} onValueChange={onChange} disabled={disabled}><SelectTrigger id="active-profile"><SelectValue placeholder="Selecciona perfil" /></SelectTrigger><SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nickname}</SelectItem>)}</SelectContent></Select></div>
}
