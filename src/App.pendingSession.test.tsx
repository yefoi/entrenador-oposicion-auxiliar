import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { ONBOARDING_KEY, STORAGE_KEY, createDefaultState } from './lib/storage'

const setSearch = (search: string) => {
  window.history.replaceState({}, '', `/${search}`)
}

const withPendingFlashcards = () => {
  const state = createDefaultState()
  state.sessions = [
    {
      id: 'minigame-pendiente',
      mode: 'minigame',
      title: 'Minijuego · Flashcards',
      createdAt: '2026-01-01T10:00:00.000Z',
      startedAt: '2026-01-01T10:00:00.000Z',
      minigameType: 'flashcards',
      immediateFeedback: true,
      questions: [{ questionId: 'B1-T01-Q01', part: 1 }],
      answers: {},
      flagged: [],
      submitted: false,
    },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

describe('sesion activa al pedir otra nueva', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setSearch('')
  })

  afterEach(() => {
    setSearch('')
  })

  it('ofrece continuar o descartar en lugar de abrir la anterior', async () => {
    withPendingFlashcards()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Práctica' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Mixto' }))
    fireEvent.click(
      await screen.findByRole('button', { name: /comenzar pr\u00e1ctica/i }),
    )
    expect(
      await screen.findByText(/ya tienes una sesi\u00f3n en marcha/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /continuar la actual/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /descartar y empezar la nueva/i }),
    ).toBeInTheDocument()
  })

  it('descartar la activa abre la nueva y elimina la anterior', async () => {
    withPendingFlashcards()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Práctica' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Mixto' }))
    fireEvent.click(
      await screen.findByRole('button', { name: /comenzar pr\u00e1ctica/i }),
    )
    fireEvent.click(
      await screen.findByRole('button', {
        name: /descartar y empezar la nueva/i,
      }),
    )
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      const ids = (saved.sessions ?? []).map((s: { id: string }) => s.id)
      expect(ids).not.toContain('minigame-pendiente')
      expect(ids.length).toBe(1)
      expect(ids[0]).not.toBe('minigame-pendiente')
    })
  })

  it('continuar la actual conserva la sesion pendiente', async () => {
    withPendingFlashcards()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Práctica' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Mixto' }))
    fireEvent.click(
      await screen.findByRole('button', { name: /comenzar pr\u00e1ctica/i }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: /continuar la actual/i }),
    )
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      const ids = (saved.sessions ?? []).map((s: { id: string }) => s.id)
      expect(ids).toEqual(['minigame-pendiente'])
    })
  })
})
