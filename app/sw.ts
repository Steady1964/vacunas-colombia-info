/// <reference lib="webworker" />
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}
declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [],
})

serwist.registerCapture(
  ({ request, url }) => request.mode === 'navigate' && url.origin === self.location.origin && url.pathname === '/' && url.search === '',
  serwist.createHandlerBoundToUrl('/'),
  'GET',
)
serwist.registerCapture(
  ({ request, url }) => request.mode === 'navigate' && url.origin === self.location.origin,
  async ({ request }) => {
    try {
      return await fetch(request)
    } catch {
      return await serwist.matchPrecache('/offline') ?? Response.error()
    }
  },
  'GET',
)
serwist.setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') return await serwist.matchPrecache('/offline') ?? Response.error()
  return Response.error()
})
serwist.addEventListeners()
