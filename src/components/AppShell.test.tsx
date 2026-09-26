import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'

const renderShell = () => {
  const utils = render(
    <AppShell view="dashboard" onNavigate={() => {}} activeSession={null}>
      <p>contenido</p>
    </AppShell>,
  )
  return {
    ...utils,
    toggle: () => utils.container.querySelector('.mobile-menu') as Element,
    drawerClose: () => utils.container.querySelector('.sidebar-close') as Element,
    backdrop: () => utils.container.querySelector('.sidebar-backdrop') as Element,
  }
}

describe('AppShell mobile menu', () => {
  beforeEach(() => {
    document.body.className = ''
  })

  it('opens the drawer from the header button', () => {
    const shell = renderShell()
    expect(shell.toggle()).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(shell.toggle())
    expect(shell.toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(document.body.classList.contains('menu-open')).toBe(true)
    expect(shell.drawerClose()).toBeTruthy()
    expect(shell.backdrop()).toBeTruthy()
  })

  it('closes from the button inside the drawer', () => {
    const shell = renderShell()
    fireEvent.click(shell.toggle())
    fireEvent.click(shell.drawerClose())
    expect(document.body.classList.contains('menu-open')).toBe(false)
  })

  it('closes when tapping the backdrop', () => {
    const shell = renderShell()
    fireEvent.click(shell.toggle())
    fireEvent.click(shell.backdrop())
    expect(document.body.classList.contains('menu-open')).toBe(false)
  })

  it('hides the backdrop from assistive technology', () => {
    const shell = renderShell()
    fireEvent.click(shell.toggle())
    expect(shell.backdrop()).toHaveAttribute('aria-hidden', 'true')
    expect(shell.backdrop()).toHaveAttribute('tabindex', '-1')
  })

  it('closes on Escape and returns focus to the toggle', () => {
    const shell = renderShell()
    fireEvent.click(shell.toggle())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.classList.contains('menu-open')).toBe(false)
    expect(document.activeElement).toBe(shell.toggle())
  })

  it('closes after choosing a destination', () => {
    const onNavigate = vi.fn()
    const { container } = render(
      <AppShell view="dashboard" onNavigate={onNavigate} activeSession={null}>
        <p>contenido</p>
      </AppShell>,
    )
    fireEvent.click(container.querySelector('.mobile-menu') as Element)
    fireEvent.click(screen.getByRole('button', { name: 'Temario' }))
    expect(onNavigate).toHaveBeenCalledWith('syllabus')
    expect(document.body.classList.contains('menu-open')).toBe(false)
  })

  it('toggles closed from the header button', () => {
    const shell = renderShell()
    fireEvent.click(shell.toggle())
    fireEvent.click(shell.toggle())
    expect(document.body.classList.contains('menu-open')).toBe(false)
  })

  it('cleans the body class when unmounted while open', () => {
    const shell = renderShell()
    fireEvent.click(shell.toggle())
    expect(document.body.classList.contains('menu-open')).toBe(true)
    shell.unmount()
    expect(document.body.classList.contains('menu-open')).toBe(false)
  })
})
