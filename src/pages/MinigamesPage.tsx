import { useMemo, useState } from 'react'
import type {
  AppView,
  BlockId,
  MinigameType,
  TrainerSession,
} from '../domain/types'
import { blocks, topics } from '../data/syllabus'
import { activeQuestions, questionsByBlock } from '../data/questions'
import {
  getMinigameQuestionCount,
  type MinigameOptions,
} from '../lib/minigames'
import { Icon, type IconName } from '../components/Icons'
import { Button, PageHeader, Tag } from '../components/UI'

interface MinigamesPageProps {
  weakTopicIds?: string[]
  reviewTopicIds?: string[]
  activeSession?: TrainerSession | null
  onStart: (options: MinigameOptions) => void
  onNavigate: (view: AppView) => void
}

type BlockFilter = BlockId | 'all'

interface GameCard {
  type: MinigameType
  title: string
  description: string
  detail: string
  icon: IconName
  tone: 'purple' | 'teal' | 'orange'
}

const gameCards: GameCard[] = [
  {
    type: 'flashcards',
    title: 'Flashcards',
    description: 'Repasa fundamentos con un ritmo que puedes mantener.',
    detail: '12 preguntas · sin límite',
    icon: 'layers',
    tone: 'purple',
  },
  {
    type: 'speedrun',
    title: 'Speedrun',
    description: 'Responde contra el reloj y conserva la racha.',
    detail: '20 preguntas · 60 segundos',
    icon: 'clock',
    tone: 'teal',
  },
  {
    type: 'weakness',
    title: 'Debilidades',
    description: 'Convierte tus temas flojos en el siguiente objetivo.',
    detail: '10 preguntas · foco personal',
    icon: 'target',
    tone: 'orange',
  },
]

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

