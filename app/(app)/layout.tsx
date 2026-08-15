import TabBar from '@/components/tab-bar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--background)] px-4 py-10">
      <div
        className="relative flex w-full max-w-[402px] flex-col overflow-hidden bg-white"
        style={{
          minHeight: 874,
          borderRadius: 36,
          boxShadow:
            '0 30px 60px -25px rgba(43,35,32,0.35), 0 0 0 1px rgba(43,35,32,0.05)',
        }}
      >
        <div className="flex-1 overflow-y-auto pb-25" style={{ paddingBottom: 100 }}>
          {children}
        </div>
        <TabBar />
      </div>
    </div>
  )
}
