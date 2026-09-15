import type { AppData } from './types'

export type NbrbRate = {
  Cur_OfficialRate: number
  Date: string
}

export async function fetchNbrbUsd(): Promise<NbrbRate> {
  const res = await fetch(
    import.meta.env.PROD ? 'https://api.nbrb.by/exrates/rates/431' : '/api/nbrb/usd',
  )
  if (!res.ok) throw new Error('nbrb')
  return (await res.json()) as NbrbRate
}

export function withNbrbRate(data: AppData, rate: number): AppData {
  return {
    ...data,
    fx: {
      ...data.fx,
      nbrbRate: rate,
      nbrbFetchedAt: new Date().toISOString(),
    },
  }
}
