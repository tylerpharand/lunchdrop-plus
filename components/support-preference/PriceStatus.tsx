import { useEffect, useState, type ReactElement } from 'react'

const STATUS_HOLD_MS = 620
const STATUS_LEAVE_MS = 200

export function PriceStatus({
  pending,
  done,
}: {
  pending: boolean
  done: number
}): ReactElement | null {
  const [phase, setPhase] = useState<'idle' | 'spin' | 'check' | 'leave' | 'dismiss'>('idle')
  const [seenDone, setSeenDone] = useState(0)

  if (pending && phase !== 'spin') {
    setPhase('spin')
  } else if (!pending && phase === 'spin') {
    if (done > seenDone) {
      setSeenDone(done)
      setPhase('check')
    } else {
      setPhase('dismiss')
    }
  }

  useEffect(() => {
    if (phase === 'check') {
      const timer = window.setTimeout(() => {
        setPhase('leave')
      }, STATUS_HOLD_MS)
      return () => {
        window.clearTimeout(timer)
      }
    }
    if (phase === 'leave' || phase === 'dismiss') {
      const timer = window.setTimeout(() => {
        setPhase('idle')
      }, STATUS_LEAVE_MS)
      return () => {
        window.clearTimeout(timer)
      }
    }
    return undefined
  }, [phase])

  if (phase === 'idle') return null

  const spinning = phase === 'spin' || phase === 'dismiss' || phase === 'check'
  const showingCheck = phase === 'check' || phase === 'leave'

  return (
    <span
      className="grid h-3.5 w-3.5 place-items-center overflow-visible"
      role="status"
      aria-label={showingCheck ? 'Support updated' : 'Updating this order'}
      data-lunchbot-support-pending={phase === 'spin' ? 'true' : undefined}
      data-lunchbot-support-done={showingCheck ? 'true' : undefined}
    >
      {spinning ? (
        <span
          className={`col-start-1 row-start-1 ${
            phase === 'spin'
              ? 'lunchbot-mark-in'
              : phase === 'check'
                ? 'lunchbot-mark-swap'
                : 'lunchbot-mark-out'
          }`}
        >
          <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-200 border-t-[#009900] motion-reduce:animate-none" />
        </span>
      ) : null}
      {showingCheck ? (
        <svg
          viewBox="0 0 16 16"
          className={`col-start-1 row-start-1 h-3.5 w-3.5 fill-none stroke-[#009900] stroke-2 ${
            phase === 'leave' ? 'lunchbot-mark-out' : 'lunchbot-check-in'
          }`}
          aria-hidden="true"
        >
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  )
}
