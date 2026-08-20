import { formatGroupLabel, formatTime, todayISO } from './dates.js'

const CHECK_ICON = `<svg viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const EMPTY_ICON = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="15" stroke="#c9c4b8" stroke-width="1.4"/><path d="M14 20h12" stroke="#c9c4b8" stroke-width="1.4" stroke-linecap="round"/></svg>`

const emptyStateCopy = {
  today: 'Nothing planned for today — add your first task above.',
  upcoming: 'No upcoming tasks yet.',
  all: 'Your list is empty. Add something to get started.'
}

const renderEmptyState = (view) => `
  <div class="empty-state">
    ${EMPTY_ICON}
    <p>${emptyStateCopy[view] || emptyStateCopy.all}</p>
  </div>
`

const renderTaskRow = (task) => `
  <div class="task-row ${task.done ? 'is-done' : ''}" data-id="${task.id}">
    <button class="check ${task.done ? 'is-checked' : ''}" data-action="toggle" aria-label="Mark done">
      ${CHECK_ICON}
    </button>
    <div class="task-body">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <span class="priority-dot ${task.priority}"></span>
        ${task.time ? `<span class="task-time">${formatTime(task.time)}</span>` : ''}
      </div>
    </div>
    <button class="remove-btn" data-action="remove" aria-label="Delete task">×</button>
  </div>
`

const renderDayGroup = (label, tasks) => `
  <div class="day-group">
    <p class="day-group-label">${label}</p>
    ${tasks.map(renderTaskRow).join('')}
  </div>
`

const escapeHtml = (str) =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const sortTasks = (tasks) =>
  [...tasks].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    if (!!a.time !== !!b.time) return a.time ? -1 : 1
    if (a.time && b.time && a.time !== b.time) return a.time < b.time ? -1 : 1
    return a.createdAt - b.createdAt
  })

const groupByDate = (tasks) => {
  const groups = new Map()
  tasks.forEach((task) => {
    const key = task.date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(task)
  })
  return groups
}

export const filterTasksForView = (tasks, view) => {
  const today = todayISO()
  if (view === 'today') return tasks.filter((t) => t.date === today)
  if (view === 'upcoming') return tasks.filter((t) => t.date > today)
  return tasks
}

export const renderList = (container, tasks, view) => {
  const filtered = sortTasks(filterTasksForView(tasks, view))

  if (filtered.length === 0) {
    container.innerHTML = renderEmptyState(view)
    return
  }

  if (view === 'today') {
    container.innerHTML = filtered.map(renderTaskRow).join('')
    return
  }

  const groups = groupByDate(filtered)
  const html = Array.from(groups.entries())
    .map(([date, group]) => renderDayGroup(formatGroupLabel(date), group))
    .join('')

  container.innerHTML = html
}

export const renderProgress = (ringFillEl, ringLabelEl, summaryEl, todaysTasks) => {
  const total = todaysTasks.length
  const done = todaysTasks.filter((t) => t.done).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  const circumference = 2 * Math.PI * 52
  const offset = circumference - (percent / 100) * circumference
  ringFillEl.style.strokeDasharray = String(circumference)
  ringFillEl.style.strokeDashoffset = String(offset)
  ringLabelEl.textContent = `${percent}%`

  summaryEl.textContent =
    total === 0 ? 'Nothing on the books today' : `${done} of ${total} done today`
}

export const setActiveTab = (tabsEl, view) => {
  tabsEl.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.view === view)
  })
}
