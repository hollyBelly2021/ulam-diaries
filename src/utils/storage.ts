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
  customPool: [],
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

function toDayDish(name: string, customPool: string[]): DayDish {
  const pool = [...ULAM_LIST, ...customPool]
  const isInPool = pool.some(
    (dish) => dish.toLowerCase() === name.toLowerCase(),
  )
  return {
    name,
    source: isInPool ? 'generated' : 'custom',
  }
}

function normalizeDishes(dishes: unknown[], customPool: string[]): DayDish[] {
  const result: DayDish[] = []

  for (const item of dishes) {
    if (typeof item === 'string') {
      if (!result.some((d) => d.name.toLowerCase() === item.toLowerCase())) {
        result.push(toDayDish(item, customPool))
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

function normalizeCustomPool(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const result: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const name = item.trim().replace(/\s+/g, ' ')
    if (!name) continue
    if (result.some((dish) => dish.toLowerCase() === name.toLowerCase())) continue
    // Skip anything already in the built-in list.
    if (ULAM_LIST.some((dish) => dish.toLowerCase() === name.toLowerCase())) {
      continue
    }
    result.push(name)
  }
  return result
}

/**
 * Migrates older history shapes into DailyUlamEntry[] with DayDish sources.
 */
function migrateHistory(
  rawHistory: unknown[],
  customPool: string[],
): DailyUlamEntry[] {
  if (rawHistory.length === 0) return []

  if (rawHistory.every(isDailyEntry)) {
    return (rawHistory as { date: string; dishes: unknown[] }[]).map(
      (entry) => ({
        date: entry.date,
        dishes: normalizeDishes(entry.dishes, customPool),
      }),
    )
  }

  if (rawHistory.every(isLegacyEntry)) {
    const byDate = new Map<string, DayDish[]>()
    const chronological = [...(rawHistory as LegacySavedUlam[])].reverse()

    for (const item of chronological) {
      const existing = byDate.get(item.date) ?? []
      if (!existing.some((d) => d.name.toLowerCase() === item.name.toLowerCase())) {
        existing.push(toDayDish(item.name, customPool))
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
 * Loads the diary from localStorage (source of truth for Current Ulam).
 * Migrates legacy history shapes when needed.
 */
export function loadState(): UlamDiaryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { history: [], excludedDishes: [], customPool: [] }

    const parsed = JSON.parse(raw) as Partial<UlamDiaryState>
    const customPool = normalizeCustomPool(parsed.customPool)
    const history = Array.isArray(parsed.history)
      ? migrateHistory(parsed.history, customPool)
      : []

    return {
      history,
      excludedDishes: Array.isArray(parsed.excludedDishes)
        ? parsed.excludedDishes
        : [],
      customPool,
    }
  } catch {
    return { ...EMPTY_STATE, history: [], excludedDishes: [], customPool: [] }
  }
}

/**
 * Saves the full diary state to localStorage immediately.
 * Today's Current Ulam lives in history under today's date key.
 */
export function saveState(state: UlamDiaryState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
