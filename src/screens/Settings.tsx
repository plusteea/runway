import { useState } from 'react'
import { CAR_PHOTOS } from '../cars'
import { resetStore, useStore } from '../store'
import { Button, Field, TextInput } from '../ui'

export function SettingsScreen() {
  const {
    data,
    setData,
    refreshRate,
    cloudEnabled,
    cloudLocked,
    syncCode,
    gistId,
    syncStatus,
    connectCloud,
    disconnectCloud,
  } = useStore()
  const [cloudInput, setCloudInput] = useState('')
  const [gistInput, setGistInput] = useState(gistId)
  const [cloudBusy, setCloudBusy] = useState(false)
  const [cloudError, setCloudError] = useState('')
  const [copied, setCopied] = useState(false)
  const [firstName, setFirstName] = useState(data.cars.first.name)
  const [firstPrice, setFirstPrice] = useState(String(data.cars.first.priceUsd))
  const [firstDeadline, setFirstDeadline] = useState(data.cars.first.deadline)
  const [dreamName, setDreamName] = useState(data.cars.dream.name)
  const [dreamPrice, setDreamPrice] = useState(String(data.cars.dream.priceUsd))
  const [dreamDeadline, setDreamDeadline] = useState(data.cars.dream.deadline)
  const [laterName, setLaterName] = useState(data.cars.later.name)
  const [laterPrice, setLaterPrice] = useState(String(data.cars.later.priceUsd || ''))
  const [laterDeadline, setLaterDeadline] = useState(data.cars.later.deadline)
  const [houseName, setHouseName] = useState(data.house.name)
  const [housePrice, setHousePrice] = useState(String(data.house.priceUsd || ''))
  const [houseDeadline, setHouseDeadline] = useState(data.house.deadline)
  const [houseVisible, setHouseVisible] = useState(data.house.visible)
  const [tradeIn, setTradeIn] = useState(String(data.tradeInUsd))
  const [capacity, setCapacity] = useState(String(data.monthlyCapacityUsd))
  const [override, setOverride] = useState(
    data.fx.overrideRate ? String(data.fx.overrideRate) : '',
  )
  const [saved, setSaved] = useState(false)

  function save() {
    setData({
      ...data,
      cars: {
        first: {
          name: firstName.trim() || data.cars.first.name,
          priceUsd: Number(firstPrice) || data.cars.first.priceUsd,
          deadline: firstDeadline,
        },
        dream: {
          name: dreamName.trim() || data.cars.dream.name,
          priceUsd: Number(dreamPrice) || data.cars.dream.priceUsd,
          deadline: dreamDeadline,
        },
        later: {
          name: laterName.trim() || data.cars.later.name,
          priceUsd: Number(laterPrice) || 0,
          deadline: laterDeadline,
        },
      },
      house: {
        name: houseName.trim() || data.house.name,
        priceUsd: Number(housePrice) || 0,
        deadline: houseDeadline,
        visible: houseVisible,
      },
      tradeInUsd: Number(tradeIn) || 0,
      monthlyCapacityUsd: Number(capacity) || 0,
      fx: {
        ...data.fx,
        overrideRate: override.trim() ? Number(override.replace(',', '.')) : null,
      },
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  function reset() {
    if (!window.confirm('Сбросить копилку и пройти настройку заново?')) return
    setData(resetStore())
  }

  return (
    <div className="max-w-4xl pb-8">
      <div className="mt-2 grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
        <p className="col-span-full text-sm text-muted">Облако · токен GitHub</p>
        <p className="col-span-full text-[13px] leading-relaxed text-muted">
          Сюда вставляется classic token с правом gist — тогда копилка одна на телефоне и компьютере.
        </p>
        {cloudEnabled ? (
          <>
            <p className="col-span-full text-[13px] text-muted">
              {syncStatus === 'ok'
                ? 'Синхронизация включена.'
                : syncStatus === 'saving'
                  ? 'Сохраняю в облако…'
                  : syncStatus === 'loading'
                    ? 'Читаю облако…'
                    : syncStatus === 'error'
                      ? 'Облако не ответило. Проверьте токен и сеть.'
                      : 'Облако подключено.'}
            </p>
            {syncCode ? (
              <Field label="Код для телефона" hint="Откройте тот же сайт и вставьте код на первом шаге.">
                <TextInput readOnly value={syncCode} onFocus={(e) => e.currentTarget.select()} />
              </Field>
            ) : (
              <p className="col-span-full text-[13px] text-muted">
                Код появится после первого успешного сохранения в gist.
              </p>
            )}
            <Field label="Gist" hint="Можно вставить свой id или оставить тот, что создало приложение.">
              <TextInput
                value={gistInput}
                onChange={(e) => setGistInput(e.target.value)}
                placeholder="8cef05b916ce13daf515c076e1f36c23"
              />
            </Field>
            <Button
              type="button"
              variant="secondary"
              disabled={cloudBusy || !gistInput.trim()}
              onClick={() => {
                setCloudError('')
                setCloudBusy(true)
                void connectCloud('', gistInput)
                  .catch((err: unknown) =>
                    setCloudError(err instanceof Error ? err.message : 'Не удалось привязать gist.'),
                  )
                  .finally(() => setCloudBusy(false))
              }}
            >
              {cloudBusy ? 'Сохраняю…' : 'Сохранить gist'}
            </Button>
            {syncCode ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(syncCode)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1400)
                }}
              >
                {copied ? 'Скопировано' : 'Скопировать код'}
              </Button>
            ) : null}
            {cloudLocked ? (
              <p className="col-span-full text-[13px] text-muted">
                Токен задан при сборке сайта — на всех устройствах копилка откроется сама.
              </p>
            ) : (
              <button
                type="button"
                onClick={disconnectCloud}
                className="text-sm text-muted hover:text-ink"
              >
                Отключить облако на этом устройстве
              </button>
            )}
          </>
        ) : (
          <>
            <Field
              label="Токен"
              hint="Classic PAT: github.com/settings/tokens → Generate new token (classic) → галочка gist."
            >
              <TextInput
                value={cloudInput}
                onChange={(e) => setCloudInput(e.target.value)}
                placeholder="ghp_…"
                autoComplete="off"
              />
            </Field>
            <Field label="Gist" hint="Id из адреса gist.github.com/вы/вот-этот-id">
              <TextInput
                value={gistInput}
                onChange={(e) => setGistInput(e.target.value)}
                placeholder="8cef05b916ce13daf515c076e1f36c23"
              />
            </Field>
            <Button
              type="button"
              disabled={cloudBusy || !cloudInput.trim()}
              onClick={() => {
                setCloudError('')
                setCloudBusy(true)
                void connectCloud(cloudInput, gistInput)
                  .catch((err: unknown) =>
                    setCloudError(err instanceof Error ? err.message : 'Не удалось подключить.'),
                  )
                  .finally(() => setCloudBusy(false))
              }}
            >
              {cloudBusy ? 'Подключаю…' : 'Включить синхронизацию'}
            </Button>
            {cloudError ? <p className="col-span-full text-sm text-bad">{cloudError}</p> : null}
          </>
        )}

        <p className="col-span-full mt-8 text-sm text-muted">Временная · {CAR_PHOTOS.first.model}</p>
        <Field label="Название">
          <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field label="Цена, USD">
          <TextInput inputMode="decimal" value={firstPrice} onChange={(e) => setFirstPrice(e.target.value)} />
        </Field>
        <Field label="Срок">
          <TextInput type="date" value={firstDeadline} onChange={(e) => setFirstDeadline(e.target.value)} />
        </Field>

        <p className="col-span-full mt-4 text-sm text-muted">Желанная · {CAR_PHOTOS.dream.model}</p>
        <Field label="Название">
          <TextInput value={dreamName} onChange={(e) => setDreamName(e.target.value)} />
        </Field>
        <Field label="Цена, USD">
          <TextInput inputMode="decimal" value={dreamPrice} onChange={(e) => setDreamPrice(e.target.value)} />
        </Field>
        <Field label="Срок">
          <TextInput type="date" value={dreamDeadline} onChange={(e) => setDreamDeadline(e.target.value)} />
        </Field>
        <p className="col-span-full mt-4 text-sm text-muted">Третья · {CAR_PHOTOS.later.model}</p>
        <Field label="Название">
          <TextInput value={laterName} onChange={(e) => setLaterName(e.target.value)} />
        </Field>
        <Field label="Цена, USD">
          <TextInput inputMode="decimal" value={laterPrice} onChange={(e) => setLaterPrice(e.target.value)} />
        </Field>
        <Field label="Срок">
          <TextInput type="date" value={laterDeadline} onChange={(e) => setLaterDeadline(e.target.value)} />
        </Field>

        <p className="col-span-full mt-4 text-sm text-muted">Четвёртая · дом</p>
        <label className="col-span-full flex items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={houseVisible}
            onChange={(e) => setHouseVisible(e.target.checked)}
            className="size-4 rounded-[4px] accent-primary"
          />
          Выводить на сводке
        </label>
        <Field label="Название">
          <TextInput value={houseName} onChange={(e) => setHouseName(e.target.value)} />
        </Field>
        <Field label="Цена, USD">
          <TextInput inputMode="decimal" value={housePrice} onChange={(e) => setHousePrice(e.target.value)} />
        </Field>
        <Field label="Срок">
          <TextInput type="date" value={houseDeadline} onChange={(e) => setHouseDeadline(e.target.value)} />
        </Field>

        <Field label="Оценка сдачи первой, USD">
          <TextInput inputMode="decimal" value={tradeIn} onChange={(e) => setTradeIn(e.target.value)} />
        </Field>
        <Field label="Могу класть в месяц, USD">
          <TextInput inputMode="decimal" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </Field>

        <p className="col-span-full mt-4 text-sm text-muted">Курс BYN за $1</p>
        <Field
          label="Свой курс"
          hint={
            data.fx.nbrbRate
              ? `Нацбанк сейчас ${data.fx.nbrbRate}. Пустое поле — брать его.`
              : 'Если Нацбанк не отвечает, укажите курс сами.'
          }
        >
          <TextInput
            inputMode="decimal"
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            placeholder="например 3.27"
          />
        </Field>
        <Button type="button" variant="secondary" onClick={() => void refreshRate()}>
          Подтянуть курс Нацбанка
        </Button>
        <Button type="button" onClick={save}>
          {saved ? 'Сохранено' : 'Сохранить'}
        </Button>
        <button type="button" onClick={reset} className="mt-6 text-sm text-muted hover:text-bad">
          Сбросить всё
        </button>
      </div>
    </div>
  )
}
