import { beforeEach, describe, expect, it } from 'vitest'
import {
  createDefaultState,
  loadTrainerState,
  saveTrainerState,
  stateStorageKey,
} from './storage'

describe('user-scoped storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mantiene estados separados por usuario', () => {
    const first = createDefaultState()
    first.settings.targetScore = 80
    const second = createDefaultState()
    second.settings.targetScore = 50
    saveTrainerState(first, 'user-a')
    saveTrainerState(second, 'user-b')
    expect(loadTrainerState('user-a').state.settings.targetScore).toBe(80)
    expect(loadTrainerState('user-b').state.settings.targetScore).toBe(50)
    expect(stateStorageKey('user-a')).not.toBe(stateStorageKey('user-b'))
  })

  it('migra el estado local legacy al primer usuario', () => {
    const legacy = createDefaultState()
    legacy.settings.targetScore = 65
    saveTrainerState(legacy)
    const loaded = loadTrainerState('new-user')
    expect(loaded.state.settings.targetScore).toBe(65)
    expect(localStorage.getItem(stateStorageKey('new-user'))).not.toBeNull()
  })
})
