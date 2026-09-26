import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Onboarding } from './Onboarding'
import { ONBOARDING_KEY } from '../lib/storage'

describe('Onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('permite saltar y marca la primera visita como completada', () => {
    const onComplete = vi.fn()
    render(<Onboarding onComplete={onComplete} />)
    expect(screen.getByText('Estudia por ciclos, no por horas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }))
    expect(onComplete).toHaveBeenCalledOnce()
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true')
  })
})
