import styles from './UlamResult.module.css'

interface UlamResultProps {
  dishName: string
  onReject: () => void
  onAccept: () => void
}

/** Shows a generated suggestion with reject / accept actions. */
export function UlamResult({ dishName, onReject, onAccept }: UlamResultProps) {
  return (
    <div className={styles.result} key={dishName}>
      <h2 className={styles.dishName}>{dishName}</h2>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.reject}`}
          onClick={onReject}
          aria-label={`Reject ${dishName}`}
        >
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.accept}`}
          onClick={onAccept}
          aria-label={`Choose ${dishName}`}
        >
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
