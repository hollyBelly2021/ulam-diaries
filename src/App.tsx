import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { UlamGenerator } from './components/UlamGenerator'
import { UlamHistory } from './components/UlamHistory'
import { ResetButton } from './components/ResetButton'
import { ULAM_LIST } from './data/dishes'
import type { DailyUlamEntry, DayDish, UlamDiaryState } from './types'
import { getTodayKey } from './utils/dates'
import {
  createDayDish,
  dayHasDish,
  findPredefinedDish,
  normalizeDishInput,
  restoresToPool,
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
      const target = entry.dishes.find((dish) => sameDishName(dish.name, dishName))
      if (target) removed = target
      return {
        ...entry,
        dishes: entry.dishes.filter((dish) => !sameDishName(dish.name, dishName)),
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

export default function App() {
  // Load saved diary from localStorage on first render.
  const [state, setState] = useState<UlamDiaryState>(() => loadState())
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [previousSuggestion, setPreviousSuggestion] = useState<string | null>(
    null,
  )

  // Persist whenever history or excluded dishes change.
  useEffect(() => {
    saveState(state)
  }, [state])

  const todayKey = getTodayKey()

  // Check whether today already has saved meals.
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

  // Available pool excludes accepted predefined dishes (and today's picks).
  const availableDishes = useMemo(() => {
    const todayLower = new Set(
      todaysDishes.map((dish) => dish.name.toLowerCase()),
    )

    return ULAM_LIST.filter(
      (dish) =>
        !state.excludedDishes.includes(dish) &&
        !todayLower.has(dish.toLowerCase()),
    )
  }, [state.excludedDishes, todaysDishes])

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

  // Same as generate — used after the first dish is already saved.
  function handleAddAnother() {
    generateSuggestion(null)
  }

  // Exit Add Another mode without accepting or rejecting the suggestion.
  function handleDismissSuggestion() {
    setSuggestion(null)
  }

  // Reject keeps the dish available and immediately picks another option.
  function handleReject() {
    if (!suggestion) return
    generateSuggestion(suggestion)
  }

  // Accept appends a generated dish and removes it from the future pool.
  function handleAccept() {
    if (!suggestion) return
    const dishName = suggestion

    setState((prev) => {
      const existing = prev.history.find((entry) => entry.date === todayKey)
      if (existing && dayHasDish(existing.dishes, dishName)) return prev

      const dish = createDayDish(dishName, 'generated')
      return {
        history: appendDishToToday(prev.history, todayKey, dish),
        excludedDishes: prev.excludedDishes.includes(dishName)
          ? prev.excludedDishes
          : [...prev.excludedDishes, dishName],
      }
    })

    setSuggestion(null)
  }

  /**
   * Adds a typed ulam. Matches the predefined pool case-insensitively.
   * Returns false when empty or already on today's list.
   */
  function handleAddCustomUlam(rawName: string): boolean {
    const trimmed = normalizeDishInput(rawName)
    if (!trimmed) return false

    const predefined = findPredefinedDish(trimmed)
    const displayName = predefined ?? trimmed
    const source = predefined ? 'matched' : 'custom'

    let added = false

    setState((prev) => {
      const existing = prev.history.find((entry) => entry.date === todayKey)
      if (existing && dayHasDish(existing.dishes, displayName)) {
        return prev
      }

      added = true
      const dish = createDayDish(displayName, source)
      const history = appendDishToToday(prev.history, todayKey, dish)

      // Only exclude from the random pool when it matched a predefined dish.
      if (predefined && !prev.excludedDishes.includes(predefined)) {
        return {
          history,
          excludedDishes: [...prev.excludedDishes, predefined],
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

  // Restores every dish to the available list without clearing diary history.
  function handleResetList() {
    setState((prev) => ({
      ...prev,
      excludedDishes: [],
    }))
    setSuggestion(null)
    setPreviousSuggestion(null)
  }

  /**
   * Removes one dish from a previous day.
   * Predefined dishes return to the pool; pure custom dishes do not.
   */
  function handleDeleteDish(date: string, dishName: string) {
    if (date === todayKey) return

    setState((prev) => {
      const { history, removed } = removeDishFromHistory(
        prev.history,
        date,
        dishName,
      )

      if (!removed || !restoresToPool(removed)) {
        return { ...prev, history }
      }

      if (stillSavedElsewhere(history, removed.name)) {
        return { ...prev, history }
      }

      return {
        history,
        excludedDishes: prev.excludedDishes.filter(
          (name) => !sameDishName(name, removed.name),
        ),
      }
    })
  }

  /**
   * Removes a dish from today's list.
   * If every dish is removed, the "Ulam for Today" button shows again.
   */
  function handleRemoveTodayDish(dishName: string) {
    setState((prev) => {
      const { history, removed } = removeDishFromHistory(
        prev.history,
        todayKey,
        dishName,
      )

      if (!removed || !restoresToPool(removed)) {
        return { ...prev, history }
      }

      if (stillSavedElsewhere(history, removed.name)) {
        return { ...prev, history }
      }

      return {
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
      <Header onAddCustomUlam={handleAddCustomUlam} />
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
