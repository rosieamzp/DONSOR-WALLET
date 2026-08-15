'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createSettlement,
  confirmSettlement,
  rejectSettlement,
  cancelSettlement,
} from '@/app/actions/settlements'
import { useConfirm, useAlert } from '@/components/confirm-dialog'

export default function SettlementActions({
  settlementId,
  isProposer,
  canPropose,
}: {
  settlementId?: string
  isProposer?: boolean
  canPropose?: boolean
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const alert = useAlert()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(
    action: () => Promise<{ error: string } | { success: true } | { success: true; nothingToSettle: boolean }>,
    successMessage: string
  ) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.refresh()
      alert(successMessage)
    })
  }

  if (canPropose) {
    return (
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await createSettlement()
              if ('error' in result) return result
              if (result.nothingToSettle) {
                return { error: '目前沒有可結算的紀錄' }
              }
              return { success: true }
            }, '已發起結算')
          }
          className="tap-feedback w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? '處理中…' : '發起結算'}
        </button>
        {error && (
          <p className="mt-2 text-xs text-primary" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  if (!settlementId) return null

  if (isProposer) {
    return (
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            if (await confirm({ message: '確定要取消這次結算發起嗎？', danger: true })) {
              run(() => cancelSettlement(settlementId), '已取消發起')
            }
          }}
          className="tap-feedback w-full rounded-2xl border border-[var(--color-border)] py-3 text-sm font-semibold text-ink disabled:opacity-60"
        >
          取消發起
        </button>
        {error && (
          <p className="mt-2 text-xs text-primary" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            if (
              await confirm({
                message: '確定要駁回這次結算嗎？相關紀錄將退回未結算狀態。',
                danger: true,
              })
            ) {
              run(() => rejectSettlement(settlementId), '已駁回結算')
            }
          }}
          className="tap-feedback flex-1 rounded-2xl border border-[var(--color-border)] py-3 text-sm font-semibold text-ink disabled:opacity-60"
        >
          駁回
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            if (await confirm('確認金額無誤嗎？確認後將無法修改。')) {
              run(() => confirmSettlement(settlementId), '已確認結算')
            }
          }}
          className="tap-feedback flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          確認結算
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-primary" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
