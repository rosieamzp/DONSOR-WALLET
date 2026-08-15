'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ConfirmOptions = {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type AlertOptions = {
  message: string
  confirmLabel?: string
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>
type AlertFn = (options: AlertOptions | string) => Promise<void>

const ConfirmContext = createContext<ConfirmFn | null>(null)
const AlertContext = createContext<AlertFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export function useAlert(): AlertFn {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlert must be used within ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null)
  const confirmResolveRef = useRef<(value: boolean) => void>(null)

  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null)
  const alertResolveRef = useRef<() => void>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setConfirmOptions(typeof opts === 'string' ? { message: opts } : opts)
    return new Promise<boolean>((resolve) => {
      confirmResolveRef.current = resolve
    })
  }, [])

  const alert = useCallback<AlertFn>((opts) => {
    setAlertOptions(typeof opts === 'string' ? { message: opts } : opts)
    return new Promise<void>((resolve) => {
      alertResolveRef.current = resolve
    })
  }, [])

  function closeConfirm(result: boolean) {
    setConfirmOptions(null)
    confirmResolveRef.current?.(result)
    confirmResolveRef.current = null
  }

  function closeAlert() {
    setAlertOptions(null)
    alertResolveRef.current?.()
    alertResolveRef.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      <AlertContext.Provider value={alert}>
        {children}
        {confirmOptions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => closeConfirm(false)}
            />
            <div className="glass-strong relative w-full max-w-xs rounded-[var(--radius-card)] p-5 shadow-xl">
              <p className="text-center text-sm font-medium text-ink">{confirmOptions.message}</p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => closeConfirm(false)}
                  className="tap-feedback flex-1 rounded-2xl border border-[var(--color-border)] py-2.5 text-sm font-semibold text-ink"
                >
                  {confirmOptions.cancelLabel ?? '取消'}
                </button>
                <button
                  type="button"
                  onClick={() => closeConfirm(true)}
                  className={
                    confirmOptions.danger
                      ? 'tap-feedback flex-1 rounded-2xl bg-primary py-2.5 text-sm font-bold text-white'
                      : 'tap-feedback flex-1 rounded-2xl bg-ink py-2.5 text-sm font-bold text-white'
                  }
                >
                  {confirmOptions.confirmLabel ?? '確定'}
                </button>
              </div>
            </div>
          </div>
        )}
        {alertOptions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeAlert} />
            <div className="glass-strong relative w-full max-w-xs rounded-[var(--radius-card)] p-5 shadow-xl">
              <p className="text-center text-sm font-medium text-ink">{alertOptions.message}</p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={closeAlert}
                  className="tap-feedback w-full rounded-2xl bg-ink py-2.5 text-sm font-bold text-white"
                >
                  {alertOptions.confirmLabel ?? '知道了'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AlertContext.Provider>
    </ConfirmContext.Provider>
  )
}
