import { beforeEach, describe, expect, it } from 'vitest'
import {
  BACKUP_KEY,
  STORAGE_KEY,
  createDefaultState,
  loadTrainerState,
  saveTrainerState,
} from './storage'

describe('local storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('guarda y recupera el estado local', () => {
    const state = createDefaultState()
    state.settings.targetScore = 80
    saveTrainerState(state)
    expect(loadTrainerState().state.settings.targetScore).toBe(80)
  })

  it('recupera una copia válida si la clave principal está dañada', () => {
    const state = createDefaultState()
    state.settings.targetScore = 65
    saveTrainerState(state)
    saveTrainerState({ ...state, settings: { ...state.settings, targetScore: 50 } })
    localStorage.setItem(STORAGE_KEY, '{roto')
    const loaded = loadTrainerState()
    expect(loaded.recovered).toBe(true)
    expect(loaded.state.settings.targetScore).toBe(65)
    expect(localStorage.getItem(BACKUP_KEY)).not.toBeNull()
  })
})
