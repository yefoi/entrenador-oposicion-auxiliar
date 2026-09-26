import { useRef, useState } from 'react'
import type { AppView, StudySettings, TrainerState } from '../domain/types'
import {
  BAQUEDANO_URL,
  CONTENT_VERSION,
  OFFICIAL_BOE_URL,
  OFFICIAL_INAP_URL,
  examRules,
} from '../data/syllabus'
import { activeQuestions } from '../data/questions'
import { validateContent } from '../lib/validation'
import { downloadState } from '../lib/storage'
import { Icon } from '../components/Icons'
import { Button, Modal, PageHeader, Tag } from '../components/UI'

interface SettingsPageProps {
  state: TrainerState
  settings: StudySettings
  storageAvailable: boolean
  onUpdate: (settings: Partial<StudySettings>) => void
  onClear: () => void
  onImport: (text: string) => void
  onNavigate: (view: AppView) => void
}

export function SettingsPage({
  state,
  settings,
  storageAvailable,
  onUpdate,
  onClear,
  onImport,
  onNavigate,
}: SettingsPageProps) {
  const [showReset, setShowReset] = useState(false)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const validation = validateContent(activeQuestions)
  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      onImport(await file.text())
      setMessage('Progreso importado correctamente.')
    } catch {
      setMessage('No se pudo importar: el archivo no es compatible.')
    }
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Ajustes y datos"
        title="Tu preparación, bajo control."
        description="Todo se guarda en este navegador. Exporta una copia antes de limpiar el dispositivo o cambiar de equipo."
        action={
          <Tag tone="success">
            <span className="status-dot" />
            Guardado local
          </Tag>
        }
      />
      <div className="settings-grid">
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Preferencias</span>
              <h2>Cómo quieres estudiar</h2>
            </div>
            <span className="panel-icon panel-icon-purple">
              <Icon name="settings" size={20} />
            </span>
          </div>
          <label className="field-label">
            Fecha objetivo
            <input
              onChange={(event) => onUpdate({ examDate: event.target.value })}
              type="date"
              value={settings.examDate}
            />
          </label>
          <label className="field-label">
            Objetivo de puntuación
            <select
              onChange={(event) =>
                onUpdate({ targetScore: Number(event.target.value) })
              }
              value={settings.targetScore}
            >
              <option value="50">50 · superar</option>
              <option value="60">60 · Vamos con margen</option>
              <option value="70">70 · recomendado</option>
              <option value="80">80 · aspiracional</option>
              <option value="90">90 · ambicioso</option>
            </select>
          </label>
          <label className="toggle-row settings-toggle">
            <span>
              <strong>Mostrar explicaciones</strong>
              <small>Mostrar el detalle al responder</small>
            </span>
            <input
              checked={settings.showExplanations}
              onChange={(event) =>
                onUpdate({ showExplanations: event.target.checked })
              }
              type="checkbox"
            />
            <span className="toggle-ui" />
          </label>
          <label className="toggle-row settings-toggle">
            <span>
              <strong>Reducir animaciones</strong>
              <small>Una interfaz más sobria y enfocada</small>
            </span>
            <input
              checked={settings.reducedMotion}
              onChange={(event) =>
                onUpdate({ reducedMotion: event.target.checked })
              }
              type="checkbox"
            />
            <span className="toggle-ui" />
          </label>
          <div className="settings-note">
            <Icon name="info" size={16} />
            <span>
              El progreso no contiene datos personales ni se envía a ningún
              servidor.
            </span>
          </div>
        </section>
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Tus datos</span>
              <h2>Respaldo local</h2>
            </div>
            <span className="panel-icon panel-icon-teal">
              <Icon name="download" size={20} />
            </span>
          </div>
          <div className="data-summary">
            <div>
              <strong>{state.attempts.length}</strong>
              <span>intentos</span>
            </div>
            <div>
              <strong>{state.activity.length}</strong>
              <span>días activos</span>
            </div>
            <div>
              <strong>{Object.keys(state.reviews).length}</strong>
              <span>temas repasados</span>
            </div>
          </div>
          <div className="data-actions">
            <Button icon="download" onClick={() => downloadState(state)}>
              Exportar progreso
            </Button>
            <Button
              icon="upload"
              onClick={() => inputRef.current?.click()}
              variant="secondary"
            >
              Importar progreso
            </Button>
            <input
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
              ref={inputRef}
              type="file"
            />
          </div>
          {message ? (
            <div className="form-success">
              <Icon name="check" size={15} />
              {message}
            </div>
          ) : null}
          <div className="danger-zone">
            <div>
              <strong>Borrar progreso</strong>
              <small>
                Elimina intentos, repasos y ajustes de este navegador.
              </small>
            </div>
            <Button
              icon="refresh"
              onClick={() => setShowReset(true)}
              variant="danger"
            >
              Borrar
            </Button>
          </div>
        </section>
      </div>
      <section className="panel content-health">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Transparencia del contenido</span>
            <h2>Estado del temario y del banco</h2>
          </div>
          <Tag tone={validation.valid ? 'success' : 'danger'}>
            {validation.valid ? 'Validado' : 'Revisión necesaria'}
          </Tag>
        </div>
        <div className="health-grid">
          <div>
            <span>Banco activo</span>
            <strong>{validation.questionCount} preguntas</strong>
            <small>Versión {CONTENT_VERSION}</small>
          </div>
          <div>
            <span>Temario</span>
            <strong>{validation.topicCount} temas · 4 bloques</strong>
            <small>Distribución 9 / 5 / 9 / 10</small>
          </div>
          <div>
            <span>Fuente</span>
            <strong>Práctica no oficial</strong>
            <small>Generadas y revisadas en la app</small>
          </div>
          <div>
            <span>Persistencia</span>
            <strong>{storageAvailable ? 'Disponible' : 'No disponible'}</strong>
            <small>
              {storageAvailable
                ? 'localStorage activo'
                : 'El progreso puede perderse al cerrar'}
            </small>
          </div>
        </div>
        {validation.errors.length ? (
          <div className="validation-errors">
            {validation.errors.map((error) => (
              <div key={error}>
                <Icon name="x" size={14} />
                {error}
              </div>
            ))}
          </div>
        ) : (
          <div className="health-ok">
            <Icon name="check" size={16} /> Todas las preguntas tienen cuatro
            opciones, explicación y un tema válido.
          </div>
        )}
      </section>
      <section className="panel sources-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Fuentes oficiales</span>
            <h2>Verifica siempre la norma</h2>
          </div>
          <span className="panel-icon panel-icon-orange">
            <Icon name="shield" size={20} />
          </span>
        </div>
        <div className="source-cards">
          <a href={OFFICIAL_BOE_URL} rel="noreferrer" target="_blank">
            <span className="source-card-icon">
              <Icon name="book" size={18} />
            </span>
            <span>
              <strong>BOE · convocatoria 2025</strong>
              <small>{examRules.reference}</small>
            </span>
            <Icon name="arrow" size={15} />
          </a>
          <a href={OFFICIAL_INAP_URL} rel="noreferrer" target="_blank">
            <span className="source-card-icon">
              <Icon name="info" size={18} />
            </span>
            <span>
              <strong>INAP · procesos selectivos</strong>
              <small>Exámenes y avisos de la CPS</small>
            </span>
            <Icon name="arrow" size={15} />
          </a>
          <a href={BAQUEDANO_URL} rel="noreferrer" target="_blank">
            <span className="source-card-icon">
              <Icon name="clipboard" size={18} />
            </span>
            <span>
              <strong>baquedano.es · archivo de ejercicios</strong>
              <small>Exámenes y soluciones para consultar estructuras</small>
            </span>
            <Icon name="arrow" size={15} />
          </a>
        </div>
        <div className="source-caution">
          <Icon name="info" size={16} />
          <span>
            La interfaz no es un servicio oficial de la AGE ni de la INAP.
            “Generada” identifica preguntas de práctica propias; no son
            respuestas oficiales.
          </span>
        </div>
      </section>
      <div className="settings-bottom">
        <button
          className="text-button"
          onClick={() => onNavigate('dashboard')}
          type="button"
        >
          <Icon name="arrow" size={14} /> Volver al panel
        </button>
        <span>
          Si borras los datos del navegador, el progreso puede desaparecer.
          Exporta con regularidad.
        </span>
      </div>
      {showReset ? (
        <Modal
          onClose={() => setShowReset(false)}
          title="¿Borrar todo el progreso?"
        >
          <div className="modal-copy">
            <p>
              Se eliminarán <strong>{state.attempts.length} intentos</strong>,{' '}
              {Object.keys(state.reviews).length} repasos y tus ajustes. El
              temario y el banco no se borran.
            </p>
            <div className="modal-warning">
              <Icon name="info" size={16} /> Esta acción no se puede deshacer.
            </div>
          </div>
          <div className="modal-actions">
            <Button onClick={() => setShowReset(false)} variant="ghost">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onClear()
                setShowReset(false)
              }}
              variant="danger"
            >
              Sí, borrar progreso
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
