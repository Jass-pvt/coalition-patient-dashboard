export const TARGET_PATIENT = 'jessica taylor'

export const findTargetPatient = (patients, target = TARGET_PATIENT) => {
  if (!Array.isArray(patients)) return null
  const normalizedTarget = (target || TARGET_PATIENT).trim().toLowerCase()
  return (
    patients.find(
      (p) => typeof p?.name === 'string' && p.name.trim().toLowerCase() === normalizedTarget,
    ) ?? null
  )
}

export const latestEntry = (history) =>
  Array.isArray(history) && history.length ? history[history.length - 1] : null

export const lastEntries = (history, count = 6) =>
  Array.isArray(history) ? history.slice(-count) : []

/** Arrow direction for a level string such as "Higher than Average". */
export function levelTrend(levels) {
  const text = (levels ?? '').toLowerCase()
  if (text.includes('higher')) return 'up'
  if (text.includes('lower')) return 'down'
  return 'none'
}

export const formatReading = (value, unit = '') =>
  value === null || value === undefined ? '—' : `${value}${unit}`
