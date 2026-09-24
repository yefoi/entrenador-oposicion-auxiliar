import { useState } from 'react'
import type { TrainerSession } from '../domain/types'
import {
  blocks,
  examRules,
  OFFICIAL_BOE_URL,
  OFFICIAL_INAP_URL,
  scenarios,
} from '../data/syllabus'
import { Icon } from '../components/Icons'
import { Button, PageHeader, Tag } from '../components/UI'

interface ExamSetupPageProps {
  activeSession: TrainerSession | null
  onStart: (scenario: 'III' | 'IV') => void
}

export function ExamSetupPage({ activeSession, onStart }: ExamSetupPageProps) {
  const [scenario, setScenario] = useState<'III' | 'IV'>('III')
  const [confirmed, setConfirmed] = useState(false)
  const selected = scenarios.find((item) => item.id === scenario)

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Simulacro de examen"
        title="Ensaya el día que importa."
        description="Reproduce la mecánica de la convocatoria: un solo bloque de 120 minutos, dos partes y penalización real."
        action={
          <Tag tone="purple">
            <Icon name="shield" size={13} /> 80 + 20
          </Tag>
        }
      />
      <div className="exam-notice">
        <span className="notice-icon">
          <Icon name="info" size={19} />
        </span>
        <div>
          <strong>Modelo de referencia · convocatoria 2025</strong>
          <p>
            El examen oficial de esta convocatoria se celebró el{' '}
            {examRules.examDate}. Las bases pueden cambiar en futuras
            convocatorias: consulta siempre el BOE y la sede del INAP.
          </p>
        </div>
        <div className="notice-links">
          <a href={OFFICIAL_BOE_URL} rel="noreferrer" target="_blank">
            BOE <Icon name="arrow" size={12} />
          </a>
          <a href={OFFICIAL_INAP_URL} rel="noreferrer" target="_blank">
            INAP <Icon name="arrow" size={12} />
          </a>
        </div>
      </div>
      <div className="exam-grid">
        <section className="panel exam-rules-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Cómo se corre</span>
              <h2>Un examen. Dos cortes.</h2>
            </div>
            <span className="panel-icon panel-icon-orange">
              <Icon name="clipboard" size={20} />
            </span>
          </div>
          <div className="exam-parts">
            <div className="exam-part">
              <div className="part-number">01</div>
              <div>
                <strong>Parte teórica</strong>
                <p>Hasta 80 preguntas de los 4 bloques + 5 de reserva.</p>
                <small>Cada acierto suma; cada error resta 1/3.</small>
              </div>
              <b>50 pts</b>
            </div>
            <div className="exam-part">
              <div className="part-number">02</div>
              <div>
                <strong>Supuesto práctico</strong>
                <p>20 preguntas + 5 de reserva. Eliges Bloque III o IV.</p>
                <small>Solo se corrige el supuesto elegido.</small>
              </div>
              <b>50 pts</b>
            </div>
          </div>
          <div className="exam-facts">
            <div>
              <Icon name="clock" size={17} />
              <span>
                <strong>120 min</strong>
                <small>una sola sesión</small>
              </span>
            </div>
            <div>
              <Icon name="grid" size={17} />
              <span>
                <strong>4 opciones</strong>
                <small>una sola correcta</small>
              </span>
            </div>
            <div>
              <Icon name="x" size={17} />
              <span>
                <strong>−1/3</strong>
                <small>por error</small>
              </span>
            </div>
            <div>
              <Icon name="check" size={17} />
              <span>
                <strong>0</strong>
                <small>por blanco</small>
              </span>
            </div>
          </div>
          <div className="score-rule">
            <Icon name="target" size={18} />
            <p>
              La app muestra la <strong>puntuación directa</strong> (aciertos −
              errores/3) y una estimación orientativa sobre 50 en cada parte. El
              corte definitivo depende de la CPS y de la convocatoria.
            </p>
          </div>
        </section>
        <section className="panel scenario-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Parte 2</span>
              <h2>Elige tu escenario</h2>
            </div>
            <span className="choice-required">Obligatorio</span>
          </div>
          <div className="scenario-options">
            {scenarios.map((item) => (
              <button
                className={`scenario-option ${scenario === item.id ? 'is-selected' : ''}`}
                key={item.id}
                onClick={() => setScenario(item.id)}
                type="button"
              >
                <span className="scenario-radio" />
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    Bloque {item.id} ·{' '}
                    {item.id === 'III'
                      ? blocks[2]?.shortTitle
                      : blocks[3]?.shortTitle}
                  </small>
                </div>
              </button>
            ))}
          </div>
          {selected ? (
            <div className="scenario-preview">
              <span className="section-kicker">Contexto</span>
              <p>{selected.context}</p>
              <div className="scenario-tasks">
                {selected.tasks.map((task) => (
                  <span key={task}>
                    <Icon name="check" size={13} />
                    {task}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <label className="confirm-row">
            <input
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>
              He entendido que son 100 preguntas y que el reloj no se pausa.
            </span>
          </label>
          <Button
            className="full-button"
            disabled={!confirmed || Boolean(activeSession)}
            onClick={() => onStart(scenario)}
            icon="clock"
          >
            {activeSession
              ? 'Ya tienes un simulacro activo'
              : 'Comenzar simulacro'}
          </Button>
          {activeSession ? (
            <p className="form-error">
              Termina o abandona la sesión activa antes de iniciar otra.
            </p>
          ) : null}
        </section>
      </div>
      <div className="exam-bottom-note">
        <Icon name="shield" size={17} />
        <span>
          No es un examen oficial. Es un simulador de entrenamiento con
          preguntas generadas y explicaciones pedagógicas.
        </span>
      </div>
    </div>
  )
}
