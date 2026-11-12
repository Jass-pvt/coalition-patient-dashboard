import { describe, it, expect } from 'vitest'
import {
  normalizePatient,
  normalizeHistory,
  normalizePatientSummary,
} from '../utils/dataNormalizer'

describe('dataNormalizer', () => {
  const rawJessica = {
    name: 'Jessica Taylor',
    gender: 'Female',
    age: '28',
    profile_picture: 'https://fedskillstest.ct.digital/4.png',
    date_of_birth: '08/23/1996',
    phone_number: '(415) 555-1234',
    emergency_contact: '(415) 555-5678',
    insurance_type: 'Sunrise Health Assurance',
    diagnosis_history: [
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
      {
        month: 'October',
        year: 2023,
        blood_pressure: {
          systolic: { value: 125, levels: 'Normal' },
          diastolic: { value: 103, levels: 'Higher than Average' },
        },
        heart_rate: { value: 80, levels: 'Normal' },
        respiratory_rate: { value: 18, levels: 'Normal' },
        temperature: { value: 98.4, levels: 'Normal' },
      },
      {
        month: 'InvalidMonth',
        year: 2023,
      },
    ],
    diagnostic_list: [
      {
        name: 'Hypertension',
        description: 'Chronic high blood pressure',
        status: 'Under Observation',
      },
    ],
    lab_results: ['Blood Tests', 'CT Scans', ' '],
  }

  describe('normalizePatient', () => {
    it('normalizes raw patient record accurately', () => {
      const patient = normalizePatient(rawJessica)
      expect(patient.name).toBe('Jessica Taylor')
      expect(patient.gender).toBe('Female')
      expect(patient.age).toBe(28)
      expect(patient.photo).toBe('https://fedskillstest.ct.digital/4.png')
      expect(patient.dateOfBirth).toBe('08/23/1996')
      expect(patient.phone).toBe('(415) 555-1234')
      expect(patient.emergencyContact).toBe('(415) 555-5678')
      expect(patient.insurance).toBe('Sunrise Health Assurance')
      expect(patient.history).toHaveLength(2) // InvalidMonth filtered out
      expect(patient.diagnostics).toHaveLength(1)
      expect(patient.diagnostics[0].name).toBe('Hypertension')
      expect(patient.labResults).toEqual(['Blood Tests', 'CT Scans'])
    })

    it('handles null, undefined, or missing fields gracefully', () => {
      const patient = normalizePatient({})
      expect(patient.name).toBeNull()
      expect(patient.gender).toBeNull()
      expect(patient.age).toBeNull()
      expect(patient.photo).toBeNull()
      expect(patient.history).toEqual([])
      expect(patient.diagnostics).toEqual([])
      expect(patient.labResults).toEqual([])
    })
  })

  describe('normalizeHistory', () => {
    it('orders history chronologically (oldest first -> newest last)', () => {
      const unsorted = [
        { month: 'March', year: 2024 },
        { month: 'January', year: 2024 },
        { month: 'October', year: 2023 },
        { month: 'December', year: 2023 },
      ]
      const sorted = normalizeHistory(unsorted)
      expect(sorted.map((e) => e.label)).toEqual([
        'Oct, 2023',
        'Dec, 2023',
        'Jan, 2024',
        'Mar, 2024',
      ])
    })

    it('drops entries without a valid month or year', () => {
      const list = [
        { month: 'January', year: 2024 },
        { month: 'NoSuchMonth', year: 2024 },
        { month: 'February', year: null },
      ]
      const normalized = normalizeHistory(list)
      expect(normalized).toHaveLength(1)
      expect(normalized[0].label).toBe('Jan, 2024')
    })
  })

  describe('normalizePatientSummary', () => {
    it('creates a summary object for sidebar navigation', () => {
      const summary = normalizePatientSummary(rawJessica, 3)
      expect(summary.id).toBe('jessica-taylor')
      expect(summary.name).toBe('Jessica Taylor')
      expect(summary.gender).toBe('Female')
      expect(summary.age).toBe(28)
      expect(summary.photo).toBe('https://fedskillstest.ct.digital/4.png')
    })

    it('handles empty patient data', () => {
      const summary = normalizePatientSummary({}, 0)
      expect(summary.id).toBe('patient-0')
      expect(summary.name).toBe('Unknown Patient')
    })
  })
})
