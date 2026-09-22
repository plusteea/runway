import { useState } from 'react'
import { effectiveEurRate, effectiveRate, eurToUsdAmount, isoDate } from '../calc'
import { formatUsd } from '../format'
import { addTx } from '../storage'
import { useStore } from '../store'
import type { Currency, TxType } from '../types'
import { Button, Field, Screen, TextInput } from '../ui'

export function AddMoney({ onBack }: { onBack: () => void }) {
  const { data, setData } = useStore()
  const [type, setType] = useState<TxType>('deposit')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(isoDate(new Date()))
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const rate = effectiveRate(data)
  const eurRate = effectiveEurRate(data)
  const parsed = Number(amount.replace(',', '.'))
  const eurAsUsd = currency === 'EUR' && parsed > 0 ? eurToUsdAmount(parsed, rate, eurRate) : null

  function submit() {
    const n = Number(amount.replace(',', '.'))
    if (!n || n <= 0) {
      setError('Укажите сумму больше нуля.')
      return
    }
    if (currency === 'BYN' && !rate) {
      setError('Сначала нужен курс доллара: обновите его на главной или укажите свой в целях.')
      return
    }
    if (currency === 'EUR' && (!rate || !eurRate)) {
      setError('Для евро нужны курсы USD и EUR. Подтяните Нацбанк или укажите свои в целях.')
      return
    }
    setData(addTx(data, { type, currency, amount: n, date, note }))
    onBack()
  }

  const amountLabel = currency === 'USD' ? 'Сумма, $' : currency === 'EUR' ? 'Сумма, €' : 'Сумма, Br'
  const hint =
    currency === 'BYN' && rate && parsed > 0
      ? `В прогресс уйдёт ${formatUsd(parsed / rate, true)} по курсу на эту операцию`
      : currency === 'EUR' && eurAsUsd != null
        ? `В прогресс уйдёт ${formatUsd(eurAsUsd, true)} по курсу на эту операцию`
        : undefined

  return (
    <Screen
      title={type === 'deposit' ? 'Пополнить' : 'Снять'}
      onBack={onBack}
      footer={
        <Button type="button" className="w-full" onClick={submit}>
          {type === 'deposit' ? 'Положить в копилку' : 'Снять из копилки'}
        </Button>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-2">
        <Toggle active={type === 'deposit'} onClick={() => setType('deposit')}>
          Положить
        </Toggle>
        <Toggle active={type === 'withdraw'} onClick={() => setType('withdraw')}>
          Снять
        </Toggle>
      </div>
      <div className="mb-5 grid grid-cols-3 gap-2">
        <Toggle active={currency === 'USD'} onClick={() => setCurrency('USD')}>
          USD
        </Toggle>
        <Toggle active={currency === 'EUR'} onClick={() => setCurrency('EUR')}>
          EUR
        </Toggle>
        <Toggle active={currency === 'BYN'} onClick={() => setCurrency('BYN')}>
          BYN
        </Toggle>
      </div>
      <div className="grid gap-4">
        <Field label={amountLabel} hint={hint}>
          <TextInput
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Дата">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Комментарий, если нужно">
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Зарплата, продажа…" />
        </Field>
      </div>
      {error ? <p className="mt-4 text-sm text-bad">{error}</p> : null}
    </Screen>
  )
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-[12px] text-sm font-medium transition-colors duration-150 ${
        active ? 'bg-primary text-on-primary' : 'bg-surface-2 text-muted'
      }`}
    >
      {children}
    </button>
  )
}
