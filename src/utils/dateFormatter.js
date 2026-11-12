const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function monthIndex(name) {
  if (typeof name !== 'string') return -1
  const key = name.trim().slice(0, 3).toLowerCase()
  return MONTHS.findIndex((m) => m.slice(0, 3).toLowerCase() === key)
}

/** "Oct, 2023" label used on the chart axis. */
export function formatMonthYear(month, year) {
  const index = monthIndex(month)
  if (index < 0 || year == null) return null
  return `${MONTHS[index].slice(0, 3)}, ${year}`
}

/** "August 23, 1996" from "YYYY-MM-DD" or "MM/DD/YYYY", avoiding timezone shifts. */
export function formatDate(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().split('T')[0]
  let y, m, d
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map(Number)
    y = parts[0]
    m = parts[1]
    d = parts[2]
  } else if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map(Number)
    m = parts[0]
    d = parts[1]
    y = parts[2]
  } else {
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) return null
    return `${MONTHS[parsed.getUTCMonth()]} ${parsed.getUTCDate()}, ${parsed.getUTCFullYear()}`
  }
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

/** "October, 2023" for the latest-reading caption. */
export function formatFullMonthYear(month, year) {
  const index = monthIndex(month)
  return index < 0 || year == null ? null : `${MONTHS[index]}, ${year}`
}
