import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { SupportPolicy, SupportQuote } from '../lib/support-policy'
import { SupportPreference } from './SupportPreference'

const DIALOG_MS = 200
const SHEET_MS = 320

function closeMotionMs(): number {
  return window.matchMedia('(max-width: 639px)').matches ? SHEET_MS : DIALOG_MS
}

interface SupportModalProps {
  policy: SupportPolicy
  quote: SupportQuote | null
  live: boolean
  pendingMode: SupportPolicy['mode'] | null
  confirmed: { mode: SupportPolicy['mode']; tick: number } | null
  remember: boolean
  onChange: (policy: SupportPolicy) => void
  onRememberChange: (remember: boolean) => void
  onClose: () => void
}

export function SupportModal({
  policy,
  quote,
  live,
  pendingMode,
  confirmed,
  remember,
  onChange,
  onRememberChange,
  onClose,
}: SupportModalProps): ReactElement {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)
  const closeTimer = useRef<number | null>(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [])

  const requestClose = (): void => {
    if (closingRef.current) return
    closingRef.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    setClosing(true)
    closeTimer.current = window.setTimeout(onClose, closeMotionMs())
  }

  return (
    <div className="relative h-full w-full font-sans text-base text-zinc-900 antialiased">
      <style>{`
        .lunchbot-control:focus {
          outline: none;
        }
        .lunchbot-control:focus-visible {
          outline: 2px solid #009900;
          outline-offset: 2px;
        }
        .lunchbot-backdrop-in {
          animation: lunchbot-backdrop-in 200ms ease-out both;
        }
        .lunchbot-backdrop-out {
          animation: lunchbot-backdrop-out 200ms ease-out both;
        }
        .lunchbot-dialog-in {
          animation: lunchbot-dialog-in ${String(DIALOG_MS)}ms ease-out both;
        }
        .lunchbot-dialog-out {
          animation: lunchbot-dialog-out ${String(DIALOG_MS)}ms ease-out both;
        }
        @keyframes lunchbot-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lunchbot-backdrop-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes lunchbot-dialog-in {
          from { opacity: 0; translate: 0 0.5rem; }
          to { opacity: 1; translate: 0 0; }
        }
        @keyframes lunchbot-dialog-out {
          from { opacity: 1; translate: 0 0; }
          to { opacity: 0; translate: 0 0.5rem; }
        }
        @keyframes lunchbot-sheet-in {
          from { translate: 0 100%; }
          to { translate: 0 0; }
        }
        @keyframes lunchbot-sheet-out {
          from { translate: 0 0; }
          to { translate: 0 100%; }
        }
        @media (max-width: 639px) {
          .lunchbot-dialog-in {
            animation: lunchbot-sheet-in ${String(SHEET_MS)}ms cubic-bezier(0.32, 0.72, 0, 1) both;
          }
          .lunchbot-dialog-out {
            animation: lunchbot-sheet-out ${String(SHEET_MS)}ms cubic-bezier(0.32, 0.72, 0, 1) both;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .lunchbot-backdrop-in,
          .lunchbot-backdrop-out,
          .lunchbot-dialog-in,
          .lunchbot-dialog-out {
            animation: none;
          }
        }
      `}</style>
      <button
        type="button"
        aria-label="Close support settings"
        onMouseDown={event => {
          event.preventDefault()
        }}
        className={`absolute inset-0 bg-zinc-950/45 outline-none! ${
          closing ? 'lunchbot-backdrop-out' : 'lunchbot-backdrop-in'
        }`}
        onClick={requestClose}
      />
      <div className="pointer-events-none relative z-10 flex h-full items-end justify-center sm:items-center sm:p-6">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lunchbot-support-title"
          tabIndex={-1}
          onKeyDown={event => {
            if (event.key !== 'Escape') return
            event.stopPropagation()
            requestClose()
          }}
          className={`pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl outline-none! sm:max-h-[calc(100dvh-3rem)] sm:max-w-md sm:rounded-3xl sm:px-6 sm:py-4 ${
            closing ? 'lunchbot-dialog-out' : 'lunchbot-dialog-in'
          }`}
        >
          <div className="mb-4">
            <h2 id="lunchbot-support-title" className="text-lg font-semibold tracking-tight">
              Support
            </h2>
            {live ? null : (
              <p className="mt-1 text-sm leading-5 text-zinc-600">
                Saved for the next order you place.
              </p>
            )}
          </div>
          <SupportPreference
            policy={policy}
            quote={quote}
            pendingMode={pendingMode}
            confirmed={confirmed}
            onChange={onChange}
          />
          <div className="mt-4 flex items-center gap-3">
            {live ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                <input
                  type="checkbox"
                  className="lunchbot-control size-4 shrink-0 cursor-pointer accent-[#009900]"
                  checked={remember}
                  onMouseDown={event => {
                    event.preventDefault()
                  }}
                  onChange={event => {
                    if (event.currentTarget.matches(':focus')) event.currentTarget.blur()
                    onRememberChange(event.target.checked)
                  }}
                />
                Remember for future orders
              </label>
            ) : null}
            <button
              className="lunchbot-control ml-auto cursor-pointer rounded-full bg-[#009900] px-4 py-2 text-sm font-semibold text-white hover:bg-[#007a00] active:bg-[#006600]"
              type="button"
              onMouseDown={event => {
                event.preventDefault()
              }}
              onClick={event => {
                if (event.detail > 0) event.currentTarget.blur()
                requestClose()
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
