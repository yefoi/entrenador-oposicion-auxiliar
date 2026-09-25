import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { activeQuestions } from '../data/questions'
import { createPracticeSession } from '../lib/session'
import { createDefaultState, saveTrainerState } from '../lib/storage'
import { useTrainer } from './useTrainer'

describe('useTrainer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('cambia el estado local al cambiar de usuario', () => {
    const first = createDefaultState()
    first.settings.targetScore = 80
    const second = createDefaultState()
    second.settings.targetScore = 50
    saveTrainerState(first, 'user-a')
    saveTrainerState(second, 'user-b')
    const { result, rerender } = renderHook(
      ({ ownerId }: { ownerId: string }) => useTrainer(ownerId),
      { initialProps: { ownerId: 'user-a' } },
    )
    expect(result.current.state.settings.targetScore).toBe(80)
    act(() => rerender({ ownerId: 'user-b' }))
    expect(result.current.state.settings.targetScore).toBe(50)
  })

  it('persists answers and creates a scored attempt', () => {
    const { result } = renderHook(() => useTrainer())
    const session = createPracticeSession(activeQuestions, { count: 2, immediateFeedback: true })
    act(() => result.current.addSession(session))
    const first = activeQuestions.find((question) => question.id === session.questions[0]?.questionId)
    const second = activeQuestions.find((question) => question.id === session.questions[1]?.questionId)
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    if (!first || !second) return
    act(() => {
      result.current.answerQuestion(session.id, first.id, first.correctIndex)
      result.current.answerQuestion(session.id, second.id, second.correctIndex)
    })
    act(() => result.current.submitSession(session.id, 42))
    expect(result.current.state.attempts).toHaveLength(1)
    expect(result.current.state.attempts[0]?.scores[0]?.correct).toBe(2)
    expect(result.current.state.sessions[0]?.submitted).toBe(true)
  })
})
