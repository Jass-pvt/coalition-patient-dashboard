import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatMonthYear,
  formatFullMonthYear,
  monthIndex,
} from '../utils/dateFormatter'

describe('dateFormatter', () => {
  describe('formatDate', () => {
    it('formats ISO YYYY-MM-DD date correctly', () => {
      expect(formatDate('1996-08-23')).toBe('August 23, 1996')
      expect(formatDate('2000-01-05')).toBe('January 5, 2000')
    })

    it('formats American MM/DD/YYYY date correctly (actual API format)', () => {
      expect(formatDate('08/23/1996')).toBe('August 23, 1996')
      expect(formatDate('8/23/1996')).toBe('August 23, 1996')
      expect(formatDate('12/31/1980')).toBe('December 31, 1980')
    })

    it('handles ISO timestamps with time component', () => {
      expect(formatDate('1996-08-23T00:00:00.000Z')).toBe('August 23, 1996')
    })

    it('returns null for non-string or empty inputs', () => {
      expect(formatDate(null)).toBeNull()
      expect(formatDate(undefined)).toBeNull()
      expect(formatDate('')).toBeNull()
      expect(formatDate(12345)).toBeNull()
    })

    it('returns null for malformed or out-of-range dates', () => {
      expect(formatDate('invalid-date')).toBeNull()
      expect(formatDate('1996-13-23')).toBeNull()
      expect(formatDate('1996-00-10')).toBeNull()
      expect(formatDate('08/35/1996')).toBeNull()
    })
  })

  describe('monthIndex', () => {
    it('resolves month index correctly from full or short names', () => {
      expect(monthIndex('January')).toBe(0)
      expect(monthIndex('March')).toBe(2)
      expect(monthIndex('oct')).toBe(9)
      expect(monthIndex('December')).toBe(11)
    })

    it('returns -1 for invalid months', () => {
      expect(monthIndex('InvalidMonth')).toBe(-1)
      expect(monthIndex(null)).toBe(-1)
      expect(monthIndex(123)).toBe(-1)
    })
  })

  describe('formatMonthYear', () => {
    it('formats short month and year for chart axis labels', () => {
      expect(formatMonthYear('October', 2023)).toBe('Oct, 2023')
      expect(formatMonthYear('March', 2024)).toBe('Mar, 2024')
    })

    it('returns null if month is invalid or year is missing', () => {
      expect(formatMonthYear('Invalid', 2023)).toBeNull()
      expect(formatMonthYear('March', null)).toBeNull()
    })
  })

  describe('formatFullMonthYear', () => {
    it('formats full month and year', () => {
      expect(formatFullMonthYear('October', 2023)).toBe('October, 2023')
    })

    it('returns null for invalid inputs', () => {
      expect(formatFullMonthYear(null, 2023)).toBeNull()
    })
  })
})
