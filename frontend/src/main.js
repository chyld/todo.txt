/**
 * TodoTxt Editor - Streamlined, modular todo.txt application
 * Architecture: Editor + Api + TodoApp (main controller)
 */

const CONFIG = {
  API_BASE: '',
  ENDPOINTS: { TODOS: '/api/todos' },
  DEBOUNCE_DELAY: 300
}

const Utils = {
  debounce(func, wait) {
    let timeout
    return (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  getVisualLineCount(element, content) {
    if (!content.trim()) return 1
    
    const measurer = document.createElement('div')
    const styles = getComputedStyle(element)
    
    Object.assign(measurer.style, {
      position: 'absolute',
      visibility: 'hidden',
      width: element.clientWidth - parseInt(styles.paddingLeft) - parseInt(styles.paddingRight) + 'px',
      font: styles.font,
      lineHeight: styles.lineHeight,
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    })
    
    measurer.textContent = content
    document.body.appendChild(measurer)
    
    const lineHeight = parseInt(styles.lineHeight)
    const visualLines = Math.max(1, Math.ceil(measurer.offsetHeight / lineHeight))
    
    document.body.removeChild(measurer)
    return visualLines
  }
}

class Editor {
  constructor(onStateChange) {
    this.textarea = document.getElementById('todo-content')
    this.lineNumbers = document.getElementById('line-numbers')
    this.pageUpBtn = document.getElementById('page-up-btn')
    this.pageDownBtn = document.getElementById('page-down-btn')
    
    this.originalContent = ''
    this.onStateChange = onStateChange
    
    this.updateLineNumbers = Utils.debounce(() => this._updateLineNumbers(), CONFIG.DEBOUNCE_DELAY)
    this._init()
  }

  _init() {
    this.textarea.addEventListener('input', () => this._handleInput())
    this.textarea.addEventListener('scroll', () => this._syncScroll())
    this.pageUpBtn.addEventListener('click', () => this._pageUp())
    this.pageDownBtn.addEventListener('click', () => this._pageDown())
    
    window.addEventListener('resize', () => this.updateLineNumbers())
    this._updateLineNumbers()
  }

  _handleInput() {
    const isDirty = this.textarea.value !== this.originalContent
    this.textarea.setAttribute('data-dirty', isDirty.toString())
    this.onStateChange?.(isDirty ? 'dirty' : 'clean')
    this.updateLineNumbers()
  }

  _updateLineNumbers() {
    const visualLines = Utils.getVisualLineCount(this.textarea, this.textarea.value)
    this.lineNumbers.textContent = Array.from({length: visualLines}, (_, i) => i + 1).join('\n')
  }

  _syncScroll() {
    this.lineNumbers.scrollTop = this.textarea.scrollTop
  }

  _pageUp() {
    this.textarea.scrollTop = Math.max(0, this.textarea.scrollTop - this.textarea.clientHeight)
    this._syncScroll()
  }

  _pageDown() {
    const maxScroll = this.textarea.scrollHeight - this.textarea.clientHeight
    this.textarea.scrollTop = Math.min(maxScroll, this.textarea.scrollTop + this.textarea.clientHeight)
    this._syncScroll()
  }

  get content() { return this.textarea.value }
  get isDirty() { return this.content !== this.originalContent }

  setContent(content, markClean = true) {
    this.textarea.value = content
    if (markClean) {
      this.originalContent = content
      this.textarea.setAttribute('data-dirty', 'false')
      this.onStateChange?.('clean')
    }
    this._updateLineNumbers()
    this._focusEnd()
  }

  markClean() {
    this.originalContent = this.content
    this.textarea.setAttribute('data-dirty', 'false')
    this.onStateChange?.('clean')
  }

  _focusEnd() {
    this.textarea.focus()
    this.textarea.setSelectionRange(this.content.length, this.content.length)
    this.textarea.scrollTop = this.textarea.scrollHeight
    this._syncScroll()
  }

  focusEnd() { this._focusEnd() }
}

class Api {
  constructor(onStatusChange) {
    this.baseUrl = CONFIG.API_BASE
    this.onStatusChange = onStatusChange
  }

  async load() {
    this.onStatusChange?.('loading')
    try {
      const response = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.TODOS}`)
      if (!response.ok) throw new Error(`Load failed: ${response.status}`)
      
      const content = await response.text()
      this.onStatusChange?.('clean')
      return content
    } catch (error) {
      this.onStatusChange?.('error')
      throw error
    }
  }

  async save(content) {
    this.onStatusChange?.('saving')
    try {
      const response = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.TODOS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: content
      })
      if (!response.ok) throw new Error(`Save failed: ${response.status}`)
      
      this.onStatusChange?.('clean')
      return true
    } catch (error) {
      this.onStatusChange?.('error')
      throw error
    }
  }
}

class TodoApp {
  constructor() {
    this.statusLed = document.getElementById('status-led')
    this.loadBtn = document.getElementById('load-btn')
    this.saveBtn = document.getElementById('save-btn')
    
    this.editor = new Editor(status => this._setStatus(status))
    this.api = new Api(status => this._setStatus(status))
    
    this._init()
  }

  _init() {
    this.loadBtn.addEventListener('click', () => this.load())
    this.saveBtn.addEventListener('click', () => this.save())
    
    document.addEventListener('keydown', e => this._handleKeydown(e))
    window.addEventListener('beforeunload', e => this._handleBeforeUnload(e))
    
    console.log('TodoApp initialized')
  }

  _setStatus(status) {
    this.statusLed.setAttribute('data-status', status)
    this.statusLed.style.transform = 'scale(1.1)'
    setTimeout(() => this.statusLed.style.transform = 'scale(1)', 200)
  }

  _handleKeydown(event) {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault()
      this.save()
    } else if (event.ctrlKey && event.key === 'o') {
      event.preventDefault()
      this.load()
    } else if (event.target === this.editor.textarea) {
      if (event.key === 'PageUp') {
        event.preventDefault()
        this.editor._pageUp()
      } else if (event.key === 'PageDown') {
        event.preventDefault()
        this.editor._pageDown()
      }
    }
  }

  _handleBeforeUnload(event) {
    if (this.editor.isDirty) {
      event.preventDefault()
      event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
    }
  }

  async load() {
    try {
      const content = await this.api.load()
      this.editor.setContent(content, true)
    } catch (error) {
      console.error('Load failed:', error)
    }
  }

  async save() {
    if (!this.editor.isDirty) return
    
    try {
      await this.api.save(this.editor.content)
      this.editor.markClean()
      this.editor.focusEnd()
    } catch (error) {
      console.error('Save failed:', error)
    }
  }
}

// Initialize
document.readyState === 'loading' 
  ? document.addEventListener('DOMContentLoaded', () => new TodoApp())
  : new TodoApp()