import type { AppData } from './types'
import {
  afterFirstRemainingUsd,
  currentCar,
  dateIfCapacity,
  neededPerMonth,
  projectFinishDate,
  snapshot,
  thisMonthNetUsd,
} from './calc'
import { formatDate, formatUsd } from './format'

export type HintTone = 'ok' | 'warn' | 'bad' | 'info'

export type Hint = {
  id: string
  tone: HintTone
  text: string
}

function almost(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(5, b * 0.03)
}

export function buildHints(data: AppData, from = new Date()): Hint[] {
  if (data.currentStage === 'done') {
    return [
      {
        id: 'done',
        tone: 'ok',
        text: 'Оба этапа закрыты. Runway пройден.',
      },
    ]
  }

  const snap = snapshot(data, from)
  const hints: Hint[] = []
  const car = currentCar(data)
  const deadline = parseDeadline(car.deadline, from)

  if (deadline === 'past') {
    hints.push({
      id: 'deadline-past',
      tone: 'bad',
      text: `Срок по «${car.name}» уже прошёл. Нужно ${formatUsd(snap.remaining)} — сдвиньте дату в целях или закройте этап.`,
    })
  }

  const need = neededPerMonth(data, from)
  const got = thisMonthNetUsd(data, from)
  if (need > 0 && snap.remaining > 0) {
    if (got < 0) {
      hints.push({
        id: 'month-negative',
        tone: 'bad',
        text: `В этом месяце копилка уменьшилась на ${formatUsd(Math.abs(got))}. Чтобы успеть, нужно класть ${formatUsd(need)} в месяц.`,
      })
    } else if (got === 0) {
      hints.push({
        id: 'month-zero',
        tone: 'warn',
        text: `В этом месяце пока ничего не положили. Чтобы успеть к сроку, нужно ${formatUsd(need)} в месяц.`,
      })
    } else if (got + 1 < need && !almost(got, need)) {
      hints.push({
        id: 'month-behind',
        tone: 'warn',
        text: `В этом месяце вы положили меньше, чем нужно: ${formatUsd(got)} из ${formatUsd(need)}.`,
      })
    } else if (got > need && !almost(got, need)) {
      hints.push({
        id: 'month-ahead',
        tone: 'ok',
        text: `В этом месяце больше плана: ${formatUsd(got)} при нужных ${formatUsd(need)}.`,
      })
    } else {
      hints.push({
        id: 'month-on',
        tone: 'ok',
        text: `Этот месяц по плану: ${formatUsd(got)} из ${formatUsd(need)}.`,
      })
    }
  }

  if (snap.remaining > 0 && snap.piggy > 0) {
    if (snap.piggy + 1 < snap.expected && !almost(snap.piggy, snap.expected)) {
      hints.push({
        id: 'pace-behind',
        tone: 'warn',
        text: `Общий темп позади графика: сейчас ${formatUsd(snap.piggy)}, к этому моменту стоило иметь около ${formatUsd(snap.expected)}.`,
      })
    } else if (snap.piggy > snap.expected && !almost(snap.piggy, snap.expected)) {
      hints.push({
        id: 'pace-ahead',
        tone: 'ok',
        text: `Темп впереди графика: накоплено ${formatUsd(snap.piggy)} при расчётных ${formatUsd(snap.expected)}.`,
      })
    }
  }

  const cap = data.monthlyCapacityUsd
  if (cap > 0 && need > cap + 1) {
    const shifted = dateIfCapacity(data, from)
    hints.push({
      id: 'capacity',
      tone: 'bad',
      text: shifted
        ? `При лимите ${formatUsd(cap)} в месяц срок не сходится. Либо класть ${formatUsd(need)}, либо отодвинуть дату примерно до ${formatDate(toIso(shifted))}`
        : `Лимит ${formatUsd(cap)} в месяц меньше нужных ${formatUsd(need)}.`,
    })
  }

  const projected = projectFinishDate(data, from)
  if (projected && snap.pace > 0 && snap.remaining > 0) {
    const projIso = toIso(projected)
    const late = parseISODateSafe(car.deadline) < projected
    hints.push({
      id: 'projection',
      tone: late ? 'warn' : 'info',
      text: late
        ? `Если класть как сейчас (${formatUsd(snap.pace)} в месяц), «${car.name}» будет к ${formatDate(projIso)} — позже срока.`
        : `Если класть как сейчас, «${car.name}» будет примерно к ${formatDate(projIso)}`,
    })
  }

  if (data.currentStage === 1) {
    const extra = afterFirstRemainingUsd(data)
    hints.push({
      id: 'look-ahead',
      tone: 'info',
      text:
        extra > 0
          ? `После покупки первой и сдачи за ${formatUsd(data.tradeInUsd)} до «${data.cars.dream.name}» останется около ${formatUsd(extra)}.`
          : `Оценка сдачи первой почти покрывает «${data.cars.dream.name}». На втором этапе копилка почти не понадобится.`,
    })
  } else {
    hints.push({
      id: 'stage-2',
      tone: 'info',
      text: `Теперь копим разницу до «${data.cars.dream.name}»: цена минус сдача первой.`,
    })
  }

  if (!snap.rate) {
    hints.push({
      id: 'no-rate',
      tone: 'warn',
      text: 'Нет курса BYN. Пополнения в белрублях и евро не попадут в прогресс, пока не подтянется курс Нацбанка или вы не укажете свой.',
    })
  }

  return hints.slice(0, 5)
}

function parseDeadline(deadline: string, from: Date): 'ok' | 'past' {
  const d = parseISODateSafe(deadline)
  return d.getTime() < from.getTime() ? 'past' : 'ok'
}

function parseISODateSafe(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function monthsWord(n: number): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return `${n} месяцев`
  if (last === 1) return `${n} месяц`
  if (last >= 2 && last <= 4) return `${n} месяца`
  return `${n} месяцев`
}
