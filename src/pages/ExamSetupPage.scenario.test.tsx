import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ExamSetupPage } from './ExamSetupPage'

describe('estudiar el supuesto desde el simulacro', () => {
  it('ofrece estudiar el escenario elegido, sin pasar por el examen', () => {
    const onPracticeScenario = vi.fn()
    render(
      <ExamSetupPage
        activeSession={null}
        onPracticeScenario={onPracticeScenario}
        onStart={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /estudiar el supuesto/i }),
    )
    expect(onPracticeScenario).toHaveBeenCalledWith('III')
  })

  it('estudia el escenario que este seleccionado, no siempre el primero', () => {
    const onPracticeScenario = vi.fn()
    render(
      <ExamSetupPage
        activeSession={null}
        onPracticeScenario={onPracticeScenario}
        onStart={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /incidente en un servicio/i }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: /estudiar el supuesto/i }),
    )
    expect(onPracticeScenario).toHaveBeenCalledWith('IV')
  })

  it('no arranca el simulacro al estudiar el supuesto', () => {
    const onStart = vi.fn()
    render(
      <ExamSetupPage
        activeSession={null}
        onPracticeScenario={vi.fn()}
        onStart={onStart}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /estudiar el supuesto/i }),
    )
    // Estudiar el caso no es empezar el examen: no hace falta confirmar nada.
    expect(onStart).not.toHaveBeenCalled()
  })
})
