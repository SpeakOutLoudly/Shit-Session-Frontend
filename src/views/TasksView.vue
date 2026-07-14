<template>
  <div class="tasks-view">

    <!-- 统计栏 -->
    <div class="task-stats-bar">
      <div class="task-stat-item">
        <span class="ts-value">{{ tasks.length }}</span>
        <span class="ts-label">总任务</span>
      </div>
      <div class="ts-divider"></div>
      <div class="task-stat-item">
        <span class="ts-value text-warning">{{ countByStatus.TODO }}</span>
        <span class="ts-label">待处理</span>
      </div>
      <div class="ts-divider"></div>
      <div class="task-stat-item">
        <span class="ts-value text-primary">{{ countByStatus.DOING }}</span>
        <span class="ts-label">进行中</span>
      </div>
      <div class="ts-divider"></div>
      <div class="task-stat-item">
        <span class="ts-value text-success">{{ countByStatus.DONE }}</span>
        <span class="ts-label">已完成</span>
      </div>
      <div class="ts-divider"></div>
      <div class="task-stat-item">
        <span class="ts-value text-danger">{{ countByPriority.HIGH }}</span>
        <span class="ts-label">高优先级</span>
      </div>
      <div class="ts-divider"></div>
      <button class="btn btn-primary btn-sm" @click="showCreate = true">＋ 新建任务</button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-tabs">
        <button class="filter-tab" :class="{ active: filterStatus === 'all' }" @click="filterStatus = 'all'">全部</button>
        <button class="filter-tab" :class="{ active: filterStatus === 'TODO' }" @click="filterStatus = 'TODO'">待处理</button>
        <button class="filter-tab" :class="{ active: filterStatus === 'DOING' }" @click="filterStatus = 'DOING'">进行中</button>
        <button class="filter-tab" :class="{ active: filterStatus === 'DONE' }" @click="filterStatus = 'DONE'">已完成</button>
      </div>
      <div class="filter-right">
        <input class="form-input" v-model="filterKeyword" placeholder="搜索标题" style="width: 140px;" />
        <select class="form-select" v-model="filterPriority" style="width: 100px;">
          <option value="all">全部优先级</option>
          <option value="HIGH">高</option>
          <option value="MEDIUM">中</option>
          <option value="LOW">低</option>
        </select>
        <button class="btn btn-sm btn-ghost" @click="resetFilters" title="重置筛选">↺</button>
      </div>
    </div>

    <!-- ===== 顶部会议卡片（横滚） ===== -->
    <div class="meeting-cards-wrap">
      <div class="meeting-cards" ref="meetingCardsRef">
        <div
          v-for="m in uniqueMeetings"
          :key="m.id"
          class="meeting-card"
          :class="{ active: drawerMeetingId === m.id }"
          @click="openDrawer(m)"
        >
          <div class="mc-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="mc-info">
            <div class="mc-title">{{ m.title }}</div>
            <div class="mc-count">{{ meetingTaskCount(m.id) }} 个任务</div>
          </div>
        </div>
        <div v-if="uniqueMeetings.length === 0" class="meeting-cards-empty">暂无会议数据</div>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="task-list">
      <div class="task-card" v-for="task in filteredTasks" :key="task.id"
           :class="{ 'task-urgent': task.priority === 'HIGH', 'task-completed': task.status === 'DONE' }">
        <div class="task-main">
          <div class="task-check">
            <button class="check-btn" :class="{ checked: task.status === 'DONE' }" @click="toggleDone(task)">
              <span v-if="task.status === 'DONE'">✓</span>
            </button>
          </div>
          <div class="task-content" @click="showDetailModal(task)">
            <div class="task-title-row">
              <h4 class="task-title" :class="{ done: task.status === 'DONE' }">{{ task.title }}</h4>
              <span class="priority-badge" :class="'priority-' + task.priority.toLowerCase()">
                {{ taskApi.formatPriority(task.priority) }}
              </span>
              <span class="task-status-badge" :class="taskApi.statusClass(task.status)">
                {{ taskApi.formatStatus(task.status) }}
              </span>
            </div>
            <div class="task-meta">
              <span v-if="task.assigneeName">{{ task.assigneeName }}</span>
              <span v-if="task.dueTime">{{ formatTime(task.dueTime) }}</span>
              <span v-if="task.meetingTitle">{{ task.meetingTitle }}</span>
              <span v-if="task.createdFrom === 'AUTO'" class="tag tag-info">自动</span>
              <span v-if="task.createdFrom === 'MANUAL'" class="tag tag-outline">手动</span>
            </div>
          </div>
          <div class="task-status-actions">
            <select class="form-select" style="width: 100px;" :value="task.status" @change="updateStatus(task, $event.target.value)">
              <option value="TODO">待处理</option>
              <option value="DOING">进行中</option>
              <option value="DONE">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
            <button class="btn btn-sm btn-ghost" @click="showEditModal(task)" title="编辑">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
            </button>
            <button class="btn btn-sm btn-ghost" @click="showNotifyModal = true; notifyTask = task" title="飞书通知">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/></svg>
            </button>
            <button class="btn btn-sm btn-ghost text-danger" @click="handleDelete(task)" title="删除">✕</button>
          </div>
        </div>
      </div>
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <div class="empty-text">暂无任务</div>
        <div class="empty-hint">可在会议纪要中生成任务或手动创建</div>
      </div>
    </div>

    <!-- ===== 右侧抽屉：选定会议的任务 ===== -->
    <transition name="drawer-fade">
      <div v-if="drawerVisible" class="drawer-overlay" @click="closeDrawer"></div>
    </transition>
    <transition name="drawer-slide">
      <div v-if="drawerVisible" class="drawer">
        <div class="drawer-header">
          <div class="drawer-header-info">
            <h3>{{ drawerMeeting?.title || '会议任务' }}</h3>
            <span class="drawer-count">{{ drawerTasks.length }} 个任务</span>
          </div>
          <button class="modal-close" @click="closeDrawer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="drawer-body">
          <!-- 抽屉内任务统计 -->
          <div class="drawer-stats">
            <span>待处理 <strong>{{ drawerCounts.TODO }}</strong></span>
            <span>进行中 <strong>{{ drawerCounts.DOING }}</strong></span>
            <span>已完成 <strong>{{ drawerCounts.DONE }}</strong></span>
          </div>
          <div class="drawer-task-list">
            <div v-for="task in drawerTasks" :key="task.id" class="drawer-task-item" :class="{ 'task-urgent': task.priority === 'HIGH' }">
              <div class="dt-header">
                <button class="check-btn dt-check" :class="{ checked: task.status === 'DONE' }" @click="toggleDone(task)">
                  <span v-if="task.status === 'DONE'">✓</span>
                </button>
                <div class="dt-title" @click="showDetailModal(task)">{{ task.title }}</div>
              </div>
              <div class="dt-meta">
                <span class="priority-badge" :class="'priority-' + task.priority.toLowerCase()">{{ taskApi.formatPriority(task.priority) }}</span>
                <span class="task-status-badge" :class="taskApi.statusClass(task.status)">{{ taskApi.formatStatus(task.status) }}</span>
                <span v-if="task.assigneeName">{{ task.assigneeName }}</span>
                <span v-if="task.dueTime">{{ formatTime(task.dueTime) }}</span>
              </div>
              <div class="dt-actions">
                <select class="form-select dt-select" :value="task.status" @change="updateStatus(task, $event.target.value)">
                  <option value="TODO">待处理</option>
                  <option value="DOING">进行中</option>
                  <option value="DONE">已完成</option>
                  <option value="CANCELLED">已取消</option>
                </select>
                <button class="btn btn-sm btn-ghost" @click="showEditModal(task)" title="编辑">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
                </button>
                <button class="btn btn-sm btn-ghost" @click="handleDelete(task)" title="删除">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            <div v-if="drawerTasks.length === 0" class="drawer-empty">
              此会议暂无任务
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 任务详情弹窗 -->
    <div class="modal-overlay" v-if="detailTask" @click.self="detailTask = null" @keydown.escape="detailTask = null" tabindex="-1">
      <div class="modal">
        <div class="modal-header">
          <h3>任务详情</h3>
          <button class="modal-close" @click="detailTask = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">标题</span><span class="detail-value">{{ detailTask.title }}</span></div>
            <div class="detail-row" v-if="detailTask.description"><span class="detail-label">描述</span><span class="detail-value" style="white-space: pre-wrap;">{{ detailTask.description }}</span></div>
            <div class="detail-row"><span class="detail-label">状态</span><span class="task-status-badge" :class="taskApi.statusClass(detailTask.status)">{{ taskApi.formatStatus(detailTask.status) }}</span></div>
            <div class="detail-row"><span class="detail-label">优先级</span><span class="priority-badge" :class="'priority-' + detailTask.priority.toLowerCase()">{{ taskApi.formatPriority(detailTask.priority) }}</span></div>
            <div class="detail-row" v-if="detailTask.assigneeName"><span class="detail-label">负责人</span><span class="detail-value">{{ detailTask.assigneeName }} <span v-if="detailTask.assigneeRole">（{{ detailTask.assigneeRole }}）</span></span></div>
            <div class="detail-row" v-if="detailTask.dueTime"><span class="detail-label">截止时间</span><span class="detail-value">{{ formatTime(detailTask.dueTime) }}</span></div>
            <div class="detail-row" v-if="detailTask.meetingTitle"><span class="detail-label">所属会议</span><span class="detail-value">{{ detailTask.meetingTitle }}</span></div>
            <div class="detail-row"><span class="detail-label">创建方式</span><span class="detail-value">{{ detailTask.createdFrom === 'AUTO' ? '自动生成' : '手动创建' }}</span></div>
            <div class="detail-row" v-if="detailTask.completedAt"><span class="detail-label">完成时间</span><span class="detail-value">{{ formatTime(detailTask.completedAt) }}</span></div>
            <div class="detail-row" v-if="detailTask.sourceText"><span class="detail-label">来源原文</span><span class="detail-value" style="font-style: italic; color: var(--text-muted);">"{{ detailTask.sourceText }}"</span></div>
            <div class="detail-row"><span class="detail-label">创建时间</span><span class="detail-value">{{ formatTime(detailTask.createdAt) }}</span></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="detailTask = null">关闭</button>
          <button class="btn btn-primary" @click="showEditModal(detailTask); detailTask = null">编辑</button>
          <button class="btn btn-secondary" @click="showNotifyModal = true; notifyTask = detailTask; detailTask = null">飞书通知</button>
        </div>
      </div>
    </div>

    <!-- 编辑任务弹窗 -->
    <div class="modal-overlay" v-if="editTask" @click.self="editTask = null">
      <div class="modal">
        <div class="modal-header"><h3>编辑任务</h3><button class="modal-close" @click="editTask = null">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">标题 *</label><input class="form-input" v-model="editForm.title" placeholder="任务标题" /></div>
          <div class="form-group"><label class="form-label">描述</label><textarea class="form-textarea" v-model="editForm.description" rows="3"></textarea></div>
          <div class="grid grid-2 gap-4">
            <div class="form-group"><label class="form-label">负责人</label><input class="form-input" v-model="editForm.assigneeName" placeholder="姓名" /></div>
            <div class="form-group"><label class="form-label">负责人角色</label><input class="form-input" v-model="editForm.assigneeRole" placeholder="角色" /></div>
          </div>
          <div class="grid grid-2 gap-4">
            <div class="form-group"><label class="form-label">优先级</label><select class="form-select" v-model="editForm.priority"><option value="HIGH">高</option><option value="MEDIUM">中</option><option value="LOW">低</option></select></div>
            <div class="form-group"><label class="form-label">截止时间</label><input class="form-input" type="datetime-local" v-model="editForm.dueTime" /></div>
          </div>
          <div class="form-group"><label class="form-label">来源原文</label><textarea class="form-textarea" v-model="editForm.sourceText" rows="2"></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editTask = null">取消</button>
          <button class="btn btn-primary" @click="handleSaveEdit" :disabled="savingEdit || !editForm.title.trim()">{{ savingEdit ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>

    <!-- 飞书通知弹窗 -->
    <div class="modal-overlay" v-if="showNotifyModal" @click.self="showNotifyModal = false">
      <div class="modal">
        <div class="modal-header"><h3>飞书通知 — {{ notifyTask?.title }}</h3><button class="modal-close" @click="showNotifyModal = false">×</button></div>
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">接收方式</label>
            <select class="form-select" v-model="notifyType" style="width: 100%;">
              <option value="chat_id">发送到群聊</option>
              <option value="open_id">发送给用户</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">{{ notifyType === 'chat_id' ? '选择群聊' : '发送对象' }}</label>
            <select v-if="notifyType === 'chat_id' && chats.length > 0" class="form-select" v-model="notifyReceiveId" style="width: 100%;">
              <option v-for="c in chats" :key="c.chatId" :value="c.chatId">{{ c.name || c.chatId }}</option>
            </select>
            <div v-else-if="notifyType === 'open_id'" class="notify-self" @click="notifyReceiveId = myOpenId">
              <div class="notify-self-avatar">{{ (myUserName || '我').charAt(0) }}</div>
              <div class="notify-self-info"><div class="notify-self-name">{{ myUserName || '我' }}</div><div class="notify-self-hint">发送给自己</div></div>
              <div class="notify-self-check" v-if="notifyReceiveId === myOpenId"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            </div>
            <div v-else-if="notifyType === 'chat_id' && chats.length === 0" class="text-muted text-sm">暂无可用群聊 <button class="btn btn-sm btn-ghost" @click="loadChats">刷新</button></div>
          </div>
          <div v-if="notifyResult" style="margin-top: 8px; font-size: 13px; color: var(--success);">通知已发送</div>
          <div v-if="notifyError" style="margin-top: 8px; font-size: 13px; color: var(--danger);">{{ notifyError }}</div>
          <button class="btn btn-primary" style="width: 100%; margin-top: 8px;" @click="handleNotifyTask" :disabled="notifying || !notifyReceiveId">{{ notifying ? '发送中...' : '发送任务卡片' }}</button>
        </div>
      </div>
    </div>

    <!-- 新建任务弹窗 -->
    <div class="modal-overlay" v-if="showCreate" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-header"><h3>新建任务</h3><button class="modal-close" @click="showCreate = false">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">任务标题 *</label><input class="form-input" v-model="createForm.title" placeholder="输入任务标题" /></div>
          <div class="grid grid-2 gap-4">
            <div class="form-group"><label class="form-label">负责人</label><input class="form-input" v-model="createForm.assigneeName" placeholder="姓名" /></div>
            <div class="form-group"><label class="form-label">优先级</label><select class="form-select" v-model="createForm.priority"><option value="HIGH">高</option><option value="MEDIUM">中</option><option value="LOW">低</option></select></div>
          </div>
          <div class="form-group"><label class="form-label">所属会议</label><select class="form-select" v-model="createForm.meetingId"><option :value="null">请选择会议</option><option v-for="m in uniqueMeetings" :key="m.id" :value="m.id">{{ m.title }}</option></select></div>
          <div class="form-group"><label class="form-label">截止时间</label><input class="form-input" type="datetime-local" v-model="createForm.dueTime" /></div>
          <div class="form-group"><label class="form-label">描述</label><textarea class="form-textarea" v-model="createForm.description" placeholder="可选" rows="3"></textarea></div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="showCreate = false">取消</button><button class="btn btn-primary" @click="handleCreate" :disabled="!createForm.title.trim()">创建</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMeetingStore } from '../stores/meetingStore'
import { useTask } from '../composables/useTask'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const store = useMeetingStore()
const taskApi = useTask()
const api = useApi()
const toast = useToast()
const { confirm } = useConfirm()

// ====== 会议列表 ======
const meetings = ref([])

const uniqueMeetings = computed(() => {
  const map = new Map()
  meetings.value.forEach(m => { if (m.id != null) map.set(Number(m.id), m) })
  return Array.from(map.values())
})

async function loadMeetings() {
  try {
    const page = await api.get('/meetings', { pageSize: 100, pageNo: 1 }, { timeout: 10000 })
    meetings.value = page.records || []
  } catch (e) {
    meetings.value = []
  }
}

// ====== 筛选 ======
const filterStatus = ref('all')
const filterPriority = ref('all')
const filterKeyword = ref('')
// 去掉 filterMeetingId（用抽屉代替了）

function resetFilters() {
  filterStatus.value = 'all'
  filterPriority.value = 'all'
  filterKeyword.value = ''
}

const tasks = computed(() => store.tasks)

const countByStatus = computed(() => {
  const r = { TODO: 0, DOING: 0, DONE: 0, CANCELLED: 0 }
  tasks.value.forEach(t => { if (r[t.status] !== undefined) r[t.status]++ })
  return r
})

const countByPriority = computed(() => {
  const r = { HIGH: 0, MEDIUM: 0, LOW: 0 }
  tasks.value.forEach(t => { if (r[t.priority] !== undefined) r[t.priority]++ })
  return r
})

const filteredTasks = computed(() => {
  let list = [...tasks.value]
  if (filterStatus.value !== 'all') list = list.filter(t => t.status === filterStatus.value)
  if (filterPriority.value !== 'all') list = list.filter(t => t.priority === filterPriority.value)
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    list = list.filter(t => (t.title || '').toLowerCase().includes(kw))
  }
  list.sort((a, b) => {
    const pw = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return (pw[a.priority] || 3) - (pw[b.priority] || 3)
  })
  return list
})

