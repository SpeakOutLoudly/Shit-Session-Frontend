// =============================================
// useToast — 轻量级 toast 通知系统
// 替换原生 alert()，提供统一的通知体验
// 用法: const toast = useToast(); toast.success('消息')
// =============================================
import { ref } from 'vue'

const toasts = ref([])
let idCounter = 0

// 清空可能残留的 toast（多实例或 HMR 导致）
toasts.value = []

const TOAST_DURATION = 4000

// SVG 图标，不用字符避免字体渲染问题
function iconSvg(type) {
  const icons = {
    success: '<polyline points="20 6 9 17 4 12" stroke="#22A06B"/>',
    error: '<line x1="18" y1="6" x2="6" y2="18" stroke="#CF3A2F"/><line x1="6" y1="6" x2="18" y2="18" stroke="#CF3A2F"/>',
    warning: '<circle cx="12" cy="12" r="10" stroke="#E4A11B" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="#E4A11B"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="#E4A11B"/>',
    info: '<circle cx="12" cy="12" r="10" stroke="#4A90D9" fill="none"/><line x1="12" y1="16" x2="12" y2="12" stroke="#4A90D9"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="#4A90D9"/>'
  }
  return icons[type] || icons.info
}

function add(type, message, duration = TOAST_DURATION) {
  if (!message) return
  const id = ++idCounter
  toasts.value.push({
    id, type, message,
    svg: iconSvg(type)
  })
  setTimeout(() => remove(id), duration)
}

function remove(id) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx >= 0) toasts.value.splice(idx, 1)
}

export function useToast() {
  function friendlyMessage(err, fallback) {
    if (!err || !err.message) return fallback || '操作失败，请重试'
    const msg = err.message.toLowerCase()
    const text = err.message
    if (msg.includes('timeout') || msg.includes('超时')) return '请求超时，请检查网络后重试'
    if (msg.includes('network') || msg.includes('网络') || msg.includes('fetch')) return '网络连接失败，请检查网络'
    if (msg.includes('403') || msg.includes('forbidden') || msg.includes('无权')) return '没有权限执行此操作'
    if (msg.includes('404') || msg.includes('not found')) return '请求的资源不存在'
    if (/[一-鿿]/.test(text)) return text
    return fallback || '操作失败，请重试'
  }

  return {
    toasts,
    success: (msg) => add('success', msg),
    error: (msg) => add('error', msg, 6000),
    errorFrom: (err, fallback) => add('error', friendlyMessage(err, fallback), 6000),
    warning: (msg) => add('warning', msg, 5000),
    info: (msg) => add('info', msg),
    remove,
    friendlyMessage
  }
}
