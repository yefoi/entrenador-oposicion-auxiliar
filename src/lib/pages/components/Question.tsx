import type { Question as QuestionModel } from '../../../domain/types'
import { Icon } from '../../../components/Icons'

interface QuestionProps {
  question: QuestionModel
  questionNumber: number
  total?: number
  selectedAnswer?: number
  locked?: boolean
  onAnswer: (answer: number) => void
}

export function Question({
  question,
  questionNumber,
  total,
  selectedAnswer,
  locked = false,
  onAnswer,
}: QuestionProps) {
  const answered = selectedAnswer !== undefined
  const questionTotal = total ?? questionNumber
  const difficulty =
    question.difficulty === 'easy'
      ? 'Fácil'
      : question.difficulty === 'medium'
        ? 'Media'
        : 'Difícil'

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
      <fieldset className="answer-fieldset" disabled={locked}>
        <legend className="sr-only">Selecciona una respuesta</legend>
        {question.options.map((option, optionIndex) => {
          const selected = selectedAnswer === optionIndex
          const isCorrect =
            answered && optionIndex === question.correctIndex
          const isWrong = selected && optionIndex !== question.correctIndex
          return (
            <label
              className={`answer-option ${selected ? 'is-selected' : ''} ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}`}
              key={option}
            >
              <input
                checked={selected}
                name={question.id}
                onChange={() => onAnswer(optionIndex)}
                type="radio"
                value={optionIndex}
              />
              <span className="option-letter">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span className="option-text">{option}</span>
              {isCorrect ? <Icon name="check" size={17} /> : null}
              {isWrong ? <Icon name="x" size={17} /> : null}
            </label>
          )
        })}
      </fieldset>
    </div>
  )
}
