<template>
  <div class="tasks-view">
    <div class="page-header">
      <h2>待办任务管理</h2>
      <p>从会议纪要中生成任务，或手动创建</p>
    </div>

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
        <select class="form-select" v-model="filterPriority" style="width: 100px;">
          <option value="all">全部优先级</option>
          <option value="HIGH">🔴 高</option>
          <option value="MEDIUM">🟡 中</option>
          <option value="LOW">🟢 低</option>
        </select>
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
          <div class="task-content">
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
              <span v-if="task.assigneeName">👤 {{ task.assigneeName }}</span>
              <span v-if="task.dueTime">📅 {{ formatTime(task.dueTime) }}</span>
              <span v-if="task.createdFrom === 'AUTO'" class="tag tag-info">自动</span>
              <span v-if="task.createdFrom === 'MANUAL'" class="tag tag-outline">手动</span>
            </div>
            <div v-if="task.description" class="task-desc">{{ task.description }}</div>
          </div>
          <div class="task-status-actions">
            <select class="form-select" style="width: 100px;" :value="task.status" @change="updateStatus(task, $event.target.value)">
              <option value="TODO">待处理</option>
              <option value="DOING">进行中</option>
              <option value="DONE">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
            <button class="btn btn-sm btn-ghost text-danger" @click="handleDelete(task)" title="删除">✕</button>
          </div>
        </div>
      </div>
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">✅</div>
        <div class="empty-text">暂无任务</div>
        <div class="empty-hint">可在会议纪要中生成任务或手动创建</div>
      </div>
    </div>

    <!-- 新建任务弹窗 -->
    <div class="modal-overlay" v-if="showCreate" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建任务</h3>
          <button class="modal-close" @click="showCreate = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">任务标题 *</label>
            <input class="form-input" v-model="createForm.title" placeholder="输入任务标题" />
          </div>
          <div class="grid grid-2" style="gap: 16px;">
            <div class="form-group">
              <label class="form-label">负责人</label>
              <input class="form-input" v-model="createForm.assigneeName" placeholder="姓名" />
            </div>
            <div class="form-group">
              <label class="form-label">优先级</label>
              <select class="form-select" v-model="createForm.priority">
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">截止时间</label>
            <input class="form-input" type="datetime-local" v-model="createForm.dueTime" />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea class="form-textarea" v-model="createForm.description" placeholder="可选" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreate = false">取消</button>
          <button class="btn btn-primary" @click="handleCreate" :disabled="!createForm.title.trim()">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMeetingStore } from '../stores/meetingStore'
import { useTask } from '../composables/useTask'

const store = useMeetingStore()
const taskApi = useTask()

const filterStatus = ref('all')
const filterPriority = ref('all')
const showCreate = ref(false)

const createForm = ref({
  title: '',
  assigneeName: '',
  priority: 'MEDIUM',
  dueTime: '',
  description: ''
})

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
  list.sort((a, b) => {
    const pw = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return (pw[a.priority] || 3) - (pw[b.priority] || 3)
  })
  return list
})

async function toggleDone(task) {
  const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
  try {
    await taskApi.updateTaskStatus(task.id, newStatus)
  } catch (err) {
    alert('更新失败: ' + err.message)
  }
}

async function updateStatus(task, status) {
  try {
    await taskApi.updateTaskStatus(task.id, status)
  } catch (err) {
    alert('更新失败: ' + err.message)
  }
}

async function handleDelete(task) {
  if (!confirm(`确定删除「${task.title}」？`)) return
  try {
    await taskApi.deleteTask(task.id)
  } catch (err) {
    alert('删除失败: ' + err.message)
  }
}

async function handleCreate() {
  if (!createForm.value.title.trim()) return
  try {
    await taskApi.createTask({
      meetingId: store.currentMeeting?.id || 0,
      title: createForm.value.title.trim(),
      assigneeName: createForm.value.assigneeName || null,
      priority: createForm.value.priority,
      dueTime: createForm.value.dueTime ? new Date(createForm.value.dueTime).toISOString() : null,
      description: createForm.value.description || null
    })
    showCreate.value = false
    createForm.value = { title: '', assigneeName: '', priority: 'MEDIUM', dueTime: '', description: '' }
  } catch (err) {
    alert('创建失败: ' + err.message)
  }
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  if (store.currentMeeting?.id) {
    taskApi.listTasks({ meetingId: store.currentMeeting.id, pageSize: 100 }).catch(() => {})
  }
})
</script>

<style scoped>
.task-stats-bar {
  display: flex; align-items: center; gap: 0;
  padding: 16px 24px; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 16px;
}
.task-stat-item { display: flex; flex-direction: column; align-items: center; padding: 0 24px; min-width: 72px; }
.ts-value { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.ts-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.ts-divider { width: 1px; height: 36px; background: var(--border); }

.filter-bar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
}
.filter-tabs { display: flex; gap: 4px; background: var(--bg); padding: 3px; border-radius: var(--radius-sm); }
.filter-tab {
  padding: 6px 16px; border: none; background: transparent; border-radius: 4px;
  cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-secondary); transition: var(--transition);
}
.filter-tab.active { background: var(--bg-card); color: var(--text-primary); box-shadow: var(--shadow-sm); }
.filter-tab:hover { color: var(--primary); }
.filter-right { display: flex; gap: 8px; }

.task-list { display: flex; flex-direction: column; gap: 8px; }

.task-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-md); transition: var(--transition);
}
.task-card.task-urgent { border-left: 3px solid var(--danger); }
.task-card.task-completed { opacity: 0.7; }

.task-main { display: flex; align-items: flex-start; gap: 16px; padding: 16px 20px; }
.task-check { padding-top: 2px; }
.check-btn {
  width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border);
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: white; transition: var(--transition);
}
.check-btn:hover { border-color: var(--primary); }
.check-btn.checked { background: var(--success); border-color: var(--success); }

.task-content { flex: 1; min-width: 0; }
.task-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.task-title { font-size: 15px; font-weight: 600; margin: 0; }
.task-title.done { text-decoration: line-through; color: var(--text-muted); }
.task-desc { font-size: 13px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5; }

.priority-badge { font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 4px; }
.priority-high { background: var(--danger-bg); color: var(--danger); }
.priority-medium { background: var(--warning-bg); color: #D97706; }
.priority-low { background: var(--success-bg); color: var(--success); }

.task-status-badge { font-size: 11px; padding: 1px 8px; border-radius: 4px; }

.task-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); }

.task-status-actions {
  display: flex; align-items: center; gap: 8px; padding-left: 16px;
  border-left: 1px solid var(--border-light); flex-shrink: 0;
}
</style>
