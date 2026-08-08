import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { UlamGenerator } from './components/UlamGenerator'
import { UlamHistory } from './components/UlamHistory'
import { ResetButton } from './components/ResetButton'
import type {
  DailyUlamEntry,
  DayDish,
  PoolAddResult,
  UlamDiaryState,
} from './types'
import { getTodayKey } from './utils/dates'
import {
  createDayDish,
  dayHasDish,
  findInDishPool,
  getFullDishPool,
  isExcluded,
  normalizeDishInput,
  sameDishName,
} from './utils/dishes'
import { pickRandomDish } from './utils/random'
import { loadState, saveState } from './utils/storage'

function appendDishToToday(
  history: DailyUlamEntry[],
  todayKey: string,
  dish: DayDish,
): DailyUlamEntry[] {
  const existing = history.find((entry) => entry.date === todayKey)

  if (existing) {
    if (dayHasDish(existing.dishes, dish.name)) return history
    return history.map((entry) =>
      entry.date === todayKey
        ? { ...entry, dishes: [...entry.dishes, dish] }
        : entry,
    )
  }

  return [{ date: todayKey, dishes: [dish] }, ...history]
}

function removeDishFromHistory(
  history: DailyUlamEntry[],
  date: string,
  dishName: string,
): { history: DailyUlamEntry[]; removed: DayDish | null } {
  let removed: DayDish | null = null

  const next = history
    .map((entry) => {
      if (entry.date !== date) return entry
      const target = entry.dishes.find((dish) =>
        sameDishName(dish.name, dishName),
      )
      if (target) removed = target
      return {
        ...entry,
        dishes: entry.dishes.filter(
          (dish) => !sameDishName(dish.name, dishName),
        ),
      }
    })
    .filter((entry) => entry.dishes.length > 0)

  return { history: next, removed }
}

function stillSavedElsewhere(
  history: DailyUlamEntry[],
  dishName: string,
): boolean {
  return history.some((entry) => dayHasDish(entry.dishes, dishName))
}

/**
 * Pool dishes (built-in or custom) should return to random generation
 * when removed from a day's list and not saved on another day.
 */
function shouldReturnToPool(
  dishName: string,
  customPool: string[],
  history: DailyUlamEntry[],
): boolean {
  const inPool = Boolean(
    findInDishPool(dishName, getFullDishPool(customPool)),
  )
  return inPool && !stillSavedElsewhere(history, dishName)
}

