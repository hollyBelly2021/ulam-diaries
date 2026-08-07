/**
 * Picks a random dish from the available list.
 * Avoids suggesting the same dish twice in a row when other options exist.
 */
export function pickRandomDish(
  available: string[],
  previousSuggestion: string | null,
): string | null {
  if (available.length === 0) return null

  // If only one dish left, we have to return it even if it was just shown.
  if (available.length === 1) return available[0]

  let candidates = available
  if (previousSuggestion) {
    const withoutPrevious = available.filter((d) => d !== previousSuggestion)
    if (withoutPrevious.length > 0) {
      candidates = withoutPrevious
    }
  }

  const index = Math.floor(Math.random() * candidates.length)
  return candidates[index]
}
