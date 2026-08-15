'use client'

import { useRef, useState, useTransition } from 'react'
import { scanReceiptImage } from '@/app/actions/receipt-scan'
import ManualForm from './manual-form'

type Category = { id: string; name: string; color: string | null; type: 'income' | 'expense' }
type Profile = { id: string; display_name: string }

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.8

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  )
  if (!blob) return file

  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

export default function AIScanFlow({
  categories,
  profiles,
  currentUserId,
  onBack,
}: {
  categories: Category[]
  profiles: Profile[]
  currentUserId: string
  onBack: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<{ amount: string; note: string } | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setPreviewUrl(URL.createObjectURL(file))

    startTransition(async () => {
      try {
        const compressed = await compressImage(file)
        const formData = new FormData()
        formData.append('image', compressed)

        const res = await scanReceiptImage(undefined, formData)
        if ('error' in res) {
          setError(res.error)
          return
        }
        setResult({ amount: String(res.amount), note: res.note ?? '' })
      } catch {
        setError('辨識過程發生問題，請重新拍照或改用相簿上傳試試看')
      }
    })
  }

  function reset() {
    setError(null)
    setPreviewUrl(null)
    setResult(null)
  }

  if (result) {
    return (
      <div className="px-5 pb-5 pt-7">
        <ManualForm
          categories={categories}
          profiles={profiles}
          currentUserId={currentUserId}
          onBack={reset}
          initialAmount={result.amount}
          initialNote={result.note}
        />
      </div>
    )
  }

  return (
    <div className="px-5 pb-5 pt-7">
      <div className="mb-5">
        <button
          type="button"
          onClick={onBack}
          className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
        >
          <span
            className="h-2 w-2 border-b-2 border-l-2 border-muted"
            style={{ transform: 'rotate(45deg)' }}
          />
        </button>
      </div>

      {previewUrl && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--color-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="收據預覽" className="max-h-72 w-full object-contain" />
        </div>
      )}

      {pending && (
        <div className="mb-5 flex flex-col items-center py-6">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)]"
            style={{ borderTopColor: '#D6303C' }}
          />
          <div className="mt-3 text-sm text-muted">辨識中…</div>
        </div>
      )}

      {error && !pending && (
        <div className="mb-5 rounded-2xl bg-primary-light p-4">
          <div className="text-sm font-bold text-primary">辨識失敗</div>
          <div className="mt-1 text-sm text-primary">{error}</div>
          <div className="mt-2 text-xs text-primary/70">
            可以重新拍照、換一張更清楚的照片，或直接手動輸入
          </div>
        </div>
      )}

      {!pending && (
        <div className="flex flex-col gap-3.5">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="tap-feedback flex cursor-pointer items-center gap-4 rounded-[20px] border border-[var(--color-border)] p-5 text-left"
          >
            <div
              className="grid flex-none place-items-center rounded-2xl bg-primary-light"
              style={{ width: 52, height: 52 }}
            >
              <div
                className="rounded-full border-[3px] border-primary"
                style={{ width: 26, height: 26 }}
              />
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-ink">
                {error || previewUrl ? '重新拍照' : '即時拍照'}
              </div>
              <div className="mt-1 text-xs text-muted">拍下收據或發票</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="tap-feedback flex cursor-pointer items-center gap-4 rounded-[20px] border border-[var(--color-border)] p-5 text-left"
          >
            <div
              className="grid flex-none place-items-center rounded-2xl bg-primary-light"
              style={{ width: 52, height: 52 }}
            >
              <div className="grid grid-cols-2 grid-rows-2 gap-1" style={{ width: 24, height: 24 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-sm bg-primary" />
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-ink">
                {error || previewUrl ? '上傳其他張' : '上傳照片'}
              </div>
              <div className="mt-1 text-xs text-muted">從相簿選擇收據或發票照片</div>
            </div>
          </button>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