// ====== 右侧抽屉 ======
const drawerVisible = ref(false)
const drawerMeetingId = ref(null)
const drawerMeeting = ref(null)

function meetingTaskCount(meetingId) {
  return tasks.value.filter(t => t.meetingId === Number(meetingId)).length
}

const drawerTasks = computed(() => {
  if (!drawerMeetingId.value) return []
  let list = tasks.value.filter(t => t.meetingId === Number(drawerMeetingId.value))
  list.sort((a, b) => {
    const pw = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return (pw[a.priority] || 3) - (pw[b.priority] || 3)
  })
  return list
})

const drawerCounts = computed(() => {
  const r = { TODO: 0, DOING: 0, DONE: 0 }
  drawerTasks.value.forEach(t => { if (r[t.status] !== undefined) r[t.status]++ })
  return r
})

function openDrawer(m) {
  drawerMeeting.value = m
  drawerMeetingId.value = m.id
  drawerVisible.value = true
}

function closeDrawer() {
  drawerVisible.value = false
  drawerMeetingId.value = null
  drawerMeeting.value = null
}

// ====== 任务详情 ======
const detailTask = ref(null)
function showDetailModal(task) { detailTask.value = task }

// ====== 编辑任务 ======
const editTask = ref(null)
const savingEdit = ref(false)
const editForm = ref({ title: '', description: '', assigneeName: '', assigneeRole: '', priority: 'MEDIUM', dueTime: '', sourceText: '' })

