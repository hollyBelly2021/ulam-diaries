import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import styles from './UlamGenerator.module.css'

interface SwipeableDishItemProps {
  dish: string
  index: number
  disabled?: boolean
  onDelete: (dish: string) => void
}

const DELETE_THRESHOLD = 72

/**
 * Current-ulam row: swipe (or mouse-drag) left past a threshold to delete.
 */
export function SwipeableDishItem({
  dish,
  index,
  disabled = false,
  onDelete,
}: SwipeableDishItemProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const tracking = useRef(false)
  const axisLocked = useRef<'none' | 'x' | 'y'>('none')
  const latestOffset = useRef(0)
  const deleted = useRef(false)

  function finishDelete() {
    if (deleted.current) return
    deleted.current = true
    onDelete(dish)
  }

  function beginLeave() {
    setIsDragging(false)
    setIsLeaving(true)
    setOffsetX(-Math.max(window.innerWidth * 0.9, 320))
    // Fallback if transitionend does not fire.
    window.setTimeout(finishDelete, 260)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLLIElement>) {
    if (disabled || isLeaving) return
    tracking.current = true
    axisLocked.current = 'none'
    startX.current = event.clientX
    startY.current = event.clientY
    latestOffset.current = 0
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLLIElement>) {
    if (!tracking.current || isLeaving) return

    const dx = event.clientX - startX.current
    const dy = event.clientY - startY.current

    if (axisLocked.current === 'none') {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axisLocked.current === 'y') {
        tracking.current = false
        setIsDragging(false)
        setOffsetX(0)
        return
      }
    }

    if (axisLocked.current !== 'x') return

    // Only allow dragging left.
    const next = Math.min(0, dx)
    latestOffset.current = next
    setOffsetX(next)
  }

  function handlePointerUp() {
    if (!tracking.current && !isDragging) return
    tracking.current = false

    if (isLeaving) return

    if (Math.abs(latestOffset.current) >= DELETE_THRESHOLD) {
      beginLeave()
      return
    }

    setIsDragging(false)
    setOffsetX(0)
    latestOffset.current = 0
  }

  return (
    <li
      className={`${styles.currentItem}${
        isLeaving ? ` ${styles.currentItemLeaving}` : ''
      }`}
      style={{
        transform: `translateX(${offsetX}px)`,
        transition: isDragging ? 'none' : 'transform 220ms ease, opacity 220ms ease',
        animationDelay: isLeaving ? undefined : `${Math.min(index, 6) * 40}ms`,
        opacity: isLeaving ? 0 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTransitionEnd={(event) => {
        if (
          isLeaving &&
          event.propertyName === 'transform' &&
          event.target === event.currentTarget
        ) {
          finishDelete()
        }
      }}
      aria-label={`${dish}. Swipe left to remove.`}
    >
      <span className={styles.currentName}>{dish}</span>
    </li>
  )
}
