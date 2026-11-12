import { describe, it, expect } from 'vitest'
import { buildOverviewSummary, countBy } from '../utils/overviewSummary'
import { normalizePatient } from '../utils/dataNormalizer'

const raw = {
  name: 'Jessica Taylor',
  gender: 'Female',
  age: 28,
  diagnosis_history: [
    {
      month: 'February',
      year: 2024,
      blood_pressure: {
        systolic: { value: 145, levels: 'Higher than Average' },
        diastolic: { value: 82, levels: 'Normal' },
      },
      heart_rate: { value: 77, levels: 'Normal' },
      respiratory_rate: { value: 20, levels: 'Normal' },
      temperature: { value: 98.5, levels: 'Normal' },
    },
    {
      month: 'March',
      year: 2024,
      blood_pressure: {
        systolic: { value: 160, levels: 'Higher than Average' },
        diastolic: { value: 78, levels: 'Lower than Average' },
      },
      heart_rate: { value: 78, levels: 'Lower than Average' },
      respiratory_rate: { value: 20, levels: 'Normal' },
      temperature: { value: 98.6, levels: 'Normal' },
    },
  ],
  diagnostic_list: [
    { name: 'A', description: 'x', status: 'Cured' },
    { name: 'B', description: 'y', status: 'Under Observation' },
    { name: 'C', description: 'z', status: 'Cured' },
  ],
  lab_results: ['Blood Tests', 'X-Rays'],
}

describe('overviewSummary', () => {
  it('summarises the latest reading and counts from existing patient data', () => {
    const s = buildOverviewSummary(normalizePatient(raw), 12)
    expect(s.name).toBe('Jessica Taylor')
    expect(s.demographics).toBe('Female, 28 years')
    expect(s.latestReadingLabel).toBe('March, 2024')
    expect(s.bloodPressure).toBe('160/78 mmHg')
    expect(s.heartRate).toBe('78 bpm')
    expect(s.respiratoryRate).toBe('20 bpm')
    expect(s.temperature).toBe('98.6°F')
    expect(s.readingsCount).toBe(2)
    expect(s.diagnosticCount).toBe(3)
    expect(s.labResultCount).toBe(2)
    expect(s.directoryCount).toBe(12)
  })

  it('groups diagnostic statuses in first-seen order', () => {
    const s = buildOverviewSummary(normalizePatient(raw))
    expect(s.diagnosticStatuses).toEqual([
      { label: 'Cured', count: 2 },
      { label: 'Under Observation', count: 1 },
    ])
  })

  it('shows dashes instead of inventing values when data is missing', () => {
    const s = buildOverviewSummary(normalizePatient({ name: 'No Data' }))
    expect(s.bloodPressure).toBe('—')
    expect(s.heartRate).toBe('—')
    expect(s.temperature).toBe('—')
    expect(s.latestReadingLabel).toBeNull()
    expect(s.diagnosticCount).toBe(0)
    expect(s.directoryCount).toBe(0)
  })

  it('returns null without a patient and tolerates bad countBy input', () => {
    expect(buildOverviewSummary(null)).toBeNull()
    expect(countBy(undefined, 'status')).toEqual([])
    expect(countBy([{ status: '' }, {}, null], 'status')).toEqual([])
  })
})
