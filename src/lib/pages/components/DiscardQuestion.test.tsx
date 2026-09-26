import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DiscardQuestion } from './DiscardQuestion'
import type { Question } from '../../../domain/types'

const question: Question = {
  id: 'B1-T01-Q01',
  topicId: 'B1-T01',
  blockId: 'I',
  statement: '¿Cuál de estas opciones es la correcta?',
  options: ['La correcta', 'La falsa uno', 'La falsa dos', 'La falsa tres'],
  correctIndex: 0,
  optionNotes: ['', 'nota uno', 'nota dos', 'nota tres'],
  explanation: 'Explicación de la correcta.',
  difficulty: 'medium',
  source: 'generated',
  sourceLabel: 'Banco propio · práctica no oficial',
  reviewedOn: '2026-09-24',
  active: true,
}

describe('DiscardQuestion', () => {
  it('no responde hasta que se han descartado tres opciones', () => {
    const onAnswer = vi.fn()
    render(<DiscardQuestion onAnswer={onAnswer} question={question} questionNumber={1} total={10} />)

    fireEvent.click(screen.getByRole('button', { name: /La falsa uno/ }))
    expect(onAnswer).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /La falsa dos/ }))
    expect(onAnswer).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /La falsa tres/ }))
    // Descartar la tercera no responde sola: hay que confirmar.
    expect(onAnswer).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Responder con la que queda/ }))
    expect(onAnswer).toHaveBeenCalledWith(0)
  })

  it('deja volver atras mientras no se haya respondido', () => {
    const onAnswer = vi.fn()
    render(<DiscardQuestion onAnswer={onAnswer} question={question} questionNumber={1} />)

    const falsa = screen.getByRole('button', { name: /La falsa uno/ })
    fireEvent.click(falsa)
    expect(falsa).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(falsa)
    expect(falsa).toHaveAttribute('aria-pressed', 'false')
    expect(onAnswer).not.toHaveBeenCalled()
  })

  it('no permite descartar la cuarta: siempre queda una en pie', () => {
    const onAnswer = vi.fn()
    render(<DiscardQuestion onAnswer={onAnswer} question={question} questionNumber={1} />)

    for (const nombre of [/La falsa uno/, /La falsa dos/, /La falsa tres/]) {
      fireEvent.click(screen.getByRole('button', { name: nombre }))
    }

    // Con tres descartadas, pulsar la que queda no debe descartarla.
    const correcta = screen.getByRole('button', { name: /La correcta/ })
    fireEvent.click(correcta)
    expect(correcta).toHaveAttribute('aria-pressed', 'false')

    // Y la confirmacion sigue disponible con la que quedo en pie.
    fireEvent.click(screen.getByRole('button', { name: /Responder con la que queda/ }))
    expect(onAnswer).toHaveBeenCalledWith(0)
  })

  it('reconstruye el descarte a partir de la respuesta ya guardada', () => {
    render(
      <DiscardQuestion
        locked
        onAnswer={() => {}}
        question={question}
        questionNumber={1}
        selectedAnswer={0}
      />,
    )

    expect(screen.queryByRole('button', { name: /Responder con la que queda/ })).toBeNull()
    expect(screen.getByRole('button', { name: /La falsa uno/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /La correcta/ })).toHaveAttribute('aria-pressed', 'false')
  })
})
