/** How a dish was added to a day's list. */
export type DishSource = 'generated' | 'custom' | 'matched'

/** A single dish saved for a day, with origin for pool restore rules. */
export interface DayDish {
  name: string
  /**
   * - generated: accepted from the random generator
   * - matched: typed manually, matched a predefined dish
   * - custom: typed manually, not in the predefined pool
   */
  source: DishSource
}

/** All dishes accepted for a single calendar day. */
export interface DailyUlamEntry {
  /** Local calendar date in YYYY-MM-DD form. */
  date: string
  /** Dishes chosen that day (unique by name, in selection order). */
  dishes: DayDish[]
}

/** Everything we persist in localStorage. */
export interface UlamDiaryState {
  /** Completed / saved days (newest first). */
  history: DailyUlamEntry[]
  /** Predefined dish names that should not appear in random suggestions. */
  excludedDishes: string[]
}

/** Legacy single-dish history shape (pre multi-ulam update). */
export interface LegacySavedUlam {
  id: string
  name: string
  date: string
}
