const analyticsSource = import.meta.env.VITE_ANALYTICS_SRC?.trim()
const analyticsDomain = import.meta.env.VITE_ANALYTICS_DOMAIN?.trim()

export const analyticsConfigured = Boolean(analyticsSource && analyticsDomain)

type AnalyticsWindow = Window & {
  plausible?: (event: string, options?: { props?: Record<string, string> }) => void
}

export function initAnalytics(): void {
  if (!analyticsConfigured || typeof document === 'undefined') return
  if (document.querySelector('script[data-plaza-tai-analytics]')) return
  const script = document.createElement('script')
  script.defer = true
  script.dataset.domain = analyticsDomain
  script.dataset.plazaTaiAnalytics = 'true'
  script.src = analyticsSource
  document.head.appendChild(script)
}

export function trackEvent(
  event: string,
  props?: Record<string, string>,
): void {
  if (!analyticsConfigured || typeof window === 'undefined') return
  const analyticsWindow = window as AnalyticsWindow
  analyticsWindow.plausible?.(event, props ? { props } : undefined)
}
