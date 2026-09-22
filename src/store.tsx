import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  clearCloudConfig,
  cloudConfigured,
  cloudLockedByEnv,
  createCloud,
  decodeSyncCode,
  encodeSyncCode,
  fetchCloud,
  pickNewer,
  readCloudConfig,
  saveCloud,
  writeCloudConfig,
  type CloudStatus,
} from './cloud'
import { fetchNbrbRates, withNbrbRates } from './fx'
import { emptyData, loadData, saveData } from './storage'
import type { AppData } from './types'

type Store = {
  data: AppData
  setData: (next: AppData | ((prev: AppData) => AppData)) => void
  refreshRate: () => Promise<void>
  rateStatus: 'idle' | 'loading' | 'error'
  ready: boolean
  syncStatus: CloudStatus
  cloudEnabled: boolean
  cloudLocked: boolean
  syncCode: string | null
  gistId: string
  connectCloud: (input: string, gistId?: string) => Promise<void>
  disconnectCloud: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => loadData())
  const [rateStatus, setRateStatus] = useState<Store['rateStatus']>('idle')
  const [ready, setReady] = useState(() => !cloudConfigured())
  const [syncStatus, setSyncStatus] = useState<CloudStatus>(() =>
    cloudConfigured() ? 'loading' : 'off',
  )
  const [cloudEnabled, setCloudEnabled] = useState(() => cloudConfigured())
  const [syncCode, setSyncCode] = useState(() => encodeSyncCode(readCloudConfig()))
  const [gistId, setGistId] = useState(() => readCloudConfig().gistId)
  const skipCloudSave = useRef(true)
  const saveTimer = useRef<number>(0)
  const dataRef = useRef(data)
  dataRef.current = data

  const refreshSyncMeta = useCallback(() => {
    const config = readCloudConfig()
    setCloudEnabled(cloudConfigured(config))
    setSyncCode(encodeSyncCode(config))
    setGistId(config.gistId)
  }, [])

  const persist = useCallback((value: AppData) => {
    saveData(value)
    if (!cloudConfigured()) return
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      setSyncStatus('saving')
      void saveCloud(readCloudConfig(), value)
        .then(() => {
          refreshSyncMeta()
          setSyncStatus('ok')
        })
        .catch(() => setSyncStatus('error'))
    }, 700)
  }, [refreshSyncMeta])

  const setData = useCallback((next: AppData | ((prev: AppData) => AppData)) => {
    setDataState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      saveData(value)
      if (!skipCloudSave.current) persist(value)
      return value
    })
  }, [persist])

  const hydrate = useCallback(async () => {
    const config = readCloudConfig()
    if (!cloudConfigured(config)) {
      setReady(true)
      setSyncStatus('off')
      return
    }
    setSyncStatus('loading')
    try {
      let working = config
      if (!working.gistId) {
        working = await createCloud({ token: working.token }, dataRef.current)
        refreshSyncMeta()
      }
      const remote = await fetchCloud(working)
      const next = pickNewer(dataRef.current, remote)
      skipCloudSave.current = true
      setDataState(next)
      saveData(next)
      if (!remote || JSON.stringify(remote.data) !== JSON.stringify(next)) {
        skipCloudSave.current = false
        persist(next)
      } else {
        setSyncStatus('ok')
      }
    } catch {
      setSyncStatus('error')
    } finally {
      skipCloudSave.current = false
      setReady(true)
    }
  }, [persist, refreshSyncMeta])

  useEffect(() => {
    skipCloudSave.current = false
    void hydrate()
    return () => window.clearTimeout(saveTimer.current)
  }, [hydrate])

  const refreshRate = useCallback(async () => {
    setRateStatus('loading')
    try {
      const payload = await fetchNbrbRates()
      setData((prev) => withNbrbRates(prev, payload.usd, payload.eur))
      setRateStatus('idle')
    } catch {
      setRateStatus('error')
    }
  }, [setData])

  useEffect(() => {
    if (!ready) return
    void refreshRate()
  }, [ready, refreshRate])

  const connectCloud = useCallback(
    async (input: string, gistIdInput = '') => {
      const fromCode = decodeSyncCode(input)
      const current = readCloudConfig()
      const token = fromCode?.token || input.trim() || current.token
      const nextGist = fromCode?.gistId || gistIdInput.trim() || current.gistId
      if (!token) throw new Error('Нужен токен GitHub.')
      writeCloudConfig({ token, gistId: nextGist })
      if (!nextGist) await createCloud({ token }, dataRef.current)
      refreshSyncMeta()
      skipCloudSave.current = true
      await hydrate()
    },
    [hydrate, refreshSyncMeta],
  )

  const disconnectCloud = useCallback(() => {
    if (cloudLockedByEnv()) return
    clearCloudConfig()
    refreshSyncMeta()
    setSyncStatus('off')
  }, [refreshSyncMeta])

  const value = useMemo(
    () => ({
      data,
      setData,
      refreshRate,
      rateStatus,
      ready,
      syncStatus,
      cloudEnabled,
      cloudLocked: cloudLockedByEnv(),
      syncCode,
      gistId,
      connectCloud,
      disconnectCloud,
    }),
    [
      cloudEnabled,
      connectCloud,
      data,
      disconnectCloud,
      rateStatus,
      ready,
      refreshRate,
      setData,
      syncCode,
      gistId,
      syncStatus,
    ],
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
