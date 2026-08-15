import Image from 'next/image'
import Link from 'next/link'
import { getCurrentUserProfile } from '@/lib/supabase/current-user'
import { logout } from '@/app/actions/auth'
import { getAvatarSrc } from '@/lib/avatars'

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile()

  const displayName = profile?.displayName ?? ''
  const avatarSrc = getAvatarSrc(displayName)
  const menuItems = [
    { label: '分類管理', href: '/profile/categories' },
    { label: '代墊結算', href: '/settlement' },
  ]

  return (
    <div className="px-5 pb-5 pt-7">
      <div className="mb-6 flex flex-col items-center">
        <div
          className="relative grid place-items-center overflow-hidden rounded-full bg-primary-light text-2xl font-bold text-primary"
          style={{ width: 72, height: 72 }}
        >
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={displayName}
              fill
              sizes="72px"
              unoptimized
              className="object-cover"
            />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="mt-3 text-lg font-extrabold text-ink">{displayName}</div>
        <div className="mt-0.5 text-xs text-faint">{profile?.email}</div>
      </div>

      <div className="glass overflow-hidden rounded-[18px]">
        {menuItems.map((item, i) => {
          const rowClass = `tap-feedback flex items-center justify-between p-4 text-sm text-ink ${
            i < menuItems.length - 1 ? 'border-b border-[var(--color-border-light)]' : ''
          } ${item.href ? '' : 'opacity-50'}`

          const chevron = (
            <div
              className="border-t-2 border-r-2 border-[var(--color-chevron)]"
              style={{ width: 7, height: 7, transform: 'rotate(45deg)' }}
            />
          )

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={rowClass}>
                {item.label}
                {chevron}
              </Link>
            )
          }

          return (
            <div key={item.label} className={rowClass}>
              {item.label}
              {chevron}
            </div>
          )
        })}
      </div>

      <form action={logout} className="mt-6">
        <button
          type="submit"
          className="tap-feedback w-full rounded-[var(--radius-default)] border border-[var(--color-border)] py-3 text-sm font-semibold text-ink"
        >
          登出
        </button>
      </form>
    </div>
  )
}
