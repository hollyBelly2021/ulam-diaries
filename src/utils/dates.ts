/** Returns today's local date as YYYY-MM-DD (used as a stable storage key). */
export function getTodayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Formats a Date for the header: weekday + full date. */
export function formatHeaderDate(date: Date = new Date()): {
  weekday: string
  fullDate: string
} {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' })
  const fullDate = date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return { weekday, fullDate }
}

/** Formats a YYYY-MM-DD key for the history list. */
export function formatHistoryDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  // Midday avoids timezone edge cases when constructing from date parts.
  const date = new Date(year, month - 1, day, 12)
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
