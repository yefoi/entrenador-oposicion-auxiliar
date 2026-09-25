import { useCallback, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { TrainerState } from '../domain/types'
import {
  mergeTrainerStates,
  pullCloudState,
  pushCloudState,
} from '../lib/cloudSync'
import { supabaseConfigured } from '../lib/supabase'

export type CloudSyncPhase =
  | 'disabled'
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'

export interface CloudSyncController {
  phase: CloudSyncPhase
  lastSyncedAt: string | null
  error: string | null
  syncNow: () => Promise<void>
}

interface UseCloudSyncOptions {
  user: User | null
  state: TrainerState
  lastSavedAt: string
  onReplace: (state: TrainerState) => void
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo sincronizar.'
}

export function useCloudSync({
  user,
  state,
  lastSavedAt,
  onReplace,
}: UseCloudSyncOptions): CloudSyncController {
  const [phase, setPhase] = useState<CloudSyncPhase>(
    supabaseConfigured ? 'idle' : 'disabled',
  )
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const syncNow = useCallback(async () => {
    if (!user) {
      setError('Inicia sesión para sincronizar tu progreso.')
      return
    }
    if (!navigator.onLine) {
      setError('No hay conexión. La sincronización se intentará más tarde.')
      return
    }
    setPhase('syncing')
    setError(null)
    try {
      const localState = { ...state, lastSavedAt }
      let remote = await pullCloudState(user.id)
      let candidate = remote
        ? mergeTrainerStates(localState, remote.state)
        : localState
      if (remote) onReplace(candidate)
      let result = await pushCloudState(
        candidate,
        remote?.revision ?? 0,
      )
      if (result.kind === 'conflict') {
        remote = await pullCloudState(user.id)
        if (!remote) throw new Error('No se pudo leer el estado remoto actualizado.')
        candidate = mergeTrainerStates(localState, remote.state)
        onReplace(candidate)
        result = await pushCloudState(candidate, remote.revision)
        if (result.kind === 'conflict') {
          throw new Error('El progreso cambió en otro dispositivo. Inténtalo de nuevo.')
        }
      }
      setLastSyncedAt(new Date().toISOString())
      setPhase('success')
    } catch (syncError) {
      setError(getErrorMessage(syncError))
      setPhase('error')
    }
  }, [lastSavedAt, onReplace, state, user])

  return { phase, lastSyncedAt, error, syncNow }
}
