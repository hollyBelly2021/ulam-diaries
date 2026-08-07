import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { PoolAddResult } from '../types'
import styles from './WriteOwnUlam.module.css'

interface WriteOwnUlamProps {
  onAddToToday: (rawName: string) => boolean
  onAddToPool: (rawName: string) => PoolAddResult
}

/**
 * Subtle write icon under the date. Opens a small form to type a custom ulam.
 */
export function WriteOwnUlam({ onAddToToday, onAddToPool }: WriteOwnUlamProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [plusPulse, setPlusPulse] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const inputId = useId()

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
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return

    const added = onAddToToday(trimmed)
    if (added) close()
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
            <input
              id={inputId}
              ref={inputRef}
              className={styles.input}
              type="text"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                if (message) setMessage(null)
              }}
              placeholder="e.g. Chicken Adobo"
              autoComplete="off"
              maxLength={80}
            />
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
