import { useState } from 'react'
import { CAR_PHOTOS } from '../cars'
import { effectiveEurRate, effectiveRate, isoDate } from '../calc'
import { seedStarting } from '../storage'
import { useStore } from '../store'
import type { Car } from '../types'
import { APP_NAME } from '../brand'
import { Logo } from '../Logo'
import { Button, Field, TextInput } from '../ui'

function plusMonths(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return isoDate(d)
}

export function Onboarding() {
  const { data, setData, connectCloud, cloudEnabled } = useStore()
  const [step, setStep] = useState(1)
  const [syncInput, setSyncInput] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [first, setFirst] = useState<Car>({
    name: 'Camry XV40',
    priceUsd: 8000,
    deadline: plusMonths(12),
  })
  const [dream, setDream] = useState<Car>({
    name: 'Tesla Model 3',
    priceUsd: 25000,
    deadline: plusMonths(36),
  })
  const [tradeInUsd, setTradeInUsd] = useState(6000)
  const [haveUsd, setHaveUsd] = useState(0)
  const [haveEur, setHaveEur] = useState(0)
  const [haveByn, setHaveByn] = useState(0)
  const [capacity, setCapacity] = useState(400)
  const [error, setError] = useState('')

  function next() {
    setError('')
    if (step === 1) {
      if (!first.name.trim() || first.priceUsd <= 0 || !first.deadline) {
        setError('Нужны название, цена и срок первой машины.')
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      if (!dream.name.trim() || dream.priceUsd <= 0 || !dream.deadline) {
        setError('Нужны название, цена и срок той машины, которую хотите.')
        return
      }
      if (tradeInUsd < 0) {
        setError('Оценка сдачи не может быть отрицательной.')
        return
      }
      setStep(3)
      return
    }

    if (haveByn > 0 && !effectiveRate(data)) {
      setError(
        'Для стартовых белрублей нужен курс. Подождите подгрузку Нацбанка или укажите 0 и задайте курс позже.',
      )
      return
    }
    if (haveEur > 0 && (!effectiveRate(data) || !effectiveEurRate(data))) {
      setError(
        'Для стартовых евро нужны курсы USD и EUR. Подождите Нацбанк или укажите 0 и задайте курсы позже.',
      )
      return
    }

    setData(
      seedStarting(
        {
          ...data,
          onboarded: true,
          cars: {
            first: { ...first, name: first.name.trim() },
            dream: { ...dream, name: dream.name.trim() },
            later: data.cars.later,
          },
          house: data.house,
          tradeInUsd,
          monthlyCapacityUsd: capacity,
          createdAt: new Date().toISOString(),
        },
        haveUsd,
        haveByn,
        haveEur,
      ),
    )
  }

  const photo = step === 2 ? CAR_PHOTOS.dream : CAR_PHOTOS.first

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-bg md:grid-cols-2">
      <div className="relative h-52 overflow-hidden md:h-auto">
        <img src={photo.src} alt={photo.alt} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg md:bg-gradient-to-r" />
        <div className="absolute bottom-5 left-5 max-w-md md:bottom-10 md:left-10">
          <div className="flex items-center gap-2.5 text-white">
            <Logo size={26} />
            <p className="text-sm font-medium">{APP_NAME}</p>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight md:mt-4 md:text-3xl">{photo.model}</p>
          <p className="mt-2 text-sm text-muted">
            {step === 1
              ? 'Сначала эта — на первое время'
              : step === 2
                ? 'Потом эта — после сдачи первой'
                : 'Одна копилка на обе'}
          </p>
        </div>
      </div>
      <div className="flex flex-col justify-center px-5 py-8 md:px-16 md:py-12">
        <p className="text-sm text-muted">Шаг {step} из 3</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {step === 1 ? 'Сначала временная' : step === 2 ? 'Потом та, которую хотите' : 'Стартовая копилка'}
        </h1>
        <div className="mt-8 max-w-md">
          {step === 1 ? (
            <div className="grid gap-4">
              <p className="text-[15px] leading-relaxed text-muted">
                Camry XV40. Копим полную цену в долларах — белрубли пересчитаются по курсу.
              </p>
              <Field label="Как назовём">
                <TextInput
                  value={first.name}
                  onChange={(e) => setFirst({ ...first, name: e.target.value })}
                />
              </Field>
              <Field label="Цена, USD">
                <TextInput
                  type="number"
                  min={1}
                  inputMode="decimal"
                  value={first.priceUsd || ''}
                  onChange={(e) => setFirst({ ...first, priceUsd: Number(e.target.value) })}
                />
              </Field>
              <Field label="К какому сроку">
                <TextInput
                  type="date"
                  value={first.deadline}
                  onChange={(e) => setFirst({ ...first, deadline: e.target.value })}
                />
              </Field>
            </div>
          ) : null}
          {step === 2 ? (
            <div className="grid gap-4">
              <p className="text-[15px] leading-relaxed text-muted">
                Tesla Model 3. Первую сдадите — её цена пойдёт в зачёт, копите только разницу.
              </p>
              <Field label="Как назовём">
                <TextInput
                  value={dream.name}
                  onChange={(e) => setDream({ ...dream, name: e.target.value })}
                />
              </Field>
              <Field label="Цена, USD">
                <TextInput
                  type="number"
                  min={1}
                  inputMode="decimal"
                  value={dream.priceUsd || ''}
                  onChange={(e) => setDream({ ...dream, priceUsd: Number(e.target.value) })}
                />
              </Field>
              <Field label="Срок">
                <TextInput
                  type="date"
                  value={dream.deadline}
                  onChange={(e) => setDream({ ...dream, deadline: e.target.value })}
                />
              </Field>
              <Field
                label="За сколько сдадите первую, USD"
                hint="Можно поправить позже. От этого зависит, сколько докидывать на втором этапе."
              >
                <TextInput
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={tradeInUsd || ''}
                  onChange={(e) => setTradeInUsd(Number(e.target.value))}
                />
              </Field>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="grid gap-4">
              <p className="text-[15px] leading-relaxed text-muted">
                Что уже лежит и сколько реально можете откладывать. Лимит нужен, чтобы сказать, сходится ли срок.
              </p>
              <Field label="Уже есть, USD">
                <TextInput
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={haveUsd || ''}
                  onChange={(e) => setHaveUsd(Number(e.target.value))}
                />
              </Field>
              <Field label="Уже есть, EUR">
                <TextInput
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={haveEur || ''}
                  onChange={(e) => setHaveEur(Number(e.target.value))}
                />
              </Field>
              <Field label="Уже есть, BYN">
                <TextInput
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={haveByn || ''}
                  onChange={(e) => setHaveByn(Number(e.target.value))}
                />
              </Field>
              <Field label="Могу класть в месяц, USD">
                <TextInput
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={capacity || ''}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </Field>
            </div>
          ) : null}
          {error ? <p className="mt-4 text-sm text-bad">{error}</p> : null}
          {step === 1 && !cloudEnabled ? (
            <div className="mt-8 grid gap-2">
              <p className="text-[13px] text-muted">Уже настраивали на другом устройстве?</p>
              <TextInput
                value={syncInput}
                onChange={(e) => setSyncInput(e.target.value)}
                placeholder="Код синхронизации rw1.…"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={syncing || !syncInput.trim()}
                onClick={() => {
                  setError('')
                  setSyncing(true)
                  void connectCloud(syncInput)
                    .catch((err: unknown) =>
                      setError(err instanceof Error ? err.message : 'Не удалось открыть копилку.'),
                    )
                    .finally(() => setSyncing(false))
                }}
              >
                {syncing ? 'Открываю…' : 'Открыть существующую копилку'}
              </Button>
            </div>
          ) : null}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
            {step > 1 ? (
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setStep(step - 1)}>
                Назад
              </Button>
            ) : null}
            <Button type="button" className="w-full sm:w-auto" onClick={next}>
              {step < 3 ? 'Дальше' : 'Открыть дашборд'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
