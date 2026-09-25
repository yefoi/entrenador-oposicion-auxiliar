import { describe, expect, it } from 'vitest'
import { createDefaultState } from './storage'
import { mergeTrainerStates } from './cloudSync'
import type { Attempt } from '../domain/types'

function makeAttempt(id: string, completedAt: string): Attempt {
  return {
    id,
    sessionId: `session-${id}`,
    mode: 'practice',
    title: 'Prueba',
    completedAt,
    durationSeconds: 60,
    questions: [],
    answers: {},
    flagged: [],
    scores: [],
    reviewTopicIds: [],
  }
}

describe('cloud state merge', () => {
  it('conserva intentos de ambos dispositivos', () => {
    const local = createDefaultState()
    local.lastSavedAt = '2026-09-25T10:00:00.000Z'
    const remote = createDefaultState()
    remote.lastSavedAt = '2026-09-25T10:01:00.000Z'
    remote.attempts = [makeAttempt('remote-attempt', '2026-09-25T10:01:00.000Z')]
    local.attempts = [makeAttempt('local-attempt', '2026-09-25T10:00:00.000Z')]

    const merged = mergeTrainerStates(local, remote)

    expect(merged.attempts.map((attempt) => attempt.id)).toEqual([
      'local-attempt',
      'remote-attempt',
    ])
    expect(merged.lastSavedAt).toBe(remote.lastSavedAt)
  })

  it('mantiene el estado remote más reciente como base', () => {
    const local = createDefaultState()
    local.lastSavedAt = '2026-09-25T10:00:00.000Z'
    local.settings.targetScore = 50
    const remote = createDefaultState()
    remote.lastSavedAt = '2026-09-25T10:02:00.000Z'
    remote.settings.targetScore = 80

    const merged = mergeTrainerStates(local, remote)

    expect(merged.settings.targetScore).toBe(80)
  })
})
