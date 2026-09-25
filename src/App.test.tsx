import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App smoke flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mantiene el modo local cuando Supabase no está configurado', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }))
    expect(screen.getByText('Sincronización desactivada')).toBeInTheDocument()
    expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeInTheDocument()
  })

  it('muestra el panel y permite navegar al temario y minijuegos', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /tu plaza, paso a paso/i }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Temario' }))
    expect(
      screen.getByRole('heading', { name: /el temario, sin perder el hilo/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('33', { exact: true })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Minijuegos' })[0])
    expect(
      screen.getByRole('heading', { name: /minijuegos para practicar/i }),
    ).toBeInTheDocument()
  })
})
