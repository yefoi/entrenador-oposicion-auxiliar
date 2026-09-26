import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icons'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  icon,
  className = '',
  ...props
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
  icon?: IconName
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {icon ? <Icon name={icon} size={17} /> : null}
      <span>{children}</span>
    </button>
  )
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = 'purple',
}: {
  label: string
  value: string
  detail?: string
  icon: IconName
  tone?: 'purple' | 'teal' | 'orange' | 'rose'
}) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-card-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  )
}

export function ProgressBar({
  value,
  tone = 'purple',
  label,
}: {
  value: number
  tone?: string
  label?: string
}) {
  const safeValue = Math.max(0, Math.min(100, value))
  return (
    <div className="progress-wrap">
      {label ? (
        <div className="progress-label">
          <span>{label}</span>
          <strong>{safeValue}%</strong>
        </div>
      ) : null}
      <div className="progress-track">
        <span
          className={`progress-fill fill-${tone}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}

export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'purple'
}) {
  return <span className={`tag tag-${tone}`}>{children}</span>
}

export function EmptyState({
  icon = 'info',
  title,
  description,
  action,
}: {
  icon?: IconName
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function ScorePill({ score, label }: { score: number; label?: string }) {
  const tone = score >= 25 ? 'success' : 'danger'
  return (
    <span className={`score-pill score-${tone}`}>
      <strong>{score.toFixed(1).replace('.', ',')}</strong>
      {label ? <small>{label}</small> : null}
    </span>
  )
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div aria-modal="true" className="modal" role="dialog">
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
