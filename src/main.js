import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles.css'

// ======== 飞书 OAuth 回调处理：在 Vue Router 接管 URL 之前拦截 code ========
// Vue Router 的 { path: '/', redirect: '/transcription' } 会丢弃查询参数，
// 因此必须在 main.js 同步阶段就把 code 保存下来。
const urlParams = new URLSearchParams(window.location.search)
const oauthCode = urlParams.get('code')
const oauthState = urlParams.get('state')
if (oauthCode) {
  // 校验 state：与发起授权时保存的值对比
  const savedState = sessionStorage.getItem('feishu_oauth_state')
  if (savedState && oauthState !== savedState) {
    console.warn('OAuth state 不匹配，可能受到 CSRF 攻击')
    sessionStorage.removeItem('feishu_oauth_state')
  } else {
    sessionStorage.setItem('feishu_oauth_code', oauthCode)
  }
  sessionStorage.removeItem('feishu_oauth_state')
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// ======== 异步兑换 OAuth code ========
// 放在 mount 之后，不阻塞渲染。兑换成功后写入 localStorage，
// ExportView 会在页面加载时从 localStorage 恢复 OAuth 用户信息。
if (oauthCode) {
  const redirectUri = window.location.origin
  fetch('/api/v1/feishu/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: oauthCode, redirectUri })
  })
    .then(r => r.json())
    .then(result => {
      if (result.code === 200 && result.data) {
        localStorage.setItem('feishu_oauth_user', JSON.stringify(result.data))
      }
    })
    .catch(() => {
      // 静默失败；ExportView 可见错误提示
    })
    .finally(() => {
      sessionStorage.removeItem('feishu_oauth_code')
      window.history.replaceState({}, '', window.location.pathname)
    })
}