function showEditModal(task) {
  editTask.value = task
  editForm.value = {
    title: task.title || '', description: task.description || '',
    assigneeName: task.assigneeName || '', assigneeRole: task.assigneeRole || '',
    priority: task.priority || 'MEDIUM',
    dueTime: task.dueTime ? task.dueTime.substring(0, 16) : '',
    sourceText: task.sourceText || ''
  }
}

async function handleSaveEdit() {
  if (!editTask.value || !editForm.value.title.trim()) return
  savingEdit.value = true
  try {
    const data = {}
    if (editForm.value.title.trim() !== editTask.value.title) data.title = editForm.value.title.trim()
    if (editForm.value.description !== (editTask.value.description || '')) data.description = editForm.value.description || null
    if (editForm.value.assigneeName !== (editTask.value.assigneeName || '')) data.assigneeName = editForm.value.assigneeName || null
    if (editForm.value.assigneeRole !== (editTask.value.assigneeRole || '')) data.assigneeRole = editForm.value.assigneeRole || null
    if (editForm.value.priority !== editTask.value.priority) data.priority = editForm.value.priority
    const newDue = editForm.value.dueTime || null
    const oldDue = editTask.value.dueTime ? editTask.value.dueTime.substring(0, 16) : null
    if (newDue !== oldDue) data.dueTime = newDue
    if (editForm.value.sourceText !== (editTask.value.sourceText || '')) data.sourceText = editForm.value.sourceText || null
    await taskApi.updateTask(editTask.value.id, data)
    editTask.value = null
  } catch (err) { toast.errorFrom(err, '编辑失败') }
  finally { savingEdit.value = false }
}

