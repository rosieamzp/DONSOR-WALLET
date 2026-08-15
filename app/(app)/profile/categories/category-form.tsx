'use client'

import { useActionState, useRef, useEffect } from 'react'
import { createCategory } from '@/app/actions/categories'
import { useAlert } from '@/components/confirm-dialog'

export default function CategoryForm() {
  const [state, action, pending] = useActionState(createCategory, undefined)
  const alert = useAlert()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!pending && state && !('error' in state)) {
      formRef.current?.reset()
      alert('已新增分類')
    }
  }, [pending, state, alert])

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          name="name"
          type="text"
          placeholder="分類名稱，例如：寵物"
          required
          className="flex-1 rounded-[var(--radius-default)] border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <select
          name="type"
          defaultValue="expense"
          className="rounded-[var(--radius-default)] border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-primary" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="tap-feedback rounded-[var(--radius-default)] bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? '新增中…' : '新增分類'}
      </button>
    </form>
  )
}
