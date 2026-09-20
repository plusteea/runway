import { History as HistoryIcon, House, PiggyBank, Plus, Settings2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { effectiveRate } from './calc'
import { AddMoney } from './screens/AddMoney'
import { Bought } from './screens/Bought'
import { History } from './screens/History'
import { Home } from './screens/Home'
import { Onboarding } from './screens/Onboarding'
import { Savings } from './screens/Savings'
import { SettingsScreen } from './screens/Settings'
import { APP_NAME } from './brand'
import { Logo } from './Logo'
import { useStore } from './store'

type Tab = 'home' | 'savings' | 'history' | 'settings'
type Overlay = null | 'add' | 'bought'

const TABS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Сводка', icon: House },
  { id: 'savings', label: 'Копилка', icon: PiggyBank },
  { id: 'history', label: 'История', icon: HistoryIcon },
  { id: 'settings', label: 'Цели', icon: Settings2 },
]

function syncLabel(status: ReturnType<typeof useStore>['syncStatus']) {
  if (status === 'loading') return 'Облако · загрузка'
  if (status === 'saving') return 'Облако · сохраняю'
  if (status === 'ok') return 'Облако · GitHub'
  if (status === 'error') return 'Облако · ошибка'
  return 'Только это устройство'
}

function formatRate(rate: number | null) {
  if (!rate) return '—'
  return rate.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}

export default function App() {
  const { data, refreshRate, rateStatus, ready, syncStatus } = useStore()
  const rate = effectiveRate(data)
  const usingOverride = Boolean(data.fx.overrideRate)
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay>(null)

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6 text-muted">
        <p>Загружаю копилку…</p>
      </div>
    )
  }

  if (!data.onboarded) return <Onboarding />

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col md:flex-row">
        <header className="glass sticky top-0 z-30 mx-3 mt-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-2.5 rounded-[18px] px-3 py-2 md:hidden">
          <Logo size={24} />
          <p className="text-[15px] font-semibold tracking-tight">{APP_NAME}</p>
          <button
            type="button"
            onClick={() => void refreshRate()}
            className="ml-auto min-h-11 px-1 text-right"
          >
            <p className="text-[15px] leading-none font-semibold tracking-tight">
              {formatRate(rate)}
              <span className="ml-1 text-[11px] font-medium text-muted">Br</span>
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {rateStatus === 'loading' ? 'Обновляю…' : syncLabel(syncStatus)}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setOverlay('add')}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-on-primary"
            aria-label="Пополнить"
          >
            <Plus size={20} />
          </button>
        </header>

        <aside className="glass sticky top-0 m-3 hidden h-[calc(100dvh-1.5rem)] w-56 shrink-0 flex-col rounded-[20px] px-3 py-5 md:flex">
          <div className="flex items-center gap-2.5 px-3">
            <Logo size={28} />
            <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
          </div>
          <nav className="mt-8 grid gap-1" aria-label="Разделы">
            {TABS.map((item) => (
              <SideLink
                key={item.id}
                active={tab === item.id}
                onClick={() => setTab(item.id)}
                icon={<item.icon size={18} />}
              >
                {item.id === 'savings' ? 'Накопления' : item.label}
              </SideLink>
            ))}
          </nav>
          <div className="mt-auto px-3">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Курс USD</p>
            <p className="mt-1.5 text-[1.65rem] leading-none font-semibold tracking-tight">
              {formatRate(rate)}
              <span className="ml-1 text-sm font-medium text-muted">Br</span>
            </p>
            <button
              type="button"
              onClick={() => void refreshRate()}
              className="mt-2 text-left text-[12px] text-muted hover:text-ink"
            >
              {rateStatus === 'loading'
                ? 'Обновляю…'
                : rate
                  ? usingOverride
                    ? 'Свой · обновить НБРБ'
                    : 'НБРБ · за $1'
                  : 'Подтянуть НБРБ'}
            </button>
            <p className="mt-3 text-[11px] text-muted">{syncLabel(syncStatus)}</p>
          </div>
          <button
            type="button"
            onClick={() => setOverlay('add')}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-primary px-3 text-[14px] font-medium text-on-primary"
          >
            <Plus size={18} />
            Пополнить
          </button>
        </aside>

        <div className="relative min-w-0 flex-1 md:py-3 md:pr-3">
          <main className="px-4 py-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] md:px-5 md:py-5 md:pb-5">
            {tab === 'home' ? <Home onBought={() => setOverlay('bought')} /> : null}
            {tab === 'savings' ? <Savings /> : null}
            {tab === 'history' ? <History /> : null}
            {tab === 'settings' ? <SettingsScreen /> : null}
          </main>

          {overlay ? (
            <div
              className="fixed inset-0 z-40 bg-bg/35 backdrop-blur-sm"
              onClick={() => setOverlay(null)}
            >
              <div
                className="glass-strong absolute inset-x-0 bottom-0 z-50 flex h-[min(92dvh,100%)] w-full flex-col overflow-hidden rounded-t-[24px] md:top-3 md:right-3 md:bottom-3 md:left-auto md:h-auto md:w-[min(28rem,calc(100%-1.5rem))] md:rounded-[20px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center pt-2 md:hidden">
                  <span className="h-1 w-10 rounded-full bg-white/20" />
                </div>
                {overlay === 'add' ? <AddMoney onBack={() => setOverlay(null)} /> : null}
                {overlay === 'bought' ? <Bought onBack={() => setOverlay(null)} /> : null}
              </div>
            </div>
          ) : null}
        </div>

        <nav
          className="glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-4 rounded-[20px] px-1 py-1 md:hidden"
          aria-label="Разделы"
        >
          {TABS.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[16px] text-[11px] ${
                  active ? 'bg-white/16 text-ink' : 'text-muted'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

function SideLink({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-[16px] px-3 text-[14px] ${
        active ? 'bg-white/16 text-ink' : 'text-muted hover:bg-white/8 hover:text-ink'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
