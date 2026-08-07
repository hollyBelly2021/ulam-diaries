/** All dishes accepted for a single calendar day. */
export interface DailyUlamEntry {
  /** Local calendar date in YYYY-MM-DD form. */
  date: string
  /** Dishes chosen that day (unique, in selection order). */
  dishes: string[]
}

/** Everything we persist in localStorage. */
export interface UlamDiaryState {
  /** Completed / saved days (newest first). */
  history: DailyUlamEntry[]
  /** Dish names that should not appear in random suggestions anymore. */
  excludedDishes: string[]
}

/** Legacy single-dish history shape (pre multi-ulam update). */
export interface LegacySavedUlam {
  id: string
  name: string
  date: string
}
