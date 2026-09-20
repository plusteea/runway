import { parseData } from './storage'
import type { AppData } from './types'

const TOKEN_KEY = 'garage-kopilka-cloud-token'
const GIST_KEY = 'garage-kopilka-cloud-gist'
const FILE = 'runway.json'
const CODE_PREFIX = 'rw1.'

export type CloudEnvelope = {
  v: 1
  updatedAt: number
  data: AppData
}

export type CloudConfig = {
  token: string
  gistId: string
}

export type CloudStatus = 'off' | 'loading' | 'saving' | 'ok' | 'error'

function envToken(): string {
  return (import.meta.env.VITE_GITHUB_TOKEN as string | undefined)?.trim() ?? ''
}

function envGistId(): string {
  return (import.meta.env.VITE_GIST_ID as string | undefined)?.trim() ?? ''
}

export function readCloudConfig(): CloudConfig {
  return {
    token: envToken() || localStorage.getItem(TOKEN_KEY)?.trim() || '',
    gistId: envGistId() || localStorage.getItem(GIST_KEY)?.trim() || '',
  }
}

export function cloudConfigured(config = readCloudConfig()): boolean {
  return Boolean(config.token)
}

export function cloudLockedByEnv(): boolean {
  return Boolean(envToken())
}

export function writeCloudConfig(config: Partial<CloudConfig>): CloudConfig {
  const next = { ...readCloudConfig(), ...config }
  if (envToken()) {
    if (!envGistId() && next.gistId) localStorage.setItem(GIST_KEY, next.gistId)
    return readCloudConfig()
  }
  if (next.token) localStorage.setItem(TOKEN_KEY, next.token)
  else localStorage.removeItem(TOKEN_KEY)
  if (next.gistId) localStorage.setItem(GIST_KEY, next.gistId)
  else localStorage.removeItem(GIST_KEY)
  return readCloudConfig()
}

export function clearCloudConfig(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(GIST_KEY)
}

export function encodeSyncCode(config: CloudConfig): string | null {
  if (!config.token || !config.gistId) return null
  const payload = btoa(JSON.stringify({ g: config.gistId, t: config.token }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
  return `${CODE_PREFIX}${payload}`
}

export function decodeSyncCode(raw: string): CloudConfig | null {
  const text = raw.trim()
  if (!text.startsWith(CODE_PREFIX)) return null
  try {
    const b64 = text
      .slice(CODE_PREFIX.length)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const parsed = JSON.parse(atob(padded)) as { g?: string; t?: string }
    if (!parsed.g || !parsed.t) return null
    return { gistId: parsed.g, token: parsed.t }
  } catch {
    return null
  }
}

function headers(token: string, json = false): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  }
}

function envelope(data: AppData, updatedAt = Date.now()): CloudEnvelope {
  return { v: 1, updatedAt, data }
}

function parseEnvelope(raw: unknown): CloudEnvelope | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as { v?: number; updatedAt?: number; data?: unknown }
  const data = parseData(value.data ?? raw)
  if (!data) return null
  return {
    v: 1,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
    data,
  }
}

type GistFile = { content?: string }
type GistResponse = { id: string; files?: Record<string, GistFile | undefined> }

async function gistRequest(url: string, init: RequestInit): Promise<GistResponse> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `github ${res.status}`)
  }
  return (await res.json()) as GistResponse
}

function gistPayload(response: GistResponse): CloudEnvelope | null {
  const file = response.files?.[FILE] ?? Object.values(response.files ?? {})[0]
  if (!file?.content) return null
  try {
    return parseEnvelope(JSON.parse(file.content) as unknown)
  } catch {
    return null
  }
}

export async function fetchCloud(config: CloudConfig): Promise<CloudEnvelope | null> {
  if (!config.token || !config.gistId) return null
  const response = await gistRequest(`https://api.github.com/gists/${config.gistId}`, {
    headers: headers(config.token),
  })
  return gistPayload(response)
}

export async function createCloud(config: { token: string }, data: AppData): Promise<CloudConfig> {
  const packed = envelope(data)
  const response = await gistRequest('https://api.github.com/gists', {
    method: 'POST',
    headers: headers(config.token, true),
    body: JSON.stringify({
      description: 'Runway — копилка',
      public: false,
      files: { [FILE]: { content: JSON.stringify(packed) } },
    }),
  })
  return writeCloudConfig({ token: config.token, gistId: response.id })
}

export async function saveCloud(config: CloudConfig, data: AppData): Promise<CloudEnvelope> {
  if (!config.token) throw new Error('no cloud token')
  const packed = envelope(data)
  const target = config.gistId
    ? config
    : await createCloud({ token: config.token }, data)
  if (!config.gistId) {
    return packed
  }
  await gistRequest(`https://api.github.com/gists/${target.gistId}`, {
    method: 'PATCH',
    headers: headers(target.token, true),
    body: JSON.stringify({
      files: { [FILE]: { content: JSON.stringify(packed) } },
    }),
  })
  return packed
}

export function pickNewer(local: AppData, remote: CloudEnvelope | null): AppData {
  if (!remote) return local
  if (!local.onboarded && remote.data.onboarded) return remote.data
  if (local.onboarded && !remote.data.onboarded) return local
  return remote.data
}
