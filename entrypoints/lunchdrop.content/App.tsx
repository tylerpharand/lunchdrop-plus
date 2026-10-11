import { useEffect, useRef, useState, type ReactElement } from 'react'
import { SupportModal } from '../../components/SupportModal'
import { useSupportPolicy } from '../../components/use-support-policy'
import {
  customSupportSeed,
  feesMatch,
  formatDollars,
  formatSupportAmount,
  inferOrderSupport,
  LUNCHBOT_SOURCE,
  orderChoiceMatchesPolicy,
  orderSupportFromMessage,
  parseSupportAmount,
  quotedSupportFee,
  supportFeeResultFromMessage,
  type OrderSupportChoice,
  type OrderSupportContext,
  type PlacedOrder,
  type SupportChoiceMode,
  type SupportQuote,
} from '../../lib/support-policy'
import { readSupportOrigin } from '../../lib/support-policy-storage'
import { onSupportModalOpen } from './open'

interface SelectionSnap {
  choice: OrderSupportChoice | null
  percent: number
  customAmount: string
}

interface PageAppProps {
  onOpenChange: (open: boolean) => void
}

export default function PageApp({ onOpenChange }: PageAppProps): ReactElement | null {
  const { policy, setPolicy } = useSupportPolicy()
  const [open, setOpen] = useState(false)
  const [remember, setRemember] = useState(false)
  const [choice, setChoice] = useState<OrderSupportChoice | null>(null)
  const [percent, setPercent] = useState(10)
  const [customAmount, setCustomAmount] = useState('')
  const [customFocusToken, setCustomFocusToken] = useState(0)
  const [supportLabel, setSupportLabel] = useState('')
  const [context, setContext] = useState<OrderSupportContext | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [baseline, setBaseline] = useState<number | null>(null)
  const [baselineKnown, setBaselineKnown] = useState(false)
  const [pendingMode, setPendingMode] = useState<SupportChoiceMode | null>(null)
  const [confirmed, setConfirmed] = useState<{
    mode: SupportChoiceMode
    tick: number
  } | null>(null)
  const confirmTick = useRef(0)
  const applyTimer = useRef<number | null>(null)
  const applyGeneration = useRef(0)
  const serverFee = useRef<number | null>(null)
  const pinnedOrderId = useRef<string | null>(null)
  const policyRef = useRef(policy)
  const selectionEdited = useRef(false)
  const lastValidCustom = useRef('')
  const burstPrevious = useRef<SelectionSnap | null>(null)
  const ignoreCustomCommit = useRef(false)

  useEffect(() => {
    onOpenChange(open)
  }, [onOpenChange, open])

  useEffect(
    () =>
      onSupportModalOpen(label => {
        pinnedOrderId.current = null
        serverFee.current = null
        applyGeneration.current = 0
        selectionEdited.current = false
        lastValidCustom.current = ''
        burstPrevious.current = null
        ignoreCustomCommit.current = false
        setRemember(false)
        setChoice(null)
        setPercent(policyRef.current.percent)
        setCustomAmount('')
        setPendingMode(null)
        setOrderId(null)
        setSupportLabel(label)
        setBaseline(null)
        setBaselineKnown(false)
        setOpen(true)
      }),
    []
  )

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (event.source !== window) return
      const next = orderSupportFromMessage(event.data)
      if (next === undefined) return
      const current = pinnedOrderId.current
      const id =
        current !== null && next.orders.some(item => item.id === current)
          ? current
          : (pickOrder(next.orders, supportLabel, null)?.id ?? null)
      pinnedOrderId.current = id
      setOrderId(id)
      setContext(next)
      if (id === null) {
        setBaseline(null)
        setBaselineKnown(true)
        return
      }
      if (id === current) return
      setBaseline(null)
      setBaselineKnown(false)
      void readSupportOrigin(id).then(stored => {
        if (pinnedOrderId.current !== id) return
        setBaseline(stored)
        setBaselineKnown(true)
      })
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [supportLabel])

  useEffect(() => {
    policyRef.current = policy
  }, [policy])

  useEffect(() => {
    if (!open) return
    const request = (): void => {
      window.postMessage(
        { source: LUNCHBOT_SOURCE, type: 'request-subsidy-context' },
        window.location.origin
      )
    }
    request()
    const timer = window.setTimeout(request, 400)
    return () => {
      window.clearTimeout(timer)
    }
  }, [open])

  const order =
    context === null
      ? null
      : (context.orders.find(item => item.id === orderId) ??
        pickOrder(context.orders, supportLabel, null))
  const subsidyRemaining = context?.subsidy?.remaining ?? null
  const subsidyCap = context?.subsidy?.cap ?? null

  useEffect(() => {
    if (!open || order === null || !baselineKnown || selectionEdited.current) return
    const liveQuote: SupportQuote = {
      itemsSubtotal: order.itemsSubtotal,
      baselineFee: baseline,
      baselineKnown: true,
      subsidy:
        subsidyCap === null || subsidyRemaining === null
          ? null
          : { cap: subsidyCap, remaining: subsidyRemaining },
    }
    const currentFee = serverFee.current ?? order.supportFee
    const next = inferOrderSupport(policy, currentFee, liveQuote)
    const fieldAmount =
      next.choice === 'custom' ? currentFee : customSupportSeed(currentFee, liveQuote)
    const formatted = formatSupportAmount(fieldAmount)
    lastValidCustom.current = formatted
    setChoice(next.choice)
    setPercent(next.percent)
    setRemember(next.remember)
    setCustomAmount(formatted)
  }, [open, order, baseline, baselineKnown, policy, subsidyCap, subsidyRemaining])

  if (!open) return null

  const quote: SupportQuote | null =
    order === null
      ? null
      : {
          itemsSubtotal: order.itemsSubtotal,
          baselineFee: baseline,
          baselineKnown,
          subsidy: context?.subsidy ?? null,
        }

  const snap = (): SelectionSnap => ({ choice, percent, customAmount })

  const postFee = (fee: number, next: SelectionSnap, previous: SelectionSnap): void => {
    if (next.choice === null || order?.deliveryId === undefined) return
    const pendingChoice = next.choice
    const currentFee = serverFee.current ?? order.supportFee
    if (feesMatch(fee, currentFee)) return
    const generation = applyGeneration.current + 1
    applyGeneration.current = generation
    const previousFee = currentFee
    serverFee.current = fee
    setPendingMode(pendingChoice)
    const deliveryId = order.deliveryId
    const task = (async (): Promise<void> => {
      try {
        const ok = await postSupportFee(order.id, deliveryId, fee)
        if (applyGeneration.current !== generation) return
        if (!ok) {
          serverFee.current = previousFee
          setChoice(previous.choice)
          setPercent(previous.percent)
          setCustomAmount(previous.customAmount)
          lastValidCustom.current = previous.customAmount
          setRemember(
            previous.choice !== null &&
              orderChoiceMatchesPolicy(previous.choice, previous.percent, policyRef.current)
          )
          return
        }
        confirmTick.current += 1
        setConfirmed({ mode: pendingChoice, tick: confirmTick.current })
      } finally {
        if (applyGeneration.current === generation) setPendingMode(null)
      }
    })()
    void task
  }

  const schedulePreset = (
    nextChoice: 'percent' | 'remaining' | 'skip',
    nextPercent: number,
    previous: SelectionSnap
  ): void => {
    const continuing =
      nextChoice === 'percent' && choice === 'percent' && applyTimer.current !== null
    if (!continuing) burstPrevious.current = previous
    if (applyTimer.current !== null) window.clearTimeout(applyTimer.current)
    const delay = nextChoice === 'percent' && choice === 'percent' ? 400 : 0
    applyTimer.current = window.setTimeout(() => {
      applyTimer.current = null
      const revertTo = burstPrevious.current ?? previous
      burstPrevious.current = null
      if (quote === null) return
      const fee = quotedSupportFee(nextChoice, nextPercent, quote)
      if (fee === null) return
      postFee(fee, { choice: nextChoice, percent: nextPercent, customAmount }, revertTo)
    }, delay)
  }

  const onChoice = (nextChoice: OrderSupportChoice): void => {
    if (order !== null) {
      pinnedOrderId.current = order.id
      setOrderId(order.id)
    }
    selectionEdited.current = true
    const previous = snap()
    if (nextChoice === 'custom') {
      if (applyTimer.current !== null) {
        window.clearTimeout(applyTimer.current)
        applyTimer.current = null
        burstPrevious.current = null
      }
      if (choice !== 'custom' && quote !== null && order !== null) {
        const formatted = formatSupportAmount(
          customSupportSeed(serverFee.current ?? order.supportFee, quote)
        )
        lastValidCustom.current = formatted
        setCustomAmount(formatted)
      }
      setChoice('custom')
      setRemember(false)
      setCustomFocusToken(token => token + 1)
      return
    }
    setChoice(nextChoice)
    setRemember(orderChoiceMatchesPolicy(nextChoice, percent, policy))
    schedulePreset(nextChoice, percent, previous)
  }

  const onPercent = (nextPercent: number): void => {
    if (order !== null) {
      pinnedOrderId.current = order.id
      setOrderId(order.id)
    }
    selectionEdited.current = true
    const previous = snap()
    setChoice('percent')
    setPercent(nextPercent)
    setRemember(orderChoiceMatchesPolicy('percent', nextPercent, policy))
    schedulePreset('percent', nextPercent, previous)
  }

  const onCustomAmount = (value: string): void => {
    selectionEdited.current = true
    setCustomAmount(value)
  }

  const commitCustom = (): void => {
    if (ignoreCustomCommit.current || choice !== 'custom' || order === null) return
    const fee = parseSupportAmount(customAmount)
    if (fee === null) {
      setCustomAmount(lastValidCustom.current)
      return
    }
    const formatted = formatSupportAmount(fee)
    lastValidCustom.current = formatted
    if (formatted !== customAmount) setCustomAmount(formatted)
    postFee(fee, { choice: 'custom', percent, customAmount: formatted }, snap())
  }

  const close = (reason: 'done' | 'dismiss'): void => {
    if (applyTimer.current !== null) {
      window.clearTimeout(applyTimer.current)
      applyTimer.current = null
      const revertTo = burstPrevious.current ?? snap()
      burstPrevious.current = null
      if (quote !== null && (choice === 'percent' || choice === 'remaining' || choice === 'skip')) {
        const fee = quotedSupportFee(choice, percent, quote)
        if (fee !== null) postFee(fee, { choice, percent, customAmount }, revertTo)
      }
    }
    if (reason === 'done' && choice === 'custom') commitCustom()
    ignoreCustomCommit.current = true
    setOpen(false)
  }

  const onRememberChange = (next: boolean): void => {
    if (choice === null || choice === 'custom') return
    selectionEdited.current = true
    setRemember(next)
    if (next) {
      setPolicy(
        choice === 'percent'
          ? { mode: 'percent', percent }
          : { mode: choice, percent: policy.percent }
      )
      return
    }
    if (orderChoiceMatchesPolicy(choice, percent, policy)) {
      setPolicy({ mode: 'default', percent: policy.percent })
    }
  }

  return (
    <SupportModal
      selection={{ choice, percent, customAmount }}
      quote={quote}
      live={order !== null}
      pendingMode={pendingMode}
      confirmed={confirmed}
      remember={remember}
      showRemember={choice === 'percent' || choice === 'remaining' || choice === 'skip'}
      customFocusToken={customFocusToken}
      onChoice={onChoice}
      onPercent={onPercent}
      onCustomAmount={onCustomAmount}
      onCustomCommit={commitCustom}
      onRememberChange={onRememberChange}
      onClose={close}
    />
  )
}

