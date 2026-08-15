'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-[var(--radius-default)] border border-black/10 px-4 py-2.5 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          密碼
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-[var(--radius-default)] border border-black/10 px-4 py-2.5 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="tap-feedback mt-2 rounded-[var(--radius-default)] bg-primary px-4 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? '登入中…' : '登入'}
      </button>
    </form>
  )
}
