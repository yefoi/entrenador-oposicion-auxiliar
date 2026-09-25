import type { TrainerState } from '../domain/types'
import { STATE_VERSION } from '../data/syllabus'

export const STORAGE_KEY = 'tai-entrenador:state'
export const BACKUP_KEY = 'tai-entrenador:state:backup'

export function stateStorageKey(ownerId?: string | null): string {
  return ownerId ? `${STORAGE_KEY}:${ownerId}` : STORAGE_KEY
}

function backupStorageKey(ownerId?: string | null): string {
  return ownerId ? `${BACKUP_KEY}:${ownerId}` : BACKUP_KEY
}

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

export function isTrainerState(value: unknown): value is TrainerState {
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

export function loadTrainerState(ownerId?: string | null): {
  state: TrainerState
  recovered: boolean
} {
  const fallback = createDefaultState()
  if (typeof window === 'undefined' || !window.localStorage) {
    return { state: fallback, recovered: false }
  }
  const key = stateStorageKey(ownerId)
  const backupKey = backupStorageKey(ownerId)
  try {
    let raw = window.localStorage.getItem(key)
    if (!raw && ownerId) {
      const legacy = window.localStorage.getItem(STORAGE_KEY)
      if (legacy) {
        window.localStorage.setItem(key, legacy)
        raw = legacy
      }
    }
    if (!raw) {
      const backup = window.localStorage.getItem(backupKey)
      if (!backup) return { state: fallback, recovered: false }
      const parsed: unknown = JSON.parse(backup)
      if (isTrainerState(parsed)) return { state: parsed, recovered: true }
      return { state: fallback, recovered: true }
    }
    const parsed: unknown = JSON.parse(raw)
    if (isTrainerState(parsed)) return { state: parsed, recovered: false }
  } catch {
    try {
      const backup = window.localStorage.getItem(backupKey)
      if (backup) {
        const parsed: unknown = JSON.parse(backup)
        if (isTrainerState(parsed)) return { state: parsed, recovered: true }
      }
    } catch {
      return { state: fallback, recovered: true }
    }
  }
  return { state: fallback, recovered: true }
}

export function saveTrainerState(
  state: TrainerState,
  ownerId?: string | null,
): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false
  const key = stateStorageKey(ownerId)
  const backupKey = backupStorageKey(ownerId)
  const serialized = JSON.stringify({
    ...state,
    lastSavedAt: state.lastSavedAt || new Date().toISOString(),
  })
  try {
    const current = window.localStorage.getItem(key)
    if (current) window.localStorage.setItem(backupKey, current)
    window.localStorage.setItem(key, serialized)
    return true
  } catch {
    return false
  }
}

export function parseImportedState(text: string): TrainerState {
  const parsed: unknown = JSON.parse(text)
  if (!isTrainerState(parsed))
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
