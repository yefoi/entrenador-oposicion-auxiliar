import { useState } from 'react'
import type { CSSProperties } from 'react'
import type {
  AppView,
  Attempt,
  StudySettings,
  TopicStat,
  TrainerSession,
} from '../domain/types'
import { blocks, OFFICIAL_BOE_URL, topics } from '../data/syllabus'
import { activeQuestions } from '../data/questions'
import { Icon } from '../components/Icons'
import {
  Button,
  EmptyState,
  PageHeader,
  ProgressBar,
  StatCard,
  Tag,
} from '../components/UI'
import { getBlockStats } from '../lib/statistics'

interface DashboardPageProps {
  stats: TopicStat[]
  attempts: Attempt[]
  settings: StudySettings
  weakTopics: TopicStat[]
  activeSession: TrainerSession | null
  onNavigate: (view: AppView) => void
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

export function DashboardPage({
  stats,
  attempts,
  settings,
  weakTopics,
  activeSession,
  onNavigate,
}: DashboardPageProps) {
  const [now] = useState(() => Date.now())
  const answered = stats.reduce((sum, item) => sum + item.presented, 0)
  const correct = stats.reduce((sum, item) => sum + item.correct, 0)
  const wrong = stats.reduce((sum, item) => sum + item.wrong, 0)
  const blank = stats.reduce((sum, item) => sum + item.blank, 0)
  const accuracy = answered === 0 ? 0 : correct / answered
  const blockStats = getBlockStats(stats)
  const completedAttempts = attempts.filter(
    (attempt) => attempt.mode !== 'practice',
  ).length
  const studiedTopics = stats.filter((item) => item.presented > 0).length
  const focus = weakTopics[0]
  const recent = attempts.slice(-4).reverse()
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(settings.examDate).getTime() - now) / 86400000),
  )
  const targetProgress = Math.min(
    100,
    Math.round(((accuracy * 100) / Math.max(1, settings.targetScore)) * 100),
  )

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Panel de preparación"
        title="Tu plaza, paso a paso."
        description="Entrena con método, mide lo que importa y llega al examen con margen."
        action={
          <Button icon="play" onClick={() => onNavigate('practice')}>
            Empezar práctica
          </Button>
        }
      />
      {activeSession ? (
        <button
          className="active-banner"
          onClick={() =>
            onNavigate(
              activeSession.mode === 'minigame'
                ? 'minigames'
                : activeSession.mode === 'exam'
                  ? 'exam'
                  : 'practice',
            )
          }
          type="button"
        >
          <span className="active-banner-icon">
            <Icon name="clock" size={19} />
          </span>
          <span>
            <strong>Tienes una sesión a medias</strong>
            <small>
              {activeSession.title} ·{' '}
              {
                activeSession.questions.filter(
                  (item) =>
                    activeSession.answers[item.questionId] !== undefined,
                ).length
              }{' '}
              de {activeSession.questions.length} respondidas
            </small>
          </span>
          <Icon name="arrow" size={18} />
        </button>
      ) : null}
      <section className="dashboard-minigame-card">
        <div className="dashboard-minigame-icon">
          <Icon name="grid" size={22} />
        </div>
        <div>
          <span className="section-kicker">Acceso rápido</span>
          <h2>Minijuegos</h2>
          <p>Flashcards, speedrun y una ronda solo con tus temas débiles.</p>
        </div>
        <Button icon="spark" onClick={() => onNavigate('minigames')}>
          Abrir Minijuegos
        </Button>
      </section>
      <div className="stats-grid">
        <StatCard
          detail={`${answered} respondidas`}
          icon="target"
          label="Precisión global"
          tone="purple"
          value={percent(accuracy)}
        />
        <StatCard
          detail={`${studiedTopics} de ${topics.length} temas`}
          icon="book"
          label="Cobertura"
          tone="teal"
          value={percent(studiedTopics / topics.length)}
        />
        <StatCard
          detail={`${wrong} errores · ${blank} blancos`}
          icon="chart"
          label="Control del error"
          tone="orange"
          value={answered ? percent(Math.max(0, 1 - wrong / answered)) : '—'}
        />
        <StatCard
          detail={`${daysLeft} días de margen`}
          icon="calendar"
          label="Cuenta atrás"
          tone="rose"
          value={completedAttempts ? `${completedAttempts}` : '0'}
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel focus-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Plan de hoy</span>
              <h2>Una sesión bien elegida vale más que diez al azar.</h2>
            </div>
            <span className="panel-icon">
              <Icon name="spark" size={20} />
            </span>
          </div>
          {focus ? (
            <div className="focus-content">
              <div
                className="focus-ring"
                style={
                  {
                    '--ring-progress': `${Math.max(8, focus.adjustedScore * 100)}%`,
                  } as CSSProperties
                }
              >
                <strong>{percent(Math.max(0, focus.adjustedScore))}</strong>
                <span>ajustado</span>
              </div>
              <div className="focus-copy">
                <Tag tone="warning">Prioridad</Tag>
                <h3>{focus.topicId.replace('-T', ' · Tema ')}</h3>
                <p>
                  {topics.find((topic) => topic.id === focus.topicId)?.title}
                </p>
                <small>
                  {focus.presented} respuestas · {focus.correct} aciertos
                </small>
                <Button variant="soft" onClick={() => onNavigate('practice')}>
                  Entrenar este tema <Icon name="arrow" size={15} />
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              description="Cuando Study registra respuestas, aquí aparecerá el siguiente foco de estudio."
              icon="target"
              title="Tu mapa está limpio"
              action={
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('syllabus')}
                >
                  Ver temario
                </Button>
              }
            />
          )}
        </section>
        <section className="panel target-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Objetivo de entrenamiento</span>
              <h2>Apunta por encima del corte.</h2>
            </div>
            <span className="panel-icon panel-icon-teal">
              <Icon name="target" size={20} />
            </span>
          </div>
          <div className="target-number">
            <strong>{settings.targetScore}</strong>
            <span>/ 100</span>
          </div>
          <ProgressBar
            label="Progreso hacia tu objetivo"
            tone="teal"
            value={targetProgress}
          />
          <p className="muted-copy">
            El simulacro calcula aciertos menos un tercio de los errores. Los
            blancos no restan.
          </p>
          <Button
            icon="clipboard"
            onClick={() => onNavigate('exam')}
            variant="secondary"
          >
            Ver formato oficial
          </Button>
        </section>
      </div>
      <div className="dashboard-grid lower-grid">
        <section className="panel block-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Mapa del temario</span>
              <h2>Rendimiento por bloque</h2>
            </div>
            <button
              className="text-button"
              onClick={() => onNavigate('statistics')}
              type="button"
            >
              Ver detalle <Icon name="arrow" size={14} />
            </button>
          </div>
          <div className="block-list">
            {blocks.map((block) => {
              const data = blockStats[block.id]
              const value =
                data.answered === 0
                  ? 0
                  : Math.round((data.correct / data.answered) * 100)
              return (
                <div className="block-row" key={block.id}>
                  <span
                    className="block-dot"
                    style={{ background: block.accent }}
                  />
                  <span className="block-name">
                    <strong>{block.shortTitle}</strong>
                    <small>{data.answered} preguntas</small>
                  </span>
                  <div className="block-progress">
                    <ProgressBar
                      tone={
                        block.id === 'I'
                          ? 'purple'
                          : block.id === 'II'
                            ? 'teal'
                            : block.id === 'III'
                              ? 'orange'
                              : 'rose'
                      }
                      value={value}
                    />
                  </div>
                  <strong className="block-percent">
                    {value ? `${value}%` : '—'}
                  </strong>
                </div>
              )
            })}
          </div>
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Constancia</span>
              <h2>Últimos 7 días</h2>
            </div>
            <span className="activity-total">
              {answered} <small>preguntas</small>
            </span>
          </div>
          <div className="activity-chart" aria-label="Preguntas por día">
            {Array.from({ length: 7 }, (_, index) => {
              const date = new Date(now - (6 - index) * 86400000)
              const key = date.toISOString().slice(0, 10)
              const day = attempts.length ? attempts : []
              const value = day.reduce(
                (sum, attempt) =>
                  sum +
                  (attempt.completedAt.slice(0, 10) === key
                    ? attempt.questions.length
                    : 0),
                0,
              )
              return (
                <div className="activity-day" key={key}>
                  <div className="activity-bar-wrap">
                    <span
                      className="activity-bar"
                      style={{
                        height: `${Math.max(6, Math.min(100, value * 5))}%`,
                      }}
                    />
                  </div>
                  <small>
                    {new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
                      .format(date)
                      .slice(0, 2)}
                  </small>
                </div>
              )
            })}
          </div>
        </section>
      </div>
      <section className="panel history-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Historial</span>
            <h2>Últimos intentos</h2>
          </div>
          <button
            className="text-button"
            onClick={() => onNavigate('statistics')}
            type="button"
          >
            Ver todos <Icon name="arrow" size={14} />
          </button>
        </div>
        {recent.length ? (
          <div className="attempt-table">
            {recent.map((attempt) => {
              const score = attempt.scores.reduce(
                (sum, item) => sum + item.estimated,
                0,
              )
              return (
                <button
                  className="attempt-row"
                  key={attempt.id}
                  onClick={() => onNavigate('results')}
                  type="button"
                >
                  <span className="attempt-icon">
                    <Icon
                      name={
                        attempt.mode === 'exam'
                          ? 'clipboard'
                          : attempt.mode === 'minigame'
                            ? 'grid'
                            : 'play'
                      }
                      size={16}
                    />
                  </span>
                  <span className="attempt-name">
                    <strong>{attempt.title}</strong>
                    <small>
                      {shortDate(attempt.completedAt)} ·{' '}
                      {attempt.questions.length} preguntas
                    </small>
                  </span>
                  <span
                    className={`attempt-status ${score >= 50 ? 'status-good' : 'status-warn'}`}
                  >
                    {score.toFixed(1).replace('.', ',')} / 100
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState
            description="Haz una práctica o un simulacro para construir tu historial."
            icon="clock"
            title="Aún no hay intentos"
          />
        )}
      </section>
      <section className="panel seo-content-panel">
        <div className="seo-content-copy">
          <span className="section-kicker">Guía rápida</span>
          <h2>Entrenador de oposiciones TAI de la AGE</h2>
          <p>
            Esta aplicación reúne el temario de {topics.length} temas en 4
            bloques, {activeQuestions.length} preguntas propias, tests con
            explicación, simulacro cronometrado, repasos espaciados y minijuegos
            para transformar el estudio en práctica.
          </p>
          <p>
            El progreso se guarda localmente en tu navegador. El banco es
            material de práctica no oficial; consulta el texto vigente de la
            convocatoria antes de estudiar una norma.
          </p>
        </div>
        <div className="seo-content-actions">
          <a href={OFFICIAL_BOE_URL} rel="noreferrer" target="_blank">
            Ver convocatoria oficial <Icon name="arrow" size={14} />
          </a>
          <Button
            icon="book"
            onClick={() => onNavigate('syllabus')}
            variant="secondary"
          >
            Explorar temario
          </Button>
        </div>
      </section>
    </div>
  )
}
