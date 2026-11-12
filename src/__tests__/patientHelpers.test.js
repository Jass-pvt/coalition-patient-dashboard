import { describe, it, expect } from 'vitest'
import {
  findTargetPatient,
  latestEntry,
  lastEntries,
  levelTrend,
  formatReading,
  TARGET_PATIENT,
} from '../utils/patientHelpers'

describe('patientHelpers', () => {
  describe('findTargetPatient', () => {
    const samplePatients = [
      { name: 'Emily Williams', age: 18 },
      { name: 'Jessica Taylor', age: 28 },
      { name: 'Ryan Johnson', age: 45 },
    ]

    it('finds Jessica Taylor by default case-insensitively', () => {
      const found = findTargetPatient(samplePatients)
      expect(found).toBeDefined()
      expect(found.name).toBe('Jessica Taylor')
      expect(found.age).toBe(28)
    })

    it('finds custom target patient name', () => {
      const found = findTargetPatient(samplePatients, 'emily williams')
      expect(found).toBeDefined()
      expect(found.name).toBe('Emily Williams')
    })

    it('returns null if patient is not found', () => {
      expect(findTargetPatient(samplePatients, 'Unknown Person')).toBeNull()
    })

    it('safely handles non-array or empty inputs', () => {
      expect(findTargetPatient([])).toBeNull()
      expect(findTargetPatient(null)).toBeNull()
      expect(findTargetPatient(undefined)).toBeNull()
    })
  })

  describe('latestEntry', () => {
    it('returns the last entry in the array', () => {
      const history = [{ month: 'Oct' }, { month: 'Nov' }, { month: 'Dec' }]
      expect(latestEntry(history)).toEqual({ month: 'Dec' })
    })

    it('returns null for empty or non-array inputs', () => {
      expect(latestEntry([])).toBeNull()
      expect(latestEntry(null)).toBeNull()
    })
  })

  describe('lastEntries', () => {
    it('returns the requested number of recent entries', () => {
      const history = [1, 2, 3, 4, 5, 6, 7, 8]
      expect(lastEntries(history, 6)).toEqual([3, 4, 5, 6, 7, 8])
    })

    it('handles arrays with fewer than requested count', () => {
      const history = [1, 2]
      expect(lastEntries(history, 6)).toEqual([1, 2])
    })

    it('safely handles empty or non-array inputs', () => {
      expect(lastEntries([])).toEqual([])
      expect(lastEntries(null, 6)).toEqual([])
    })
  })

  describe('levelTrend', () => {
    it('returns "up" for higher than average', () => {
      expect(levelTrend('Higher than Average')).toBe('up')
      expect(levelTrend('higher')).toBe('up')
    })

    it('returns "down" for lower than average', () => {
      expect(levelTrend('Lower than Average')).toBe('down')
      expect(levelTrend('lower')).toBe('down')
    })

    it('returns "none" for normal or unstated levels', () => {
      expect(levelTrend('Normal')).toBe('none')
      expect(levelTrend('')).toBe('none')
      expect(levelTrend(null)).toBe('none')
    })
  })

  describe('formatReading', () => {
    it('appends unit to valid numeric or string values', () => {
      expect(formatReading(120, ' bpm')).toBe('120 bpm')
      expect(formatReading(98.6, '°F')).toBe('98.6°F')
      expect(formatReading(160)).toBe('160')
    })

    it('returns dash for null or undefined values', () => {
      expect(formatReading(null, ' bpm')).toBe('—')
      expect(formatReading(undefined)).toBe('—')
    })
  })
})
