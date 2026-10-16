import type { FamilySnapshot } from '@/lib/types'
import { serializeBackup } from '@/lib/backup'
export function downloadBackup(snapshot: FamilySnapshot) {
  const text = serializeBackup(snapshot, new Date().toISOString())
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'vacunas-colombia-respaldo.json'
  document.body.append(anchor)
  try { anchor.click() } finally { anchor.remove(); URL.revokeObjectURL(url) }
}
