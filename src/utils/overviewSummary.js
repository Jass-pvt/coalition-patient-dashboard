import { latestEntry, formatReading } from './patientHelpers'
import { formatFullMonthYear } from './dateFormatter'

/** Counts items by a text field, preserving first-seen order. Missing values are skipped. */
export function countBy(items, key) {
  const counts = new Map()
  for (const item of Array.isArray(items) ? items : []) {
    const value = item?.[key]
    if (typeof value === 'string' && value) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return Array.from(counts, ([label, count]) => ({ label, count }))
}

/**
 * Builds the Overview figures from data the app already holds (the single patient-list
 * response). Nothing is estimated or invented: a missing value renders as "—".
 */
export function buildOverviewSummary(patient, directoryCount = 0) {
  if (!patient) return null
  const latest = latestEntry(patient.history)
  const systolic = latest?.systolic?.value
  const diastolic = latest?.diastolic?.value
  const hasBp = systolic != null || diastolic != null

  return {
    name: patient.name,
    demographics: [patient.gender, patient.age != null ? `${patient.age} years` : null]
      .filter(Boolean)
      .join(', '),
    latestReadingLabel: latest ? formatFullMonthYear(latest.month, latest.year) : null,
    bloodPressure: hasBp ? `${formatReading(systolic)}/${formatReading(diastolic)} mmHg` : '—',
    bloodPressureLevels: [latest?.systolic?.levels, latest?.diastolic?.levels]
      .filter(Boolean)
      .join(' / '),
    heartRate: formatReading(latest?.heartRate?.value, ' bpm'),
    respiratoryRate: formatReading(latest?.respiratoryRate?.value, ' bpm'),
    temperature: formatReading(latest?.temperature?.value, '°F'),
    readingsCount: patient.history?.length ?? 0,
    diagnosticCount: patient.diagnostics?.length ?? 0,
    diagnosticStatuses: countBy(patient.diagnostics, 'status'),
    labResultCount: patient.labResults?.length ?? 0,
    directoryCount,
  }
}
