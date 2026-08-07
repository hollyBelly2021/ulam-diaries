import { ULAM_LIST } from '../data/dishes'
import type {
  DailyUlamEntry,
  DayDish,
  LegacySavedUlam,
  UlamDiaryState,
} from '../types'

const STORAGE_KEY = 'ulam-diaries-state'

const EMPTY_STATE: UlamDiaryState = {
  history: [],
  excludedDishes: [],
}

function isDayDish(value: unknown): value is DayDish {
  if (!value || typeof value !== 'object') return false
  const dish = value as DayDish
  return (
    typeof dish.name === 'string' &&
    (dish.source === 'generated' ||
      dish.source === 'custom' ||
      dish.source === 'matched')
  )
}

function toDayDish(name: string): DayDish {
  // Legacy string entries: restore-to-pool if they match the predefined list.
  const isPredefined = ULAM_LIST.some(
    (dish) => dish.toLowerCase() === name.toLowerCase(),
  )
  return {
    name,
    source: isPredefined ? 'generated' : 'custom',
  }
}

function normalizeDishes(dishes: unknown[]): DayDish[] {
  const result: DayDish[] = []

  for (const item of dishes) {
    if (typeof item === 'string') {
      if (!result.some((d) => d.name.toLowerCase() === item.toLowerCase())) {
        result.push(toDayDish(item))
      }
      continue
    }

    if (isDayDish(item)) {
      if (!result.some((d) => d.name.toLowerCase() === item.name.toLowerCase())) {
        result.push(item)
      }
    }
  }

  return result
}

function isDailyEntry(value: unknown): value is { date: string; dishes: unknown[] } {
  if (!value || typeof value !== 'object') return false
  const entry = value as { date: unknown; dishes: unknown }
  return typeof entry.date === 'string' && Array.isArray(entry.dishes)
}

function isLegacyEntry(value: unknown): value is LegacySavedUlam {
  if (!value || typeof value !== 'object') return false
  const entry = value as LegacySavedUlam
  return typeof entry.date === 'string' && typeof entry.name === 'string'
}

/**
 * Migrates older history shapes into DailyUlamEntry[] with DayDish sources.
 */
function migrateHistory(rawHistory: unknown[]): DailyUlamEntry[] {
  if (rawHistory.length === 0) return []

  // Multi-day entries (string[] or DayDish[]).
  if (rawHistory.every(isDailyEntry)) {
    return (rawHistory as { date: string; dishes: unknown[] }[]).map(
      (entry) => ({
        date: entry.date,
        dishes: normalizeDishes(entry.dishes),
      }),
    )
  }

  // Legacy SavedUlam rows → group by date.
  if (rawHistory.every(isLegacyEntry)) {
    const byDate = new Map<string, DayDish[]>()
    const chronological = [...(rawHistory as LegacySavedUlam[])].reverse()

    for (const item of chronological) {
      const existing = byDate.get(item.date) ?? []
      if (!existing.some((d) => d.name.toLowerCase() === item.name.toLowerCase())) {
        existing.push(toDayDish(item.name))
      }
      byDate.set(item.date, existing)
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([date, dishes]) => ({ date, dishes }))
  }

  return []
}

/**
 * Loads the diary from localStorage.
 * Migrates legacy history shapes when needed.
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
