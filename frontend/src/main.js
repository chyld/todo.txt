const API_BASE = '' // use nginx to forward calls to server

const loadBtn = document.getElementById('load-btn')
const saveBtn = document.getElementById('save-btn')
const todoContent = document.getElementById('todo-content')

// Dirty state tracking
let originalContent = ''
let isDirty = false

function updateDirtyState() {
  const currentContent = todoContent.value
  isDirty = currentContent !== originalContent
  updateUI()
}

function updateUI() {
  const statusLed = document.getElementById('status-led')
  
  if (isDirty) {
    statusLed.classList.remove('status-led-clean')
    statusLed.classList.add('status-led-dirty')
  } else {
    statusLed.classList.remove('status-led-dirty')
    statusLed.classList.add('status-led-clean')
  }
}

// Add input event listener for dirty state tracking
todoContent.addEventListener('input', updateDirtyState)

loadBtn.addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_BASE}/api/todos`)
    if (response.ok) {
      const content = await response.text()
      todoContent.value = content
      originalContent = content
      isDirty = false
      updateUI()
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
      originalContent = todoContent.value
      isDirty = false
      updateUI()
    } else {
      alert('Failed to save todos')
    }
  } catch (error) {
    alert('Error saving todos: ' + error.message)
  }
})