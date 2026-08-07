import type {
  DailyUlamEntry,
  LegacySavedUlam,
  UlamDiaryState,
} from '../types'

const STORAGE_KEY = 'ulam-diaries-state'

const EMPTY_STATE: UlamDiaryState = {
  history: [],
  excludedDishes: [],
}

function isDailyEntry(value: unknown): value is DailyUlamEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as DailyUlamEntry
  return typeof entry.date === 'string' && Array.isArray(entry.dishes)
}

function isLegacyEntry(value: unknown): value is LegacySavedUlam {
  if (!value || typeof value !== 'object') return false
  const entry = value as LegacySavedUlam
  return typeof entry.date === 'string' && typeof entry.name === 'string'
}

/**
 * Migrates old one-dish-per-row history into DailyUlamEntry[].
 * Groups by date and keeps selection order (older rows first within a day).
 */
function migrateHistory(rawHistory: unknown[]): DailyUlamEntry[] {
  if (rawHistory.length === 0) return []

  // Already on the new shape.
  if (rawHistory.every(isDailyEntry)) {
    return rawHistory as DailyUlamEntry[]
  }

  // Legacy SavedUlam rows → group by date.
  if (rawHistory.every(isLegacyEntry)) {
    const byDate = new Map<string, string[]>()

    // History was stored newest-first; reverse so we append in chronological order.
    const chronological = [...(rawHistory as LegacySavedUlam[])].reverse()

    for (const item of chronological) {
      const existing = byDate.get(item.date) ?? []
      if (!existing.includes(item.name)) {
        existing.push(item.name)
      }
      byDate.set(item.date, existing)
    }

    // Newest dates first.
    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([date, dishes]) => ({ date, dishes }))
  }

  return []
}

/**
 * Loads the diary from localStorage.
 * Migrates legacy single-dish history when needed.
 */
export function loadState(): UlamDiaryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { history: [], excludedDishes: [] }

    const parsed = JSON.parse(raw) as Partial<UlamDiaryState>
    const history = Array.isArray(parsed.history)
      ? migrateHistory(parsed.history)
      : []

    return {
      history,
      excludedDishes: Array.isArray(parsed.excludedDishes)
        ? parsed.excludedDishes
        : [],
    }
  } catch {
    return { ...EMPTY_STATE, history: [], excludedDishes: [] }
  }
}

/** Saves the full diary state to localStorage. */
export function saveState(state: UlamDiaryState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
