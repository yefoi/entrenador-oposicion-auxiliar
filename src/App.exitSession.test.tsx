import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { ONBOARDING_KEY, STORAGE_KEY, createDefaultState } from './lib/storage'
import type { TrainerSession } from './domain/types'

const setSearch = (search: string) => {
  window.history.replaceState({}, '', `/${search}`)
}

/**
 * Salir navegaba a la misma vista en la que se dibuja la sesion, asi que la
 * condicion para mostrarla seguia siendo cierta y el boton no hacia nada. Estos
 * tests fijan que ahora descarta la sesion y que la pantalla cambia de verdad.
 */
const withSession = (answers: Record<string, number>) => {
  const state = createDefaultState()
  const session: TrainerSession = {
    id: 'minigame-en-curso',
    mode: 'minigame',
    title: 'Minijuego · Flashcards',
    createdAt: '2026-01-01T10:00:00.000Z',
    startedAt: '2026-01-01T10:00:00.000Z',
    minigameType: 'flashcards',
    immediateFeedback: true,
    questions: [
      { questionId: 'B1-T01-Q01', part: 1 },
      { questionId: 'B1-T01-Q02', part: 1 },
    ],
    answers,
    flagged: [],
    submitted: false,
  }
  state.sessions = [session]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

describe('salir de una sesion en curso', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setSearch('')
  })

  afterEach(() => {
    setSearch('')
  })

  it('sin respuestas sale sin preguntar y descarta la sesion', async () => {
    withSession({})
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Minijuegos' }))
    fireEvent.click(await screen.findByRole('button', { name: /salir/i }))

    // No aparece ninguna confirmacion porque no hay nada que perder.
    expect(screen.queryByText(/salir de la sesi\u00f3n/i)).toBeNull()
    // Y se vuelve a la pantalla de minijuegos, no a la sesion.
    expect(
      await screen.findByText(/minijuegos para practicar/i),
    ).toBeInTheDocument()
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      expect(saved.sessions ?? []).toEqual([])
    })
  })

  it('con respuestas pide confirmacion antes de descartar', async () => {
    withSession({ 'B1-T01-Q01': 0 })
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Minijuegos' }))
    fireEvent.click(await screen.findByRole('button', { name: /salir/i }))

    expect(
      await screen.findByText(/salir de la sesi\u00f3n/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /seguir con la sesi\u00f3n/i }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /salir y descartar/i }))
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      expect(saved.sessions ?? []).toEqual([])
    })
  })

  it('seguir con la sesion conserva las respuestas dadas', async () => {
    withSession({ 'B1-T01-Q01': 0 })
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Minijuegos' }))
    fireEvent.click(await screen.findByRole('button', { name: /salir/i }))
    fireEvent.click(
      await screen.findByRole('button', { name: /seguir con la sesi\u00f3n/i }),
    )

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      expect(saved.sessions?.[0]?.id).toBe('minigame-en-curso')
      expect(saved.sessions?.[0]?.answers).toEqual({ 'B1-T01-Q01': 0 })
    })
  })
})
