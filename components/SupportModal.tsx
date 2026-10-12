import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { SupportChoiceMode } from '../lib/support-policy'
import { isCompactViewport } from '../lib/visual-viewport'
import { useCompactViewport } from './use-compact-viewport'
import { SupportPreference, useSwitchMotion, type OrderPreferenceProps } from './SupportPreference'

const DIALOG_MS = 200
const SHEET_MS = 320

function closeMotionMs(): number {
  return isCompactViewport() ? SHEET_MS : DIALOG_MS
}

interface SupportModalProps extends Pick<
  OrderPreferenceProps,
  | 'selection'
  | 'quote'
  | 'customFocusToken'
  | 'onChoice'
  | 'onPercent'
  | 'onCustomAmount'
  | 'onCustomCommit'
> {
  live: boolean
  pendingMode: SupportChoiceMode | null
  confirmed: { mode: SupportChoiceMode; tick: number } | null
  remember: boolean
  showRemember: boolean
  onRememberChange: (remember: boolean) => void
  onClose: (reason: 'done' | 'dismiss') => void
}

export function SupportModal({
  selection,
  quote,
  live,
  pendingMode,
  confirmed,
  remember,
  showRemember,
  customFocusToken,
  onChoice,
  onPercent,
  onCustomAmount,
  onCustomCommit,
  onRememberChange,
  onClose,
}: SupportModalProps): ReactElement {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)
  const closeTimer = useRef<number | null>(null)
  const [closing, setClosing] = useState(false)
  const compact = useCompactViewport()
  const animateRemember = useSwitchMotion(showRemember)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [])

  const requestClose = (reason: 'done' | 'dismiss'): void => {
    if (closingRef.current) return
    closingRef.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose(reason)
      return
    }
    setClosing(true)
    closeTimer.current = window.setTimeout(() => {
      onClose(reason)
    }, closeMotionMs())
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
        .lunchbot-sheet.lunchbot-dialog-in {
          animation: lunchbot-sheet-in ${String(SHEET_MS)}ms cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        .lunchbot-sheet.lunchbot-dialog-out {
          animation: lunchbot-sheet-out ${String(SHEET_MS)}ms cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        @keyframes lunchbot-remember-in {
          from { opacity: 0; translate: 0 -0.5rem; }
          to { opacity: 1; translate: 0 0; }
        }
        @keyframes lunchbot-remember-out {
          from { opacity: 1; translate: 0 0; }
          to { opacity: 0; translate: 0 -0.5rem; }
        }
        .lunchbot-remember-in,
        .lunchbot-remember-out {
          animation-duration: 300ms;
          animation-timing-function: ease-out;
          animation-fill-mode: both;
        }
        .lunchbot-remember-in { animation-name: lunchbot-remember-in; }
        .lunchbot-remember-out { animation-name: lunchbot-remember-out; }
        @media (prefers-reduced-motion: reduce) {
          .lunchbot-backdrop-in,
          .lunchbot-backdrop-out,
          .lunchbot-dialog-in,
          .lunchbot-dialog-out,
          .lunchbot-sheet.lunchbot-dialog-in,
          .lunchbot-sheet.lunchbot-dialog-out,
          .lunchbot-remember-in,
          .lunchbot-remember-out {
            animation: none;
            translate: none;
          }
          .lunchbot-remember-in { opacity: 1; }
          .lunchbot-remember-out { opacity: 0; }
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
        onClick={() => {
          requestClose('dismiss')
        }}
      />
      <div
        className={`pointer-events-none relative z-10 flex h-full justify-center ${
          compact ? 'items-end' : 'items-center p-6'
        }`}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lunchbot-support-title"
          tabIndex={-1}
          onKeyDown={event => {
            if (event.key !== 'Escape') return
            event.stopPropagation()
            requestClose('dismiss')
          }}
          className={`pointer-events-auto flex w-full flex-col overflow-y-auto bg-white shadow-2xl outline-none! ${
            compact
              ? 'lunchbot-sheet max-h-[calc(var(--lunchbot-frame-height)*0.92)] rounded-t-3xl px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]'
              : 'max-h-[calc(var(--lunchbot-frame-height)-3rem)] max-w-md rounded-3xl px-6 py-4'
          } ${closing ? 'lunchbot-dialog-out' : 'lunchbot-dialog-in'}`}
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
            variant="order"
            selection={selection}
            quote={quote}
            pendingMode={pendingMode}
            confirmed={confirmed}
            customFocusToken={customFocusToken}
            onChoice={onChoice}
            onPercent={onPercent}
            onCustomAmount={onCustomAmount}
            onCustomCommit={onCustomCommit}
          />
          <div className="mt-4 flex items-center gap-3">
            {live ? (
              <label
                inert={!showRemember}
                aria-hidden={!showRemember}
                className={`flex items-center gap-2 text-sm text-zinc-800 ${
                  showRemember ? 'cursor-pointer' : 'pointer-events-none'
                } ${
                  animateRemember && showRemember
                    ? 'lunchbot-remember-in'
                    : animateRemember && !showRemember
                      ? 'lunchbot-remember-out'
                      : showRemember
                        ? ''
                        : 'opacity-0'
                }`}
              >
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
                requestClose('done')
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
