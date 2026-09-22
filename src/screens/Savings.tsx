import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { lastPurchase, savingsSplit } from '../calc'
import { formatByn, formatEur, formatUsd } from '../format'
import { applyCashTargets } from '../storage'
import { useStore } from '../store'
import { Button, Field, TextInput } from '../ui'

export function Savings() {
  const { data, setData } = useStore()
  const split = savingsSplit(data)
  const afterPurchase = Boolean(lastPurchase(data))
  const [open, setOpen] = useState(false)

  return (
    <div className="pb-8">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted">
          {afterPurchase
            ? 'Сверка копилки текущего этапа: номинал в USD, EUR и BYN и сколько это в долларах.'
            : 'Сверка копилки: сколько лежит в долларах, евро и белрублях.'}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] text-muted hover:bg-white/10 hover:text-ink"
          aria-label="Редактировать накопления"
        >
          <Pencil size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <section className="glass rounded-[20px] px-4 py-4 md:px-5 md:py-5">
          <p className="text-sm text-muted">USD</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{formatUsd(split.usdCash, true)}</p>
          <p className="mt-3 text-sm text-muted">Номинал операций в USD</p>
        </section>
        <section className="glass rounded-[20px] px-4 py-4 md:px-5 md:py-5">
          <p className="text-sm text-muted">EUR</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{formatEur(split.eurCash, true)}</p>
          <p className="mt-3 text-sm text-muted">Номинал операций в EUR</p>
        </section>
        <section className="glass rounded-[20px] px-4 py-4 md:px-5 md:py-5">
          <p className="text-sm text-muted">BYN</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{formatByn(split.bynCash)}</p>
        </section>
        <section className="glass rounded-[20px] px-4 py-4 md:px-5 md:py-5">
          <p className="text-sm text-muted">Всего в копилке</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{formatUsd(split.totalUsd, true)}</p>
          <p className="mt-3 text-sm text-muted">USD + EUR + BYN по курсу операции</p>
        </section>
      </div>

      <section className="glass mt-4 overflow-hidden rounded-[20px]">
        <ul>
          <Row label="Доллары, номинал" value={formatUsd(split.usdCash, true)} />
          <Row label="Евро, номинал" value={formatEur(split.eurCash, true)} />
          <Row label="Белрубли, номинал" value={formatByn(split.bynCash)} />
          <Row label="Итого в копилке" value={formatUsd(split.totalUsd, true)} last />
        </ul>
      </section>

      {open ? (
        <EditDialog
          usd={split.usdCash}
          eur={split.eurCash}
          byn={split.bynCash}
          hasUsdRate={Boolean(split.rate)}
          hasEurRate={Boolean(split.rate && split.eurRate)}
          onClose={() => setOpen(false)}
          onSave={(nextUsd, nextByn, nextEur, reason) => {
            setData(applyCashTargets(data, nextUsd, nextByn, nextEur, reason))
            setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function EditDialog({
  usd,
  eur,
  byn,
  hasUsdRate,
  hasEurRate,
  onClose,
  onSave,
}: {
  usd: number
  eur: number
  byn: number
  hasUsdRate: boolean
  hasEurRate: boolean
  onClose: () => void
  onSave: (usd: number, byn: number, eur: number, reason: string) => void
}) {
  const [nextUsd, setNextUsd] = useState(String(usd))
  const [nextEur, setNextEur] = useState(String(eur))
  const [nextByn, setNextByn] = useState(String(byn))
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  function submit() {
    const parsedUsd = Number(nextUsd.replace(',', '.'))
    const parsedEur = Number(nextEur.replace(',', '.'))
    const parsedByn = Number(nextByn.replace(',', '.'))
    if (!Number.isFinite(parsedUsd) || !Number.isFinite(parsedEur) || !Number.isFinite(parsedByn)) {
      setError('Укажите числа во всех валютах.')
      return
    }
    if (parsedByn !== byn && !hasUsdRate) {
      setError('Чтобы править BYN, нужен курс доллара.')
      return
    }
    if (parsedEur !== eur && !hasEurRate) {
      setError('Чтобы править EUR, нужны курсы доллара и евро.')
      return
    }
    if (!reason.trim()) {
      setError('Напишите, почему изменились данные.')
      return
    }
    onSave(parsedUsd, parsedByn, parsedEur, reason.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-strong w-full max-w-md rounded-[20px] px-6 py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xl font-semibold tracking-tight">Редактирование</p>
        <p className="mt-1 text-sm text-muted">Поправьте номинал. Разница уйдёт в историю.</p>
        <div className="mt-5 grid gap-4">
          <Field label="В долларах, $">
            <TextInput inputMode="decimal" value={nextUsd} onChange={(e) => setNextUsd(e.target.value)} />
          </Field>
          <Field label="В евро, €">
            <TextInput inputMode="decimal" value={nextEur} onChange={(e) => setNextEur(e.target.value)} />
          </Field>
          <Field label="В BYN, Br">
            <TextInput inputMode="decimal" value={nextByn} onChange={(e) => setNextByn(e.target.value)} />
          </Field>
          <Field label="Почему изменились данные">
            <TextInput
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Пересчитал наличку, ошибка, обмен…"
            />
          </Field>
        </div>
        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="button" onClick={submit}>
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <li
      className={`flex items-baseline justify-between gap-6 px-5 py-4 ${last ? '' : 'border-b border-white/8'}`}
    >
      <p className="text-[15px] text-muted">{label}</p>
      <p className="text-[15px] font-medium tabular-nums">{value}</p>
    </li>
  )
}
