import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { PoolAddResult } from '../types'
import styles from './WriteOwnUlam.module.css'

const MAX_SUGGESTIONS = 6

interface WriteOwnUlamProps {
  /** Built-in + custom dishes available for suggestions. */
  dishPool: string[]
  /** Dish names already saved for today (excluded from suggestions). */
  todaysDishes: string[]
  onAddToToday: (rawName: string) => boolean
  onAddToPool: (rawName: string) => PoolAddResult
}

function getSuggestions(
  query: string,
  dishPool: string[],
  todaysDishes: string[],
): string[] {
  const key = query.trim().toLowerCase()
  if (!key) return []

  const todayLower = new Set(todaysDishes.map((dish) => dish.toLowerCase()))

  return dishPool
    .filter(
      (dish) =>
        !todayLower.has(dish.toLowerCase()) &&
        dish.toLowerCase().includes(key),
    )
    .slice(0, MAX_SUGGESTIONS)
}

/**
 * Subtle write icon under the date. Opens a small form to type a custom ulam.
 */
export function WriteOwnUlam({
  dishPool,
  todaysDishes,
  onAddToToday,
  onAddToPool,
}: WriteOwnUlamProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [plusPulse, setPlusPulse] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const inputId = useId()
  const listId = useId()

  const suggestions = useMemo(
    () => getSuggestions(value, dishPool, todaysDishes),
    [value, dishPool, todaysDishes],
  )

  const dropdownOpen = showSuggestions && suggestions.length > 0

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  function close() {
    setOpen(false)
    setValue('')
    setMessage(null)
    setPlusPulse(false)
    setShowSuggestions(true)
  }

  function selectSuggestion(dish: string) {
    setValue(dish)
    setShowSuggestions(false)
    setMessage(null)
    inputRef.current?.focus()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return

    const added = onAddToToday(trimmed)
    if (added) close()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && dropdownOpen) {
      event.preventDefault()
      setShowSuggestions(false)
      return
    }

    // Enter fills the first suggestion instead of submitting while the list is open.
    if (event.key === 'Enter' && dropdownOpen) {
      event.preventDefault()
      selectSuggestion(suggestions[0])
    }
  }

  function handleAddToPool() {
    const trimmed = value.trim()
    if (!trimmed) return

    const result = onAddToPool(trimmed)
    if (result.status === 'empty') return

    if (result.status === 'added') {
      setMessage(`✓ Added "${result.name}" to your ulam list.`)
      setPlusPulse(true)
      window.setTimeout(() => setPlusPulse(false), 420)
    } else {
      setMessage(`"${result.name}" is already in your ulam list.`)
    }
  }

  return (
    <div className={styles.wrapper}>
      {!open ? (
        <button
          type="button"
          className={styles.writeButton}
          aria-label="Write your own ulam"
          onClick={() => setOpen(true)}
        >
          <svg
            className={styles.writeIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0-2.1-2.1L5.9 17.9 4 20z" />
            <path d="M13.5 6.5l2.1 2.1" />
          </svg>
        </button>
      ) : (
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          aria-labelledby={titleId}
        >
          <label id={titleId} className={styles.label} htmlFor={inputId}>
            Write your own ulam
          </label>

          <div className={styles.inputRow}>
            <div className={styles.inputWrap}>
              <input
                id={inputId}
                ref={inputRef}
                className={styles.input}
                type="text"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  setShowSuggestions(true)
                  if (message) setMessage(null)
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder="e.g. Chicken Adobo"
                autoComplete="off"
                maxLength={80}
                role="combobox"
                aria-expanded={dropdownOpen}
                aria-controls={listId}
                aria-autocomplete="list"
              />

              {dropdownOpen && (
                <ul
                  id={listId}
                  className={styles.suggestions}
                  role="listbox"
                  aria-label="Dish suggestions"
                >
                  {suggestions.map((dish, index) => (
                    <li key={dish} role="option" aria-selected={index === 0}>
                      <button
                        type="button"
                        className={styles.suggestionItem}
                        onMouseDown={(event) => {
                          // Prevent input blur before the click applies.
                          event.preventDefault()
                        }}
                        onClick={() => selectSuggestion(dish)}
                      >
                        {dish}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              className={`${styles.plusButton}${
                plusPulse ? ` ${styles.plusPulse}` : ''
              }`}
              onClick={handleAddToPool}
              disabled={!value.trim()}
              aria-label="Add dish to ulam list"
              title="Add to ulam list"
            >
              <svg
                className={styles.plusIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {message && (
            <p className={styles.message} role="status" aria-live="polite">
              {message}
            </p>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={close}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.add}
              disabled={!value.trim()}
            >
              Add to Today
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
