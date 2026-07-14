// =============================================
// useToast — 轻量级 toast 通知系统
// 使用 reactive 而非 ref，确保模板中正确解包
// =============================================
import { reactive } from 'vue'

// 使用 reactive 数组，模板中直接访问 toasts.length 即可
const toasts = reactive([])
let idCounter = 0

const icons = {
  success: '<polyline points="20 6 9 17 4 12" stroke="#22A06B"/>',
  error: '<line x1="18" y1="6" x2="6" y2="18" stroke="#CF3A2F"/><line x1="6" y1="6" x2="18" y2="18" stroke="#CF3A2F"/>',
  warning: '<circle cx="12" cy="12" r="10" stroke="#E4A11B" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="#E4A11B"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="#E4A11B"/>',
  info: '<circle cx="12" cy="12" r="10" stroke="#4A90D9" fill="none"/><line x1="12" y1="16" x2="12" y2="12" stroke="#4A90D9"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="#4A90D9"/>'
}

function add(type, message, duration = 4000) {
  if (!message) return
  const id = ++idCounter
  toasts.push({ id, type, message, svg: icons[type] || icons.info })
  setTimeout(() => {
    const idx = toasts.findIndex(t => t.id === id)
    if (idx >= 0) toasts.splice(idx, 1)
  }, duration)
}

export function useToast() {
  const warning = (msg) => add('warning', msg, 5000)
  const success = (msg) => add('success', msg)
  const error = (msg) => add('error', msg, 6000)
  const info = (msg) => add('info', msg)
  const errorFrom = (err, fallback) => {
    if (!err) return error(fallback || '操作失败，请重试')
    if (/[一-鿿]/.test(err.message)) return error(err.message)
    const m = err.message.toLowerCase()
    if (m.includes('timeout')) return error('请求超时，请检查网络后重试')
    if (m.includes('network') || m.includes('fetch')) return error('网络连接失败，请检查网络')
    return error(fallback || '操作失败，请重试')
  }
  const remove = (id) => {
    const idx = toasts.findIndex(t => t.id === id)
    if (idx >= 0) toasts.splice(idx, 1)
  }
  return { toasts, success, error, errorFrom, warning, info, remove }
}
