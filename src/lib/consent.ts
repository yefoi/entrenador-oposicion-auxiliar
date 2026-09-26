export const CONSENT_KEY = 'tai-entrenador:ads-consent'

export type ConsentValue = 'granted' | 'denied'

const listeners = new Set<() => void>()

export function readConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    return raw === 'granted' || raw === 'denied' ? raw : null
  } catch {
    return null
  }
}

export function getConsentSnapshot(): ConsentValue | null {
  return readConsent()
}

export function subscribeConsent(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function writeConsent(value: ConsentValue): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(CONSENT_KEY, value)
  } catch {
    return false
  }
  for (const listener of listeners) listener()
  return true
}
