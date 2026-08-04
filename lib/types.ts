export type Note = {
  id: string
  title: string
  body: string
  createdAt: number
  updatedAt: number
}

export type Todo = {
  id: string
  text: string
  done: boolean
  dueDate: string | null // ISO date string (yyyy-mm-dd) or null
  createdAt: number
}
