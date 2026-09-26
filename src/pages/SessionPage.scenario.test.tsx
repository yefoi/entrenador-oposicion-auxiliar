import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SessionPage } from './SessionPage'
import { activeQuestions, questionById } from '../data/questions'
import { createPracticeSession } from '../lib/session'

/**
 * Las preguntas de un supuesto piden consultar los documentos del caso. Si se
 * cuelan en una practica o en un minijuego y los materiales no acompasan a la
 * pregunta, no hay forma de responderlas.
 */
const scenarioQuestion = activeQuestions.find((q) => q.scenarioId === 'IV')
const theoryQuestion = activeQuestions.find(
  (q) => !q.scenarioId && q.blockId === 'I',
)

const renderPage = (questionId: string) => {
  const session = createPracticeSession(activeQuestions, {
    questionIds: [questionId],
    count: 1,
  })
  render(
    <SessionPage
      onAnswer={vi.fn()}
      onExit={vi.fn()}
      onFlag={vi.fn()}
      onSubmit={vi.fn()}
      questionById={questionById}
      session={session}
    />,
  )
}

describe('materiales del supuesto fuera del simulacro', () => {
  it('acompanan a la pregunta del caso dentro de una practica', () => {
    expect(scenarioQuestion).toBeDefined()
    renderPage(scenarioQuestion!.id)

    expect(
      screen.getByRole('button', { name: /materiales del supuesto/i }),
    ).toBeInTheDocument()
  })

  it('se pueden abrir y muestran los documentos del caso', () => {
    renderPage(scenarioQuestion!.id)

    fireEvent.click(
      screen.getByRole('button', { name: /materiales del supuesto/i }),
    )
    expect(screen.getByText('Estado del conmutador de acceso')).toBeInTheDocument()
    expect(screen.getByText('Plan de copias vigente')).toBeInTheDocument()
    expect(
      screen.getByText('Registro de actuaciones del incidente INC-4471'),
    ).toBeInTheDocument()
  })

  it('no aparecen en una pregunta de teoria que no es de ningun caso', () => {
    expect(theoryQuestion).toBeDefined()
    renderPage(theoryQuestion!.id)

    expect(
      screen.queryByRole('button', { name: /materiales del supuesto/i }),
    ).toBeNull()
  })
})
