import type { TrainerState } from '../domain/types'
import { STATE_VERSION } from '../data/syllabus'

export const STORAGE_KEY = 'tai-entrenador:state'
export const BACKUP_KEY = 'tai-entrenador:state:backup'

function defaultExamDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 180)
  return date.toISOString().slice(0, 10)
}

export function createDefaultState(): TrainerState {
  return {
    version: STATE_VERSION,
    sessions: [],
    attempts: [],
    reviews: {},
    activity: [],
    settings: {
      examDate: defaultExamDate(),
      weeklyMinutes: 420,
      studyDays: [1, 2, 3, 4, 5, 6],
      targetScore: 70,
      reducedMotion: false,
      showExplanations: true,
    },
    lastSavedAt: new Date().toISOString(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isState(value: unknown): value is TrainerState {
  if (!isRecord(value)) return false
  return (
    value.version === STATE_VERSION &&
    Array.isArray(value.sessions) &&
    Array.isArray(value.attempts) &&
    isRecord(value.reviews) &&
    Array.isArray(value.activity) &&
    isRecord(value.settings) &&
    typeof value.lastSavedAt === 'string'
  )
}

export function loadTrainerState(): {
  state: TrainerState
  recovered: boolean
} {
  const fallback = createDefaultState()
  if (typeof window === 'undefined' || !window.localStorage) {
    return { state: fallback, recovered: false }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { state: fallback, recovered: false }
    const parsed: unknown = JSON.parse(raw)
    if (isState(parsed)) return { state: parsed, recovered: false }
  } catch {
    try {
      const backup = window.localStorage.getItem(BACKUP_KEY)
      if (backup) {
        const parsed: unknown = JSON.parse(backup)
        if (isState(parsed)) return { state: parsed, recovered: true }
      }
    } catch {
      return { state: fallback, recovered: true }
    }
  }
  return { state: fallback, recovered: true }
}

export function saveTrainerState(state: TrainerState): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false
  const serialized = JSON.stringify({
    ...state,
    lastSavedAt: new Date().toISOString(),
  })
  try {
    const current = window.localStorage.getItem(STORAGE_KEY)
    if (current) window.localStorage.setItem(BACKUP_KEY, current)
    window.localStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch {
    return false
  }
}

export function parseImportedState(text: string): TrainerState {
  const parsed: unknown = JSON.parse(text)
  if (!isState(parsed))
    throw new Error('El archivo no tiene un formato de estado compatible.')
  return parsed
}

export function downloadState(state: TrainerState): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `tai-entrenador-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function storageIsAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const key = 'tai-entrenador:probe'
    window.localStorage.setItem(key, '1')
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
