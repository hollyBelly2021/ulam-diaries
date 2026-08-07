import { ULAM_LIST } from '../data/dishes'
import type { DayDish, DishSource } from '../types'

/** Trim and collapse extra spaces. */
export function normalizeDishInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** Built-in list plus any user-added pool dishes. */
export function getFullDishPool(customPool: string[] = []): string[] {
  return [...ULAM_LIST, ...customPool]
}

/** Case-insensitive lookup against a dish pool. */
export function findInDishPool(
  input: string,
  pool: string[],
): string | null {
  const key = normalizeDishInput(input).toLowerCase()
  if (!key) return null
  return pool.find((dish) => dish.toLowerCase() === key) ?? null
}

/** Case-insensitive lookup against the built-in list only. */
export function findPredefinedDish(input: string): string | null {
  return findInDishPool(input, ULAM_LIST)
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

export function isExcluded(excludedDishes: string[], dish: string): boolean {
  return excludedDishes.some((name) => sameDishName(name, dish))
}
