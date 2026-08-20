import { getAllTasks, addTask, updateTask, deleteTask } from './db.js'
import { createStore } from './store.js'
import { renderList, renderProgress, setActiveTab } from './ui.js'
import { todayISO, formatHeadingDate } from './dates.js'

const store = createStore({ tasks: [], view: 'today' })

const dateHeading = document.getElementById('dateHeading')
const taskSummary = document.getElementById('taskSummary')
const ringFill = document.getElementById('ringFill')
const ringLabel = document.getElementById('ringLabel')
const listContent = document.getElementById('listContent')
const tabs = document.getElementById('tabs')
const taskForm = document.getElementById('taskForm')
const titleInput = document.getElementById('titleInput')
const dateInput = document.getElementById('dateInput')
const timeInput = document.getElementById('timeInput')
const priorityInput = document.getElementById('priorityInput')

const render = () => {
  const { tasks, view } = store.getState()
  const today = todayISO()
  const todaysTasks = tasks.filter((t) => t.date === today)

  renderList(listContent, tasks, view)
  renderProgress(ringFill, ringLabel, taskSummary, todaysTasks)
  setActiveTab(tabs, view)
}

const loadTasks = async () => {
  const tasks = await getAllTasks()
  store.setState({ tasks })
}

const handleAddTask = async (event) => {
  event.preventDefault()
  const title = titleInput.value.trim()
  if (!title) return

  await addTask({
    title,
    date: dateInput.value || todayISO(),
    time: timeInput.value,
    priority: priorityInput.value
  })

  titleInput.value = ''
  timeInput.value = ''
  priorityInput.value = 'medium'
  dateInput.value = todayISO()
  titleInput.focus()

  await loadTasks()
  render()
}

const handleListClick = async (event) => {
  const row = event.target.closest('.task-row')
  if (!row) return
  const id = row.dataset.id
  const action = event.target.closest('[data-action]')?.dataset.action

  if (action === 'toggle') {
    const task = store.getState().tasks.find((t) => t.id === id)
    await updateTask(id, { done: !task.done })
    await loadTasks()
    render()
  }

  if (action === 'remove') {
    await deleteTask(id)
    await loadTasks()
    render()
  }
}

const handleTabClick = (event) => {
  const tabBtn = event.target.closest('.tab')
  if (!tabBtn) return
  store.setState({ view: tabBtn.dataset.view })
  render()
}

const init = async () => {
  dateHeading.textContent = formatHeadingDate(todayISO())
  dateInput.value = todayISO()

  taskForm.addEventListener('submit', handleAddTask)
  listContent.addEventListener('click', handleListClick)
  tabs.addEventListener('click', handleTabClick)

  await loadTasks()
  render()
}

init()
