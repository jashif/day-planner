const DB_NAME = 'day-planner'
const DB_VERSION = 1
const STORE_NAME = 'tasks'

let dbPromise = null

const openDatabase = () => {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('date', 'date', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

const runRequest = (store, method, ...args) =>
  new Promise((resolve, reject) => {
    const request = store[method](...args)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const getStore = async (mode) => {
  const db = await openDatabase()
  const tx = db.transaction(STORE_NAME, mode)
  return tx.objectStore(STORE_NAME)
}

const generateId = () =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const getAllTasks = async () => {
  const store = await getStore('readonly')
  return runRequest(store, 'getAll')
}

export const addTask = async (task) => {
  const record = {
    id: generateId(),
    title: task.title.trim(),
    date: task.date,
    time: task.time || null,
    priority: task.priority || 'medium',
    done: false,
    createdAt: Date.now()
  }

  const store = await getStore('readwrite')
  await runRequest(store, 'add', record)
  return record
}

export const updateTask = async (id, changes) => {
  const readStore = await getStore('readonly')
  const existing = await runRequest(readStore, 'get', id)
  if (!existing) return null

  const updated = { ...existing, ...changes }
  const writeStore = await getStore('readwrite')
  await runRequest(writeStore, 'put', updated)
  return updated
}

export const deleteTask = async (id) => {
  const store = await getStore('readwrite')
  return runRequest(store, 'delete', id)
}
