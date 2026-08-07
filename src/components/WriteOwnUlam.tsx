import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import styles from './WriteOwnUlam.module.css'

interface WriteOwnUlamProps {
  onAdd: (rawName: string) => boolean
}

/**
 * Subtle write icon under the date. Opens a small form to type a custom ulam.
 */
export function WriteOwnUlam({ onAdd }: WriteOwnUlamProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
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
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return

    const added = onAdd(trimmed)
    if (added) close()
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
          <input
            id={inputId}
            ref={inputRef}
            className={styles.input}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="e.g. Chicken Adobo"
            autoComplete="off"
            maxLength={80}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.add}
              disabled={!value.trim()}
            >
              Add
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
