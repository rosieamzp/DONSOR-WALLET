'use client'

import { useRef, useState, useTransition } from 'react'
import { updateCategoryName } from '@/app/actions/categories'

export default function EditableName({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function save() {
    const trimmed = value.trim()
    if (!trimmed || trimmed === name) {
      setValue(name)
      setEditing(false)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await updateCategoryName(id, trimmed)
      if ('error' in result) {
        setError(result.error)
        setValue(name)
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            inputRef.current?.blur()
          }
          if (e.key === 'Escape') {
            setValue(name)
            setEditing(false)
          }
        }}
        autoFocus
        className="flex-1 rounded-lg border border-primary px-2 py-1 text-sm font-medium text-ink outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="tap-feedback flex-1 truncate rounded-lg px-2 py-1 text-left text-sm font-medium text-ink"
    >
      {name}
      {error && <span className="ml-2 text-[11px] font-normal text-primary">{error}</span>}
    </button>
  )
}
