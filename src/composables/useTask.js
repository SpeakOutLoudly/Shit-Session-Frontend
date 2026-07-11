// =============================================
// useTask — 任务 CRUD composable
// 对接后端 /api/v1/tasks 接口
// =============================================
import { useApi } from './useApi'
import { useMeetingStore } from '../stores/meetingStore'

export function useTask() {
  const api = useApi()
  const store = useMeetingStore()

  async function listTasks(params = {}) {
    const page = await api.get('/tasks', params)
    store.tasks = page.records || []
    return page
  }

  async function getTask(id) {
    return await api.get(`/tasks/${id}`)
  }

  async function createTask(data) {
    const task = await api.post('/tasks', {
      meetingId: data.meetingId,
      minutesId: data.minutesId || null,
      title: data.title,
      description: data.description || null,
      assigneeName: data.assigneeName || null,
      assigneeRole: data.assigneeRole || null,
      priority: data.priority || 'MEDIUM',
      dueTime: data.dueTime || null,
      sourceText: data.sourceText || null
    })
    store.tasks.unshift(task)
    return task
  }

  async function updateTask(id, data) {
    const task = await api.put(`/tasks/${id}`, data)
    const idx = store.tasks.findIndex(t => t.id === id)
    if (idx >= 0) store.tasks[idx] = task
    return task
  }

  async function updateTaskStatus(id, status) {
    const task = await api.patch(`/tasks/${id}/status`, { status })
    const idx = store.tasks.findIndex(t => t.id === id)
    if (idx >= 0) store.tasks[idx] = task
    return task
  }

  async function deleteTask(id) {
    await api.del(`/tasks/${id}`)
    store.tasks = store.tasks.filter(t => t.id !== id)
  }

  const PRIORITY_MAP = { LOW: '低', MEDIUM: '中', HIGH: '高' }
  const STATUS_MAP = { TODO: '待处理', DOING: '进行中', DONE: '已完成', CANCELLED: '已取消' }
  const PRIORITY_CLASS_MAP = { LOW: 'tag-info', MEDIUM: 'tag-warning', HIGH: 'tag-danger' }
  const STATUS_CLASS_MAP = { TODO: 'tag-warning', DOING: 'tag-info', DONE: 'tag-success', CANCELLED: 'tag-outline' }

  function formatPriority(p) { return PRIORITY_MAP[p] || p }
  function formatStatus(s) { return STATUS_MAP[s] || s }
  function priorityClass(p) { return PRIORITY_CLASS_MAP[p] || 'tag-info' }
  function statusClass(s) { return STATUS_CLASS_MAP[s] || 'tag-outline' }

  return {
    listTasks,
    getTask,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    formatPriority,
    formatStatus,
    priorityClass,
    statusClass
  }
}
