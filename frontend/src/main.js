const API_BASE = '' // use nginx to forward calls to server

const loadBtn = document.getElementById('load-btn')
const saveBtn = document.getElementById('save-btn')
const todoContent = document.getElementById('todo-content')
const lineNumbers = document.getElementById('line-numbers')
const pageUpBtn = document.getElementById('page-up-btn')
const pageDownBtn = document.getElementById('page-down-btn')

// Dirty state tracking
let originalContent = ''
let isDirty = false

function updateDirtyState() {
  const currentContent = todoContent.value
  isDirty = currentContent !== originalContent
  updateUI()
}


function updateLineNumbers() {
  const content = todoContent.value
  
  if (!content.trim()) {
    // Empty content, show just line 1
    lineNumbers.textContent = '1'
    return
  }
  
  // Create a hidden div to measure actual content height
  const measurer = document.createElement('div')
  measurer.style.position = 'absolute'
  measurer.style.visibility = 'hidden'
  measurer.style.width = todoContent.clientWidth - parseInt(window.getComputedStyle(todoContent).paddingLeft) - parseInt(window.getComputedStyle(todoContent).paddingRight) + 'px'
  measurer.style.font = window.getComputedStyle(todoContent).font
  measurer.style.lineHeight = window.getComputedStyle(todoContent).lineHeight
  measurer.style.whiteSpace = 'pre-wrap'
  measurer.style.wordWrap = 'break-word'
  measurer.textContent = content
  
  document.body.appendChild(measurer)
  
  const contentHeight = measurer.offsetHeight
  const lineHeight = parseInt(window.getComputedStyle(todoContent).lineHeight)
  const visualLines = Math.max(1, Math.ceil(contentHeight / lineHeight))
  
  document.body.removeChild(measurer)
  
  // Generate line numbers for actual visual lines
  const numbers = []
  for (let i = 1; i <= visualLines; i++) {
    numbers.push(i.toString())
  }
  
  lineNumbers.textContent = numbers.join('\n')
}

function syncScroll() {
  lineNumbers.scrollTop = todoContent.scrollTop
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


// Add input event listener for dirty state tracking and line numbers
todoContent.addEventListener('input', () => {
  updateDirtyState()
  updateLineNumbers()
})

// Sync scrolling between textarea and line numbers
todoContent.addEventListener('scroll', syncScroll)

// Initialize line numbers
updateLineNumbers()

// Page navigation functionality
pageUpBtn.addEventListener('click', () => {
  const pageSize = todoContent.clientHeight
  todoContent.scrollTop = Math.max(0, todoContent.scrollTop - pageSize)
  syncScroll()
})

pageDownBtn.addEventListener('click', () => {
  const pageSize = todoContent.clientHeight
  todoContent.scrollTop = Math.min(
    todoContent.scrollHeight - todoContent.clientHeight,
    todoContent.scrollTop + pageSize
  )
  syncScroll()
})

loadBtn.addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_BASE}/api/todos`)
    if (response.ok) {
      const content = await response.text()
      todoContent.value = content
      originalContent = content
      isDirty = false
      updateUI()
      updateLineNumbers()
      
      // Scroll to bottom and place cursor at end
      todoContent.scrollTop = todoContent.scrollHeight
      todoContent.focus()
      todoContent.setSelectionRange(content.length, content.length)
      syncScroll()
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