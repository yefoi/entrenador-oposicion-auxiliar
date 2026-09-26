import type { Question } from '../domain/types'

/**
 * Shows, for every option that is not the answer, why it is wrong. This is the
 * part that turns a guess into learning: the explanation says what the right
 * answer is, the notes say what each distractor gets wrong.
 */
export function OptionNotes({ question }: { question: Question }) {
  if (!question.optionNotes) return null
  const wrongIndexes = question.options
    .map((_, index) => index)
    .filter((index) => index !== question.correctIndex)
  if (!wrongIndexes.length) return null

  return (
    <div className="option-notes">
      <span className="option-notes__title">Por qué no las otras</span>
      <dl>
        {wrongIndexes.map((index) => (
          <div key={question.options[index]}>
            <dt>{question.options[index]}</dt>
            <dd>{question.optionNotes![index]}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
