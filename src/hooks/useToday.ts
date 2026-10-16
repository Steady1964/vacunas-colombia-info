'use client'

import { useEffect, useState } from 'react'
import { millisecondsUntilNextLocalDay, todayCivil } from '../lib/civilDate'
import type { CivilDate } from '../lib/types'

export function useToday(): CivilDate | null {
  const [today, setToday] = useState<CivilDate | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      clearTimeout(timer)
      const now = new Date()
      setToday(todayCivil(now))
      timer = setTimeout(refresh, millisecondsUntilNextLocalDay(now))
    }
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh() }
    refresh()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  return today
}
