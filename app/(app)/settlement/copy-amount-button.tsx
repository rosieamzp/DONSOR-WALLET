'use client'

import { useState } from 'react'

export default function CopyAmountButton({ amount }: { amount: number }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const rawValue = String(Math.round(amount * 100) / 100)
    try {
      await navigator.clipboard.writeText(rawValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard 權限被拒絕或不支援時，靜默失敗，不影響其他功能
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="tap-feedback inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary"
    >
      {copied ? (
        '已複製'
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="8"
              y="8"
              width="13"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          複製金額
        </>
      )}
    </button>
  )
}
