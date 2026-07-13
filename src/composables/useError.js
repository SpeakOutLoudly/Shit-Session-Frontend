// =============================================
// useError — 友好的错误消息
// 将 API 错误转化为用户可读的中文描述
// =============================================

const ERROR_MESSAGES = {
  TIMEOUT: '请求超时，请检查网络后重试',
  NETWORK: '网络连接失败，请检查网络',
  FORBIDDEN: '没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  CONFLICT: '操作冲突，请刷新后重试',
  VALIDATION: '输入数据有误，请检查后重试',
  DEFAULT: '操作失败，请稍后重试'
}

export function useError() {
  function friendlyMessage(err) {
    if (!err) return ERROR_MESSAGES.DEFAULT
    const msg = (err.message || '').toLowerCase()
    const text = (err.message || '')

    if (msg.includes('timeout') || msg.includes('超时')) return ERROR_MESSAGES.TIMEOUT
    if (msg.includes('network') || msg.includes('网络') || msg.includes('fetch')) return ERROR_MESSAGES.NETWORK
    if (msg.includes('403') || msg.includes('forbidden') || msg.includes('无权')) return ERROR_MESSAGES.FORBIDDEN
    if (msg.includes('404') || msg.includes('not found')) return ERROR_MESSAGES.NOT_FOUND
    if (msg.includes('409') || msg.includes('conflict')) return ERROR_MESSAGES.CONFLICT
    if (msg.includes('validation') || msg.includes('valid')) return ERROR_MESSAGES.VALIDATION

    // 保留中文后端错误消息（如果已经是中文就显示）
    if (/[一-鿿]/.test(text)) return text

    return ERROR_MESSAGES.DEFAULT
  }

  return { friendlyMessage }
}
