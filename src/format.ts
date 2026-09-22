import type { Transaction } from './types'
import { parseISODate } from './calc'

const usdFmt = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

const usdExact = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

const bynFmt = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

export function formatUsd(n: number, exact = false): string {
  const fmt = exact ? usdExact : usdFmt
  const abs = fmt.format(Math.abs(n))
  const sign = n < 0 ? '−' : ''
  return `${sign}$${abs}`
}

export function formatByn(n: number): string {
  return `${bynFmt.format(n)} Br`
}

export function formatEur(n: number, exact = false): string {
  const fmt = exact ? usdExact : usdFmt
  const abs = fmt.format(Math.abs(n))
  const sign = n < 0 ? '−' : ''
  return `${sign}€${abs}`
}

export function formatMoney(tx: Transaction): string {
  if (tx.currency === 'USD') return formatUsd(tx.amount, true)
  if (tx.currency === 'EUR') return formatEur(tx.amount, true)
  return formatByn(tx.amount)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseISODate(iso))
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(parseISODate(iso))
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, (m ?? 1) - 1, 1)
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(d)
}

export function monthShort(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, (m ?? 1) - 1, 1)
  return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d).replace('.', '')
}

export function formatRate(rate: number): string {
  return `${rate.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} Br за $1`
}
