import { useState } from 'react'
import type { Question as QuestionModel } from '../../../domain/types'
import { Icon } from '../../../components/Icons'
import { Button } from '../../../components/UI'

interface DiscardQuestionProps {
  question: QuestionModel
  questionNumber: number
  total?: number
  selectedAnswer?: number
  locked?: boolean
  onAnswer: (answer: number) => void
}

const ALL_OPTIONS = [0, 1, 2, 3]

/**
 * Igual que una pregunta normal, pero la respuesta se construye al reves: hay
 * que descartar las tres opciones falsas y la que queda en pie es la que se
 * envia. El indice guardado es el mismo que en el resto de modos, asi que el
 * historial, la puntuacion y los repasos no cambian.
 *
 * La idea es que obliga a pronunciarse sobre las cuatro opciones una por una,
 * en lugar de reconocer la buena y dejar las otras sin leer, que es justo lo
 * que premia el examen cuando los distractores son plausibles.
 */
export function DiscardQuestion({
  question,
  questionNumber,
  total,
  selectedAnswer,
  locked = false,
  onAnswer,
}: DiscardQuestionProps) {
  const [discarded, setDiscarded] = useState<number[]>([])
  const answered = selectedAnswer !== undefined
  const questionTotal = total ?? questionNumber
  const difficulty =
    question.difficulty === 'easy'
      ? 'Fácil'
      : question.difficulty === 'medium'
        ? 'Media'
        : 'Difícil'

  // Al responder se reconstruye el descarte a partir de la respuesta: asi la
  // vista sigue teniendo sentido si el estado local se pierde al recargar.
  const descartadas = answered
    ? ALL_OPTIONS.filter((index) => index !== selectedAnswer)
    : discarded
  const enPie = answered
    ? selectedAnswer
    : ALL_OPTIONS.find((index) => !descartadas.includes(index))
  const listo = !answered && descartadas.length === 3

  const toggle = (optionIndex: number) => {
    if (answered || locked) return
    if (descartadas.includes(optionIndex)) {
      setDiscarded(descartadas.filter((index) => index !== optionIndex))
      return
    }
    // Siempre tiene que quedar una opcion en pie.
    if (descartadas.length === 3) return
    setDiscarded([...descartadas, optionIndex])
  }

  return (
    <div className="minigame-question-content">
      <div className="question-meta">
        <span>
          Pregunta {questionNumber} de {questionTotal}
        </span>
        <span className="difficulty">
          <i /> {difficulty}
        </span>
        <span className="source-mini">Pregunta propia · no oficial</span>
      </div>
      <div className="question-statement-wrap">
        <span className="question-number">
          {String(questionNumber).padStart(2, '0')}
        </span>
        <h1>{question.statement}</h1>
      </div>
      <div className="answer-fieldset discard-fieldset">
        {question.options.map((option, optionIndex) => {
          const descartada = descartadas.includes(optionIndex)
          const esCorrecta = answered && optionIndex === question.correctIndex
          const esLaQueQueda = !answered && enPie === optionIndex
          const fallada = answered && optionIndex === selectedAnswer && !esCorrecta
          return (
            <button
              aria-pressed={descartada}
              className={`answer-option discard-option ${descartada ? 'is-discarded' : ''} ${esCorrecta ? 'is-correct' : ''} ${fallada ? 'is-wrong' : ''} ${esLaQueQueda && listo ? 'is-selected' : ''}`}
              disabled={answered || locked}
              key={option}
              onClick={() => toggle(optionIndex)}
              type="button"
            >
              <span className="option-letter">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span className="option-text">{option}</span>
              {descartada ? <Icon name="x" size={17} /> : null}
              {esCorrecta ? <Icon name="check" size={17} /> : null}
            </button>
          )
        })}
      </div>
      {answered ? null : (
        <div className="discard-footer">
          <p className="discard-hint">
            {listo
              ? 'Queda una opción en pie. Comprueba que es la que defiendes y responde.'
              : `Descarta las tres opciones falsas. Llevas ${descartadas.length} de 3.`}
          </p>
          <Button
            disabled={!listo}
            icon="check"
            onClick={() => {
              if (enPie !== undefined) onAnswer(enPie)
            }}
          >
            Responder con la que queda
          </Button>
        </div>
      )}
    </div>
  )
}