// ====== 状态操作 ======
async function toggleDone(task) {
  const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
  try {
    await taskApi.updateTaskStatus(task.id, newStatus)
    if (newStatus === 'DONE') toast.success('已标记为完成')
  } catch (err) { toast.errorFrom(err, '更新失败') }
}

async function updateStatus(task, status) {
  try { await taskApi.updateTaskStatus(task.id, status) }
  catch (err) { toast.errorFrom(err, '更新失败') }
}

async function handleDelete(task) {
  if (!await confirm({ title: '删除任务', message: `确定删除「${task.title}」？`, danger: true })) return
  try { await taskApi.deleteTask(task.id) }
  catch (err) { toast.errorFrom(err, '删除失败') }
}

// ====== 新建任务 ======
const showCreate = ref(false)
const createForm = ref({ title: '', meetingId: null, assigneeName: '', priority: 'MEDIUM', dueTime: '', description: '' })

async function handleCreate() {
  if (!createForm.value.title.trim()) return
  try {
    await taskApi.createTask({
      meetingId: createForm.value.meetingId || store.currentMeeting?.id || 0,
      title: createForm.value.title.trim(),
      assigneeName: createForm.value.assigneeName || null,
      priority: createForm.value.priority,
      dueTime: createForm.value.dueTime ? new Date(createForm.value.dueTime).toISOString() : null,
      description: createForm.value.description || null
    })
    showCreate.value = false
    createForm.value = { title: '', meetingId: null, assigneeName: '', priority: 'MEDIUM', dueTime: '', description: '' }
  } catch (err) { toast.errorFrom(err, '创建失败') }
}

