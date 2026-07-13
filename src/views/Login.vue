<template>
  <div class="start-page">
    <!-- 背景装饰 - 几何视觉 -->
    <div class="hero-bg">
      <!-- 大圆环 -->
      <div class="geo-ring geo-ring-1"></div>
      <div class="geo-ring geo-ring-2"></div>

      <!-- 小圆点 -->
      <div class="geo-dot geo-dot-1"></div>
      <div class="geo-dot geo-dot-2"></div>
      <div class="geo-dot geo-dot-3"></div>

      <!-- 装饰短横线 -->
      <div class="geo-bar geo-bar-1"></div>
      <div class="geo-bar geo-bar-2"></div>

      <!-- 网格 -->
      <div class="geo-grid"></div>
    </div>

    <div class="start-inner">
      <div class="start-logo">
        <div class="logo-ring"></div>
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <path d="M8 21h8"/>
        </svg>
      </div>

      <h1 class="start-title">
        <span class="title-line">智能会议同传</span>
        <span class="title-line accent">与纪要系统</span>
      </h1>

      <p class="start-desc">
        实时字幕 · AI 纪要 · 待办任务 · 飞书同步
      </p>

      <div class="start-card">
        <div class="input-group">
          <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <input
            class="start-input"
            v-model="username"
            placeholder="请输入您的姓名"
            maxlength="20"
            @keyup.enter="enterMeeting"
            autofocus
          />
        </div>
        <button class="start-btn" @click="enterMeeting" :disabled="!username.trim()">
          <span>进入会议室</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
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
  router.push('/dashboard')
}
</script>

<style scoped>
.start-page {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F6F8;
  overflow: hidden;
  z-index: 9999;
}

/* ===== 背景装饰 - 几何风 ===== */
.hero-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

/* 圆环 — 干净几何边框 */
.geo-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(209, 69, 59, 0.12);
}

.geo-ring-1 {
  width: 520px;
  height: 520px;
  top: -160px;
  right: -80px;
  animation: geoFloat1 8s ease-in-out infinite alternate;
}

.geo-ring-2 {
  width: 400px;
  height: 400px;
  bottom: -120px;
  left: -60px;
  animation: geoFloat2 10s ease-in-out infinite alternate;
}

@keyframes geoFloat1 {
  from { transform: translate(0, 0); }
  to   { transform: translate(-30px, 20px); }
}

@keyframes geoFloat2 {
  from { transform: translate(0, 0); }
  to   { transform: translate(30px, -20px); }
}

/* 小圆点 — 品牌色点缀 */
.geo-dot {
  position: absolute;
  border-radius: 50%;
  background: var(--primary);
}

.geo-dot-1 {
  width: 12px; height: 12px;
  opacity: 0.25;
  top: 18%;
  right: 22%;
  animation: geoPulse 4s ease-in-out infinite;
}

.geo-dot-2 {
  width: 8px; height: 8px;
  opacity: 0.18;
  bottom: 30%;
  left: 18%;
  animation: geoPulse 5s ease-in-out infinite 1s;
}

.geo-dot-3 {
  width: 6px; height: 6px;
  opacity: 0.15;
  top: 55%;
  right: 12%;
  animation: geoPulse 4.5s ease-in-out infinite 0.5s;
}

@keyframes geoPulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50%      { opacity: 0.35; transform: scale(1.3); }
}

/* 装饰短横线 */
.geo-bar {
  position: absolute;
  background: var(--primary);
  border-radius: 2px;
}

.geo-bar-1 {
  width: 32px; height: 3px;
  opacity: 0.15;
  top: 25%;
  left: 12%;
  animation: geoFade 6s ease-in-out infinite;
}

.geo-bar-2 {
  width: 24px; height: 3px;
  opacity: 0.12;
  bottom: 22%;
  right: 15%;
  animation: geoFade 7s ease-in-out infinite 2s;
}

@keyframes geoFade {
  0%, 100% { opacity: 0.08; }
  50%      { opacity: 0.25; }
}

/* 网格 — 品牌色细线 */
.geo-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(209, 69, 59, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(209, 69, 59, 0.04) 1px, transparent 1px);
  background-size: 80px 80px;
  opacity: 0.4;
}

/* ===== 主容器 ===== */
.start-inner {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 520px;
  width: 90vw;
}

/* ===== Logo ===== */
.start-logo {
  margin-bottom: 32px;
  position: relative;
  display: inline-block;
  animation: logoEnter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.logo-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1.5px solid rgba(209, 69, 59, 0.15);
  animation: ringPulse 3s ease-in-out infinite;
}

.start-logo svg {
  padding: 16px;
  background: var(--bg-card);
  border-radius: 24px;
  box-shadow: 0 12px 48px rgba(209, 69, 59, 0.12);
  width: 80px;
  height: 80px;
  display: block;
  position: relative;
}

@keyframes logoEnter {
  from { opacity: 0; transform: scale(0.7) translateY(-20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50%      { transform: scale(1.08); opacity: 0.1; }
}

/* ===== 标题 ===== */
.start-title {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0 0 16px;
}

.title-line {
  display: block;
  color: var(--text-primary);
}

.title-line:first-child {
  animation: titleSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}

.title-line.accent {
  color: var(--primary);
  animation: titleSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}

@keyframes titleSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.start-desc {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 40px;
  letter-spacing: 0.3px;
  animation: fadeIn 0.6s ease-out 0.45s both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ===== 卡片 ===== */
.start-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 28px 32px;
  text-align: left;
  animation: cardRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
}

@keyframes cardRise {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.input-group {
  position: relative;
  margin-bottom: 12px;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
}

.start-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: 16px;
  color: var(--text-primary);
  background: var(--bg);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  font-family: inherit;
}

.start-input::placeholder {
  color: var(--text-muted);
}

.start-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-bg);
  background: var(--bg-card);
}

.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: var(--primary);
  cursor: pointer;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  font-family: inherit;
}

.start-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(209, 69, 59, 0.25);
}

.start-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

.start-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ===== 响应式 ===== */
@media (max-width: 600px) {
  .start-title { font-size: 36px; }
  .start-card { padding: 24px; border-radius: 16px; }
  .start-logo svg { width: 64px; height: 64px; padding: 14px; border-radius: 20px; }
  .geo-ring-1 { width: 300px; height: 300px; top: -100px; right: -50px; }
  .geo-ring-2 { width: 250px; height: 250px; bottom: -80px; left: -40px; }
}
</style>
