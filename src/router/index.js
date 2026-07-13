import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '工作台', icon: 'dashboard' }
  },
  {
    path: '/transcription',
    name: 'Transcription',
    component: () => import('../views/TranscriptionView.vue'),
    meta: { title: '会议室', icon: 'mic' }
  },
  {
    path: '/summary',
    name: 'Summary',
    component: () => import('../views/SummaryView.vue'),
    meta: { title: '会议摘要', icon: 'summary' }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../views/TasksView.vue'),
    meta: { title: '待办任务', icon: 'task' }
  },
  {
    path: '/export',
    name: 'Export',
    component: () => import('../views/ExportView.vue'),
    meta: { title: '导出与同步', icon: 'export' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫：未登录跳转到登录页
router.beforeEach((to, from, next) => {
  const username = localStorage.getItem('username')
  if (to.name !== 'Login' && !username) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
