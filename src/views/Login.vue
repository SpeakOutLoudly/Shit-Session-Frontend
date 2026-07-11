<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>

    <div class="login-container">
      <!-- 磨砂玻璃卡片 -->
      <div class="login-card">
        <div class="card-glow"></div>
        <div class="card-content">
          <div class="login-logo">
            <span class="logo-icon">🎙️</span>
          </div>
          <h1 class="login-title">智能会议同传与纪要系统</h1>
          <p class="login-desc">输入姓名加入会议室，开始智能协作</p>

          <div class="login-form">
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input
                class="login-input"
                v-model="username"
                placeholder="请输入您的姓名"
                maxlength="20"
                @keyup.enter="enterMeeting"
                autofocus
              />
            </div>
            <button class="login-btn" @click="enterMeeting" :disabled="!username.trim()">
              <span>进入会议室</span>
              <span class="btn-arrow">→</span>
            </button>
          </div>

          <p class="login-hint">暂时无需密码 · 姓名仅用于会议内身份标识</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetingStore } from '../stores/meetingStore'

const router = useRouter()
const store = useMeetingStore()
const username = ref('')

function enterMeeting() {
  const name = username.value.trim()
  if (!name) return
  store.setUsername(name)
  localStorage.setItem('username', name)
  router.push('/transcription')
}
</script>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E8F4FD 0%, #F0F7FF 30%, #E0EEFC 60%, #D6E8FA 100%);
  overflow: hidden;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* ====== 背景装饰形状 ====== */
.bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}

.shape-1 {
  width: 600px;
  height: 600px;
  background: rgba(79, 110, 247, 0.12);
  top: -200px;
  left: -150px;
  animation: float 20s ease-in-out infinite;
}

.shape-2 {
  width: 500px;
  height: 500px;
  background: rgba(59, 130, 246, 0.1);
  bottom: -200px;
  right: -150px;
  animation: float 25s ease-in-out infinite reverse;
}

.shape-3 {
  width: 400px;
  height: 400px;
  background: rgba(147, 197, 253, 0.15);
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  animation: float 18s ease-in-out infinite 2s;
}

.shape-4 {
  width: 300px;
  height: 300px;
  background: rgba(191, 219, 254, 0.2);
  top: 20%;
  right: 10%;
  animation: float 22s ease-in-out infinite 1s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(40px, 30px) scale(1.02); }
}

/* ====== 容器 ====== */
.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 20px;
}

/* ====== 磨砂玻璃卡片 ====== */
.login-card {
  position: relative;
  width: 440px;
  max-width: 100%;
  border-radius: 24px;
  overflow: hidden;
}

/* 发光边缘 */
.card-glow {
  position: absolute;
  inset: -2px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(79,110,247,0.15), rgba(255,255,255,0.5), rgba(79,110,247,0.1));
  z-index: -1;
}

/* 磨砂玻璃主体 */
.card-content {
  position: relative;
  padding: 52px 40px 48px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 8px 32px rgba(79, 110, 247, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  text-align: center;
}

/* ====== Logo ====== */
.login-logo {
  margin-bottom: 20px;
}

.logo-icon {
  display: inline-flex;
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: rgba(79, 110, 247, 0.08);
  backdrop-filter: blur(8px);
  align-items: center;
  justify-content: center;
  font-size: 36px;
  border: 1px solid rgba(79, 110, 247, 0.12);
  box-shadow: 0 4px 16px rgba(79, 110, 247, 0.06);
}

/* ====== 标题 ====== */
.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1d29;
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}

.login-desc {
  font-size: 15px;
  color: #5a6072;
  margin: 0 0 36px;
}

/* ====== 表单 ====== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  font-size: 18px;
  z-index: 1;
  pointer-events: none;
}

.login-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  font-size: 16px;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.login-input::placeholder {
  color: var(--text-muted);
}

.login-input:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px var(--primary-bg);
}

.login-input:-webkit-autofill,
.login-input:-webkit-autofill:hover,
.login-input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text-primary);
  -webkit-box-shadow: 0 0 0px 1000px white inset;
}

/* ====== 按钮 ====== */
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: var(--primary-gradient);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
  box-shadow: 0 4px 16px rgba(79, 110, 247, 0.25);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.login-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-arrow {
  font-size: 18px;
  transition: transform 0.25s ease;
}

.login-btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(4px);
}

/* ====== 提示 ====== */
.login-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin: 24px 0 0;
  letter-spacing: 0.3px;
}

/* ====== 响应式 ====== */
@media (max-width: 480px) {
  .card-content {
    padding: 36px 24px 32px;
  }
  .login-title {
    font-size: 20px;
  }
  .shape-1, .shape-2 { display: none; }
}
</style>
