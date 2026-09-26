import { beforeEach, describe, expect, it } from 'vitest'
import {
  CONSENT_KEY,
  getConsentSnapshot,
  subscribeConsent,
  writeConsent,
} from './consent'

describe('ads consent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts pending when nothing is stored', () => {
    expect(getConsentSnapshot()).toBeNull()
  })

  it('persists the decision', () => {
    expect(writeConsent('granted')).toBe(true)
    expect(localStorage.getItem(CONSENT_KEY)).toBe('granted')
    expect(writeConsent('denied')).toBe(true)
    expect(localStorage.getItem(CONSENT_KEY)).toBe('denied')
  })

  it('ignores unexpected stored values', () => {
    localStorage.setItem(CONSENT_KEY, 'lo-que-sea')
    expect(getConsentSnapshot()).toBeNull()
  })

  it('notifies subscribers on every decision', () => {
    let calls = 0
    const unsubscribe = subscribeConsent(() => {
      calls += 1
    })
    writeConsent('granted')
    writeConsent('denied')
    unsubscribe()
    writeConsent('granted')
    expect(calls).toBe(2)
  })
})
