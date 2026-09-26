import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppView, TrainerSession } from '../domain/types'
import { Icon, type IconName } from './Icons'

interface AppShellProps {
  view: AppView
  onNavigate: (view: AppView) => void
  activeSession: TrainerSession | null
  children: ReactNode
}

const navigation: { id: AppView; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Inicio', icon: 'home' },
  { id: 'syllabus', label: 'Temario', icon: 'book' },
  { id: 'practice', label: 'Práctica', icon: 'play' },
  { id: 'minigames', label: 'Minijuegos', icon: 'grid' },
  { id: 'exam', label: 'Simulacro', icon: 'clipboard' },
  { id: 'reviews', label: 'Repasos', icon: 'refresh' },
  { id: 'statistics', label: 'Estadísticas', icon: 'chart' },
  { id: 'plan', label: 'Plan', icon: 'calendar' },
]

function getSessionView(session: TrainerSession): AppView {
  if (session.mode === 'minigame') return 'minigames'
  return session.mode === 'exam' ? 'exam' : 'practice'
}

export function AppShell({
  view,
  onNavigate,
  activeSession,
  children,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    if (!menuOpen) return
    document.body.classList.add('menu-open')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('menu-open')
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const go = useCallback(
    (next: AppView) => {
      setMenuOpen(false)
      onNavigate(next)
    },
    [onNavigate],
  )

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      {menuOpen ? (
        <button
          aria-hidden="true"
          className="sidebar-backdrop"
          onClick={closeMenu}
          tabIndex={-1}
          type="button"
        />
      ) : null}
      <aside
        aria-label="Menú principal"
        className="sidebar"
        data-adsbygoogle-exclude="navigation"
        id="app-sidebar"
      >
        <div className="sidebar-head">
          <button
            className="brand"
            onClick={() => go('dashboard')}
            type="button"
          >
            <div className="brand-mark">
              <Icon name="target" size={24} />
            </div>
            <div>
              <strong>Plaza TAI</strong>
              <span>entrenador AGE</span>
            </div>
          </button>
          <button
            aria-label="Cerrar menú"
            className="sidebar-close"
            onClick={closeMenu}
            type="button"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="sidebar-rule" />
        <nav aria-label="Navegación principal" className="main-nav">
          {navigation.map((item) => (
            <button
              aria-current={view === item.id ? 'page' : undefined}
              className={`nav-item ${view === item.id ? 'is-active' : ''}`}
              key={item.id}
              onClick={() => go(item.id)}
              type="button"
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === 'reviews' && activeSession ? (
                <i className="nav-dot" />
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {activeSession ? (
            <button
              className="resume-card"
              onClick={() => go(getSessionView(activeSession))}
              type="button"
            >
              <span className="resume-icon">
                <Icon name="clock" size={17} />
              </span>
              <span>
                <small>Sesión activa</small>
                <strong>
                  {activeSession.mode === 'exam'
                    ? 'Simulacro en curso'
                    : activeSession.mode === 'minigame'
                      ? 'Minijuego en curso'
                      : 'Práctica en curso'}
                </strong>
              </span>
              <Icon name="arrow" size={16} />
            </button>
          ) : (
            <div className="sidebar-tip">
              <span>
                La constancia gana
                <br />
                al improviso.
              </span>
            </div>
          )}
          <button
            aria-current={view === 'settings' ? 'page' : undefined}
            className={`nav-item ${view === 'settings' ? 'is-active' : ''}`}
            onClick={() => go('settings')}
            type="button"
          >
            <Icon name="settings" size={19} />
            <span>Ajustes</span>
          </button>
          <div className="local-badge">
            <span className="online-dot" /> Progreso local
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="mobile-header">
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            ref={toggleRef}
            type="button"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
          <div className="mobile-brand">
            <div className="brand-mark">
              <Icon name="target" size={20} />
            </div>
            <strong>Plaza TAI</strong>
          </div>
          <button
            className="avatar"
            onClick={() => onNavigate('settings')}
            type="button"
            aria-label="Abrir ajustes"
          >
            <Icon name="user" size={18} />
          </button>
        </header>
        <main id="main-content" className="page-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>
            Banco propio de práctica · No oficial · Normativa de referencia: convocatoria 2025
          </span>
          <nav aria-label="Enlaces legales" className="footer-legal">
            <a href="./privacidad.html">Privacidad</a>
            <a href="./cookies.html">Cookies</a>
          </nav>
        </footer>
      </div>
    </div>
  )
}