// ====== 飞书通知 ======
const showNotifyModal = ref(false)
const notifyTask = ref(null)
const chats = ref([])
const notifyType = ref('chat_id')
const notifyReceiveId = ref('')
const notifying = ref(false)
const notifyResult = ref(null)
const notifyError = ref('')

const myOpenId = computed(() => {
  try { const s = localStorage.getItem('feishu_oauth_user'); if (s) return JSON.parse(s).openId || '' } catch (e) {}
  return ''
})
const myUserName = computed(() => {
  try { const s = localStorage.getItem('feishu_oauth_user'); if (s) return JSON.parse(s).name || '' } catch (e) {}
  return ''
})

watch(showNotifyModal, async (val) => {
  if (!val) { notifyResult.value = null; notifyError.value = ''; notifyReceiveId.value = ''; return }
  if (notifyType.value === 'chat_id' && chats.value.length === 0) await loadChats()
  if (notifyType.value === 'open_id' && myOpenId.value) notifyReceiveId.value = myOpenId.value
})

watch(notifyType, async (type) => {
  notifyReceiveId.value = ''; notifyError.value = ''; notifyResult.value = null
  if (type === 'chat_id' && chats.value.length === 0) await loadChats()
  if (type === 'open_id' && myOpenId.value) notifyReceiveId.value = myOpenId.value
})

