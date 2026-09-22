import type { AppData, Transaction } from './types'

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function effectiveRate(data: AppData): number | null {
  if (data.fx.overrideRate && data.fx.overrideRate > 0) return data.fx.overrideRate
  if (data.fx.nbrbRate && data.fx.nbrbRate > 0) return data.fx.nbrbRate
  return null
}

export function effectiveEurRate(data: AppData): number | null {
  if (data.fx.overrideEurRate && data.fx.overrideEurRate > 0) return data.fx.overrideEurRate
  if (data.fx.nbrbEurRate && data.fx.nbrbEurRate > 0) return data.fx.nbrbEurRate
  return null
}

export function eurToUsdAmount(amount: number, usdRate: number | null, eurRate: number | null): number | null {
  if (!usdRate || !eurRate || usdRate <= 0 || eurRate <= 0) return null
  return round2(amount * (eurRate / usdRate))
}

export function txToUsd(tx: Transaction): number {
  const signed = tx.type === 'withdraw' ? -tx.amount : tx.amount
  if (tx.currency === 'USD') return signed
  if (tx.currency === 'EUR') {
    const eur = tx.rateBynPerEur ?? 0
    if (!tx.rateBynPerUsd || !eur) return 0
    return signed * (eur / tx.rateBynPerUsd)
  }
  if (!tx.rateBynPerUsd) return 0
  return signed / tx.rateBynPerUsd
}

export function lastPurchase(data: AppData) {
  return data.purchases.at(-1) ?? null
}

export function currentPiggyUsd(data: AppData): number {
  const purchase = lastPurchase(data)
  const sum = data.txs
    .filter((tx) => !purchase || tx.createdAt > purchase.createdAt)
    .reduce((acc, tx) => acc + txToUsd(tx), 0)
  return round2(sum)
}

export function savingsSplit(data: AppData) {
  const purchase = lastPurchase(data)
  const txs = data.txs.filter((tx) => !purchase || tx.createdAt > purchase.createdAt)
  const signed = (tx: Transaction) => (tx.type === 'withdraw' ? -tx.amount : tx.amount)
  const usdCash = round2(txs.filter((tx) => tx.currency === 'USD').reduce((acc, tx) => acc + signed(tx), 0))
  const eurCash = round2(txs.filter((tx) => tx.currency === 'EUR').reduce((acc, tx) => acc + signed(tx), 0))
  const bynCash = round2(txs.filter((tx) => tx.currency === 'BYN').reduce((acc, tx) => acc + signed(tx), 0))
  const bynBookedUsd = round2(
    txs.filter((tx) => tx.currency === 'BYN').reduce((acc, tx) => acc + txToUsd(tx), 0),
  )
  const rate = effectiveRate(data)
  const eurRate = effectiveEurRate(data)
  const bynLiveUsd = rate && rate > 0 ? round2(bynCash / rate) : null
  return {
    usdCash,
    eurCash,
    bynCash,
    bynBookedUsd,
    bynLiveUsd,
    totalUsd: currentPiggyUsd(data),
    rate,
    eurRate,
  }
}

export function stageTargetUsd(data: AppData): number {
  if (data.currentStage === 1) return data.cars.first.priceUsd
  const tradeIn = lastPurchase(data)?.tradeInUsd ?? data.tradeInUsd
  return Math.max(0, data.cars.dream.priceUsd - tradeIn)
}

export function currentCar(data: AppData) {
  if (data.currentStage === 2) return data.cars.dream
  return data.cars.first
}

export function monthsLeft(deadline: string, from = new Date()): number {
  const end = parseISODate(deadline)
  if (Number.isNaN(end.getTime())) return 1
  if (end.getTime() <= from.getTime()) return 1
  let months =
    (end.getFullYear() - from.getFullYear()) * 12 + (end.getMonth() - from.getMonth())
  if (end.getDate() < from.getDate()) months -= 1
  return Math.max(1, months)
}

export function remainingUsd(data: AppData): number {
  return round2(Math.max(0, stageTargetUsd(data) - currentPiggyUsd(data)))
}

export function neededPerMonth(data: AppData, from = new Date()): number {
  const car = currentCar(data)
  const left = remainingUsd(data)
  const months = monthsLeft(car.deadline, from)
  return round2(left / months)
}

