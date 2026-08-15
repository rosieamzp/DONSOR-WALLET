'use client'

import { useState, useTransition } from 'react'
import { deleteCategory } from '@/app/actions/categories'
import { useConfirm } from '@/components/confirm-dialog'

export default function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const confirm = useConfirm()

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (await confirm({ message: '確定要刪除這個分類嗎？', danger: true })) {
            setError(null)
            startTransition(async () => {
              const result = await deleteCategory(id)
              if ('error' in result) {
                setError(result.error)
              }
            })
          }
        }}
        className="tap-feedback rounded-md px-1.5 py-0.5 text-xs font-medium text-muted disabled:opacity-50"
      >
        刪除
      </button>
      {error && <p className="text-[11px] text-primary">{error}</p>}
    </div>
  )
}
