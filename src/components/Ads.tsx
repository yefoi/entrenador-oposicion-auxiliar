import { useEffect } from 'react'

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

export interface AdSlotProps {
  slot: string
  label?: string
}

/**
 * Auto Ads, enabled by loading the adsbygoogle script in the document head
 * (see vite.config.ts and scripts/generate-seo.mjs), places ads on its own.
 * This component is only needed for manual ad units: pass the slot id from
 * the AdSense dashboard. Without a slot id it renders nothing.
 */
export function AdSlot({ slot, label = 'Publicidad' }: AdSlotProps) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT

  useEffect(() => {
    if (!client || !slot) return
    if (document.querySelector(`script[src^="${ADSENSE_SRC}"]`)) return
    const script = document.createElement('script')
    script.async = true
    script.src = `${ADSENSE_SRC}?client=${client}`
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)
  }, [client, slot])

  if (!client || !slot) return null

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
