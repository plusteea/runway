import { useState } from 'react'
import { currentPiggyUsd, stageTargetUsd } from '../calc'
import { formatUsd } from '../format'
import { buyStage } from '../storage'
import { useStore } from '../store'
import { Button, Field, Screen, TextInput } from '../ui'

export function Bought({ onBack }: { onBack: () => void }) {
  const { data, setData } = useStore()
  const stage = data.currentStage === 2 ? 2 : 1
  const [tradeIn, setTradeIn] = useState(String(data.tradeInUsd))
  const piggy = currentPiggyUsd(data)
  const target = stageTargetUsd(data)
  const name = stage === 1 ? data.cars.first.name : data.cars.dream.name

  function confirm() {
    const nextTrade = stage === 1 ? Number(tradeIn) || 0 : data.tradeInUsd
    setData(buyStage(data, stage, nextTrade))
    onBack()
  }

  return (
    <Screen
      title="Отметить покупку"
      onBack={onBack}
      footer={
        <Button type="button" className="w-full" onClick={confirm}>
          Купил «{name}»
        </Button>
      }
    >
      <p className="text-[15px] leading-relaxed text-muted">
        Накопления текущего этапа спишутся в машину. Если в копилке больше цены — остаток перейдёт
        дальше.
      </p>
      <p className="mt-5 text-[15px]">
        Сейчас в копилке {formatUsd(piggy, true)} при цели {formatUsd(target, true)}.
      </p>
      {stage === 1 ? (
        <div className="mt-6">
          <Field
            label="За сколько потом сдадите, USD"
            hint="Эта сумма вычтется из цены желанной машины."
          >
            <TextInput
              inputMode="decimal"
              value={tradeIn}
              onChange={(e) => setTradeIn(e.target.value)}
            />
          </Field>
        </div>
      ) : (
        <p className="mt-5 text-[15px] text-muted">
          После этого дорожка закроется. Сдачу первой уже учли в разнице.
        </p>
      )}
    </Screen>
  )
}
