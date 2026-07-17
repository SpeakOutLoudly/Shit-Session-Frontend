<template>
  <!-- 登录页：全屏独立，无侧边栏 -->
  <Login v-if="isLoginPage" />

  <!-- 系统主界面：侧边栏 + 顶部栏 -->
  <div v-else class="app-container">
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg></span>
          <span class="logo-text" v-show="!sidebarCollapsed">智能会议系统</span>
        </div>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline :points="sidebarCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"/></svg>
        </button>
      </div>
      <nav class="nav-menu">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-label" v-show="!sidebarCollapsed">{{ item.label }}</span>
          <span v-if="item.badge && !sidebarCollapsed" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </nav>
      <div class="sidebar-recent" v-show="!sidebarCollapsed">
        <div class="sidebar-recent-label">最近会议</div>
        <div class="sidebar-recent-list">
          <div
            v-for="m in recentMeetings"
            :key="m.id"
            class="sidebar-recent-item"
            @click="goToMeeting(m)"
          >
            <span class="sri-dot" :class="'sri-' + (m.status || 'FINISHED').toLowerCase()"></span>
            <span class="sri-title">{{ m.title }}</span>
          </div>
          <div v-if="recentMeetings.length === 0" class="sidebar-recent-empty">暂无会议</div>
        </div>
      </div>
      <div class="sidebar-footer" v-show="!sidebarCollapsed">
        <div class="system-status">
          <span class="status-dot online"></span>
          <span>系统在线</span>
        </div>
        <div class="sidebar-footer-actions">
          <button class="help-btn" @click="showHelp = true" title="帮助">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>帮助</span>
          </button>
          <span class="version">v2.1.0</span>
        </div>
      </div>
    </aside>

    <main class="main-content" :class="{ expanded: sidebarCollapsed }">
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="topbar-right">
          <div class="user-info" v-if="store.username">
            <span class="user-avatar">{{ store.username.charAt(0) }}</span>
            <span class="user-name" v-show="!sidebarCollapsed">{{ store.username }}</span>
          </div>
          <button class="btn btn-sm btn-ghost" @click="logout" title="退出登录">退出</button>
        </div>
      </header>

      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>

  <!-- Toast 通知容器：有通知时才显示 -->
  <div class="toast-container" v-if="toast.toasts.length > 0">
    <div
      v-for="t in toast.toasts"
      :key="t.id"
      class="toast"
      :class="'toast-' + t.type"
      @click="toast.remove(t.id)"
    >
      <span class="toast-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="t.svg"></svg></span>
      <span class="toast-msg">{{ t.message }}</span>
    </div>
  </div>

  <!-- 确认对话框 -->
  <div class="modal-overlay" v-if="confirmState.show" @click.self="resolveConfirm(false)" @keydown.escape="resolveConfirm(false)" tabindex="-1">
    <div class="modal confirm-modal">
      <div class="modal-header">
        <h3>{{ confirmState.title }}</h3>
        <button class="modal-close" @click="resolveConfirm(false)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <p style="font-size: 14px; line-height: 1.6; color: var(--text-secondary);">{{ confirmState.message }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="resolveConfirm(false)">{{ confirmState.cancelText }}</button>
        <button class="btn" :class="confirmState.danger ? 'btn-danger' : 'btn-primary'" @click="resolveConfirm(true)">{{ confirmState.confirmText }}</button>
      </div>
    </div>
  </div>

  <!-- 帮助弹窗 -->
  <div class="modal-overlay" v-if="showHelp" @click.self="showHelp = false" @keydown.escape="showHelp = false" tabindex="-1">
    <div class="modal modal-lg">
      <div class="help-header">
        <div class="help-header-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="help-header-text">
          <h3>使用帮助</h3>
          <p>快速了解各功能模块</p>
        </div>
        <button class="modal-close" @click="showHelp = false">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="help-body">
        <div class="help-section">
          <div class="help-section-icon" style="background: var(--primary-bg); color: var(--primary);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <div class="help-section-text">
            <h4>工作台</h4>
            <p>查看会议统计概览，快速创建或进入会议。支持按状态、时间搜索筛选会议。</p>
          </div>
        </div>
        <div class="help-section">
          <div class="help-section-icon" style="background: var(--danger-bg); color: var(--danger);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </div>
          <div class="help-section-text">
            <h4>会议室</h4>
            <p>创建新会议，开始/结束录制。录制期间实时字幕通过 SSE 推送，支持说话人识别。</p>
          </div>
        </div>
        <div class="help-section">
          <div class="help-section-icon" style="background: var(--info-bg); color: var(--info);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="help-section-text">
            <h4>会议摘要</h4>
            <p>选择已结束会议，AI 自动生成结构化纪要，包括摘要、重点内容、决策和待办行动项。</p>
          </div>
        </div>
        <div class="help-section">
          <div class="help-section-icon" style="background: var(--success-bg); color: var(--success);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div class="help-section-text">
            <h4>待办任务</h4>
            <p>从会议纪要自动生成任务或手动创建。支持状态流转（待处理→进行中→已完成）、优先级标记和飞书通知。</p>
          </div>
        </div>
        <div class="help-section">
          <div class="help-section-icon" style="background: var(--warning-bg); color: var(--warning);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div class="help-section-text">
            <h4>导出与同步</h4>
            <p>导出 Word/PDF 文档，或授权飞书账号后同步会议纪要和任务到飞书在线文档。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeetingStore } from './stores/meetingStore'
