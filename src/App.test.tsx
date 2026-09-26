import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App smoke flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('muestra los ajustes con persistencia local', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }))
    expect(
      screen.getByRole('heading', { name: /tu preparación, bajo control/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Guardado local')).toBeInTheDocument()
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
