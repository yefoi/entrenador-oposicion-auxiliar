import { useState } from 'react'
import type { AppView, Attempt, TopicStat } from '../domain/types'
import { blocks, topics } from '../data/syllabus'
import { getBlockStats } from '../lib/statistics'
import { Icon } from '../components/Icons'
import {
  Button,
  EmptyState,
  PageHeader,
  ProgressBar,
  Tag,
} from '../components/UI'

interface StatisticsPageProps {
  stats: TopicStat[]
  attempts: Attempt[]
  activity: {
    date: string
    questions: number
    correct: number
    wrong: number
    blank: number
    minutes: number
  }[]
  onPractice: (topicId: string) => void
  onNavigate: (view: AppView) => void
}

export function StatisticsPage({
  stats,
  attempts,
  activity,
  onPractice,
  onNavigate,
}: StatisticsPageProps) {
  const [now] = useState(() => Date.now())
  const blockStats = getBlockStats(stats)
  const totalPresented = stats.reduce((sum, stat) => sum + stat.presented, 0)
  const totalCorrect = stats.reduce((sum, stat) => sum + stat.correct, 0)
  const totalWrong = stats.reduce((sum, stat) => sum + stat.wrong, 0)
  const totalBlank = stats.reduce((sum, stat) => sum + stat.blank, 0)
  const totalMinutes =
    attempts.reduce((sum, attempt) => sum + attempt.durationSeconds, 0) / 60
  const best = [...stats]
    .filter((stat) => stat.presented >= 3)
    .sort((a, b) => b.accuracy - a.accuracy)[0]
  const weak = [...stats]
    .filter((stat) => stat.status === 'weak' || stat.status === 'review')
    .sort((a, b) => a.accuracy - b.accuracy)[0]
  const recentAttempts = attempts.slice(-8).reverse()

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Analítica de preparación"
        title="Convierte datos en decisiones."
        description="La estadística no te juzga: te dice dónde invertir los próximos 30 minutos."
        action={
          <Button
            icon="play"
            onClick={() => onNavigate('practice')}
            variant="secondary"
          >
            Practicar ahora
          </Button>
        }
      />
      <div className="stats-grid stats-grid-four">
        <div className="stat-card stat-purple">
          <div className="stat-card-top">
            <span>Preguntas</span>
            <span className="stat-icon">
              <Icon name="layers" size={18} />
            </span>
          </div>
          <strong>{totalPresented}</strong>
          <small>{totalCorrect} aciertos</small>
        </div>
        <div className="stat-card stat-teal">
          <div className="stat-card-top">
            <span>Precisión</span>
            <span className="stat-icon">
              <Icon name="target" size={18} />
            </span>
          </div>
          <strong>
            {totalPresented
              ? `${Math.round((totalCorrect / totalPresented) * 100)}%`
              : '—'}
          </strong>
          <small>
            {totalWrong} errores · {totalBlank} blancos
          </small>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-card-top">
            <span>Tiempo</span>
            <span className="stat-icon">
              <Icon name="clock" size={18} />
            </span>
          </div>
          <strong>{Math.round(totalMinutes)}</strong>
          <small>minutos de práctica</small>
        </div>
        <div className="stat-card stat-rose">
          <div className="stat-card-top">
            <span>Sesiones</span>
            <span className="stat-icon">
              <Icon name="trend" size={18} />
            </span>
          </div>
          <strong>{attempts.length}</strong>
          <small>intentos registrados</small>
        </div>
      </div>
      <div className="stats-two-col">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Comparativa</span>
              <h2>Por bloque</h2>
            </div>
            <span className="panel-icon panel-icon-teal">
              <Icon name="chart" size={20} />
            </span>
          </div>
          <div className="block-stats-list">
            {blocks.map((block) => {
              const data = blockStats[block.id]
              const percent = data.answered
                ? Math.round((data.correct / data.answered) * 100)
                : 0
              return (
                <div className="block-stat-row" key={block.id}>
                  <div className="block-stat-label">
                    <span
                      className="block-dot"
                      style={{ background: block.accent }}
                    />
                    <span>
                      <strong>Bloque {block.id}</strong>
                      <small>
                        {block.shortTitle} · {data.answered} respondidas
                      </small>
                    </span>
                    <strong>{data.answered ? `${percent}%` : '—'}</strong>
                  </div>
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
                    value={percent}
                  />
                </div>
              )
            })}
          </div>
        </section>
        <section className="panel insight-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Lectura rápida</span>
              <h2>Dos señales</h2>
            </div>
            <span className="panel-icon panel-icon-orange">
              <Icon name="trend" size={20} />
            </span>
          </div>
          <div className="insight">
            <span className="insight-label good">Tu fortaleza</span>
            <strong>
              {best
                ? topics.find((topic) => topic.id === best.topicId)?.focus
                : 'Aún sin datos'}
            </strong>
            <small>
              {best
                ? `${Math.round(best.accuracy * 100)}% de acierto en ${best.presented} respuestas`
                : 'Completa una práctica para detectar tu ventaja'}
            </small>
          </div>
          <div className="insight">
            <span className="insight-label warn">Siguiente foco</span>
            <strong>
              {weak
                ? topics.find((topic) => topic.id === weak.topicId)?.focus
                : 'Constancia'}
            </strong>
            <small>
              {weak
                ? `${Math.round(weak.accuracy * 100)}% de acierto · vuelve a practicarlo`
                : 'Un test diario mantiene viva la ventaja'}
            </small>
            <Button
              icon="play"
              onClick={() => weak && onPractice(weak.topicId)}
              variant="soft"
            >
              Entrenar foco
            </Button>
          </div>
        </section>
      </div>
      <section className="panel topic-performance">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Detalle</span>
            <h2>Rendimiento por tema</h2>
          </div>
          <span className="muted-copy">Ordenado por necesidad de repaso</span>
        </div>
        <div className="performance-table">
          <div className="performance-head">
            <span>Tema</span>
            <span>Estado</span>
            <span>Respuestas</span>
            <span>Precisión</span>
            <span />
          </div>
          {[...stats]
            .sort(
              (a, b) => a.accuracy - b.accuracy || a.presented - b.presented,
            )
            .map((stat) => {
              const topic = topics.find((item) => item.id === stat.topicId)
              const percent = stat.presented
                ? Math.round(stat.accuracy * 100)
                : 0
              return (
                <div className="performance-row" key={stat.topicId}>
                  <span className="performance-topic">
                    <b>
                      {topic?.blockId} ·{' '}
                      {topic?.number.toString().padStart(2, '0')}
                    </b>
                    <span>{topic?.focus}</span>
                  </span>
                  <span>
                    <Tag
                      tone={
                        stat.status === 'weak'
                          ? 'danger'
                          : stat.status === 'review'
                            ? 'warning'
                            : stat.status === 'untouched'
                              ? 'neutral'
                              : 'success'
                      }
                    >
                      {stat.status === 'untouched'
                        ? 'Sin empezar'
                        : stat.status === 'weak'
                          ? 'Débil'
                          : stat.status === 'review'
                            ? 'Repaso'
                            : stat.status === 'strong'
                              ? 'Fuerte'
                              : 'En marcha'}
                    </Tag>
                  </span>
                  <span>{stat.presented}</span>
                  <span className="performance-progress">
                    <ProgressBar
                      tone={stat.status === 'weak' ? 'rose' : 'teal'}
                      value={percent}
                    />
                    <small>{percent}%</small>
                  </span>
                  <button
                    className="row-action"
                    onClick={() => onPractice(stat.topicId)}
                    type="button"
                  >
                    <Icon name="play" size={14} />
                  </button>
                </div>
              )
            })}
        </div>
      </section>
      <section className="panel trend-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Ritmo</span>
            <h2>Actividad reciente</h2>
          </div>
          <Tag tone="neutral">{activity.length} días</Tag>
        </div>
        <div className="large-activity-chart">
          {Array.from({ length: Math.max(14, activity.length) }, (_, index) => {
            const date = new Date(
              now - (Math.max(14, activity.length) - 1 - index) * 86400000,
            )
            const key = date.toISOString().slice(0, 10)
            const day = activity.find((item) => item.date === key)
            const value = day?.questions ?? 0
            return (
              <div key={key}>
                <div className="large-bar-wrap">
                  <span style={{ height: `${Math.max(4, value * 4)}%` }} />
                </div>
                <small>{date.getDate()}</small>
              </div>
            )
          })}
        </div>
      </section>
      {recentAttempts.length ? (
        <section className="panel history-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Registro</span>
              <h2>Intentos recientes</h2>
            </div>
          </div>
          <div className="attempt-table">
            {recentAttempts.map((attempt) => (
              <button
                className="attempt-row"
                key={attempt.id}
                onClick={() => onNavigate('results')}
                type="button"
              >
                <span className="attempt-icon">
                  <Icon
                    name={attempt.mode === 'exam' ? 'clipboard' : 'play'}
                    size={16}
                  />
                </span>
                <span className="attempt-name">
                  <strong>{attempt.title}</strong>
                  <small>
                    {new Intl.DateTimeFormat('es-ES', {
                      dateStyle: 'short',
                    }).format(new Date(attempt.completedAt))}
                  </small>
                </span>
                <span
                  className={`attempt-status ${attempt.scores.every((score) => score.passed) ? 'status-good' : 'status-warn'}`}
                >
                  {attempt.scores
                    .reduce((sum, score) => sum + score.estimated, 0)
                    .toFixed(1)
                    .replace('.', ',')}{' '}
                  / 100
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          description="Tus métricas aparecerán después de la primera sesión."
          icon="chart"
          title="Aún no hay suficientes datos"
        />
      )}
    </div>
  )
}
