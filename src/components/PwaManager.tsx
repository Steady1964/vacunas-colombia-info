'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { registerPwa } from '../lib/pwa'

type InstallPrompt = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }> }

export function PwaManager({ hasUnsavedChanges, storageBlocked }: { hasUnsavedChanges: boolean; storageBlocked: boolean }) {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')
  const [installed, setInstalled] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [activatedUpdate, setActivatedUpdate] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [registrationFailed, setRegistrationFailed] = useState(false)
  const [prompting, setPrompting] = useState(false)
  const [installError, setInstallError] = useState(false)
  const guarded = useRef(hasUnsavedChanges || storageBlocked)
  const reloadRequested = useRef(false)
  guarded.current = hasUnsavedChanges || storageBlocked

  useEffect(() => {
    let disposed = false
    let registration: ServiceWorkerRegistration | null = null
    let installing: ServiceWorker | null = null
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setPlatform(ios ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'other')
    setInstalled(window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    const beforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt) }
    const appInstalled = () => { setInstalled(true); setInstallPrompt(null) }
    const stateChanged = () => {
      if (disposed || !installing) return
      if (installing.state === 'installed') {
        if (navigator.serviceWorker.controller) setWaitingWorker(registration?.waiting ?? installing)
        else setOfflineReady(true)
      }
    }
    const updateFound = () => {
      installing?.removeEventListener('statechange', stateChanged)
      installing = registration?.installing ?? null
      installing?.addEventListener('statechange', stateChanged)
    }
    const controlled = () => {
      if (disposed) return
      setOfflineReady(true)
      setWaitingWorker(null)
      if (reloadRequested.current) {
        if (!guarded.current) window.location.reload()
        else { reloadRequested.current = false; setActivatedUpdate(true) }
      }
    }
    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', appInstalled)
    if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('controllerchange', controlled)
    registerPwa().then(result => {
      if (disposed) return
      registration = result
      if (!registration) { setRegistrationFailed(process.env.NODE_ENV === 'production'); return }
      setOfflineReady(Boolean(navigator.serviceWorker.controller))
      setWaitingWorker(registration.waiting)
      registration.addEventListener('updatefound', updateFound)
      updateFound()
    })
    return () => {
      disposed = true
      window.removeEventListener('beforeinstallprompt', beforeInstall)
      window.removeEventListener('appinstalled', appInstalled)
      if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('controllerchange', controlled)
      registration?.removeEventListener('updatefound', updateFound)
      installing?.removeEventListener('statechange', stateChanged)
    }
  }, [])

  async function install() {
    if (!installPrompt || prompting) return
    setPrompting(true)
    setInstallError(false)
    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome === 'accepted') setInstalled(true)
    } catch {
      setInstallError(true)
    } finally {
      setInstallPrompt(null)
      setPrompting(false)
    }
  }

  function update() {
    if (guarded.current || (!waitingWorker && !activatedUpdate)) return
    if (!window.confirm('La aplicación se actualizará y volverá a abrirse. Los registros locales permanecerán guardados. ¿Continuar?')) return
    if (activatedUpdate) { window.location.reload(); return }
    reloadRequested.current = true
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
  }

  return (
    <aside className="pwa-panel notice no-print" aria-label="Instalación y uso sin conexión">
      <strong>Vacunas Colombia en tu dispositivo</strong>
      <p>{offlineReady ? 'La aplicación está preparada para uso sin conexión. Conserva también una copia de tus datos.' : 'Completa la primera carga con conexión para disponer del calendario y carné offline.'}</p>
      {!installed && platform === 'ios' && <p>En Safari: toca Compartir y elige Agregar a pantalla de inicio.</p>}
      {!installed && platform === 'android' && !installPrompt && <p>Abre el menú de tu navegador y busca Instalar aplicación o Agregar a pantalla de inicio. La opción depende del navegador.</p>}
      {!installed && platform === 'other' && !installPrompt && <p>Para instalarla, busca la opción de instalación en la barra de direcciones o en el menú del navegador.</p>}
      {!installed && installPrompt && <Button type="button" className="btn secondary" onClick={install} disabled={prompting}><Download size={16} aria-hidden="true" />{prompting ? 'Abriendo instalación…' : 'Instalar aplicación'}</Button>}
      {installed && <p>Abierta o instalada como aplicación en este dispositivo.</p>}
      {installError && <p role="status">No se pudo abrir la instalación nativa. Usa las opciones del menú del navegador.</p>}
      {registrationFailed && <p role="status">No se pudo preparar el uso offline. Comprueba la conexión y vuelve a abrir la aplicación; tus registros locales no se borrarán.</p>}
      {(waitingWorker || activatedUpdate) && <div><p>Hay una actualización disponible. {hasUnsavedChanges ? 'Guarda o cancela los cambios del formulario antes de actualizar.' : storageBlocked ? 'Resuelve el bloqueo de almacenamiento antes de recargar.' : 'Tus registros permanecerán en el dispositivo.'}</p><Button type="button" className="btn secondary" onClick={update} disabled={hasUnsavedChanges || storageBlocked}><RefreshCw size={16} aria-hidden="true" />Actualizar aplicación</Button></div>}
    </aside>
  )
}
