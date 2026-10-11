import { useEffect, useRef, useState, type ReactElement } from 'react'
import { SupportModal } from '../../components/SupportModal'
import { useSupportPolicy } from '../../components/use-support-policy'
import {
  formatDollars,
  LUNCHBOT_SOURCE,
  orderSupportFromMessage,
  quotedSupportFee,
  supportFeeResultFromMessage,
  type OrderSupportContext,
  type PlacedOrder,
  type SupportPolicy,
  type SupportQuote,
} from '../../lib/support-policy'
import { readSupportBaseline, rememberSupportBaseline } from '../../lib/support-policy-storage'
import { onSupportModalOpen } from './open'

interface PageAppProps {
  onOpenChange: (open: boolean) => void
}

export default function PageApp({ onOpenChange }: PageAppProps): ReactElement | null {
  const { policy, setPolicy } = useSupportPolicy()
  const [open, setOpen] = useState(false)
  const [remember, setRemember] = useState(true)
  const [draft, setDraft] = useState<SupportPolicy | null>(null)
  const [supportLabel, setSupportLabel] = useState('')
  const [context, setContext] = useState<OrderSupportContext | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [baseline, setBaseline] = useState<number | null>(null)
  const [pendingMode, setPendingMode] = useState<SupportPolicy['mode'] | null>(null)
  const [confirmed, setConfirmed] = useState<{
    mode: SupportPolicy['mode']
    tick: number
  } | null>(null)
  const confirmTick = useRef(0)
  const applyTimer = useRef<number | null>(null)
  const applyGeneration = useRef(0)
  const serverFee = useRef<number | null>(null)
  const pinnedOrderId = useRef<string | null>(null)
  const policyRef = useRef(policy)
  const openedPolicy = useRef(policy)
  const rememberRef = useRef(true)
  const selectionEdited = useRef(false)

  useEffect(() => {
    onOpenChange(open)
  }, [onOpenChange, open])

  useEffect(
    () =>
      onSupportModalOpen(label => {
        pinnedOrderId.current = null
        serverFee.current = null
        applyGeneration.current = 0
        openedPolicy.current = policyRef.current
        selectionEdited.current = false
        rememberRef.current = true
        setRemember(true)
        setDraft(null)
        setPendingMode(null)
        setOrderId(null)
        setSupportLabel(label)
        setBaseline(null)
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
      if (id === null) return
      const liveFee = next.orders.find(item => item.id === id)?.supportFee ?? null
      void readSupportBaseline(id).then(stored => {
        setBaseline(stored ?? liveFee)
      })
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [supportLabel])

  useEffect(() => {
    policyRef.current = policy
    if (!open || selectionEdited.current) return
    openedPolicy.current = policy
  }, [open, policy])

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

  if (!open) return null

  const quote: SupportQuote | null =
    order !== null && baseline !== null
      ? {
          itemsSubtotal: order.itemsSubtotal,
          baselineFee: baseline,
          subsidy: context?.subsidy ?? null,
        }
      : null

  const runApply = (next: SupportPolicy, previous: SupportPolicy): void => {
    if (order?.deliveryId === undefined) return
    const currentFee = serverFee.current ?? order.supportFee
    const fee = quotedFeeToPost(order, quote, next, currentFee)
    if (fee === null) return
    const generation = applyGeneration.current + 1
    applyGeneration.current = generation
    const previousFee = currentFee
    serverFee.current = fee
    setPendingMode(next.mode)
    const task = (async (): Promise<void> => {
      try {
        const outcome = await applySupportChoice(order, quote, next, previousFee)
        if (applyGeneration.current !== generation) return
        if (outcome !== 'applied') serverFee.current = previousFee
        if (outcome === 'applied') {
          confirmTick.current += 1
          setConfirmed({ mode: next.mode, tick: confirmTick.current })
        }
        if (outcome === 'failed') {
          setDraft(previous)
          if (rememberRef.current) setPolicy(previous)
        }
      } finally {
        if (applyGeneration.current === generation) setPendingMode(null)
      }
    })()
    void task
  }

  const shown = draft ?? policy

  const onChange = (next: SupportPolicy): void => {
    if (order !== null) {
      pinnedOrderId.current = order.id
      setOrderId(order.id)
    }
    const previous = shown
    selectionEdited.current = true
    setDraft(next)
    if (rememberRef.current) setPolicy(next)
    if (applyTimer.current !== null) window.clearTimeout(applyTimer.current)
    const delay = next.mode === 'percent' && shown.mode === 'percent' ? 400 : 0
    applyTimer.current = window.setTimeout(() => {
      applyTimer.current = null
      runApply(next, previous)
    }, delay)
  }

  const close = (): void => {
    if (applyTimer.current !== null) {
      window.clearTimeout(applyTimer.current)
      applyTimer.current = null
      runApply(shown, shown)
    }
    setOpen(false)
  }

  const onRememberChange = (next: boolean): void => {
    rememberRef.current = next
    setRemember(next)
    const current = draft ?? policy
    if (next) {
      setPolicy(current)
      return
    }
    setDraft(current)
    setPolicy(openedPolicy.current)
  }

  return (
    <SupportModal
      policy={shown}
      quote={quote}
      live={order !== null}
      pendingMode={pendingMode}
      confirmed={confirmed}
      remember={remember}
      onChange={onChange}
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

type ApplyOutcome = 'unchanged' | 'applied' | 'failed'

function quotedFeeToPost(
  order: PlacedOrder | null,
  quote: SupportQuote | null,
  policy: SupportPolicy,
  currentFee: number
): number | null {
  if (order?.deliveryId === undefined || quote === null) return null
  const fee = quotedSupportFee(policy.mode, policy.percent, quote)
  if (fee === null || Math.abs(fee - currentFee) < 0.001) return null
  return fee
}

async function applySupportChoice(
  order: PlacedOrder,
  quote: SupportQuote | null,
  policy: SupportPolicy,
  currentFee: number
): Promise<ApplyOutcome> {
  const fee = quotedFeeToPost(order, quote, policy, currentFee)
  if (fee === null || order.deliveryId === undefined) return 'unchanged'
  await rememberSupportBaseline(order.id, currentFee)
  const ok = await postSupportFee(order.id, order.deliveryId, fee)
  return ok ? 'applied' : 'failed'
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
