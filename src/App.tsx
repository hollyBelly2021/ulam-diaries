import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { UlamGenerator } from './components/UlamGenerator'
import { UlamHistory } from './components/UlamHistory'
import { ResetButton } from './components/ResetButton'
import { ULAM_LIST } from './data/dishes'
import type { DailyUlamEntry, UlamDiaryState } from './types'
import { getTodayKey } from './utils/dates'
import { pickRandomDish } from './utils/random'
import { loadState, saveState } from './utils/storage'

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

  const todaysDishes = todaysEntry?.dishes ?? []

  // Available pool excludes accepted dishes (and always today's picks as a safeguard).
  const availableDishes = useMemo(
    () =>
      ULAM_LIST.filter(
        (dish) =>
          !state.excludedDishes.includes(dish) && !todaysDishes.includes(dish),
      ),
    [state.excludedDishes, todaysDishes],
  )

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

  // Reject keeps the dish available and immediately picks another option.
  function handleReject() {
    if (!suggestion) return
    generateSuggestion(suggestion)
  }

  // Accept appends the dish to today's list and removes it from the future pool.
  function handleAccept() {
    if (!suggestion) return
    const dish = suggestion

    setState((prev) => {
      const existing = prev.history.find((entry) => entry.date === todayKey)

      // Each dish should only appear once for the current day.
      if (existing?.dishes.includes(dish)) {
        return prev
      }

      let history: DailyUlamEntry[]

      if (existing) {
        history = prev.history.map((entry) =>
          entry.date === todayKey
            ? { ...entry, dishes: [...entry.dishes, dish] }
            : entry,
        )
      } else {
        history = [{ date: todayKey, dishes: [dish] }, ...prev.history]
      }

      return {
        history,
        excludedDishes: prev.excludedDishes.includes(dish)
          ? prev.excludedDishes
          : [...prev.excludedDishes, dish],
      }
    })

    setSuggestion(null)
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
   * Removes one dish from a previous day and returns it to the random pool.
   * Today's entry is never passed here, so today's selection stays intact.
   */
  function handleDeleteDish(date: string, dish: string) {
    if (date === todayKey) return

    setState((prev) => {
      const history = prev.history
        .map((entry) => {
          if (entry.date !== date) return entry
          return {
            ...entry,
            dishes: entry.dishes.filter((name) => name !== dish),
          }
        })
        .filter((entry) => entry.dishes.length > 0)

      const stillSaved = history.some((entry) => entry.dishes.includes(dish))

      return {
        history,
        excludedDishes: stillSaved
          ? prev.excludedDishes
          : prev.excludedDishes.filter((name) => name !== dish),
      }
    })
  }

  /**
   * Removes a dish from today's list and returns it to the random pool.
   * If every dish is removed, the "Ulam for Today" button shows again.
   */
  function handleRemoveTodayDish(dish: string) {
    setState((prev) => {
      const history = prev.history
        .map((entry) => {
          if (entry.date !== todayKey) return entry
          return {
            ...entry,
            dishes: entry.dishes.filter((name) => name !== dish),
          }
        })
        .filter((entry) => entry.dishes.length > 0)

      const stillSaved = history.some((entry) => entry.dishes.includes(dish))

      return {
        history,
        excludedDishes: stillSaved
          ? prev.excludedDishes
          : prev.excludedDishes.filter((name) => name !== dish),
      }
    })

    // Clear a matching open suggestion so it cannot be accepted again by mistake.
    setSuggestion((current) => (current === dish ? null : current))
  }

  return (
    <div className="app">
      <Header />
      <UlamGenerator
        suggestion={suggestion}
        todaysDishes={todaysDishes}
        allTried={allTried}
        onGenerate={handleGenerate}
        onAddAnother={handleAddAnother}
        onReject={handleReject}
        onAccept={handleAccept}
        onRemoveTodayDish={handleRemoveTodayDish}
      />
      <UlamHistory entries={previousEntries} onDeleteDish={handleDeleteDish} />
      <ResetButton onReset={handleResetList} />
    </div>
  )
}
