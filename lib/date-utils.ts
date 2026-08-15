// 該年月的最後一天，用來把 31 號這類日期在小月自動順延到月底
export function lastDayOfMonth(year: number, month1based: number) {
  return new Date(year, month1based, 0).getDate()
}

export function dateISO(year: number, month1based: number, day: number) {
  const clampedDay = Math.min(day, lastDayOfMonth(year, month1based))
  const mm = String(month1based).padStart(2, '0')
  const dd = String(clampedDay).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function addMonthsClamped(dateStr: string, months: number) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const totalMonths = year * 12 + (month - 1) + months
  const nextYear = Math.floor(totalMonths / 12)
  const nextMonth1based = (totalMonths % 12) + 1
  return dateISO(nextYear, nextMonth1based, day)
}
