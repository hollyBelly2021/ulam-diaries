import { ULAM_LIST } from '../data/dishes'
import type { DayDish, DishSource } from '../types'

/** Trim and collapse extra spaces. */
export function normalizeDishInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** Case-insensitive lookup against the predefined ulam pool. */
export function findPredefinedDish(input: string): string | null {
  const key = normalizeDishInput(input).toLowerCase()
  if (!key) return null
  return ULAM_LIST.find((dish) => dish.toLowerCase() === key) ?? null
}

/** True when this entry should return to the random pool on remove. */
export function restoresToPool(dish: DayDish): boolean {
  return dish.source === 'generated' || dish.source === 'matched'
}

/** Case-insensitive name match. */
export function sameDishName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

export function dayHasDish(dishes: DayDish[], name: string): boolean {
  return dishes.some((dish) => sameDishName(dish.name, name))
}

export function createDayDish(name: string, source: DishSource): DayDish {
  return { name, source }
}