async function loadChats() {
  try { const r = await api.get('/feishu/im/chats'); chats.value = r || []; if (chats.value.length > 0 && !notifyReceiveId.value) notifyReceiveId.value = chats.value[0].chatId } catch (e) {}
}

async function handleNotifyTask() {
  if (!notifyTask.value?.id || !notifyReceiveId.value) return
  notifying.value = true; notifyResult.value = null; notifyError.value = ''
  try {
    const result = await api.post(`/tasks/${notifyTask.value.id}/notifications/feishu`, { receiveIdType: notifyType.value, receiveId: notifyReceiveId.value })
    notifyResult.value = result
  } catch (err) { notifyError.value = `发送失败: ${err.message}` }
  finally { notifying.value = false }
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  loadMeetings()
  if (store.currentMeeting?.id) {
    taskApi.listTasks({ meetingId: store.currentMeeting.id, pageSize: 100 }).catch(() => {})
  } else {
    taskApi.listTasks({ pageSize: 100 }).catch(() => {})
  }
})
</script>

<style scoped>
.task-stats-bar {
  display: flex; align-items: center; gap: 0;
  padding: 14px 16px; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 16px;
}
.task-stat-item { display: flex; flex-direction: column; align-items: center; padding: 0 24px; min-width: 72px; }
.ts-value { font-size: var(--text-display); font-weight: 700; color: var(--text-primary); }
.ts-label { font-size: var(--text-caption); color: var(--text-muted); margin-top: 2px; }
.ts-divider { width: 1px; height: 36px; background: var(--border); }

