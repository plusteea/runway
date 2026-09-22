import type { AppData } from './types'

export type NbrbRate = {
  Cur_OfficialRate: number
  Date: string
}

function nbrbUrl(code: 'usd' | 'eur'): string {
  const id = code === 'usd' ? '431' : '451'
  return import.meta.env.PROD ? `https://api.nbrb.by/exrates/rates/${id}` : `/api/nbrb/${code}`
}

export async function fetchNbrbRates(): Promise<{ usd: number; eur: number }> {
  const [usdRes, eurRes] = await Promise.all([fetch(nbrbUrl('usd')), fetch(nbrbUrl('eur'))])
  if (!usdRes.ok || !eurRes.ok) throw new Error('nbrb')
  const usd = (await usdRes.json()) as NbrbRate
  const eur = (await eurRes.json()) as NbrbRate
  return { usd: usd.Cur_OfficialRate, eur: eur.Cur_OfficialRate }
}

export function withNbrbRates(data: AppData, usd: number, eur: number): AppData {
  return {
    ...data,
    fx: {
      ...data.fx,
      nbrbRate: usd,
      nbrbEurRate: eur,
      nbrbFetchedAt: new Date().toISOString(),
    },
  }
}
