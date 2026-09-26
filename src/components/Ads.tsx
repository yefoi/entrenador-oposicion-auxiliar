import { useEffect, useSyncExternalStore } from 'react'
import {
  getConsentSnapshot,
  subscribeConsent,
  writeConsent,
} from '../lib/consent'

const ADSENSE_SCRIPT = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

function useAdsConsent() {
  return useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    () => null,
  )
}

export interface AdSlotProps {
  slot: string
  label?: string
}

export function AdSlot({ slot, label = 'Publicidad' }: AdSlotProps) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT
  const consent = useAdsConsent()

  useEffect(() => {
    if (!client || consent !== 'granted') return
    if (document.querySelector(`script[src="${ADSENSE_SCRIPT}"]`)) return
    const script = document.createElement('script')
    script.async = true
    script.src = ADSENSE_SCRIPT
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)
  }, [client, consent])

  if (!client || !slot || consent !== 'granted') return null

  return (
    <aside className="ad-slot" aria-label={label}>
      <span className="ad-slot__label">{label}</span>
      <ins
        className="adsbygoogle"
        data-ad-client={client}
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-ad-slot={slot}
      />
    </aside>
  )
}

export function ConsentBanner() {
  const client = import.meta.env.VITE_ADSENSE_CLIENT
  const consent = useAdsConsent()
  const pending = Boolean(client) && consent === null

  if (!client || !pending) return null

  const decide = (value: boolean) => {
    writeConsent(value ? 'granted' : 'denied')
  }

  return (
    <div className="consent-banner" role="region" aria-label="Aviso de cookies">
      <p>
        Podemos mostrar publicidad para mantener el sitio gratuito. No usamos
        analítica que cree perfiles. Puedes decidir ahora o seguir sin publicidad.
      </p>
      <div className="consent-banner__actions">
        <button onClick={() => decide(true)} type="button">
          Aceptar publicidad
        </button>
        <button onClick={() => decide(false)} type="button">
          Seguir sin publicidad
        </button>
      </div>
      <a href="./cookies.html">Política de cookies</a>
    </div>
  )
}
