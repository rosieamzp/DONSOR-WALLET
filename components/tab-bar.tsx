'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '首頁', key: 'home' },
  { href: '/records', label: '記錄', key: 'records' },
  { href: '/add', label: '新增', key: 'add' },
  { href: '/stats', label: '統計', key: 'stats' },
  { href: '/profile', label: '我的', key: 'profile' },
] as const

function TabIcon({ tabKey, active }: { tabKey: string; active: boolean }) {
  const color = active ? '#D6303C' : '#9C9490'

  if (tabKey === 'home') {
    return <div style={{ width: 20, height: 20, borderRadius: 6, background: color }} />
  }
  if (tabKey === 'records') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 20 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 3, borderRadius: 2, background: color }} />
        ))}
      </div>
    )
  }
  if (tabKey === 'stats') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 18 }}>
        <div style={{ width: 4, height: 8, borderRadius: 1, background: color }} />
        <div style={{ width: 4, height: 14, borderRadius: 1, background: color }} />
        <div style={{ width: 4, height: 18, borderRadius: 1, background: color }} />
      </div>
    )
  }
  return <div style={{ width: 20, height: 20, borderRadius: '50%', background: color }} />
}

export default function TabBar() {
  const pathname = usePathname()

  return (
    <div className="glass absolute bottom-0 left-0 right-0 flex h-20 items-center justify-around border-t-0 px-1.5 pb-3.5">
      {tabs.map((tab) => {
        if (tab.key === 'add') {
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="tap-feedback relative top-[-16px] flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="flex h-13 w-13 items-center justify-center rounded-full"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: 'linear-gradient(160deg, #E6434E, #B62430)',
                  boxShadow: '0 10px 20px -6px rgba(214,48,60,0.55)',
                }}
              >
                <div className="relative h-4.5 w-4.5" style={{ width: 18, height: 18 }}>
                  <div
                    className="absolute rounded-full bg-white"
                    style={{ top: 8, left: 0, width: 18, height: 2.5, borderRadius: 2 }}
                  />
                  <div
                    className="absolute rounded-full bg-white"
                    style={{ top: 0, left: 8, width: 2.5, height: 18, borderRadius: 2 }}
                  />
                </div>
              </div>
            </Link>
          )
        }

        const active = pathname === tab.href
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className="tap-feedback flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-1"
          >
            <TabIcon tabKey={tab.key} active={active} />
            <div
              className="text-[11px]"
              style={{
                color: active ? '#D6303C' : '#9C9490',
                fontWeight: active ? 700 : 500,
              }}
            >
              {tab.label}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
