import { useState } from 'react'
import type { DailyUlamEntry, DayDish } from '../types'
import { formatHistoryDate } from '../utils/dates'
import { restoresToPool } from '../utils/dishes'
import styles from './UlamHistory.module.css'

interface PendingDelete {
  date: string
  dish: DayDish
}

interface UlamHistoryProps {
  /** Previous days only (excludes today's entry). */
  entries: DailyUlamEntry[]
  onDeleteDish: (date: string, dishName: string) => void
}

export function UlamHistory({ entries, onDeleteDish }: UlamHistoryProps) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  return (
    <section className={styles.section} aria-labelledby="previous-ulam-heading">
      <h2 id="previous-ulam-heading" className={styles.title}>
        Previous Ulam
      </h2>

      {entries.length === 0 ? (
        <p className={styles.empty}>No previous ulam yet.</p>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.date} className={styles.item}>
              <p className={styles.date}>{formatHistoryDate(entry.date)}</p>
              <ul className={styles.dishList}>
                {entry.dishes.map((dish) => (
                  <li
                    key={`${entry.date}-${dish.name}`}
                    className={styles.dishRow}
                  >
                    <span className={styles.name}>{dish.name}</span>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      aria-label={`Remove ${dish.name} from diary`}
                      onClick={() =>
                        setPendingDelete({ date: entry.date, dish })
                      }
                    >
                      <svg
                        className={styles.deleteIcon}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {pendingDelete && (
        <div
          className={styles.dialog}
          role="alertdialog"
          aria-labelledby="delete-ulam-title"
          aria-modal="true"
        >
          <p id="delete-ulam-title" className={styles.message}>
            {restoresToPool(pendingDelete.dish)
              ? `Remove ${pendingDelete.dish.name} from your diary? It will be available again in future suggestions.`
              : `Remove ${pendingDelete.dish.name} from your diary?`}
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirm}
              onClick={() => {
                onDeleteDish(pendingDelete.date, pendingDelete.dish.name)
                setPendingDelete(null)
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
