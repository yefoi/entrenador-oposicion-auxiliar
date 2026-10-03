import { describe, expect, it } from 'vitest'
import { examRules } from '../data/syllabus'
import { SECONDS_PER_SCORED_QUESTION, getPace } from './statistics'
import { createExamSession } from './session'
import { activeQuestions } from '../data/questions'

describe('ritmo respecto al examen', () => {
  it('deriva la referencia de las reglas de la convocatoria', () => {
    // El numero que se enseña al alumno no puede ser una constante suelta: si
    // una convocatoria futura cambia la duracion o el numero de preguntas, la
    // referencia tiene que moverse con ella.
    expect(SECONDS_PER_SCORED_QUESTION).toBe(
      (examRules.durationMinutes * 60) /
        (examRules.theoryQuestions + examRules.scenarioQuestions),
    )
    expect(SECONDS_PER_SCORED_QUESTION).toBe(72)
  })

  it('la referencia casa con las preguntas que trae el simulacro', () => {
    // Si el simulacro dejara de montar 80 + 20, la referencia de 72 s estaria
    // midiendo un examen que ya no se hace.
    const session = createExamSession(activeQuestions, 'III', new Date('2026-01-01'))
    expect(session.questions).toHaveLength(
      examRules.theoryQuestions + examRules.scenarioQuestions,
    )
  })

  it('calcula segundos por pregunta', () => {
    expect(getPace(7200, 100)).toBe(72)
    expect(getPace(3600, 100)).toBe(36)
    expect(getPace(4300, 100)).toBe(43)
  })

  it('se calla cuando no hay nada que medir', () => {
    // Un intento sin duracion o sin preguntas daria un cero que se leeria como
    // un ritmo perfecto, que es lo contrario de lo que paso.
    expect(getPace(0, 100)).toBeNull()
    expect(getPace(600, 0)).toBeNull()
    expect(getPace(-5, 100)).toBeNull()
  })
})