export function MinigamesPage({
  weakTopicIds = [],
  reviewTopicIds = [],
  activeSession = null,
  onStart,
  onNavigate,
}: MinigamesPageProps) {
  const [selectedType, setSelectedType] = useState<MinigameType>('flashcards')
  const [count, setCount] = useState(12)
  const [blockId, setBlockId] = useState<BlockFilter>('all')
  const weakIds = useMemo(() => unique(weakTopicIds), [weakTopicIds])
  const reviewIds = useMemo(() => unique(reviewTopicIds), [reviewTopicIds])
  const weaknessIds = useMemo(() => {
    const ids = unique([...weakIds, ...reviewIds])
    if (blockId === 'all') return ids
    return ids.filter((id) => {
      const topic = topics.find((item) => item.id === id)
      return topic?.blockId === blockId
    })
  }, [blockId, reviewIds, weakIds])
  const selectedCard =
    gameCards.find((card) => card.type === selectedType) ?? gameCards[0]
  const countOptions = selectedType === 'speedrun' ? [10, 20] : [5, 10, 12]
  const availableQuestions =
    blockId === 'all' ? activeQuestions : questionsByBlock[blockId]
  const availableForSelection =
    selectedType === 'weakness' && weaknessIds.length
      ? availableQuestions.filter((question) =>
          weaknessIds.includes(question.topicId),
        )
      : availableQuestions
  const plannedCount = Math.min(count, availableForSelection.length)
  const topicLabel = (id: string) =>
    topics.find((topic) => topic.id === id)?.focus ?? id

  const start = () => {
    if (activeSession) {
      onNavigate(
        activeSession.mode === 'minigame'
          ? 'minigames'
          : activeSession.mode === 'exam'
            ? 'exam'
            : 'practice',
      )
      return
    }
    onStart({
      type: selectedType,
      count,
      blockId: blockId === 'all' ? undefined : blockId,
      topicIds:
        selectedType === 'weakness' && weaknessIds.length
          ? weaknessIds
          : undefined,
    })
  }

  return (
    <div className="page-stack minigames-page">
      <PageHeader
        eyebrow="Centro de minijuegos"
        title="Minijuegos para practicar."
        description="Elige un reto, concentra la atención y convierte cada respuesta en una señal para tu práctica."
        action={
          <Tag tone="purple">
            <Icon name="shield" size={13} /> Banco propio
          </Tag>
        }
      />
      <div className="minigame-intro">
        <div className="minigame-intro-icon">
          <Icon name="grid" size={24} />
        </div>
        <div>
          <strong>Tres formas de practicar sin cambiar tu progreso.</strong>
          <p>
            Los minijuegos usan preguntas propias del banco activo, guardan sus
            respuestas y actualizan tus repasos como el resto de la app.
          </p>
        </div>
        <Button
          icon="play"
          onClick={() => onNavigate('practice')}
          variant="secondary"
        >
          Ir a práctica
        </Button>
      </div>
      {activeSession ? (
        <button
          className="minigame-resume-banner"
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
          <span>
            <Icon name="clock" size={18} />
          </span>
          <div>
            <strong>Tienes una sesión activa</strong>
            <small>{activeSession.title} · vuelve a tu recorrido</small>
          </div>
          <Icon name="arrow" size={17} />
        </button>
      ) : null}
      <section className="minigame-games-section">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Elige tu ritmo</span>
            <h2>Un minijuego para cada momento</h2>
          </div>
          <span className="muted-copy">
            Preguntas de práctica, no oficiales
          </span>
        </div>
        <div className="minigame-card-grid">
          {gameCards.map((card) => (
            <button
              aria-label={card.title}
              aria-pressed={selectedType === card.type}
              className={`minigame-card minigame-card-${card.tone} ${selectedType === card.type ? 'is-selected' : ''}`}
              key={card.type}
              onClick={() => {
                setSelectedType(card.type)
                setCount(getMinigameQuestionCount(card.type))
              }}
              type="button"
            >
              <span className="minigame-card-icon">
                <Icon name={card.icon} size={23} />
              </span>
              <span className="minigame-card-copy">
                <strong>{card.title}</strong>
                <span>{card.description}</span>
                <small>{card.detail}</small>
              </span>
              <span className="minigame-card-arrow">
                <Icon name="arrow" size={17} />
              </span>
            </button>
          ))}
        </div>
      </section>
      <div className="minigame-config-grid">
        <section className="panel minigame-config-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Configura el reto</span>
              <h2>{selectedCard?.title}</h2>
            </div>
            <span
              aria-label="Cantidad de preguntas"
              className="minigame-count-badge"
            >
              Cantidad · {count} preguntas
            </span>
          </div>
          <label className="field-label minigame-select-label">
            Bloque del temario
            <select
              aria-label="Bloque del temario"
              onChange={(event) =>
                setBlockId(event.target.value as BlockFilter)
              }
              value={blockId}
            >
              <option value="all">Todos los bloques</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  Bloque {block.id} · {block.shortTitle}
                </option>
              ))}
            </select>
          </label>
          <div className="field-label minigame-select-label">
            Cantidad de preguntas
            <div className="segmented minigame-count-options">
              {countOptions.map((value) => (
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
          <div className="minigame-selection-note">
            <Icon name="info" size={16} />
            <span>
              {selectedType === 'speedrun'
                ? `Tienes 60 segundos para responder ${count} preguntas. Al llegar a cero se envía automáticamente.`
                : selectedType === 'flashcards'
                  ? 'Sin límite de tiempo: lee la explicación antes de continuar.'
                  : 'La ronda prioriza los temas débiles y los que están esperando repaso.'}
            </span>
          </div>
          <Button
            className="full-button"
            disabled={plannedCount === 0 && !activeSession}
            icon="play"
            onClick={start}
          >
            {activeSession
              ? 'Volver a la sesión activa'
              : `Comenzar ${selectedCard?.title.toLowerCase() ?? 'minijuego'}`}
          </Button>
          {plannedCount < count && !activeSession ? (
            <small className="minigame-availability">
              Hay {plannedCount} preguntas disponibles con este filtro; no se
              repetirán.
            </small>
          ) : null}
        </section>
        <aside className="minigame-focus-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Foco recomendado</span>
              <h2>Debilidades y repasos</h2>
            </div>
            <span className="panel-icon panel-icon-orange">
              <Icon name="target" size={20} />
            </span>
          </div>
          <div className="minigame-focus-group">
            <div className="minigame-focus-head">
              <strong>Temas débiles</strong>
              <Tag tone="danger">{weakIds.length}</Tag>
            </div>
            <p>
              {weakIds.length
                ? weakIds.slice(0, 4).map(topicLabel).join(' · ')
                : 'Aún no hay temas débiles registrados.'}
            </p>
            {weakIds.length ? (
              <small>Foco automático del próximo reto</small>
            ) : null}
          </div>
          <div className="minigame-focus-group">
            <div className="minigame-focus-head">
              <strong>Repasos pendientes</strong>
              <Tag tone="warning">{reviewIds.length}</Tag>
            </div>
            <p>
              {reviewIds.length
                ? reviewIds.slice(0, 4).map(topicLabel).join(' · ')
                : 'No hay repasos pendientes.'}
            </p>
            {reviewIds.length ? (
              <small>Incluidos en la ronda de debilidades</small>
            ) : null}
          </div>
          <Button
            disabled={plannedCount === 0 && !activeSession}
            icon="target"
            onClick={() => {
              if (activeSession) {
                onNavigate(
                  activeSession.mode === 'minigame'
                    ? 'minigames'
                    : activeSession.mode === 'exam'
                      ? 'exam'
                      : 'practice',
                )
                return
              }
              setSelectedType('weakness')
              onStart({
                type: 'weakness',
                blockId: blockId === 'all' ? undefined : blockId,
                topicIds: weaknessIds.length ? weaknessIds : undefined,
              })
            }}
            variant="soft"
          >
            Crear ronda de debilidades
          </Button>
          <small className="minigame-focus-foot">
            Se registrarán también en tu progreso y en la cola de repasos.
          </small>
        </aside>
      </div>
      <div className="minigame-disclaimer">
        <Icon name="shield" size={18} />
        <p>
          Estas preguntas son material propio de práctica y las explicaciones
          son pedagógicas. No son preguntas oficiales ni representan un examen
          oficial.
        </p>
      </div>
    </div>
  )
}
