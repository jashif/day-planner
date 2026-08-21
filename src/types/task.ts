export type Priority = 'low' | 'medium' | 'high'

export type View = 'today' | 'upcoming' | 'all'

export interface Task {
  id: string
  title: string
  date: string
  time: string | null
  priority: Priority
  done: boolean
  createdAt: number
}

export interface NewTaskInput {
  title: string
  date: string
  time: string
  priority: Priority
}
