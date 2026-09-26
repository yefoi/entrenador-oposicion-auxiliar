import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { ONBOARDING_KEY } from './lib/storage'
import { topics } from './data/syllabus'

const setSearch = (search: string) => {
  window.history.replaceState({}, '', `/${search}`)
}

describe('App smoke flow', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setSearch('')
  })

  afterEach(() => {
    setSearch('')
  })

  it('muestra los ajustes con persistencia local', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }))
    expect(
      await screen.findByRole('heading', { name: /tu preparación, bajo control/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Guardado local')).toBeInTheDocument()
  })

  it('muestra el panel y permite navegar al temario y minijuegos', async () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /tu plaza, paso a paso/i }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Temario' }))
    expect(
      await screen.findByRole('heading', { name: /el temario, sin perder el hilo/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('33', { exact: true })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Minijuegos' })[0])
    expect(
      await screen.findByRole('heading', { name: /minijuegos para practicar/i }),
    ).toBeInTheDocument()
  })

  it('abre la práctica filtrada por el tema del enlace profundo', async () => {
    const target = topics[12]
    setSearch(`?tema=${target.id}&vista=practica`)
    render(<App />)
    expect(
      await screen.findByRole('heading', {
        name: /entrena lo que sabes/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Por tema' }),
    ).toHaveClass('is-active')
    expect(
      screen.getByRole('button', { name: new RegExp(target.focus, 'i') }),
    ).toHaveClass('is-selected')
  })

  it('abre el temario desde el enlace de una página estática', async () => {
    setSearch('?vista=temario')
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: /el temario, sin perder el hilo/i }),
    ).toBeInTheDocument()
  })

  it('ofrece el repaso del tema dentro de la práctica', async () => {
    const target = topics[5]
    setSearch(`?tema=${target.id}&vista=practica`)
    render(<App />)
    const summary = await screen.findByText('Repaso de este tema')
    expect(summary.closest('details')).toBeInTheDocument()
  })

  it('ignora un enlace profundo con un tema inexistente', async () => {
    setSearch('?tema=B9-T99&vista=practica')
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: /entrena lo que sabes/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mixto' })).toHaveClass(
      'is-active',
    )
  })
})
