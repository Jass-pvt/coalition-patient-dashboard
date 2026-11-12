import { describe, it, expect } from 'vitest'
import {
  NAV_ITEMS,
  DEFAULT_SECTION,
  PLACEHOLDER_SECTIONS,
  getNavItem,
} from '../components/layout/navigation'

describe('navigation config', () => {
  it('lists the five XD labels in order', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      'Overview',
      'Patients',
      'Schedule',
      'Message',
      'Transactions',
    ])
  })

  it('has unique ids and an icon for every item', () => {
    const ids = NAV_ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    NAV_ITEMS.forEach((i) => expect(i.icon).toBeTruthy())
  })

  it('defaults to Patients and marks only the out-of-scope sections as placeholders', () => {
    expect(DEFAULT_SECTION).toBe('patients')
    expect(PLACEHOLDER_SECTIONS).toEqual(['schedule', 'message', 'transactions'])
    PLACEHOLDER_SECTIONS.forEach((id) => expect(getNavItem(id)).not.toBeNull())
    expect(getNavItem('nope')).toBeNull()
  })
})