import Login from './views/Login.vue'
import { svg } from './composables/useIcons'
import { useToast } from './composables/useToast'
import { useConfirm } from './composables/useConfirm'

const toast = useToast()
const { confirmState, confirm, resolveConfirm } = useConfirm()
const showHelp = ref(false)

const route = useRoute()
const router = useRouter()
const store = useMeetingStore()
const sidebarCollapsed = ref(false)

const isLoginPage = computed(() => route.name === 'Login')

const recentMeetings = computed(() => {
  const list = store.meetingList || []
  return [...list].sort((a, b) => {
    const ta = a.createdAt || a.startTime || ''
    const tb = b.createdAt || b.startTime || ''
    return tb.localeCompare(ta)
  }).slice(0, 3)
})

function goToMeeting(m) {
  store.currentMeeting = m
  router.push('/transcription')
}

const tasksCount = computed(() => {
  const tasks = store.tasks || []
  const pending = tasks.filter(t => t.status === 'TODO' || t.status === 'DOING').length
  return pending || ''
})

const navItems = [
  { path: '/dashboard', label: '工作台', icon: svg('dashboard', {size: 18}), badge: '' },
  { path: '/transcription', label: '会议室', icon: svg('mic', {size: 18}), badge: '' },
  { path: '/summary', label: '会议摘要', icon: svg('document', {size: 18}), badge: '' },
  { path: '/tasks', label: '待办任务', icon: svg('task', {size: 18}), badge: tasksCount },
  { path: '/export', label: '导出同步', icon: svg('export', {size: 18}), badge: '' }
]

const currentPageTitle = computed(() => {
  const map = {
    'Login': '登录',
    'Dashboard': '工作台',
    'Transcription': '会议室',
    'Summary': '会议智能摘要',
    'Tasks': '待办任务管理',
    'Export': '导出与同步'
  }
  return map[route.name] || '智能会议同传与纪要系统'
})

function isActive(path) {
  return route.path === path
}

function logout() {
  localStorage.removeItem('username')
  router.push('/login')
}
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.sidebar-recent {
  padding: 8px 16px 4px;
  border-top: 1px solid var(--border-light);
  margin-top: auto;
}
.sidebar-recent-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 6px;
}
.sidebar-recent-list { display: flex; flex-direction: column; gap: 2px; }
.sidebar-recent-item {
  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
  border-radius: 4px; cursor: pointer; transition: var(--transition);
}
.sidebar-recent-item:hover { background: var(--sidebar-active-hover-bg); }
.sri-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.sri-recording { background: var(--danger); }
.sri-finished { background: var(--success); }
.sri-cancelled { background: var(--text-muted); }
.sri-not_started { background: var(--warning); }
.sri-title {
  font-size: var(--text-body); color: var(--text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sidebar-recent-empty { font-size: 12px; color: var(--text-muted); padding: 6px 8px; }
</style>
