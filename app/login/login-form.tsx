'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white/80">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input-on-primary border-0 border-b border-white/40 bg-transparent px-0 py-2 text-base text-white outline-none transition-colors placeholder:text-white/40 focus:border-white"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white/80">
          密碼
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input-on-primary border-0 border-b border-white/40 bg-transparent px-0 py-2 text-base text-white outline-none transition-colors placeholder:text-white/40 focus:border-white"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-white" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="tap-feedback mt-2 rounded-[var(--radius-default)] border border-white bg-transparent px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-white hover:text-primary disabled:opacity-60"
      >
        {pending ? '登入中…' : '登入'}
      </button>
    </form>
  )
}
