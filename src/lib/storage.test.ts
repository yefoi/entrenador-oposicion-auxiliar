import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('informa de un guardado correcto', () => {
    expect(saveTrainerState(createDefaultState())).toBe('ok')
  })

  it('distingue el error de cuota del almacenamiento no disponible', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        const error = new DOMException('full', 'QuotaExceededError')
        throw error
      })
    expect(saveTrainerState(createDefaultState())).toBe('quota')
    setItem.mockRestore()
  })

  it('no rompe cuando el navegador deniega el acceso', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError')
      })
    expect(saveTrainerState(createDefaultState())).toBe('unavailable')
    getItem.mockRestore()
  })
})
