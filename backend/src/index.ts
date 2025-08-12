import { Hono } from 'hono'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const app = new Hono()
const TODO_FILE_PATH = join(process.cwd(), 'data', 'todo.txt')

app.get('/todos', async (c) => {
  try {
    const content = await readFile(TODO_FILE_PATH, 'utf-8')
    return c.text(content)
  } catch (error) {
    return c.text('Error reading todo file', 500)
  }
})

app.post('/todos', async (c) => {
  try {
    const body = await c.req.text()
    await writeFile(TODO_FILE_PATH, body, 'utf-8')
    return c.text('Todo file updated successfully')
  } catch (error) {
    return c.text('Error updating todo file', 500)
  }
})

export default app
