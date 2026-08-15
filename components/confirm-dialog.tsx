'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ConfirmOptions = {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<(value: boolean) => void>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(typeof opts === 'string' ? { message: opts } : opts)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  function close(result: boolean) {
    setOptions(null)
    resolveRef.current?.(result)
    resolveRef.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => close(false)}
          />
          <div className="glass-strong relative w-full max-w-xs rounded-[var(--radius-card)] p-5 shadow-xl">
            <p className="text-center text-sm font-medium text-ink">{options.message}</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => close(false)}
                className="tap-feedback flex-1 rounded-2xl border border-[var(--color-border)] py-2.5 text-sm font-semibold text-ink"
              >
                {options.cancelLabel ?? '取消'}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={
                  options.danger
                    ? 'tap-feedback flex-1 rounded-2xl bg-primary py-2.5 text-sm font-bold text-white'
                    : 'tap-feedback flex-1 rounded-2xl bg-ink py-2.5 text-sm font-bold text-white'
                }
              >
                {options.confirmLabel ?? '確定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
