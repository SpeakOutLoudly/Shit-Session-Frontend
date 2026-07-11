// =============================================
// useApi — 后端 API 基础层
// 封装 fetch，统一处理响应、错误、base URL
// 无后端时可正常降级，不挂起
// =============================================

const BASE_URL = '/api/v1'
const TIMEOUT_MS = 3000  // 3 秒超时，无后端时快速降级

async function request(url, options = {}) {
  const { method = 'GET', body, params } = options

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
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

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
  function get(url, params) {
    return request(url, { method: 'GET', params })
  }

  function post(url, body) {
    return request(url, { method: 'POST', body })
  }

  function put(url, body) {
    return request(url, { method: 'PUT', body })
  }

  function patch(url, body) {
    return request(url, { method: 'PATCH', body })
  }

  function del(url) {
    return request(url, { method: 'DELETE' })
  }

  function getDownloadUrl(path) {
    return `${BASE_URL}${path}`
  }

  return { get, post, put, patch, del, getDownloadUrl }
}
