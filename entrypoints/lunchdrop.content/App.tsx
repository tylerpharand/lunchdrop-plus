import { useEffect, useRef, useState, type ReactElement } from 'react'
import { SupportModal } from '../../components/SupportModal'
import { useSupportPolicy } from '../../components/use-support-policy'
import {
  customSupportSeed,
  feesMatch,
  formatSupportAmount,
  inferOrderSupport,
  LUNCHBOT_SOURCE,
  orderChoiceMatchesPolicy,
  orderSupportFromMessage,
  parseSupportAmount,
  quotedSupportFee,
  type OrderChoiceMemory,
  type OrderSupportChoice,
  type OrderSupportContext,
  type SupportChoiceMode,
  type SupportPolicy,
  type SupportQuote,
} from '../../lib/support-policy'
import {
  peekOrderChoice,
  readOrderChoice,
  readSupportOrigin,
  writeOrderChoice,
} from '../../lib/support-policy-storage'
import { onSupportModalOpen } from './open'
import { pickOrder, postSupportFee, subsidyForOrder } from './support-fee-client'

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
  const [loadedPin, setLoadedPin] = useState<OrderChoiceMemory | null>(null)
  const [loadedPinId, setLoadedPinId] = useState<string | null>(null)
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
  const rememberHeldOff = useRef(false)

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
        rememberHeldOff.current = false
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
  const orderSubsidy = subsidyForOrder(context, order)
  const subsidyRemaining = orderSubsidy?.remaining ?? null
  const subsidyCap = orderSubsidy?.cap ?? null
  const activeOrderId = order?.id ?? null
  const peekedPin = activeOrderId === null ? undefined : peekOrderChoice(activeOrderId)
  const pinKnown =
    activeOrderId !== null && (peekedPin !== undefined || loadedPinId === activeOrderId)
  const pinned = peekedPin !== undefined ? peekedPin : loadedPin

  useEffect(() => {
    if (!open || activeOrderId === null || peekOrderChoice(activeOrderId) !== undefined) return
    let cancelled = false
    void readOrderChoice(activeOrderId).then(pin => {
      if (cancelled) return
      setLoadedPin(pin)
      setLoadedPinId(activeOrderId)
    })
    return () => {
      cancelled = true
    }
  }, [open, activeOrderId])

  useEffect(() => {
    if (!open || order === null || !baselineKnown || !pinKnown || selectionEdited.current) return
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
    const next = inferOrderSupport(policy, currentFee, liveQuote, pinned)
    const fieldAmount =
      next.choice === 'custom' ? currentFee : customSupportSeed(currentFee, liveQuote)
    const formatted = formatSupportAmount(fieldAmount)
    lastValidCustom.current = formatted
    setChoice(next.choice)
    setPercent(next.percent)
    setRemember(next.remember)
    setCustomAmount(formatted)
  }, [open, order, baseline, baselineKnown, pinKnown, pinned, policy, subsidyCap, subsidyRemaining])

  if (!open) return null

  const quote: SupportQuote | null =
    order === null
      ? null
      : {
          itemsSubtotal: order.itemsSubtotal,
          baselineFee: baseline,
          baselineKnown,
          subsidy: orderSubsidy,
        }

  const snap = (): SelectionSnap => ({ choice, percent, customAmount })

  const rememberAppliedChoice = (next: SelectionSnap, fee: number): void => {
    if (order === null || next.choice === null) return
    const memory: OrderChoiceMemory = {
      choice: next.choice,
      percent: next.percent,
      amount: fee,
    }
    writeOrderChoice(order.id, memory)
    setLoadedPin(memory)
    setLoadedPinId(order.id)
    if (next.choice === 'custom' || rememberHeldOff.current) return
    const current = policyRef.current
    if (orderChoiceMatchesPolicy(next.choice, next.percent, current)) return
    const nextPolicy: SupportPolicy =
      next.choice === 'percent'
        ? { mode: 'percent', percent: next.percent }
        : { mode: next.choice, percent: current.percent }
    setPolicy(nextPolicy)
  }

  const postFee = (fee: number, next: SelectionSnap, previous: SelectionSnap): void => {
    if (next.choice === null || order === null) return
    const pendingChoice = next.choice
    const currentFee = serverFee.current ?? order.supportFee
    if (feesMatch(fee, currentFee)) {
      rememberAppliedChoice(next, fee)
      return
    }
    if (order.deliveryId === undefined) return
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
        rememberAppliedChoice(next, fee)
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
    setRemember(!rememberHeldOff.current)
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
    setRemember(!rememberHeldOff.current)
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
    rememberHeldOff.current = !next
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
