<template>
  <!-- 登录页：全屏独立，无侧边栏 -->
  <Login v-if="isLoginPage" />

  <!-- 系统主界面：侧边栏 + 顶部栏 -->
  <div v-else class="app-container">
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🎙️</span>
          <span class="logo-text" v-show="!sidebarCollapsed">智能会议系统</span>
        </div>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <span class="icon">{{ sidebarCollapsed ? '▶' : '◀' }}</span>
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
      <div class="sidebar-footer" v-show="!sidebarCollapsed">
        <div class="system-status">
          <span class="status-dot online"></span>
          <span>系统在线</span>
        </div>
        <div class="version">v2.1.0</div>
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeetingStore } from './stores/meetingStore'
import Login from './views/Login.vue'

const route = useRoute()
const router = useRouter()
const store = useMeetingStore()
const sidebarCollapsed = ref(false)

const isLoginPage = computed(() => route.name === 'Login')

const tasksCount = computed(() => {
  const tasks = store.tasks || []
  const pending = tasks.filter(t => t.status === 'TODO' || t.status === 'DOING').length
  return pending || ''
})

const navItems = [
  { path: '/transcription', label: '会议室', icon: '🎤', badge: '' },
  { path: '/dashboard', label: '工作台', icon: '📊', badge: '' },
  { path: '/summary', label: '会议摘要', icon: '📝', badge: '' },
  { path: '/tasks', label: '待办任务', icon: '✅', badge: tasksCount },
  { path: '/export', label: '导出同步', icon: '📤', badge: '' }
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
  background: var(--primary-gradient);
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
</style>
