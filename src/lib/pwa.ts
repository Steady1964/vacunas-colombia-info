let registrationPromise: Promise<ServiceWorkerRegistration | null> | null =
  null;

export function registerPwa(): Promise<ServiceWorkerRegistration | null> {
  if (
    typeof window === 'undefined' ||
    process.env.NODE_ENV !== 'production' ||
    !window.isSecureContext ||
    !('serviceWorker' in navigator)
  )
    return Promise.resolve(null);
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {
        registrationPromise = null;
        return null;
      });
  }
  return registrationPromise;
}

export async function requestPersistentStorage(): Promise<
  'granted' | 'denied' | 'unsupported'
> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist)
    return 'unsupported';
  try {
    return (await navigator.storage.persist()) ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}
