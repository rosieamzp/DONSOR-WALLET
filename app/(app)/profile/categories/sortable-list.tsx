'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { reorderCategories } from '@/app/actions/categories'
import EditableName from './editable-name'
import DeleteButton from './delete-button'

type CategoryItem = { id: string; name: string; color: string | null }

function SortableRow({ category }: { category: CategoryItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-light)] bg-white p-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="tap-feedback flex-none touch-none px-1 py-1 text-faint"
        aria-label="拖曳排序"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="5" cy="4" r="1.3" fill="currentColor" />
          <circle cx="11" cy="4" r="1.3" fill="currentColor" />
          <circle cx="5" cy="8" r="1.3" fill="currentColor" />
          <circle cx="11" cy="8" r="1.3" fill="currentColor" />
          <circle cx="5" cy="12" r="1.3" fill="currentColor" />
          <circle cx="11" cy="12" r="1.3" fill="currentColor" />
        </svg>
      </button>
      <div className="h-8 w-8 flex-none rounded-full" style={{ background: category.color ?? '#9C9490' }} />
      <EditableName id={category.id} name={category.name} />
      <DeleteButton id={category.id} />
    </div>
  )
}

export default function SortableList({ categories }: { categories: CategoryItem[] }) {
  const [items, setItems] = useState(categories)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setItems((current) => {
      const oldIndex = current.findIndex((c) => c.id === active.id)
      const newIndex = current.findIndex((c) => c.id === over.id)
      const next = arrayMove(current, oldIndex, newIndex)
      reorderCategories(next.map((c) => c.id))
      return next
    })
  }

  if (items.length === 0) {
    return <p className="py-2 text-sm text-faint">尚無分類</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((c) => (
            <SortableRow key={c.id} category={c} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
