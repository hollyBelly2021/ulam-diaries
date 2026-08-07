import { formatHeaderDate } from '../utils/dates'
import { WriteOwnUlam } from './WriteOwnUlam'
import styles from './Header.module.css'

interface HeaderProps {
  onAddCustomUlam: (rawName: string) => boolean
}

export function Header({ onAddCustomUlam }: HeaderProps) {
  const { weekday, fullDate } = formatHeaderDate()

  return (
    <header className={styles.header}>
      <h1 className={styles.brand}>Ulam Diary</h1>
      <div className={styles.dateBlock}>
        <p className={styles.weekday}>{weekday}</p>
        <p className={styles.fullDate}>{fullDate}</p>
      </div>
      <WriteOwnUlam onAdd={onAddCustomUlam} />
    </header>
  )
}
