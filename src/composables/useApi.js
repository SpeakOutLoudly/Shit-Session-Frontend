// =============================================
// useApi — 后端 API 基础层
// 封装 fetch，统一处理响应、错误、base URL
// 无后端时可正常降级，不挂起
// =============================================

const BASE_URL = '/api/v1'
const DEFAULT_TIMEOUT_MS = 8000    // 常规请求 8 秒超时
const LONG_TIMEOUT_MS = 120000     // 导出/同步等耗时操作 120 秒超时

async function request(url, options = {}) {
  const { method = 'GET', body, params, timeout } = options

  // 超时优先级：传入参数 > POST/PUT 等写操作默认长超时 > 默认值
  const effectiveTimeout = timeout ?? (method === 'GET' ? DEFAULT_TIMEOUT_MS : LONG_TIMEOUT_MS)

  // 构建 URL
  let fullUrl = `${BASE_URL}${url}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') searchParams.append(k, v)
    })
    const qs = searchParams.toString()
    if (qs) fullUrl += `?${qs}`
  }

  // 使用 AbortController 实现超时
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout)

  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(fullUrl, fetchOptions)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('请求超时，后端未响应')
    }
    throw new Error(`无法连接到后端服务 (${err.message})`)
  }
  clearTimeout(timeoutId)

  const result = await response.json()

  // 后端文档约定：HTTP 200 也需检查 code
  if (result.code !== 200) {
    throw new Error(result.message || `请求失败 (${result.code})`)
  }

  return result.data
}

export function useApi() {
  function get(url, params, opts = {}) {
    return request(url, { method: 'GET', params, ...opts })
  }

  function post(url, body, opts = {}) {
    return request(url, { method: 'POST', body, ...opts })
  }

  function put(url, body, opts = {}) {
    return request(url, { method: 'PUT', body, ...opts })
  }

  function patch(url, body, opts = {}) {
    return request(url, { method: 'PATCH', body, ...opts })
  }

  function del(url, opts = {}) {
    return request(url, { method: 'DELETE', ...opts })
  }

  function getDownloadUrl(path) {
    return `${BASE_URL}${path}`
  }

  return { get, post, put, patch, del, getDownloadUrl }
}
