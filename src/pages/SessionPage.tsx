import { useEffect, useMemo, useRef, useState } from 'react'
import type { Question, TrainerSession } from '../domain/types'
import { formatTimer, getRemainingSeconds } from '../lib/session'
import { Icon } from '../components/Icons'
import { Button, Modal, ProgressBar } from '../components/UI'

interface SessionPageProps {
  session: TrainerSession
  questionById: Map<string, Question>
  onAnswer: (questionId: string, answer?: number) => void
  onFlag: (questionId: string) => void
  onSubmit: (durationSeconds: number) => void
  onExit: () => void
}

export function SessionPage({
  session,
  questionById,
  onAnswer,
  onFlag,
  onSubmit,
  onExit,
}: SessionPageProps) {
  const [index, setIndex] = useState(0)
  const [seconds, setSeconds] = useState(() => getRemainingSeconds(session))
  const [showSubmit, setShowSubmit] = useState(false)
  const submittedRef = useRef(false)
  const questionEntry = session.questions[index]
  const question = questionEntry
    ? questionById.get(questionEntry.questionId)
    : undefined
  const isExam = session.mode === 'exam'
  const currentPart = questionEntry?.part ?? 1
  const answered = useMemo(
    () =>
      session.questions.filter(
        (entry) => session.answers[entry.questionId] !== undefined,
      ).length,
    [session],
  )
  const isLast = index === session.questions.length - 1

  useEffect(() => {
    if (!isExam || session.submitted) return
    const update = () => {
      const remaining = getRemainingSeconds(session)
      setSeconds(remaining)
      if (remaining <= 0 && !submittedRef.current) {
        submittedRef.current = true
        onSubmit(7200)
      }
    }
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [isExam, onSubmit, session])

  if (!question || !questionEntry) {
    return (
      <div className="empty-state">
        <h2>No hay preguntas en esta sesión.</h2>
        <Button onClick={onExit}>Volver</Button>
      </div>
    )
  }

  const answer = session.answers[question.id]
  const immediate = session.immediateFeedback && answer !== undefined
  const goTo = (next: number) =>
    setIndex(Math.max(0, Math.min(session.questions.length - 1, next)))
  const handleSubmit = () => {
    const elapsed = Math.max(
      0,
      Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
    )
    onSubmit(Math.min(elapsed, isExam ? 7200 : elapsed))
    setShowSubmit(false)
  }

  return (
    <div className="session-page">
      <div className="session-topbar">
        <button className="back-link" onClick={onExit} type="button">
          <Icon name="arrow" size={16} /> Salir
        </button>
        <div className="session-top-title">
          <span>{isExam ? 'Simulacro oficial' : 'Práctica'}</span>
          <strong>{session.title}</strong>
        </div>
        <div
          className={`session-timer ${isExam && seconds < 600 ? 'timer-warning' : ''}`}
        >
          <Icon name="clock" size={17} />
          <span>{isExam ? formatTimer(seconds) : 'Sin límite'}</span>
        </div>
      </div>
      <div className="session-progress">
        <div>
          <span>Progreso de la sesión</span>
          <strong>
            {answered} / {session.questions.length}
          </strong>
        </div>
        <ProgressBar
          tone={isExam ? 'orange' : 'purple'}
          value={(answered / session.questions.length) * 100}
        />
      </div>
      {isExam ? (
        <div className="exam-progress-tabs">
          <span className={currentPart === 1 ? 'is-active' : ''}>
            <b>01</b> Teoría <small>80</small>
          </span>
          <span className={currentPart === 2 ? 'is-active' : ''}>
            <b>02</b> Supuesto {session.scenarioBlock} <small>20</small>
          </span>
        </div>
      ) : null}
      <div className="session-layout">
        <main className="question-panel">
          <div className="question-meta">
            <span>
              Pregunta {index + 1} de {session.questions.length}
            </span>
            <span className="difficulty">
              <i />{' '}
              {question.difficulty === 'easy'
                ? 'Fácil'
                : question.difficulty === 'medium'
                  ? 'Media'
                  : 'Difícil'}
            </span>
            {isExam ? (
              <span className="source-mini">Práctica no oficial</span>
            ) : null}
          </div>
          <div className="question-statement-wrap">
            <span className="question-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h1>{question.statement}</h1>
          </div>
          <fieldset className="answer-fieldset">
            <legend className="sr-only">Selecciona una respuesta</legend>
            {question.options.map((option, optionIndex) => {
              const selected = answer === optionIndex
              const isCorrect =
                selected && optionIndex === question.correctIndex
              const isWrong = selected && optionIndex !== question.correctIndex
              return (
                <label
                  className={`answer-option ${selected ? 'is-selected' : ''} ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}`}
                  key={option}
                >
                  <input
                    checked={selected}
                    name={question.id}
                    onChange={() => onAnswer(question.id, optionIndex)}
                    type="radio"
                    value={optionIndex}
                  />
                  <span className="option-letter">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="option-text">{option}</span>
                  {isCorrect ? (
                    <Icon name="check" size={17} />
                  ) : isWrong ? (
                    <Icon name="x" size={17} />
                  ) : null}
                </label>
              )
            })}
          </fieldset>
          {answer === undefined ? (
            <button
              className="blank-button"
              onClick={() => onAnswer(question.id, undefined)}
              type="button"
            >
              Dejar en blanco
            </button>
          ) : (
            <button
              className="clear-answer"
              onClick={() => onAnswer(question.id, undefined)}
              type="button"
            >
              <Icon name="refresh" size={14} /> Cambiar a blanco
            </button>
          )}
          {immediate ? (
            <div
              className={`explanation-box ${answer === question.correctIndex ? 'explanation-good' : 'explanation-bad'}`}
            >
              <div className="explanation-head">
                <span>
                  {answer === question.correctIndex
                    ? 'Acierto'
                    : 'Revisa esta idea'}
                </span>
                <Icon
                  name={answer === question.correctIndex ? 'check' : 'spark'}
                  size={17}
                />
              </div>
              <p>{question.explanation}</p>
              {question.legalReference ? (
                <small>{question.legalReference}</small>
              ) : null}
            </div>
          ) : null}
          <div className="question-actions">
            <button
              className="flag-button"
              onClick={() => onFlag(question.id)}
              type="button"
            >
              <Icon name="flag" size={16} />{' '}
              {session.flagged.includes(question.id) ? 'Marcada' : 'Marcar'}
            </button>
            <div>
              <Button
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                variant="ghost"
              >
                Anterior
              </Button>
              {isLast ? (
                <Button onClick={() => setShowSubmit(true)} icon="check">
                  Enviar
                </Button>
              ) : (
                <Button onClick={() => goTo(index + 1)} icon="arrow">
                  Siguiente
                </Button>
              )}
            </div>
          </div>
        </main>
        <aside className="navigator-panel">
          <div className="navigator-head">
            <div>
              <span className="section-kicker">Mapa de respuestas</span>
              <h2>{isExam ? 'Navegador' : 'Tu recorrido'}</h2>
            </div>
            <span className="answered-count">
              {answered}/{session.questions.length}
            </span>
          </div>
          <div className="navigator-grid">
            {session.questions.map((entry, entryIndex) => {
              const isAnswered = session.answers[entry.questionId] !== undefined
              const isCurrent = entryIndex === index
              return (
                <button
                  aria-label={`Pregunta ${entryIndex + 1}${isAnswered ? ', respondida' : ', sin contestar'}${session.flagged.includes(entry.questionId) ? ', marcada' : ''}`}
                  className={`navigator-cell ${isAnswered ? 'is-answered' : ''} ${isCurrent ? 'is-current' : ''} ${session.flagged.includes(entry.questionId) ? 'is-flagged' : ''}`}
                  key={entry.questionId}
                  onClick={() => goTo(entryIndex)}
                  type="button"
                >
                  <span>{entryIndex + 1}</span>
                  {session.flagged.includes(entry.questionId) ? <i /> : null}
                  {isCurrent ? <b /> : null}
                </button>
              )
            })}
          </div>
          <div className="navigator-legend">
            <span>
              <i className="legend-cell answered" /> Respondida
            </span>
            <span>
              <i className="legend-cell" /> Sin contestar
            </span>
            <span>
              <i className="legend-cell current" /> Actual
            </span>
          </div>
          {isExam ? (
            <div className="exam-reserve-note">
              <Icon name="info" size={15} />
              <span>
                Las preguntas de reserva solo se utilizan si se anula alguna
                pregunta en el examen oficial.
              </span>
            </div>
          ) : null}
          <Button
            className="full-button"
            onClick={() => setShowSubmit(true)}
            variant="secondary"
            icon="check"
          >
            Revisar y enviar
          </Button>
          <p className="session-disclaimer">{question.sourceLabel}</p>
        </aside>
      </div>
      {showSubmit ? (
        <Modal onClose={() => setShowSubmit(false)} title="Enviar sesión">
          <div className="modal-copy">
            <p>
              Has contestado{' '}
              <strong>
                {answered} de {session.questions.length}
              </strong>{' '}
              preguntas. Los blancos no penalizan, pero las respuestas
              incorrectas descuentan 1/3.
            </p>
            {answered < session.questions.length ? (
              <div className="modal-warning">
                <Icon name="info" size={16} /> Aún quedan{' '}
                {session.questions.length - answered} preguntas sin contestar.
              </div>
            ) : null}
          </div>
          <div className="modal-actions">
            <Button onClick={() => setShowSubmit(false)} variant="ghost">
              Seguir respondiendo
            </Button>
            <Button onClick={handleSubmit} icon="check">
              Enviar y ver resultado
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
