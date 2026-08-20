export const toISODate = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const todayISO = () => toISODate(new Date())

export const formatHeadingDate = (isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export const formatGroupLabel = (isoDate) => {
  const today = todayISO()
  const tomorrow = toISODate(new Date(Date.now() + 86400000))

  if (isoDate === today) return 'Today'
  if (isoDate === tomorrow) return 'Tomorrow'

  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export const formatTime = (time24) => {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}
