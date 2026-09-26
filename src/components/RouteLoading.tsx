export function RouteLoading({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-loading__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
