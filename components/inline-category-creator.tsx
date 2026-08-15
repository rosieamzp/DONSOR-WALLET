'use client'

import { useActionState, useRef, useState, useEffect } from 'react'
import { createCategory } from '@/app/actions/categories'

export default function InlineCategoryCreator({
  type,
  onCreated,
}: {
  type: 'income' | 'expense'
  onCreated?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createCategory, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state && 'success' in state) {
      formRef.current?.reset()
      setOpen(false)
      onCreated?.(state.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-feedback rounded-full border border-dashed border-[var(--color-border)] px-4 py-2 text-[13px] font-semibold text-muted"
      >
        + 新增
      </button>
    )
  }

  return (
    <form ref={formRef} action={action} className="flex items-center gap-2">
      <input type="hidden" name="type" value={type} />
      <input
        name="name"
        type="text"
        placeholder="分類名稱"
        required
        autoFocus
        className="w-28 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[13px] outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={pending}
        className="tap-feedback rounded-full bg-primary px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? '建立中…' : '確認'}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="tap-feedback rounded-full px-2 py-1.5 text-[13px] text-muted"
      >
        取消
      </button>
      {state && 'error' in state && (
        <p className="text-[11px] text-primary" role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
