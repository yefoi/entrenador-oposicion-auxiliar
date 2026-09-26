import { useEffect, useMemo, useRef, useState } from 'react'
import type { Question, TrainerSession } from '../domain/types'
import { formatTimer, getRemainingSeconds } from '../lib/session'
import { getMinigameStreak } from '../lib/minigames'
import { Icon } from '../components/Icons'
import { Button, ProgressBar } from '../components/UI'
import { Question as QuestionCard } from '../lib/pages/components/Question'

interface MinigameSessionPageProps {
  session: TrainerSession
  questionById: Map<string, Question>
  onAnswer: (questionId: string, answer?: number) => void
  onFlag?: (questionId: string) => void
  onSubmit: (durationSeconds: number) => void
  onExit: () => void
}

function getResumeQuestionIndex(session: TrainerSession): number {
  const unanswered = session.questions.findIndex(
    (entry) => session.answers[entry.questionId] === undefined,
  )
  if (unanswered >= 0) return unanswered
  return Math.max(0, session.questions.length - 1)
}

function elapsedSeconds(session: TrainerSession): number {
  return Math.max(
    0,
    Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
  )
}

export function MinigameSessionPage({
  session,
  questionById,
  onAnswer,
  onFlag,
  onSubmit,
  onExit,
}: MinigameSessionPageProps) {
  const [index, setIndex] = useState(() => getResumeQuestionIndex(session))
  const [seconds, setSeconds] = useState(() => getRemainingSeconds(session))
  const submittedRef = useRef(session.submitted)
  const isSpeedrun = session.minigameType === 'speedrun'
  const total = session.questions.length
  const questionEntry = session.questions[index]
  const question = questionEntry
    ? questionById.get(questionEntry.questionId)
    : undefined
  const answer = questionEntry
    ? session.answers[questionEntry.questionId]
    : undefined
  const answered = useMemo(
    () =>
      session.questions.filter(
        (entry) => session.answers[entry.questionId] !== undefined,
      ).length,
    [session.answers, session.questions],
  )
  const streak = useMemo(
    () => getMinigameStreak(session.questions, session.answers, questionById),
    [questionById, session.answers, session.questions],
  )

  useEffect(() => {
    if (!isSpeedrun || session.submitted) return
    const update = () => {
      const remaining = getRemainingSeconds(session)
      setSeconds(remaining)
      if (remaining <= 0 && !submittedRef.current) {
        submittedRef.current = true
        onSubmit(Math.min(60, elapsedSeconds(session)))
      }
    }
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [isSpeedrun, onSubmit, session])

  if (!question || !questionEntry) {
    return (
      <div className="empty-state">
        <h2>No hay preguntas en este minijuego.</h2>
        <Button onClick={onExit}>Volver a minijuegos</Button>
      </div>
    )
  }

  const isCorrect = answer === question.correctIndex
  const showFeedback = answer !== undefined
  const isLast = index === total - 1
  const finish = () => {
    if (submittedRef.current) return
    submittedRef.current = true
    onSubmit(
      Math.min(
        isSpeedrun ? 60 : Number.POSITIVE_INFINITY,
        elapsedSeconds(session),
      ),
    )
  }
  const next = () => {
    if (isLast) {
      finish()
      return
    }
    setIndex((current) => Math.min(total - 1, current + 1))
  }

  return (
    <div className="session-page minigame-session-page">
      <div className="session-topbar">
        <button className="back-link" onClick={onExit} type="button">
          <Icon name="arrow" size={16} /> Salir
        </button>
        <div className="session-top-title">
          <span>Minijuego</span>
          <strong>{session.title}</strong>
        </div>
        <div
          className={`session-timer ${isSpeedrun && seconds <= 10 ? 'timer-warning' : ''}`}
        >
          <Icon name="clock" size={17} />
          <span>{isSpeedrun ? formatTimer(seconds) : 'Sin límite'}</span>
        </div>
      </div>
      <div className="session-progress">
        <div>
          <span>Progreso del minijuego</span>
          <strong>
            {answered} / {total}
          </strong>
        </div>
        <ProgressBar
          tone={isSpeedrun ? 'orange' : 'purple'}
          value={total ? (answered / total) * 100 : 0}
        />
      </div>
      <div className="minigame-session-layout">
        <main className="question-panel minigame-question-panel">
          <QuestionCard
            locked={showFeedback}
            onAnswer={(optionIndex) => {
              if (answer === undefined) {
                onAnswer(question.id, optionIndex)
              }
            }}
            question={question}
            questionNumber={index + 1}
            selectedAnswer={answer}
            total={total}
          />
          {showFeedback ? (
            <div
              aria-live="polite"
              className={`explanation-box ${isCorrect ? 'explanation-good' : 'explanation-bad'} minigame-feedback`}
            >
              <div className="explanation-head">
                <span>{isCorrect ? 'Acierto' : 'Refuerza esta idea'}</span>
                <Icon name={isCorrect ? 'check' : 'x'} size={17} />
              </div>
              <p>{question.explanation}</p>
              {question.legalReference ? (
                <small>{question.legalReference}</small>
              ) : null}
            </div>
          ) : (
            <p className="minigame-locked-copy">
              Elige una opción. La pregunta se bloqueará para que la explicación
              llegue antes de continuar.
            </p>
          )}
          <div className="question-actions">
            {onFlag ? (
              <button
                className="flag-button"
                onClick={() => onFlag(question.id)}
                type="button"
              >
                <Icon name="flag" size={16} />
                {session.flagged.includes(question.id) ? 'Marcada' : 'Marcar'}
              </button>
            ) : (
              <span />
            )}
            <div>
              <Button
                disabled={index === 0}
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                variant="ghost"
              >
                Anterior
              </Button>
              <Button
                disabled={!showFeedback && !isLast}
                icon={isLast ? 'check' : 'arrow'}
                onClick={next}
              >
                {isLast ? 'Enviar resultado' : 'Siguiente'}
              </Button>
            </div>
          </div>
        </main>
        <aside className="minigame-session-aside">
          <div className="minigame-streak-card">
            <div className="minigame-streak-card-head">
              <span className="section-kicker">Racha</span>
              <Icon name="trend" size={18} />
            </div>
            <div className="minigame-streak-values">
              <div>
                <strong>{streak.current}</strong>
                <span>racha actual</span>
              </div>
              <div>
                <strong>{streak.best}</strong>
                <span>mejor racha</span>
              </div>
            </div>
            <small>Los aciertos consecutivos mantienen la racha.</small>
          </div>
          <div className="minigame-round-card">
            <div className="minigame-round-row">
              <span>Ronda</span>
              <strong>
                {index + 1} / {total}
              </strong>
            </div>
            <div className="minigame-round-row">
              <span>Respondidas</span>
              <strong>{answered}</strong>
            </div>
            <div className="minigame-round-row">
              <span>Modo</span>
              <strong>{isSpeedrun ? 'Speedrun' : 'Entreno'}</strong>
            </div>
          </div>
          <div className="minigame-aside-note">
            <Icon name="info" size={15} />
            <span>El resultado se guardará en tu historial local.</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
