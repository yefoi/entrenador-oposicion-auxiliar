import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsPage } from './ResultsPage'
import { SECONDS_PER_SCORED_QUESTION } from '../lib/statistics'
import type { Attempt, Question } from '../domain/types'

const questions: Question[] = Array.from({ length: 100 }, (_, i) => ({
  id: `Q${i + 1}`,
  topicId: 'B1-T01',
  blockId: 'I',
  statement: `Enunciado ${i + 1}`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'Porque si.',
  difficulty: 'medium',
  source: 'generated',
  sourceLabel: 'Elaborada',
  reviewedOn: '2026-01-01',
  active: true,
}))

const questionById = new Map(questions.map((q) => [q.id, q]))

const attempt: Attempt = {
  id: 'a1',
  sessionId: 's1',
  mode: 'exam',
  title: 'Simulacro orientativo',
  completedAt: '2026-05-01T10:00:00.000Z',
  durationSeconds: 7800,
  scores: [
    { part: 1, total: 80, correct: 60, wrong: 12, blank: 8, direct: 56, estimated: 35, threshold: 25, passed: true },
    { part: 2, total: 20, correct: 14, wrong: 4, blank: 2, direct: 12.67, estimated: 31.7, threshold: 25, passed: true },
  ],
  questions: questions.map((q) => ({ questionId: q.id, part: 1 })),
  answers: {},
  flagged: [],
  reviewTopicIds: [],
}

const renderPage = (value: Attempt) =>
  render(
    <ResultsPage
      attempt={value}
      onBack={() => {}}
      onNavigate={() => {}}
      onPracticeWrong={() => {}}
      questionById={questionById}
    />,
  )

describe('ritmo en la página de resultados', () => {
  it('compara el ritmo del simulacro con el del examen', () => {
    renderPage(attempt)
    const referencia = Math.round(SECONDS_PER_SCORED_QUESTION)
    // 7.800 s entre 100 preguntas son 78 s: seis por encima de los 72 del
    // examen.
    const linea = screen.getByText(/ritmo medio/i)
    expect(linea.textContent).toContain('78')
    expect(linea.textContent).toContain(String(referencia))
    expect(screen.getByText(/vas 6 s por encima/i)).toBeTruthy()
  })

  it('no enseña ritmo en una práctica, porque el reloj incluye la corrección', () => {
    renderPage({ ...attempt, mode: 'practice' })
    expect(screen.queryByText(/ritmo medio/i)).toBeNull()
  })
})
