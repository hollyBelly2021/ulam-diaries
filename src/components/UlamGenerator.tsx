import { SwipeableDishItem } from './SwipeableDishItem'
import { UlamResult } from './UlamResult'
import styles from './UlamGenerator.module.css'

interface UlamGeneratorProps {
  suggestion: string | null
  /** Dishes already accepted for today (may be empty). */
  todaysDishes: string[]
  allTried: boolean
  onGenerate: () => void
  onAddAnother: () => void
  onReject: () => void
  onAccept: () => void
  onDismissSuggestion: () => void
  onRemoveTodayDish: (dish: string) => void
}

/**
 * Main interaction area:
 * - Initial: "Ulam for Today" button
 * - Suggesting: dish + reject/accept (keeps today's list visible)
 * - Saved today: Current Ulam of the Day + Add Another Ulam
 * - Exhausted list: all-tried message
 */
export function UlamGenerator({
  suggestion,
  todaysDishes,
  allTried,
  onGenerate,
  onAddAnother,
  onReject,
  onAccept,
  onDismissSuggestion,
  onRemoveTodayDish,
}: UlamGeneratorProps) {
  const hasToday = todaysDishes.length > 0

  return (
    <section className={styles.section} aria-live="polite">
      {hasToday && (
        <div className={styles.currentBlock}>
          <h2 className={styles.currentTitle}>Current Ulam of the Day</h2>
          <ul className={styles.currentList}>
            {todaysDishes.map((dish, index) => (
              <SwipeableDishItem
                key={dish}
                dish={dish}
                index={index}
                onDelete={onRemoveTodayDish}
              />
            ))}
          </ul>
        </div>
      )}

      {suggestion ? (
        <UlamResult
          dishName={suggestion}
          onReject={onReject}
          onAccept={onAccept}
          onClose={hasToday ? onDismissSuggestion : undefined}
        />
      ) : allTried ? (
        <p className={styles.emptyMessage}>
          You&apos;ve tried every ulam in the diary!
        </p>
      ) : hasToday ? (
        <button
          type="button"
          className={styles.addAnotherButton}
          onClick={onAddAnother}
        >
          Add Another Ulam
        </button>
      ) : (
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onGenerate}
        >
          Ulam for Today
        </button>
      )}
    </section>
  )
}
