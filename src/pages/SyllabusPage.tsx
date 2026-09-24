import { useMemo, useState } from 'react'
import type { BlockId, TopicStat } from '../domain/types'
import { blocks, OFFICIAL_BOE_URL, topics } from '../data/syllabus'
import { activeQuestions } from '../data/questions'
import { Icon } from '../components/Icons'
import { PageHeader, ProgressBar, Tag } from '../components/UI'

interface SyllabusPageProps {
  stats: TopicStat[]
  onStart: (topicId: string, blockId: BlockId) => void
}

export function SyllabusPage({ stats, onStart }: SyllabusPageProps) {
  const [openBlocks, setOpenBlocks] = useState<BlockId[]>(['I'])
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('es')
    if (!value) return topics
    return topics.filter((topic) =>
      `${topic.title} ${topic.focus}`.toLocaleLowerCase('es').includes(value),
    )
  }, [query])
  const toggleBlock = (block: BlockId) =>
    setOpenBlocks((current) =>
      current.includes(block)
        ? current.filter((item) => item !== block)
        : [...current, block],
    )

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`Programa oficial · ${topics.length} temas`}
        title="El temario, sin perder el hilo."
        description="Cada tema está conectado a preguntas, práctica y seguimiento. Los títulos reproducen la convocatoria de referencia."
        action={
          <a
            className="source-link"
            href={OFFICIAL_BOE_URL}
            rel="noreferrer"
            target="_blank"
          >
            Ver BOE <Icon name="arrow" size={14} />
          </a>
        }
      />
      <div className="syllabus-toolbar">
        <div className="search-box">
          <Icon name="search" size={18} />
          <input
            aria-label="Buscar en el temario"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar un tema, protocolo o concepto..."
            value={query}
          />
        </div>
        <div className="legend">
          <span>
            <i className="legend-dot dot-purple" /> Sin empezar
          </span>
          <span>
            <i className="legend-dot dot-teal" /> En progreso
          </span>
          <span>
            <i className="legend-dot dot-orange" /> Repaso
          </span>
        </div>
      </div>
      <div className="syllabus-summary">
        <div>
          <strong>4</strong>
          <span>bloques</span>
        </div>
        <div>
          <strong>{topics.length}</strong>
          <span>temas oficiales</span>
        </div>
        <div>
          <strong>{activeQuestions.length}</strong>
          <span>preguntas propias</span>
        </div>
        <div className="summary-note">
          <Icon name="info" size={16} />
          <span>
            La distribución de la parte 1 no está publicada por bloque. La app
            usa una orientación para el simulacro.
          </span>
        </div>
      </div>
      <div className="syllabus-list">
        {blocks.map((block) => {
          const blockTopics = filtered.filter(
            (topic) => topic.blockId === block.id,
          )
          const done = topics.filter(
            (topic) =>
              topic.blockId === block.id &&
              (stats.find((stat) => stat.topicId === topic.id)?.presented ??
                0) > 0,
          ).length
          const isOpen = openBlocks.includes(block.id)
          return (
            <section
              className={`syllabus-block block-outline-${block.id.toLowerCase()}`}
              key={block.id}
            >
              <button
                className="block-header"
                onClick={() => toggleBlock(block.id)}
                type="button"
                aria-expanded={isOpen}
              >
                <span
                  className="block-index"
                  style={{ background: block.accent }}
                >
                  {block.id}
                </span>
                <span className="block-header-copy">
                  <strong>{block.title}</strong>
                  <small>
                    {
                      topics.filter((topic) => topic.blockId === block.id)
                        .length
                    }{' '}
                    temas · {done} con actividad
                  </small>
                </span>
                <span className="block-header-progress">
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
                    value={
                      (done /
                        topics.filter((topic) => topic.blockId === block.id)
                          .length) *
                      100
                    }
                  />
                  <Icon name={isOpen ? 'chevron' : 'arrow'} size={17} />
                </span>
              </button>
              {isOpen ? (
                <div className="topic-list">
                  {blockTopics.length ? (
                    blockTopics.map((topic) => {
                      const stat = stats.find(
                        (item) => item.topicId === topic.id,
                      )
                      const status =
                        !stat || stat.presented === 0
                          ? 'new'
                          : stat.status === 'weak' || stat.status === 'review'
                            ? 'due'
                            : 'done'
                      return (
                        <article className="topic-row" key={topic.id}>
                          <span className={`topic-status status-${status}`}>
                            {status === 'new'
                              ? '—'
                              : status === 'due'
                                ? '!'
                                : '✓'}
                          </span>
                          <span className="topic-number">
                            {topic.number.toString().padStart(2, '0')}
                          </span>
                          <span className="topic-copy">
                            <strong>{topic.title}</strong>
                            <small>{topic.focus}</small>
                          </span>
                          <span className="topic-score">
                            {stat && stat.presented > 0
                              ? `${Math.round(stat.accuracy * 100)}%`
                              : '—'}
                          </span>
                          <button
                            className="topic-practice"
                            onClick={() => onStart(topic.id, block.id)}
                            type="button"
                            aria-label={`Practicar ${topic.title}`}
                          >
                            <Icon name="play" size={14} />
                          </button>
                        </article>
                      )
                    })
                  ) : (
                    <div className="no-results">
                      No hay temas que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
      <div className="official-note">
        <Icon name="shield" size={19} />
        <div>
          <strong>Fuente normativa y aviso</strong>
          <p>
            El temario y el formato se basan en la convocatoria publicada en el
            BOE. El banco de preguntas es propio, práctico y no oficial; revisa
            el texto vigente antes de estudiar una norma.
          </p>
          <a href={OFFICIAL_BOE_URL} rel="noreferrer" target="_blank">
            Abrir texto oficial <Icon name="arrow" size={13} />
          </a>
        </div>
        <Tag tone="purple">Convocatoria 2025</Tag>
      </div>
    </div>
  )
}
