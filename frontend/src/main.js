const API_BASE = '' // use nginx to forward calls to server

const loadBtn = document.getElementById('load-btn')
const saveBtn = document.getElementById('save-btn')
const todoContent = document.getElementById('todo-content')

loadBtn.addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_BASE}/api/todos`)
    if (response.ok) {
      const content = await response.text()
      todoContent.value = content
    } else {
      alert('Failed to load todos')
    }
  } catch (error) {
    alert('Error loading todos: ' + error.message)
  }
})

saveBtn.addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_BASE}/api/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: todoContent.value
    })
    if (response.ok) {
      console.log("Write success.")
    } else {
      alert('Failed to save todos')
    }
  } catch (error) {
    alert('Error saving todos: ' + error.message)
  }
})