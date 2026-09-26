import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RouteErrorBoundary } from './RouteErrorBoundary'

const Boom = ({ message }: { message: string }) => {
  throw new Error(message)
}

describe('RouteErrorBoundary', () => {
  it('renders the children when nothing fails', () => {
    render(
      <RouteErrorBoundary>
        <p>contenido</p>
      </RouteErrorBoundary>,
    )
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('shows a recovery screen instead of a blank page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <RouteErrorBoundary>
        <Boom message="boom" />
      </RouteErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /algo ha fallado/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /reintentar/i }),
    ).toBeInTheDocument()
  })

  it('offers a reload when a lazy chunk fails to download', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    })
    render(
      <RouteErrorBoundary>
        <Boom message="Failed to fetch dynamically imported module" />
      </RouteErrorBoundary>,
    )
    expect(
      screen.getByRole('heading', { name: /no se pudo cargar esta sección/i }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /recargar la página/i }))
    expect(reload).toHaveBeenCalled()
  })

  it('recovers when retrying', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true
    const Flaky = () => {
      if (shouldThrow) throw new Error('boom')
      return <p>recuperado</p>
    }
    render(
      <RouteErrorBoundary>
        <Flaky />
      </RouteErrorBoundary>,
    )
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(screen.getByText('recuperado')).toBeInTheDocument()
  })
})
