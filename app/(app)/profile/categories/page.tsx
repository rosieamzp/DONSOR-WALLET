import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CategoryForm from './category-form'
import SortableList from './sortable-list'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, type, color')
    .order('sort_order', { ascending: true })

  const expenseCategories = categories?.filter((c) => c.type === 'expense') ?? []
  const incomeCategories = categories?.filter((c) => c.type === 'income') ?? []

  return (
    <div className="px-5 pb-5 pt-7">
      <div className="mb-5">
        <Link
          href="/profile"
          className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
        >
          <span
            className="h-2 w-2 border-b-2 border-l-2 border-muted"
            style={{ transform: 'rotate(45deg)' }}
          />
        </Link>
      </div>

      <div className="mb-6 rounded-[20px] border border-[var(--color-border)] p-5">
        <CategoryForm />
      </div>

      <div className="mb-1 text-sm font-bold text-ink">支出分類</div>
      <p className="mb-3 text-[11px] text-faint">拖曳左側手柄可調整順序，越前面越常用</p>
      <div className="mb-6">
        <SortableList
          key={expenseCategories.map((c) => `${c.id}:${c.name}`).join(',')}
          categories={expenseCategories}
        />
      </div>

      <div className="mb-1 text-sm font-bold text-ink">收入分類</div>
      <p className="mb-3 text-[11px] text-faint">拖曳左側手柄可調整順序，越前面越常用</p>
      <SortableList
        key={incomeCategories.map((c) => `${c.id}:${c.name}`).join(',')}
        categories={incomeCategories}
      />
    </div>
  )
}
