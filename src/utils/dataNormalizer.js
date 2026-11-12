import { monthIndex, formatMonthYear } from './dateFormatter'

const toNumber = (value) => {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(n) ? n : null
}

const toText = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null)

const toReading = (raw) => {
  if (raw && typeof raw === 'object') {
    return {
      value: toNumber(raw.value ?? (typeof raw.val === 'number' ? raw.val : null)),
      levels: toText(raw.levels ?? raw.level ?? raw.status),
    }
  }
  if (typeof raw === 'number' || typeof raw === 'string') {
    return { value: toNumber(raw), levels: null }
  }
  return { value: null, levels: null }
}

function normalizeHistoryEntry(entry, position) {
  const month = toText(entry?.month)
  const year = toNumber(entry?.year)
  const index = monthIndex(month)
  return {
    id: `${year ?? 'na'}-${index}-${position}`,
    month,
    year,
    sortKey: year !== null && index >= 0 ? year * 12 + index : null,
    label: formatMonthYear(month, year),
    systolic: toReading(entry?.blood_pressure?.systolic),
    diastolic: toReading(entry?.blood_pressure?.diastolic),
    heartRate: toReading(entry?.heart_rate),
    respiratoryRate: toReading(entry?.respiratory_rate),
    temperature: toReading(entry?.temperature),
  }
}

/** Chronological (oldest → newest). Entries without a usable date are dropped. */
export function normalizeHistory(list) {
  if (!Array.isArray(list)) return []
  return list
    .map(normalizeHistoryEntry)
    .filter((entry) => entry.sortKey !== null)
    .sort((a, b) => a.sortKey - b.sortKey)
}

export function normalizePatientSummary(raw, position = 0) {
  const name = toText(raw?.name)
  return {
    id: name ? name.toLowerCase().replace(/\s+/g, '-') : `patient-${position}`,
    name: name ?? 'Unknown Patient',
    gender: toText(raw?.gender),
    age: toNumber(raw?.age),
    photo: toText(raw?.profile_picture),
    raw,
  }
}

export function normalizePatient(raw) {
  const name = toText(raw?.name)
  return {
    id: name ? name.toLowerCase().replace(/\s+/g, '-') : 'unknown-patient',
    name,
    gender: toText(raw?.gender),
    age: toNumber(raw?.age),
    photo: toText(raw?.profile_picture),
    dateOfBirth: toText(raw?.date_of_birth),
    phone: toText(raw?.phone_number),
    emergencyContact: toText(raw?.emergency_contact),
    insurance: toText(raw?.insurance_type),
    history: normalizeHistory(raw?.diagnosis_history),
    diagnostics: Array.isArray(raw?.diagnostic_list)
      ? raw.diagnostic_list.map((item, i) => ({
          id: `${toText(item?.name) ?? 'diagnostic'}-${i}`,
          name: toText(item?.name),
          description: toText(item?.description),
          status: toText(item?.status),
        }))
      : [],
    labResults: Array.isArray(raw?.lab_results)
      ? raw.lab_results.filter((r) => typeof r === 'string' && r.trim())
      : [],
  }
}
