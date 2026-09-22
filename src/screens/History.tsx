import { Trash2 } from 'lucide-react'
import { lastPurchase, txToUsd } from '../calc'
import { formatDateShort, formatMoney, formatUsd, monthLabel } from '../format'
import { removeTx } from '../storage'
import { useStore } from '../store'
import type { Transaction } from '../types'

export function History() {
  const { data, setData } = useStore()
  const groups = groupMonths(data.txs)

  function remove(tx: Transaction) {
    const label = `${tx.type === 'withdraw' ? 'снятие' : 'пополнение'} ${formatMoney(tx)}`
    if (!window.confirm(`Удалить ${label}? Прогресс пересчитается.`)) return
    setData(removeTx(data, tx.id))
  }

  if (data.txs.length === 0) {
    return (
      <p className="max-w-md text-[15px] leading-relaxed text-muted">
        Пока пусто. Первое пополнение появится здесь и сразу войдёт в прогресс текущего этапа.
      </p>
    )
  }

  return (
    <div className="max-w-3xl pb-8">
      <div className="mt-2 grid gap-5">
        {groups.map((group) => (
          <section key={group.key} className="glass rounded-[20px] px-5 py-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="capitalize text-sm text-muted">{group.label}</h2>
              <p className="text-sm">{formatUsd(group.net, true)}</p>
            </div>
            <ul>
              {group.items.map((tx) => (
                <TxRow key={tx.id} tx={tx} onDelete={() => remove(tx)} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {data.purchases.length > 0 ? (
        <p className="mt-8 text-sm text-muted">
          Покупки:{' '}
          {data.purchases
            .map(
              (p) =>
                `${p.stage === 1 ? data.cars.first.name : data.cars.dream.name} · ${formatDateShort(p.date)}`,
            )
            .join('; ')}
        </p>
      ) : null}
      {lastPurchase(data) ? (
        <p className="mt-2 text-sm text-muted">
          В текущий этап входят операции после последней покупки.
        </p>
      ) : null}
    </div>
  )
}

function TxRow({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  const usd = txToUsd(tx)
  return (
    <li className="flex items-center justify-between gap-3 border-t border-white/10 py-3 first:border-t-0">
      <div className="min-w-0">
        <p className="break-words text-[15px]">
          {tx.type === 'withdraw' ? 'Снятие' : 'Пополнение'} · {formatMoney(tx)}
        </p>
        <p className="mt-0.5 text-[13px] text-muted">
          {formatDateShort(tx.date)}
          {tx.note ? ` · ${tx.note}` : ''}
          {tx.currency !== 'USD' ? ` · ${formatUsd(Math.abs(usd), true)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <p className={`text-[15px] ${usd < 0 ? 'text-bad' : ''}`}>{formatUsd(usd, true)}</p>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex size-9 items-center justify-center rounded-[12px] text-muted hover:bg-white/10 hover:text-bad"
          aria-label="Удалить операцию"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  )
}

function groupMonths(txs: Transaction[]) {
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const key = tx.date.slice(0, 7)
    const list = map.get(key) ?? []
    list.push(tx)
    map.set(key, list)
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => ({
      key,
      label: monthLabel(key),
      items,
      net: items.reduce((acc, tx) => acc + txToUsd(tx), 0),
    }))
}