function pickOrder(
  orders: PlacedOrder[],
  supportLabel: string,
  pinnedId: string | null
): PlacedOrder | null {
  const pinned = orders.find(item => item.id === pinnedId)
  if (pinned !== undefined) return pinned
  const labeled = orders.find(item => formatDollars(item.supportFee) === supportLabel.trim())
  if (labeled !== undefined) return labeled
  return orders.length === 1 ? (orders[0] ?? null) : null
}

function postSupportFee(orderId: string, deliveryId: string, supportFee: number): Promise<boolean> {
  const requestId = crypto.randomUUID()
  return new Promise(resolve => {
    let settled = false
    const finish = (ok: boolean): void => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timer)
      if (ok) {
        window.postMessage(
          { source: LUNCHBOT_SOURCE, type: 'request-subsidy-context' },
          window.location.origin
        )
      }
      resolve(ok)
    }
    const onMessage = (event: MessageEvent): void => {
      if (event.source !== window) return
      const result = supportFeeResultFromMessage(event.data)
      if (result?.requestId !== requestId) return
      finish(result.ok)
    }
    const timer = window.setTimeout(() => {
      finish(false)
    }, 8000)
    window.addEventListener('message', onMessage)
    window.postMessage(
      {
        source: LUNCHBOT_SOURCE,
        type: 'apply-support-fee',
        requestId,
        orderId,
        deliveryId,
        supportFee,
      },
      window.location.origin
    )
  })
}
