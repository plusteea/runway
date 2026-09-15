import type { ReactNode } from 'react'
import {
  Calendar,
  CalendarClock,
  CalendarX,
  Flag,
  Info,
  Landmark,
  TrendingDown,
  TrendingUp,
  Wallet,
  Waypoints,
} from 'lucide-react'
import { CAR_PHOTOS } from '../cars'
import { currentCar, monthlyLedger, snapshot } from '../calc'
import { formatDate, formatUsd, monthShort } from '../format'
import { buildHints, monthsWord, type Hint, type HintTone } from '../hints'
import { useStore } from '../store'

export function Home({
  onBought,
}: {
  onBought: () => void
}) {
  const { data } = useStore()

  if (data.currentStage === 'done') {
    return (
      <div className="max-w-2xl">
        <p className="text-3xl font-semibold leading-snug tracking-tight">Оба этапа закрыты.</p>
        <p className="mt-3 text-[15px] text-muted">
          История на месте. Новый заезд — сброс в целях.
        </p>
      </div>
    )
  }

  const snap = snapshot(data)
  const hints = buildHints(data)
  const car = currentCar(data)
  const firstActive = data.currentStage !== 2

  return (
    <div>
      <div className="grid gap-4">
        <StagePanel
          size="hero"
          photo={CAR_PHOTOS.first}
          name={data.cars.first.name}
          label={firstActive ? '' : 'Пройдено'}
          dim={!firstActive}
        >
          {firstActive ? (
            <>
              <Bar value={snap.progress} />
              <p className="mt-3 text-sm">
                {formatUsd(snap.piggy)} из {formatUsd(data.cars.first.priceUsd)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              Сдача ~{formatUsd(data.tradeInUsd)} идёт в зачёт следующей
            </p>
          )}
        </StagePanel>
        <div className={`grid gap-4 ${data.house.visible ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <StagePanel
            size="compact"
            photo={CAR_PHOTOS.dream}
            name={data.cars.dream.name}
            label={firstActive ? 'Потом' : 'Сейчас'}
            dim={firstActive}
          >
            {firstActive ? null : (
              <>
                <Bar value={snap.progress} />
                <p className="mt-3 text-sm">
                  {formatUsd(snap.piggy)} из {formatUsd(snap.target)}
                </p>
              </>
            )}
          </StagePanel>
          <StagePanel
            size="compact"
            photo={CAR_PHOTOS.later}
            name={data.cars.later.name || 'Cybertruck'}
            label="Coming soon"
            dim
          />
          {data.house.visible ? (
            <StagePanel
              size="compact"
              photo={CAR_PHOTOS.house}
              name={data.house.name || 'Дом'}
              label="Потом"
              dim
            />
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <section className="glass flex flex-col rounded-[20px] px-5 py-5">
          <p className="text-sm text-muted">Ещё до «{car.name}»</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">{formatUsd(snap.remaining)}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {formatUsd(snap.piggy)} из {formatUsd(snap.target)} · {formatDate(car.deadline)} ·{' '}
            {monthsWord(snap.months)}
          </p>
        </section>
        <section className="glass flex flex-col rounded-[20px] px-5 py-5">
          <p className="text-sm text-muted">Этот месяц</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">
            {formatUsd(snap.monthGot)}
            <span className="ml-2 text-lg font-medium text-muted">из {formatUsd(snap.monthlyNeed)}</span>
          </p>
          <Bar value={snap.monthlyNeed <= 0 ? 1 : snap.monthGot / snap.monthlyNeed} />
          <p className="mt-3 text-sm text-muted">
            План {formatUsd(snap.monthlyNeed)}
            {data.monthlyCapacityUsd > 0 ? ` · можете ${formatUsd(data.monthlyCapacityUsd)}` : ''}
          </p>
        </section>
        <MonthChart />
      </div>

      <section className="glass mt-4 overflow-hidden rounded-[20px]">
        <ul>
          {hints.map((hint) => (
            <StatusRow key={hint.id} hint={hint} />
          ))}
        </ul>
        <div className="border-t border-white/8 px-5 py-4">
          <button
            type="button"
            onClick={onBought}
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            {firstActive
              ? `Отметить «${data.cars.first.name}» купленной`
              : `Отметить «${data.cars.dream.name}» купленной`}
          </button>
        </div>
      </section>
    </div>
  )
}

function MonthChart() {
  const { data } = useStore()
  const rows = monthlyLedger(data)
  const peak = Math.max(1, ...rows.flatMap((row) => [row.actual, row.planned]))

  return (
    <section className="glass flex flex-col rounded-[20px] px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted">По месяцам</p>
        <div className="flex flex-wrap gap-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 bg-primary" />
            Положил
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 bg-white/25" />
            Надо было
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 bg-bad/70" />
            Дыра
          </span>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-muted">Пока нет месяцев на этом этапе.</p>
      ) : (
        <div className="mt-5 flex min-h-0 flex-1 items-end gap-2 overflow-x-auto pb-1">
          {rows.map((row) => (
            <div key={row.key} className="flex min-w-8 flex-1 flex-col items-center">
              <div className="flex h-28 items-end gap-0.5">
                <div
                  className="w-3 bg-primary"
                  style={{ height: `${(row.actual / peak) * 100}%` }}
                  title={`Положил ${formatUsd(row.actual)}`}
                />
                <div
                  className="w-3 bg-white/25"
                  style={{ height: `${(row.planned / peak) * 100}%` }}
                  title={`Надо было ${formatUsd(row.planned)}`}
                />
                <div
                  className="w-3 bg-bad/70"
                  style={{ height: `${(row.hole / peak) * 100}%` }}
                  title={`Дыра ${formatUsd(row.hole)}`}
                />
              </div>
              <p className="mt-2 text-[11px] capitalize text-muted">{monthShort(row.key)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function StatusRow({ hint }: { hint: Hint }) {
  const meta = statusMeta(hint.id)
  const Icon = meta.icon
  return (
    <li className="flex items-start gap-4 border-b border-white/8 px-5 py-4">
      <span
        className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[12px] ${toneClass(hint.tone)}`}
      >
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-muted">{meta.title}</p>
        <p className="mt-1 text-[15px] leading-relaxed">{hint.text}</p>
      </div>
    </li>
  )
}

function statusMeta(id: string): { title: string; icon: typeof Info } {
  if (id.startsWith('month-')) return { title: 'Этот месяц', icon: Calendar }
  if (id === 'pace-behind') return { title: 'Темп', icon: TrendingDown }
  if (id === 'pace-ahead') return { title: 'Темп', icon: TrendingUp }
  if (id === 'capacity') return { title: 'Лимит', icon: Wallet }
  if (id === 'projection') return { title: 'Прогноз', icon: CalendarClock }
  if (id === 'look-ahead' || id === 'stage-2') return { title: 'Дорожка', icon: Waypoints }
  if (id === 'no-rate') return { title: 'Курс', icon: Landmark }
  if (id === 'deadline-past') return { title: 'Срок', icon: CalendarX }
  if (id === 'done') return { title: 'Готово', icon: Flag }
  return { title: 'Статус', icon: Info }
}

function toneClass(tone: HintTone): string {
  if (tone === 'ok') return 'bg-primary/20 text-primary'
  if (tone === 'warn') return 'bg-warn/20 text-warn'
  if (tone === 'bad') return 'bg-bad/20 text-bad'
  return 'bg-white/10 text-accent'
}

function StagePanel({
  photo,
  name,
  label,
  dim,
  size = 'compact',
  children,
}: {
  photo: { src: string; alt: string; model: string; position: string }
  name: string
  label: string
  dim: boolean
  size?: 'hero' | 'compact'
  children?: ReactNode
}) {
  const tall = size === 'hero' ? 'h-[520px]' : 'h-[300px]'
  const sheet =
    size === 'hero' ? 'bottom-5 left-5 w-max max-w-[80%] p-4' : 'bottom-4 right-4 w-max max-w-[80%] p-3.5'
  return (
    <section className={tall}>
      <div className="relative h-full overflow-hidden rounded-[20px]">
        <img
          src={photo.src}
          alt={photo.alt}
          className={`absolute inset-0 size-full object-cover ${dim ? 'opacity-85' : ''}`}
          style={{ objectPosition: photo.position }}
        />
        <div className={`glass absolute ${sheet} rounded-[12px]`}>
          <p className="text-[11px] tracking-[0.14em] text-white/70 uppercase">{label}</p>
          <p
            className={`mt-1.5 whitespace-nowrap font-semibold leading-tight tracking-tight text-white ${
              size === 'hero' ? 'text-[1.35rem]' : 'text-[1.15rem]'
            }`}
          >
            {name}
          </p>
          {size === 'hero' ? (
            <p className="mt-0.5 text-[12px] text-white/65">{photo.model}</p>
          ) : null}
          {children ? <div className="mt-3 text-[13px] text-white/90">{children}</div> : null}
        </div>
      </div>
    </section>
  )
}

function Bar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(1, value)) * 100
  const over = value > 1
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-[6px] bg-white/15">
      <div
        className={`h-full rounded-[6px] ${over ? 'bg-accent' : 'bg-primary'} transition-[width] duration-200 ease-[var(--ease-out)]`}
        style={{ width: `${Math.min(100, width)}%` }}
      />
    </div>
  )
}