.filter-bar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;
}
.filter-tabs { display: flex; gap: 4px; background: var(--bg); padding: 3px; border-radius: var(--radius-sm); }
.filter-tab {
  padding: 6px 16px; border: none; background: transparent; border-radius: 4px;
  cursor: pointer; font-size: var(--text-small); font-weight: 500; color: var(--text-secondary); transition: var(--transition);
}
.filter-tab.active { background: var(--bg-card); color: var(--text-primary); box-shadow: var(--shadow-sm); }
.filter-tab:hover { color: var(--primary); }
.filter-right { display: flex; gap: 8px; }

/* ===== 顶部会议卡片（横滚） ===== */
.meeting-cards-wrap {
  margin-bottom: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.meeting-cards {
  display: flex; gap: 10px; padding: 4px 0;
}
.meeting-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px;
  background: var(--bg-card); border: 1.5px solid var(--border);
  border-radius: var(--radius-md); cursor: pointer;
  transition: var(--transition); flex-shrink: 0;
  min-width: 220px;
}
.meeting-card:hover { border-color: var(--primary); background: var(--primary-bg); }
.meeting-card.active { border-color: var(--primary); background: var(--sidebar-active-bg); }
.mc-icon { color: var(--primary); display: flex; flex-shrink: 0; }
.mc-info { min-width: 0; }
.mc-title { font-size: var(--text-body); font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
.mc-count { font-size: var(--text-small); color: var(--text-secondary); margin-top: 2px; font-weight: 500; }
.meeting-cards-empty { padding: 16px; color: var(--text-muted); font-size: var(--text-small); }

/* ===== 任务列表 ===== */
.task-list { display: flex; flex-direction: column; gap: 8px; }

.task-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-md); transition: var(--transition);
}
.task-card.task-urgent { border-top: 2px solid var(--danger); }
.task-card.task-completed { opacity: 0.7; }

.task-main { display: flex; align-items: flex-start; gap: 16px; padding: 16px 20px; }
.task-check { padding-top: 2px; }
.check-btn {
  width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border);
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: white; transition: var(--transition);
}
.check-btn:hover { border-color: var(--primary); }
.check-btn.checked { background: var(--success); border-color: var(--success); animation: checkPop 0.25s cubic-bezier(0.25, 1, 0.5, 1); }

.task-content { flex: 1; min-width: 0; cursor: pointer; }
.task-content:hover .task-title { color: var(--primary); }
.task-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.task-title { font-size: var(--text-subhead); font-weight: 600; margin: 0; transition: var(--transition); }
.task-title.done { text-decoration: line-through; color: var(--text-muted); }
.task-desc { font-size: 13px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5; }

