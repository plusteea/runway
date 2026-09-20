import type { AppData, Purchase, Transaction } from './types'
import { currentPiggyUsd, effectiveRate, isoDate, round2, savingsSplit } from './calc'

const KEY = 'garage-kopilka-v1'

export function emptyData(): AppData {
  return {
    version: 1,
    onboarded: false,
    createdAt: new Date().toISOString(),
    cars: {
      first: { name: '', priceUsd: 0, deadline: '' },
      dream: { name: '', priceUsd: 0, deadline: '' },
      later: { name: 'Cybertruck', priceUsd: 0, deadline: '' },
    },
    house: { name: 'Дом', priceUsd: 0, deadline: '', visible: false },
    tradeInUsd: 0,
    monthlyCapacityUsd: 0,
    currentStage: 1,
    fx: {
      nbrbRate: null,
      nbrbFetchedAt: null,
      overrideRate: null,
    },
    txs: [],
    purchases: [],
  }
}

export function parseData(raw: unknown): AppData | null {
  if (!raw || typeof raw !== 'object') return null
  const parsed = raw as AppData
  if (parsed.version !== 1) return null
  const base = emptyData()
  return {
    ...base,
    ...parsed,
    cars: {
      ...base.cars,
      ...parsed.cars,
      later: { ...base.cars.later, ...parsed.cars?.later },
    },
    house: { ...base.house, ...parsed.house },
    fx: { ...base.fx, ...parsed.fx },
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    return parseData(JSON.parse(raw) as unknown) ?? emptyData()
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function addTx(
  data: AppData,
  input: {
    type: Transaction['type']
    currency: Transaction['currency']
    amount: number
    date: string
    note?: string
  },
): AppData {
  const rate = effectiveRate(data)
  const tx: Transaction = {
    id: crypto.randomUUID(),
    type: input.type,
    currency: input.currency,
    amount: input.amount,
    date: input.date,
    note: input.note?.trim() || undefined,
    rateBynPerUsd: rate ?? 0,
    createdAt: new Date().toISOString(),
  }
  return { ...data, txs: [tx, ...data.txs] }
}

export function buyStage(data: AppData, stage: 1 | 2, tradeInUsd?: number): AppData {
  const now = new Date()
  const piggy = currentPiggyUsd(data)
  const price = stage === 1 ? data.cars.first.priceUsd : Math.max(0, data.cars.dream.priceUsd - (tradeInUsd ?? data.tradeInUsd))
  const surplus = round2(Math.max(0, piggy - (stage === 1 ? data.cars.first.priceUsd : price)))
  const spent = round2(piggy - surplus)
  const purchase: Purchase = {
    id: crypto.randomUUID(),
    stage,
    date: isoDate(now),
    createdAt: now.toISOString(),
    spentUsd: spent,
    tradeInUsd: stage === 1 ? (tradeInUsd ?? data.tradeInUsd) : undefined,
  }

  let next: AppData = {
    ...data,
    tradeInUsd: stage === 1 ? (tradeInUsd ?? data.tradeInUsd) : data.tradeInUsd,
    currentStage: stage === 1 ? 2 : 'done',
    purchases: [...data.purchases, purchase],
  }

  if (surplus > 0) {
    const leftover: Transaction = {
      id: crypto.randomUUID(),
      type: 'deposit',
      currency: 'USD',
      amount: surplus,
      date: isoDate(now),
      note: 'Остаток после покупки',
      rateBynPerUsd: effectiveRate(data) ?? 0,
      createdAt: new Date(now.getTime() + 1).toISOString(),
    }
    next = { ...next, txs: [leftover, ...next.txs] }
  }

  return next
}

export function seedStarting(data: AppData, usd: number, byn: number): AppData {
  const rate = effectiveRate(data) ?? 0
  const now = new Date()
  const txs: Transaction[] = []
  if (usd > 0) {
    txs.push({
      id: crypto.randomUUID(),
      type: 'deposit',
      currency: 'USD',
      amount: usd,
      date: isoDate(now),
      note: 'Уже было',
      rateBynPerUsd: rate,
      createdAt: now.toISOString(),
    })
  }
  if (byn > 0) {
    txs.push({
      id: crypto.randomUUID(),
      type: 'deposit',
      currency: 'BYN',
      amount: byn,
      date: isoDate(now),
      note: 'Уже было',
      rateBynPerUsd: rate,
      createdAt: new Date(now.getTime() + 1).toISOString(),
    })
  }
  return { ...data, txs: [...txs, ...data.txs] }
}

export function applyCashTargets(data: AppData, usd: number, byn: number, reason: string): AppData {
  const split = savingsSplit(data)
  const date = isoDate(new Date())
  const note = reason.trim()
  let next = data
  const usdDelta = round2(usd - split.usdCash)
  const bynDelta = round2(byn - split.bynCash)
  if (usdDelta !== 0) {
    next = addTx(next, {
      type: usdDelta > 0 ? 'deposit' : 'withdraw',
      currency: 'USD',
      amount: Math.abs(usdDelta),
      date,
      note,
    })
  }
  if (bynDelta !== 0) {
    next = addTx(next, {
      type: bynDelta > 0 ? 'deposit' : 'withdraw',
      currency: 'BYN',
      amount: Math.abs(bynDelta),
      date,
      note,
    })
  }
  return next
}

export function updateTx(
  data: AppData,
  id: string,
  patch: Partial<Pick<Transaction, 'amount' | 'date' | 'note'>>,
): AppData {
  return {
    ...data,
    txs: data.txs.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx)),
  }
}

export function removeTx(data: AppData, id: string): AppData {
  return { ...data, txs: data.txs.filter((tx) => tx.id !== id) }
}