export function thisMonthNetUsd(data: AppData, from = new Date()): number {
  const purchase = lastPurchase(data)
  const key = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`
  const sum = data.txs
    .filter((tx) => !purchase || tx.createdAt > purchase.createdAt)
    .filter((tx) => tx.date.startsWith(key))
    .filter((tx) => tx.note !== 'Уже было')
    .reduce((acc, tx) => acc + txToUsd(tx), 0)
  return round2(sum)
}

export function stageStart(data: AppData): Date {
  const purchase = lastPurchase(data)
  if (purchase) return new Date(purchase.createdAt)
  return new Date(data.createdAt)
}

export function elapsedMonths(data: AppData, from = new Date()): number {
  const start = stageStart(data)
  let months =
    (from.getFullYear() - start.getFullYear()) * 12 + (from.getMonth() - start.getMonth())
  if (from.getDate() < start.getDate()) months -= 1
  return Math.max(1, months + 1)
}

export function expectedByNowUsd(data: AppData, from = new Date()): number {
  const target = stageTargetUsd(data)
  const total = monthsLeft(currentCar(data).deadline, stageStart(data))
  const gone = elapsedMonths(data, from)
  const ratio = Math.min(1, gone / Math.max(1, total))
  return round2(target * ratio)
}

export function averageMonthlyUsd(data: AppData, from = new Date()): number {
  const piggy = currentPiggyUsd(data)
  return round2(piggy / elapsedMonths(data, from))
}

export function projectFinishDate(data: AppData, from = new Date()): Date | null {
  const pace = averageMonthlyUsd(data, from)
  if (pace <= 0) return null
  const months = remainingUsd(data) / pace
  const result = new Date(from)
  const whole = Math.ceil(months)
  result.setMonth(result.getMonth() + whole)
  return result
}

export function dateIfCapacity(data: AppData, from = new Date()): Date | null {
  const cap = data.monthlyCapacityUsd
  if (cap <= 0) return null
  const months = Math.ceil(remainingUsd(data) / cap)
  const result = new Date(from)
  result.setMonth(result.getMonth() + months)
  return result
}

export function monthlyLedger(data: AppData, from = new Date()) {
  const purchase = lastPurchase(data)
  const txs = data.txs.filter((tx) => !purchase || tx.createdAt > purchase.createdAt)
  const start = stageStart(data)
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(from.getFullYear(), from.getMonth(), 1)
  const target = stageTargetUsd(data)
  const deadline = currentCar(data).deadline
  const rows: {
    key: string
    actual: number
    planned: number
    hole: number
  }[] = []

  while (cursor <= last) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const piggyBefore = txs
      .filter((tx) => tx.date.slice(0, 7) < key)
      .reduce((acc, tx) => acc + txToUsd(tx), 0)
    const remaining = Math.max(0, target - piggyBefore)
    const planned = round2(remaining / monthsLeft(deadline, cursor))
    const actual = round2(
      txs
        .filter((tx) => tx.date.startsWith(key) && tx.note !== 'Уже было')
        .reduce((acc, tx) => acc + txToUsd(tx), 0),
    )
    rows.push({
      key,
      actual,
      planned,
      hole: round2(Math.max(0, planned - actual)),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return rows.slice(-12)
}

export function afterFirstRemainingUsd(data: AppData): number {
  return round2(Math.max(0, data.cars.dream.priceUsd - data.tradeInUsd))
}

export function snapshot(data: AppData, from = new Date()) {
  const piggy = currentPiggyUsd(data)
  const target = stageTargetUsd(data)
  const remaining = remainingUsd(data)
  const monthlyNeed = neededPerMonth(data, from)
  const monthGot = thisMonthNetUsd(data, from)
  const progress = target <= 0 ? 1 : Math.min(1, Math.max(0, piggy / target))
  return {
    piggy,
    target,
    remaining,
    monthlyNeed,
    monthGot,
    progress,
    months: monthsLeft(currentCar(data).deadline, from),
    expected: expectedByNowUsd(data, from),
    pace: averageMonthlyUsd(data, from),
    projected: projectFinishDate(data, from),
    capacityDate: dateIfCapacity(data, from),
    afterFirst: afterFirstRemainingUsd(data),
    rate: effectiveRate(data),
    eurRate: effectiveEurRate(data),
  }
}
