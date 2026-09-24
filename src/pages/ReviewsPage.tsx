import { useState } from 'react'
import type { AppView, TopicReview, TopicStat } from '../domain/types'
import { topics } from '../data/syllabus'
import { Icon } from '../components/Icons'
import {
  Button,
  EmptyState,
  PageHeader,
  ProgressBar,
  Tag,
} from '../components/UI'

interface ReviewsPageProps {
  reviewQueue: TopicReview[]
  allReviews: TopicReview[]
  stats: TopicStat[]
  onStart: (topicIds: string[], count: number) => void
  onNavigate: (view: AppView) => void
}

const levelLabels = [
  'Nuevo',
  '1 día',
  '3 días',
  '7 días',
  '14 días',
  '30 días',
  '60 días',
]

export function ReviewsPage({
  reviewQueue,
  allReviews,
  stats,
  onStart,
  onNavigate,
}: ReviewsPageProps) {
  const [now] = useState(() => Date.now())
  const dueIds = reviewQueue.map((review) => review.topicId)
  const dueStats = stats.filter((stat) => dueIds.includes(stat.topicId))
  const upcoming = allReviews.filter(
    (review) => new Date(review.dueAt).getTime() > now,
  )

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Repaso espaciado"
        title="Volver justo a tiempo."
        description="El sistema Leitner programa cada tema: un acierto aumenta el intervalo; un error vuelve al inicio."
        action={
          <Button
            disabled={!dueIds.length}
            icon="refresh"
            onClick={() =>
              onStart(dueIds, Math.min(20, Math.max(5, dueIds.length * 2)))
            }
          >
            Empezar repaso
          </Button>
        }
      />
      <div className="review-hero">
        <div className="review-hero-icon">
          <Icon name="refresh" size={25} />
        </div>
        <div>
          <span className="section-kicker">Cola de hoy</span>
          <h2>
            {dueIds.length
              ? `${dueIds.length} temas esperan tu repaso`
              : 'Tu memoria está al día'}
          </h2>
          <p>
            {dueIds.length
              ? 'No los estudies de nuevo desde cero: recupera el recuerdo y corrige lo que se desvanecía.'
              : 'Aprovecha para hacer un test mixto o avanzar en un tema nuevo.'}
          </p>
        </div>
        <div className="review-hero-score">
          <strong>
            {dueStats.length
              ? `${Math.round((dueStats.filter((item) => item.status !== 'weak').length / dueStats.length) * 100)}%`
              : '—'}
          </strong>
          <span>en marcha</span>
        </div>
      </div>
      {dueIds.length ? (
        <section className="panel due-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Vencen ahora</span>
              <h2>Repaso prioritario</h2>
            </div>
            <Tag tone="warning">Leitner activo</Tag>
          </div>
          <div className="due-list">
            {reviewQueue.map((review) => {
              const topic = topics.find((item) => item.id === review.topicId)
              const stat = stats.find((item) => item.topicId === review.topicId)
              if (!topic) return null
              return (
                <div className="due-row" key={review.topicId}>
                  <span className="due-index">
                    {topic.blockId} · {topic.number.toString().padStart(2, '0')}
                  </span>
                  <span className="due-copy">
                    <strong>{topic.focus}</strong>
                    <small>
                      {stat?.presented ?? 0} respuestas ·{' '}
                      {Math.round((stat?.accuracy ?? 0) * 100)}% de acierto
                    </small>
                  </span>
                  <span className="level-track">
                    <i
                      style={{
                        width: `${((review.level + 1) / levelLabels.length) * 100}%`,
                      }}
                    />
                    <small>Nivel {review.level + 1}</small>
                  </span>
                  <button
                    className="review-start"
                    onClick={() => onStart([review.topicId], 5)}
                    type="button"
                  >
                    <Icon name="play" size={14} /> Repasar
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="panel empty-review">
          <EmptyState
            description="Cuando responds una práctica, los temas que necesiten refuerzo aparecerán aquí automáticamente."
            icon="refresh"
            title="No hay repasos pendientes"
            action={
              <Button
                icon="play"
                onClick={() => onNavigate('practice')}
                variant="secondary"
              >
                Hacer una práctica
              </Button>
            }
          />
        </section>
      )}
      <section className="panel leiniter-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Cómo funciona</span>
            <h2>Intervalos de memoria</h2>
          </div>
          <span className="panel-icon panel-icon-purple">
            <Icon name="trend" size={20} />
          </span>
        </div>
        <div className="interval-flow">
          {levelLabels.slice(0, 6).map((label, index) => (
            <div className="interval-step" key={label}>
              <span className={index === 0 ? 'is-active' : ''}>
                {index + 1}
              </span>
              <strong>{label}</strong>
              <small>{index === 0 ? 'tras fallo' : 'tras acierto'}</small>
            </div>
          ))}
        </div>
        <div className="review-tip">
          <Icon name="spark" size={17} />
          <p>
            No marques una respuesta como aprendida por haberla leído: el repaso
            solo avanza cuando vuelves a responder.
          </p>
        </div>
      </section>
      {upcoming.length ? (
        <section className="panel upcoming-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Próximos</span>
              <h2>Lo que viene después</h2>
            </div>
          </div>
          <div className="upcoming-list">
            {upcoming.slice(0, 6).map((review) => {
              const topic = topics.find((item) => item.id === review.topicId)
              return (
                <div key={review.topicId}>
                  <span>{topic?.focus}</span>
                  <ProgressBar
                    tone="purple"
                    value={Math.max(
                      5,
                      Math.min(100, ((review.level + 1) / 6) * 100),
                    )}
                  />
                  <small>
                    {new Intl.DateTimeFormat('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    }).format(new Date(review.dueAt))}
                  </small>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
