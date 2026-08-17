import TabBar from '@/components/tab-bar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)] px-4 py-4">
      <div
        className="relative flex w-full max-w-[402px] flex-col overflow-hidden bg-white"
        style={{
          height: '100%',
          maxHeight: 874,
          borderRadius: 36,
          boxShadow:
            '0 30px 60px -25px rgba(43,35,32,0.35), 0 0 0 1px rgba(43,35,32,0.05)',
        }}
      >
        <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 100 }}>
          {children}
        </div>
        <TabBar />
      </div>
    </div>
  )
}