export default function App() {
  // localStorage is the source of truth for Current Ulam / history / pool.
  const [state, setState] = useState<UlamDiaryState>(() => loadState())
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [previousSuggestion, setPreviousSuggestion] = useState<string | null>(
    null,
  )

  // Keep a backup sync in case any update path misses an immediate write.
  useEffect(() => {
    saveState(state)
  }, [state])

  /**
   * Update React state and write localStorage in the same turn
   * so Current Ulam never drifts after refresh.
   */
  function commitState(
    updater: (prev: UlamDiaryState) => UlamDiaryState,
  ): UlamDiaryState {
    let nextState = state
    setState((prev) => {
      const next = updater(prev)
      nextState = next
      if (next !== prev) {
        saveState(next)
      }
      return next
    })
    return nextState
  }

  const todayKey = getTodayKey()

  const todaysEntry = useMemo(
    () => state.history.find((entry) => entry.date === todayKey) ?? null,
    [state.history, todayKey],
  )

  const todaysDishes = useMemo(
    () => todaysEntry?.dishes ?? [],
    [todaysEntry],
  )
  const todaysDishNames = useMemo(
    () => todaysDishes.map((dish) => dish.name),
    [todaysDishes],
  )

  const dishPool = useMemo(
    () => getFullDishPool(state.customPool),
    [state.customPool],
  )

  const availableDishes = useMemo(() => {
    const todayLower = new Set(
      todaysDishes.map((dish) => dish.name.toLowerCase()),
    )

    return dishPool.filter(
      (dish) =>
        !isExcluded(state.excludedDishes, dish) &&
        !todayLower.has(dish.toLowerCase()),
    )
  }, [state.excludedDishes, dishPool, todaysDishes])

  const previousEntries = useMemo(
    () => state.history.filter((entry) => entry.date !== todayKey),
    [state.history, todayKey],
  )

  const allTried = availableDishes.length === 0

  function generateSuggestion(avoid: string | null = previousSuggestion) {
    const next = pickRandomDish(availableDishes, avoid)
    setSuggestion(next)
    if (next) setPreviousSuggestion(next)
  }

  function handleGenerate() {
    generateSuggestion(null)
  }

  function handleAddAnother() {
    generateSuggestion(null)
  }

  function handleDismissSuggestion() {
    setSuggestion(null)
  }

  function handleReject() {
    if (!suggestion) return
    generateSuggestion(suggestion)
  }

  // Accept → append to today's Current Ulam and persist immediately.
  function handleAccept() {
    if (!suggestion) return
    const dishName = suggestion

    commitState((prev) => {
      const existing = prev.history.find((entry) => entry.date === todayKey)
      if (existing && dayHasDish(existing.dishes, dishName)) return prev

      const dish = createDayDish(dishName, 'generated')
      return {
        ...prev,
        history: appendDishToToday(prev.history, todayKey, dish),
        excludedDishes: isExcluded(prev.excludedDishes, dishName)
          ? prev.excludedDishes
          : [...prev.excludedDishes, dishName],
      }
    })

    setSuggestion(null)
  }

  /**
   * Adds a typed ulam to today's list and persists immediately.
   * If it matches the pool, exclude it from generation.
   */
  function handleAddCustomUlam(rawName: string): boolean {
    const trimmed = normalizeDishInput(rawName)
    if (!trimmed) return false

    let added = false
    let displayName = trimmed

    commitState((prev) => {
      const poolMatch = findInDishPool(
        trimmed,
        getFullDishPool(prev.customPool),
      )
      displayName = poolMatch ?? trimmed
      const source = poolMatch ? 'matched' : 'custom'

      const existing = prev.history.find((entry) => entry.date === todayKey)
      if (existing && dayHasDish(existing.dishes, displayName)) {
        return prev
      }

      added = true
      const dish = createDayDish(displayName, source)
      const history = appendDishToToday(prev.history, todayKey, dish)

      if (poolMatch && !isExcluded(prev.excludedDishes, poolMatch)) {
        return {
          ...prev,
          history,
          excludedDishes: [...prev.excludedDishes, poolMatch],
        }
      }

      return { ...prev, history }
    })

    if (added) {
      setSuggestion((current) =>
        current && sameDishName(current, displayName) ? null : current,
      )
    }

    return added
  }

  function handleAddToPool(rawName: string): PoolAddResult {
    const trimmed = normalizeDishInput(rawName)
    if (!trimmed) return { status: 'empty' }

    let result: PoolAddResult = { status: 'empty' }

    commitState((prev) => {
      const pool = getFullDishPool(prev.customPool)
      const existing = findInDishPool(trimmed, pool)

      if (existing) {
        result = { status: 'exists', name: existing }
        return prev
      }

      result = { status: 'added', name: trimmed }
      return {
        ...prev,
        customPool: [...prev.customPool, trimmed],
      }
    })

    return result
  }

  function handleResetList() {
    commitState((prev) => ({
      ...prev,
      excludedDishes: [],
    }))
    setSuggestion(null)
    setPreviousSuggestion(null)
  }

  function handleDeleteDish(date: string, dishName: string) {
    if (date === todayKey) return

    commitState((prev) => {
      const { history, removed } = removeDishFromHistory(
        prev.history,
        date,
        dishName,
      )
      if (!removed) return { ...prev, history }

      if (!shouldReturnToPool(removed.name, prev.customPool, history)) {
        return { ...prev, history }
      }

      return {
        ...prev,
        history,
        excludedDishes: prev.excludedDishes.filter(
          (name) => !sameDishName(name, removed.name),
        ),
      }
    })
  }

  /**
   * Swipe-remove from Current Ulam of the Day:
   * update UI + localStorage immediately so a refresh cannot restore it.
   */
  function handleRemoveTodayDish(dishName: string) {
    commitState((prev) => {
      const { history, removed } = removeDishFromHistory(
        prev.history,
        todayKey,
        dishName,
      )
      if (!removed) return { ...prev, history }

      if (!shouldReturnToPool(removed.name, prev.customPool, history)) {
        return { ...prev, history }
      }

      return {
        ...prev,
        history,
        excludedDishes: prev.excludedDishes.filter(
          (name) => !sameDishName(name, removed.name),
        ),
      }
    })

    setSuggestion((current) =>
      current && sameDishName(current, dishName) ? null : current,
    )
  }

  return (
    <div className="app">
      <Header
        dishPool={dishPool}
        todaysDishes={todaysDishNames}
        onAddCustomUlam={handleAddCustomUlam}
        onAddToPool={handleAddToPool}
      />
      <UlamGenerator
        suggestion={suggestion}
        todaysDishes={todaysDishNames}
        allTried={allTried}
        onGenerate={handleGenerate}
        onAddAnother={handleAddAnother}
        onReject={handleReject}
        onAccept={handleAccept}
        onDismissSuggestion={handleDismissSuggestion}
        onRemoveTodayDish={handleRemoveTodayDish}
      />
      <UlamHistory entries={previousEntries} onDeleteDish={handleDeleteDish} />
      <ResetButton onReset={handleResetList} />
    </div>
  )
}
