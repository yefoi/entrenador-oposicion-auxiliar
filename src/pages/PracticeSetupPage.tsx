import { useMemo, useState } from 'react'
import type { AppView, BlockId, TopicStat } from '../domain/types'
import type { PracticeOptions } from '../lib/session'
import { blocks, topics } from '../data/syllabus'
import {
  activeQuestions,
  questionsByBlock,
  questionsByTopic,
} from '../data/questions'
import { Icon } from '../components/Icons'
import { Button, PageHeader } from '../components/UI'
import { searchQuestions } from '../lib/search'

interface PracticeSetupPageProps {
  stats: TopicStat[]
  adaptiveQuestionIds: string[]
  showExplanations: boolean
  onStart: (options: PracticeOptions) => void
  initialTopicId?: string
  initialBlockId?: BlockId
  onNavigate: (view: AppView) => void
}

type Focus = 'all' | 'weak' | 'due' | 'adaptive' | 'search'

export function PracticeSetupPage({
  stats,
  adaptiveQuestionIds,
  showExplanations,
  onStart,
  initialTopicId,
  initialBlockId,
  onNavigate,
}: PracticeSetupPageProps) {
  const [scope, setScope] = useState<'mixed' | 'block' | 'topic'>(
    initialTopicId ? 'topic' : initialBlockId ? 'block' : 'mixed',
  )
  const [blockId, setBlockId] = useState<BlockId>(initialBlockId ?? 'III')
  const [topicId, setTopicId] = useState(initialTopicId ?? topics[0]?.id ?? '')
  const [count, setCount] = useState(10)
  const [focus, setFocus] = useState<Focus>('all')
  const [immediate, setImmediate] = useState(showExplanations)
  const [query, setQuery] = useState('')
  const [textQuery, setTextQuery] = useState('')

  const available = useMemo(() => {
    if (scope === 'topic') return questionsByTopic.get(topicId) ?? []
    if (scope === 'block') return questionsByBlock[blockId]
    return activeQuestions
  }, [scope, blockId, topicId])
  const textMatches = useMemo(
    () => searchQuestions(available, textQuery),
    [available, textQuery],
  )
  const effectiveAvailable = useMemo(() => {
    if (focus === 'search') {
      return textMatches.map((match) => match.question)
    }
    if (focus === 'adaptive') {
      return available.filter((question) =>
        adaptiveQuestionIds.includes(question.id),
      )
    }
    if (focus === 'weak' || focus === 'due') {
      const matchingTopics = new Set(
        stats
          .filter((item) =>
            focus === 'weak'
              ? item.status === 'weak'
              : item.status === 'review',
          )
          .map((item) => item.topicId),
      )
      return available.filter((question) =>
        matchingTopics.has(question.topicId),
      )
    }
    return available
  }, [adaptiveQuestionIds, available, focus, stats, textMatches])
  const availableTopics = useMemo(
    () =>
      topics.filter((topic) =>
        `${topic.title} ${topic.focus}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  )
  const statFor = (id: string) => stats.find((item) => item.topicId === id)
  const selectedStat = scope === 'topic' ? statFor(topicId) : undefined

  const start = () => {
    onStart({
      count,
      immediateFeedback: immediate,
      blockIds: scope === 'block' ? [blockId] : undefined,
      questionIds:
        focus === 'adaptive' || focus === 'search'
          ? effectiveAvailable.map((question) => question.id)
          : undefined,
      selectionStrategy: focus === 'adaptive' ? 'adaptive' : 'random',
      topicIds:
        focus === 'adaptive' || focus === 'search'
          ? undefined
          : scope === 'topic'
            ? [topicId]
            : focus === 'weak'
              ? stats
                  .filter((item) => item.status === 'weak')
                  .map((item) => item.topicId)
              : focus === 'due'
                ? stats
                    .filter((item) => item.status === 'review')
                    .map((item) => item.topicId)
                : undefined,
      title:
        focus === 'adaptive'
          ? 'Práctica adaptativa'
          : focus === 'search'
            ? `Búsqueda · ${textQuery.trim()}`
            : scope === 'topic'
              ? `Práctica · ${topics.find((topic) => topic.id === topicId)?.focus ?? 'Tema'}`
              : scope === 'block'
                ? `Práctica · Bloque ${blockId}`
                : 'Práctica mixta',
    })
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Centro de práctica"
        title="Entrena lo que sabes. Descubre lo que no."
        description="Una sesión corta, con explicación inmediata, convierte el error en información."
        action={
          <div className="bank-counter">
            <Icon name="layers" size={17} />
            <strong>{activeQuestions.length}</strong>
            <span>preguntas activas</span>
          </div>
        }
      />
      <div className="practice-layout">
        <section className="panel setup-panel">
          <div className="setup-step">
            <span className="step-number">1</span>
            <div>
              <h2>¿Qué quieres entrenar?</h2>
              <p>Elige el alcance de esta sesión.</p>
            </div>
          </div>
          <div className="scope-tabs" role="tablist">
            <button
              className={scope === 'mixed' ? 'is-active' : ''}
              onClick={() => setScope('mixed')}
              type="button"
            >
              Mixto
            </button>
            <button
              className={scope === 'block' ? 'is-active' : ''}
              onClick={() => setScope('block')}
              type="button"
            >
              Por bloque
            </button>
            <button
              className={scope === 'topic' ? 'is-active' : ''}
              onClick={() => setScope('topic')}
              type="button"
            >
              Por tema
            </button>
          </div>
          {scope === 'block' ? (
            <div className="choice-grid">
              {blocks.map((block) => (
                <button
                  className={`choice-card ${blockId === block.id ? 'is-selected' : ''}`}
                  key={block.id}
                  onClick={() => setBlockId(block.id)}
                  type="button"
                >
                  <span
                    className="choice-id"
                    style={{ background: block.accent }}
                  >
                    {block.id}
                  </span>
                  <strong>{block.shortTitle}</strong>
                  <small>{questionsByBlock[block.id].length} preguntas</small>
                </button>
              ))}
            </div>
          ) : null}
          {scope === 'topic' ? (
            <>
              <div className="search-box compact">
                <Icon name="search" size={17} />
                <input
                  aria-label="Buscar tema"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar tema..."
                  value={query}
                />
              </div>
              <div className="topic-picker">
                {availableTopics.length ? (
                  availableTopics.map((topic) => {
                    const stat = statFor(topic.id)
                    return (
                      <button
                        className={`topic-pick ${topicId === topic.id ? 'is-selected' : ''}`}
                        key={topic.id}
                        onClick={() => setTopicId(topic.id)}
                        type="button"
                      >
                        <span>
                          {topic.blockId} ·{' '}
                          {topic.number.toString().padStart(2, '0')}
                        </span>
                        <strong>{topic.focus}</strong>
                        <small>{stat?.presented ?? 0} respuestas</small>
                      </button>
                    )
                  })
                ) : (
                  <p className="empty-hint" role="status">
                    Ningún tema coincide con «{query.trim()}». Limpia la
                    búsqueda para ver los 33 temas.
                  </p>
                )}
              </div>
            </>
          ) : null}
          <div className="setup-step second-step">
            <span className="step-number">2</span>
            <div>
              <h2>¿Qué ritmo buscas?</h2>
              <p>Ajusta la presión para programar el hábito.</p>
            </div>
          </div>
          <div className="option-row">
            <span className="option-label">
              <strong>Preguntas</strong>
              <small>Duración aproximada de la sesión</small>
            </span>
            <div className="segmented">
              {[5, 10, 20, 30].map((value) => (
                <button
                  className={count === value ? 'is-active' : ''}
                  key={value}
                  onClick={() => setCount(value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="option-row">
            <span className="option-label">
              <strong>Enfoque</strong>
              <small>Prioriza lo que más necesitas</small>
            </span>
            <div className="segmented text-segments">
              <button
                className={focus === 'all' ? 'is-active' : ''}
                onClick={() => setFocus('all')}
                type="button"
              >
                Todo
              </button>
              <button
                className={focus === 'weak' ? 'is-active' : ''}
                onClick={() => setFocus('weak')}
                type="button"
              >
                Débiles
              </button>
              <button
                className={focus === 'due' ? 'is-active' : ''}
                onClick={() => setFocus('due')}
                type="button"
              >
                Repaso
              </button>
              <button
                className={focus === 'adaptive' ? 'is-active' : ''}
                onClick={() => setFocus('adaptive')}
                type="button"
              >
                Adaptativo
              </button>
              <button
                className={focus === 'search' ? 'is-active' : ''}
                onClick={() => setFocus('search')}
                type="button"
              >
                Texto
              </button>
            </div>
            {focus === 'adaptive' ? (
              <p className="adaptive-note">
                Prioriza preguntas nuevas, errores recientes, temas débiles y
                repasos vencidos, manteniendo equilibrio entre bloques.
              </p>
            ) : null}
            {focus === 'search' ? (
              <div className="search-focus">
                <div className="search-box">
                  <Icon name="search" size={17} />
                  <input
                    aria-label="Buscar en el texto de las preguntas"
                    onChange={(event) => setTextQuery(event.target.value)}
                    placeholder="Ej.: firma electrónica, TCP, normalización..."
                    type="search"
                    value={textQuery}
                  />
                </div>
                {textQuery.trim() ? (
                  textMatches.length ? (
                    <p className="adaptive-note" role="status">
                      {textMatches.length}{' '}
                      {textMatches.length === 1
                        ? 'coincidencia'
                        : 'coincidencias'}{' '}
                      en{' '}
                      {scope === 'mixed'
                        ? 'todo el banco'
                        : 'el alcance elegido'}
                      . La búsqueda ignora mayúsculas y tildes.
                    </p>
                  ) : (
                    <p className="empty-hint" role="status">
                      Sin coincidencias para «{textQuery.trim()}». Prueba con
                      otra palabra o amplía el alcance.
                    </p>
                  )
                ) : (
                  <p className="adaptive-note">
                    Busca en el enunciado, las opciones, la explicación y el
                    nombre del tema.
                  </p>
                )}
              </div>
            ) : null}
          </div>
          <label className="toggle-row">
            <span>
              <strong>Explicación inmediata</strong>
              <small>Resolver y entender antes de avanzar</small>
            </span>
            <input
              checked={immediate}
              onChange={(event) => setImmediate(event.target.checked)}
              type="checkbox"
            />
            <span className="toggle-ui" />
          </label>
          <div className="setup-footer">
            <div className="availability">
              <span
                className={
                  effectiveAvailable.length >= count ? 'ok-dot' : 'warn-dot'
                }
              />
              <strong>{Math.min(effectiveAvailable.length, count)}</strong>{' '}
              preguntas disponibles
              {selectedStat ? (
                <small>
                  {' '}
                  · {Math.round(selectedStat.accuracy * 100)}% de acierto previo
                </small>
              ) : null}
            </div>
            <Button
              disabled={effectiveAvailable.length === 0}
              onClick={start}
              icon="play"
            >
              Comenzar práctica
            </Button>
          </div>
        </section>
        <aside className="practice-aside">
          <div className="tip-card">
            <span className="tip-icon">
              <Icon name="spark" size={19} />
            </span>
            <h3>La regla del error</h3>
            <p>
              En el examen cada fallo resta <strong>1/3</strong> de un acierto.
              Practica con esa presión desde el primer día.
            </p>
            <button
              className="link-button"
              onClick={() => onNavigate('exam')}
              type="button"
            >
              Ver simulacro <Icon name="arrow" size={14} />
            </button>
          </div>
          <div className="quick-blocks">
            <span className="section-kicker">Accesos rápidos</span>
            {blocks.map((block) => (
              <button
                key={block.id}
                onClick={() => {
                  setScope('block')
                  setBlockId(block.id)
                }}
                type="button"
              >
                <i style={{ background: block.accent }} />
                <span>{block.shortTitle}</span>
                <small>{questionsByBlock[block.id].length}</small>
                <Icon name="arrow" size={14} />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
