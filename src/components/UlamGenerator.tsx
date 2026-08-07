import { useState } from 'react'
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
  onRemoveTodayDish,
}: UlamGeneratorProps) {
  // Dish currently playing the fade-out removal animation.
  const [removingDish, setRemovingDish] = useState<string | null>(null)
  const hasToday = todaysDishes.length > 0

  function handleRemoveClick(dish: string) {
    if (removingDish) return
    setRemovingDish(dish)
  }

  function handleRemoveAnimationEnd(dish: string) {
    if (removingDish !== dish) return
    onRemoveTodayDish(dish)
    setRemovingDish(null)
  }

  return (
    <section className={styles.section} aria-live="polite">
      {hasToday && (
        <div className={styles.currentBlock}>
          <h2 className={styles.currentTitle}>Current Ulam of the Day</h2>
          <ul className={styles.currentList}>
            {todaysDishes.map((dish, index) => {
              const isRemoving = removingDish === dish

              return (
                <li
                  key={dish}
                  className={`${styles.currentItem}${
                    isRemoving ? ` ${styles.currentItemLeaving}` : ''
                  }`}
                  style={
                    isRemoving
                      ? undefined
                      : { animationDelay: `${Math.min(index, 6) * 40}ms` }
                  }
                  onAnimationEnd={(event) => {
                    // Only finish removal after this item's fade-out, not child events.
                    if (
                      isRemoving &&
                      event.target === event.currentTarget
                    ) {
                      handleRemoveAnimationEnd(dish)
                    }
                  }}
                >
                  <span className={styles.currentName}>{dish}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    aria-label={`Remove ${dish} from today's ulam`}
                    disabled={Boolean(removingDish)}
                    onClick={() => handleRemoveClick(dish)}
                  >
                    <svg
                      className={styles.removeIcon}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {suggestion ? (
        <UlamResult
          dishName={suggestion}
          onReject={onReject}
          onAccept={onAccept}
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
