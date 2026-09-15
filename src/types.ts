export type Currency = 'USD' | 'BYN'
export type Stage = 1 | 2 | 'done'
export type TxType = 'deposit' | 'withdraw'

export type Car = {
  name: string
  priceUsd: number
  deadline: string
}

export type Transaction = {
  id: string
  type: TxType
  currency: Currency
  amount: number
  date: string
  note?: string
  rateBynPerUsd: number
  createdAt: string
}

export type Purchase = {
  id: string
  stage: 1 | 2
  date: string
  createdAt: string
  spentUsd: number
  tradeInUsd?: number
}

export type AppData = {
  version: 1
  onboarded: boolean
  createdAt: string
  cars: {
    first: Car
    dream: Car
    later: Car
  }
  house: Car & { visible: boolean }
  tradeInUsd: number
  monthlyCapacityUsd: number
  currentStage: Stage
  fx: {
    nbrbRate: number | null
    nbrbFetchedAt: string | null
    overrideRate: number | null
  }
  txs: Transaction[]
  purchases: Purchase[]
}
