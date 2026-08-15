export function formatMoney(n: number) {
  return Math.round(n).toLocaleString('zh-TW')
}

export function formatDateLabel(dateStr: string) {
  const dt = new Date(dateStr + 'T00:00:00')
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
  return `${dt.getMonth() + 1}月${dt.getDate()}日 · 週${weekday}`
}