.priority-badge { font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 4px; }
.priority-high { background: var(--danger-bg); color: var(--danger); }
.priority-medium { background: var(--warning-bg); color: var(--warning); }
.priority-low { background: var(--success-bg); color: var(--success); }

.task-status-badge { font-size: 11px; padding: 1px 8px; border-radius: 4px; }
.task-meta { display: flex; gap: 12px; font-size: var(--text-caption); color: var(--text-muted); flex-wrap: wrap; }

.task-status-actions {
  display: flex; align-items: center; gap: 8px; padding-left: 16px;
  border-left: 1px solid var(--border-light); flex-shrink: 0;
}

/* ===== 右侧抽屉 ===== */
.drawer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.25);
  z-index: 500; animation: fadeIn 0.2s ease-out;
}
.drawer {
  position: fixed; top: 0; right: 0; width: 420px; max-width: 90vw;
  height: 100vh; background: var(--bg-card); z-index: 501;
  box-shadow: var(--shadow-xl);
  display: flex; flex-direction: column;
  animation: drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes drawerSlideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  display: flex; align-items: center; padding: 20px 24px;
  border-bottom: 1px solid var(--border-light); flex-shrink: 0;
}
.drawer-header-info { flex: 1; }
.drawer-header-info h3 { font-size: 17px; font-weight: 600; margin: 0 0 2px; }
.drawer-count { font-size: var(--text-caption); color: var(--text-muted); }

.drawer-body { flex: 1; overflow-y: auto; padding: 16px 20px; }
.drawer-stats { display: flex; gap: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--border-light); margin-bottom: 12px; font-size: var(--text-small); color: var(--text-secondary); }
.drawer-stats strong { color: var(--text-primary); margin-left: 4px; }

.drawer-task-list { display: flex; flex-direction: column; gap: 8px; }
.drawer-task-item {
  padding: 12px 14px; border: 1px solid var(--border-light);
  border-radius: var(--radius-sm); transition: var(--transition);
}
.drawer-task-item.task-urgent { border-left: 2px solid var(--danger); }
.dt-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.dt-check { width: 18px; height: 18px; flex-shrink: 0; }
.dt-title { font-size: var(--text-small); font-weight: 500; cursor: pointer; flex: 1; }
.dt-title:hover { color: var(--primary); }
.dt-meta { display: flex; gap: 8px; font-size: var(--text-caption); color: var(--text-muted); align-items: center; flex-wrap: wrap; padding-left: 28px; margin-bottom: 6px; }
.dt-actions { display: flex; gap: 6px; padding-left: 28px; }
.dt-select { width: 90px; font-size: 12px !important; padding: 4px 8px !important; }

.drawer-empty { padding: 32px; text-align: center; color: var(--text-muted); font-size: var(--text-small); }

.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.2s; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-slide-leave-active { transition: transform 0.2s ease-in; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

/* 详情弹窗 */
.detail-grid { display: flex; flex-direction: column; gap: 16px; }
.detail-row { display: flex; flex-direction: column; gap: 4px; }
.detail-label { font-size: var(--text-caption); font-weight: 600; color: var(--text-secondary); }
.detail-value { font-size: var(--text-body); color: var(--text-primary); }



.notify-self {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px;
  border: 1.5px solid var(--border); border-radius: var(--radius-md);
  cursor: pointer; transition: var(--transition);
}
.notify-self:hover { border-color: var(--primary-light); background: var(--primary-bg); }
.notify-self-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--primary); color: white; display: flex;
  align-items: center; justify-content: center;
  font-size: 15px; font-weight: 600; flex-shrink: 0;
}
.notify-self-info { flex: 1; }
.notify-self-name { font-size: var(--text-small); font-weight: 500; color: var(--text-primary); }
.notify-self-hint { font-size: var(--text-caption); color: var(--text-muted); margin-top: 1px; }
.notify-self-check { width: 24px; display: flex; align-items: center; justify-content: center; }
</style>
