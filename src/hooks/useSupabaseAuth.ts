import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { authRedirectUrl, supabase, supabaseConfigured } from '../lib/supabase'

export type AuthStatus = 'disabled' | 'loading' | 'anonymous' | 'authenticated'

export interface CloudAuth {
  configured: boolean
  status: AuthStatus
  user: User | null
  error: string | null
  notice: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación.'
}

export function useSupabaseAuth(): CloudAuth {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(
    supabaseConfigured ? 'loading' : 'disabled',
  )
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        setError(sessionError.message)
        setStatus('anonymous')
        return
      }
      setUser(data.session?.user ?? null)
      setStatus(data.session?.user ? 'authenticated' : 'anonymous')
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ?? null)
      setStatus(session?.user ? 'authenticated' : 'anonymous')
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase no está configurado.')
    setError(null)
    setNotice(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signInError) throw new Error(getErrorMessage(signInError))
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase no está configurado.')
    setError(null)
    setNotice(null)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: authRedirectUrl() },
    })
    if (signUpError) throw new Error(getErrorMessage(signUpError))
    setNotice(
      data.user
        ? 'Cuenta creada. Si el proyecto exige confirmación, revisa tu correo.'
        : 'Cuenta creada. Revisa tu correo para continuar.',
    )
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    setError(null)
    setNotice(null)
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw new Error(getErrorMessage(signOutError))
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    configured: supabaseConfigured,
    status,
    user,
    error,
    notice,
    signIn,
    signUp,
    signOut,
    clearError,
  }
}
