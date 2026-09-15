import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchNbrbUsd, withNbrbRate } from './fx'
import { emptyData, loadData, saveData } from './storage'
import type { AppData } from './types'

type Store = {
  data: AppData
  setData: (next: AppData | ((prev: AppData) => AppData)) => void
  refreshRate: () => Promise<void>
  rateStatus: 'idle' | 'loading' | 'error'
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => loadData())
  const [rateStatus, setRateStatus] = useState<Store['rateStatus']>('idle')

  const setData = useCallback((next: AppData | ((prev: AppData) => AppData)) => {
    setDataState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      saveData(value)
      return value
    })
  }, [])

  const refreshRate = useCallback(async () => {
    setRateStatus('loading')
    try {
      const payload = await fetchNbrbUsd()
      setData((prev) => withNbrbRate(prev, payload.Cur_OfficialRate))
      setRateStatus('idle')
    } catch {
      setRateStatus('error')
    }
  }, [setData])

  useEffect(() => {
    void refreshRate()
  }, [refreshRate])

  const value = useMemo(
    () => ({ data, setData, refreshRate, rateStatus }),
    [data, setData, refreshRate, rateStatus],
  )

  return createElement(StoreContext.Provider, { value }, children)
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('StoreProvider missing')
  return ctx
}

export function resetStore(): AppData {
  const fresh = emptyData()
  saveData(fresh)
  return fresh
}
