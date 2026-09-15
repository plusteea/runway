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

export default function App() {
  const { data, refreshRate, rateStatus } = useStore()
  const rate = effectiveRate(data)
  const usingOverride = Boolean(data.fx.overrideRate)
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay>(null)

  if (!data.onboarded) return <Onboarding />

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1400px]">
        <aside className="glass sticky top-0 m-3 flex h-[calc(100dvh-1.5rem)] w-56 shrink-0 flex-col rounded-[20px] px-3 py-5">
          <div className="flex items-center gap-2.5 px-3">
            <Logo size={28} />
            <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
          </div>
          <nav className="mt-8 grid gap-1" aria-label="Разделы">
            <SideLink active={tab === 'home'} onClick={() => setTab('home')} icon={<House size={18} />}>
              Сводка
            </SideLink>
            <SideLink
              active={tab === 'savings'}
              onClick={() => setTab('savings')}
              icon={<PiggyBank size={18} />}
            >
              Накопления
            </SideLink>
            <SideLink
              active={tab === 'history'}
              onClick={() => setTab('history')}
              icon={<HistoryIcon size={18} />}
            >
              История
            </SideLink>
            <SideLink
              active={tab === 'settings'}
              onClick={() => setTab('settings')}
              icon={<Settings2 size={18} />}
            >
              Цели
            </SideLink>
          </nav>
          <div className="mt-auto px-3">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Курс USD</p>
            <p className="mt-1.5 text-[1.65rem] leading-none font-semibold tracking-tight">
              {rate ? rate.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : '—'}
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

        <div className="relative min-w-0 flex-1 py-3 pr-3">
          <main className="px-5 py-5">
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
                className="glass-strong absolute top-3 right-3 bottom-3 z-50 flex w-[min(28rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-[20px]"
                onClick={(e) => e.stopPropagation()}
              >
                {overlay === 'add' ? <AddMoney onBack={() => setOverlay(null)} /> : null}
                {overlay === 'bought' ? <Bought onBack={() => setOverlay(null)} /> : null}
              </div>
            </div>
          ) : null}
        </div>
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
