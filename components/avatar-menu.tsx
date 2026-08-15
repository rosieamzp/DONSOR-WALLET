'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { logout } from '@/app/actions/auth'

export default function AvatarMenu({
  displayName,
  avatarSrc,
}: {
  displayName: string
  avatarSrc: string | null
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tap-feedback relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary-light text-base font-bold text-primary"
        title={displayName}
      >
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={displayName}
            fill
            sizes="44px"
            unoptimized
            className="object-cover"
          />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </button>

      {open && (
        <form
          action={logout}
          className="glass-strong absolute right-0 top-13 z-10 overflow-hidden rounded-2xl"
          style={{ minWidth: 160, boxShadow: '0 12px 28px -12px rgba(43,35,32,0.25)' }}
        >
          <button
            type="submit"
            className="tap-feedback block w-full border-b border-[var(--color-border-light)] px-4 py-3 text-left text-sm font-semibold text-ink"
          >
            切換其他使用者
          </button>
          <button
            type="submit"
            className="tap-feedback block w-full px-4 py-3 text-left text-sm font-semibold text-primary"
          >
            登出
          </button>
        </form>
      )}
    </div>
  )
}
