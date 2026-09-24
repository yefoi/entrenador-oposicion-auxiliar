import { useMemo, useState } from 'react'
import type { AppView, Attempt, Question } from '../domain/types'
import { formatDirect, overallScore } from '../lib/scoring'
import { topics } from '../data/syllabus'
import { Icon } from '../components/Icons'
import {
  Button,
  EmptyState,
  PageHeader,
  ProgressBar,
  ScorePill,
  Tag,
} from '../components/UI'

interface ResultsPageProps {
  attempt: Attempt | null
  questionById: Map<string, Question>
  onBack: () => void
  onPracticeWrong: (questionIds: string[]) => void
  onNavigate: (view: AppView) => void
}

type ReviewFilter = 'all' | 'wrong' | 'blank' | 'flagged'

export function ResultsPage({
  attempt,
  questionById,
  onBack,
  onPracticeWrong,
  onNavigate,
}: ResultsPageProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const wrongIds = useMemo(
    () =>
      attempt?.questions
        .filter((entry) => {
          const answer = attempt.answers[entry.questionId]
          return (
            answer !== undefined &&
            answer !== questionById.get(entry.questionId)?.correctIndex
          )
        })
        .map((entry) => entry.questionId) ?? [],
    [attempt, questionById],
  )
  const entries = useMemo(
    () =>
      attempt?.questions.filter((entry) => {
        const answer = attempt.answers[entry.questionId]
        const question = questionById.get(entry.questionId)
        if (filter === 'wrong')
          return answer !== undefined && answer !== question?.correctIndex
        if (filter === 'blank') return answer === undefined
        if (filter === 'flagged')
          return attempt.flagged.includes(entry.questionId)
        return true
      }) ?? [],
    [attempt, filter, questionById],
  )
  if (!attempt)
    return (
      <EmptyState
        description="Selecciona un intento desde el panel o completa una práctica."
        icon="clock"
        title="No hay resultado seleccionado"
        action={<Button onClick={onBack}>Volver al inicio</Button>}
      />
    )
  const overall = overallScore(attempt.scores)
  const isExam = attempt.mode === 'exam'
  const isMinigame = attempt.mode === 'minigame'
  const duration = `${Math.floor(attempt.durationSeconds / 60)} min ${attempt.durationSeconds % 60} s`
  const partLabel = isExam
    ? 'Parte'
    : isMinigame
      ? 'Resultado del minijuego'
      : 'Sesión de práctica'

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={
          isMinigame
            ? 'Resultado · minijuego completado'
            : 'Resultado · sesión completada'
        }
        title={attempt.title}
        description={`${new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(attempt.completedAt))} · ${duration}${isMinigame ? ' · No es un examen oficial' : ''}`}
        action={
          <div
            className={`result-verdict ${overall.passed ? 'verdict-pass' : 'verdict-work'}`}
          >
            <Icon name={overall.passed ? 'check' : 'trend'} size={17} />
            <span>
              {isMinigame
                ? overall.passed
                  ? 'Racha completada'
                  : 'Hay margen para crecer'
                : overall.passed
                  ? 'En el objetivo'
                  : 'Hay margen para crecer'}
            </span>
          </div>
        }
      />
      <div className="result-summary">
        <div className="result-total">
          <span>
            {isMinigame ? 'Puntuación del minijuego' : 'Puntuación estimada'}
          </span>
          <strong>{overall.estimated.toFixed(1).replace('.', ',')}</strong>
          <small>/ 100 · directa {formatDirect(overall.direct)}</small>
          {isMinigame ? (
            <div className="minigame-result-streak">
              <span>Mejor racha</span>
              <strong>{attempt.bestStreak ?? 0}</strong>
            </div>
          ) : null}
          <ProgressBar
            tone={overall.passed ? 'teal' : 'orange'}
            value={overall.estimated}
          />
        </div>
        {attempt.scores.map((score) => (
          <div className="result-part" key={score.part}>
            <div className="result-part-head">
              <span>
                {isExam
                  ? `Parte ${score.part === 1 ? '01 · Teoría' : '02 · Supuesto'}`
                  : partLabel}
              </span>
              <ScorePill
                label={isExam ? '/ 50' : '/ 100'}
                score={score.estimated}
              />
            </div>
            <div className="score-counts">
              <span>
                <b>{score.correct}</b> aciertos
              </span>
              <span>
                <b>{score.wrong}</b> errores
              </span>
              <span>
                <b>{score.blank}</b> blancos
              </span>
            </div>
            <ProgressBar
              tone={score.passed ? 'teal' : 'rose'}
              value={score.estimated}
            />
            <small className="score-foot">
              Directa: {formatDirect(score.direct)} ·{' '}
              {isExam
                ? 'Mínimo orientativo: 25'
                : isMinigame
                  ? `Mejor racha: ${attempt.bestStreak ?? 0}`
                  : 'Referencia de práctica: 70'}
            </small>
          </div>
        ))}
      </div>
      <div className="result-actions">
        <Button icon="arrow" onClick={onBack} variant="ghost">
          Volver al panel
        </Button>
        <Button
          disabled={wrongIds.length === 0}
          icon="refresh"
          onClick={() => onPracticeWrong(wrongIds)}
          variant="secondary"
        >
          Repetir {wrongIds.length} errores
        </Button>
        <Button
          icon="play"
          onClick={() => onNavigate(isMinigame ? 'minigames' : 'practice')}
        >
          {isMinigame ? 'Nuevo minijuego' : 'Nueva práctica'}
        </Button>
      </div>
      <section className="review-section">
        <div className="review-section-head">
          <div>
            <span className="section-kicker">Corrección explicada</span>
            <h2>Revisa cada respuesta</h2>
            <p>
              {isMinigame
                ? 'Es un resultado de minijuego con preguntas propias. No es un examen oficial ni una corrección de la CPS.'
                : 'El banco es propio y las explicaciones son pedagógicas, no correcciones de la CPS.'}
            </p>
          </div>
          <div className="review-filters">
            {(
              [
                ['all', 'Todas'],
                ['wrong', 'Falladas'],
                ['blank', 'Blancas'],
                ['flagged', 'Marcadas'],
              ] as [ReviewFilter, string][]
            ).map(([id, label]) => (
              <button
                className={filter === id ? 'is-active' : ''}
                key={id}
                onClick={() => setFilter(id)}
                type="button"
              >
                {label}
                <span>
                  {id === 'all'
                    ? attempt.questions.length
                    : id === 'wrong'
                      ? wrongIds.length
                      : id === 'blank'
                        ? attempt.scores.reduce(
                            (sum, score) => sum + score.blank,
                            0,
                          )
                        : attempt.flagged.length}
                </span>
              </button>
            ))}
          </div>
        </div>
        {entries.length ? (
          <div className="question-review-list">
            {entries.map((entry, entryIndex) => {
              const question = questionById.get(entry.questionId)
              if (!question) return null
              const selected = attempt.answers[entry.questionId]
              const isCorrect = selected === question.correctIndex
              const isBlank = selected === undefined
              const topic = topics.find((item) => item.id === question.topicId)
              return (
                <article
                  className={`review-card ${isCorrect ? 'review-correct' : isBlank ? 'review-blank' : 'review-wrong'}`}
                  key={entry.questionId}
                >
                  <div className="review-card-head">
                    <span className="review-index">
                      {String(entryIndex + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <span className="review-topic">
                        {entry.part === 2
                          ? 'Supuesto práctico'
                          : topic?.blockId}{' '}
                        · {topic?.focus}
                      </span>
                      <h3>{question.statement}</h3>
                    </div>
                    <span className="review-result">
                      {isCorrect ? (
                        <Icon name="check" size={18} />
                      ) : isBlank ? (
                        <span>—</span>
                      ) : (
                        <Icon name="x" size={18} />
                      )}
                    </span>
                  </div>
                  <div className="review-options">
                    {question.options.map((option, optionIndex) => {
                      const chosen = selected === optionIndex
                      const correct = question.correctIndex === optionIndex
                      return (
                        <div
                          className={`review-option ${chosen ? 'chosen' : ''} ${correct ? 'correct' : ''}`}
                          key={option}
                        >
                          <span>{String.fromCharCode(65 + optionIndex)}</span>
                          <p>{option}</p>
                          {chosen ? (
                            <Tag tone={isCorrect ? 'success' : 'danger'}>
                              Tu respuesta
                            </Tag>
                          ) : null}
                          {correct && !chosen ? (
                            <Tag tone="success">Correcta</Tag>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                  <div className="review-explanation">
                    <Icon name="spark" size={16} />
                    <p>{question.explanation}</p>
                  </div>
                  {question.legalReference ? (
                    <small className="legal-reference">
                      {question.legalReference} ·{' '}
                      <a
                        href={question.sourceUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Fuente
                      </a>
                    </small>
                  ) : null}
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState
            description="No hay preguntas en este filtro."
            icon="search"
            title="Sin resultados"
          />
        )}
      </section>
    </div>
  )
}
