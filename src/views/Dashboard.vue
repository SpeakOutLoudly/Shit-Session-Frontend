<template>
  <div class="dashboard">

    <!-- 统计卡片 -->
    <div class="grid grid-4 mb-6">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--primary-bg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </div>
        <div class="stat-label">总会议数</div>
        <div class="stat-value">{{ store.stats.total }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--danger-bg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>
        </div>
        <div class="stat-label">录制中</div>
        <div class="stat-value text-danger">{{ store.stats.recording }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--success-bg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="stat-label">已结束</div>
        <div class="stat-value text-success">{{ store.stats.finished }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--info-bg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="stat-label">已生成纪要</div>
        <div class="stat-value text-primary">{{ store.stats.withSummary }}</div>
      </div>
    </div>

    <div class="grid grid-2">
      <!-- 会议列表 -->
      <div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">会议列表</span>
            <router-link to="/transcription" class="btn btn-sm btn-ghost">新建会议 →</router-link>
          </div>
          <div class="card-body card-body-compact">
            <!-- 搜索与简化筛选 -->
            <div class="filter-bar">
              <input class="form-input" v-model="filters.keyword" placeholder="搜索标题或编号" style="flex: 1;" @input="onFilterChange" />
              <button class="btn btn-sm btn-ghost" @click="showAdvancedFilters = !showAdvancedFilters">
                {{ showAdvancedFilters ? '收起' : '筛选' }}
              </button>
            </div>
            <div class="filter-row">
              <select class="form-select" v-model="filters.status" style="flex: 1;" @change="onFilterChange">
                <option value="">全部状态</option>
                <option value="NOT_STARTED">未开始</option>
                <option value="RECORDING">录制中</option>
                <option value="FINISHED">已结束</option>
                <option value="CANCELLED">已取消</option>
              </select>
              <select class="form-select" v-model="filters.summaryStatus" style="flex: 1;" @change="onFilterChange">
                <option value="">全部纪要</option>
                <option value="NONE">未生成</option>
                <option value="GENERATING">生成中</option>
                <option value="DONE">已生成</option>
                <option value="FAILED">失败</option>
              </select>
            </div>
            <transition name="filter-expand">
              <div v-if="showAdvancedFilters" class="filter-row">
                <input class="form-input" type="datetime-local" v-model="filters.startTimeFrom" @change="onFilterChange" style="flex: 1;" title="开始时间起" />
                <input class="form-input" type="datetime-local" v-model="filters.startTimeTo" @change="onFilterChange" style="flex: 1;" title="开始时间止" />
              </div>
            </transition>
          </div>
          <div class="card-body card-body-flush">
            <div v-if="loading && filteredMeetings.length === 0" class="empty-state" style="padding: 32px;">
              <div class="empty-text">加载中...</div>
            </div>
            <div v-else-if="filteredMeetings.length === 0" class="empty-state" style="padding: 32px;">
              <div class="empty-text">暂无会议记录</div>
              <div class="empty-hint">点击"新建会议"开始</div>
            </div>
            <div v-else class="meeting-list">
              <div class="meeting-item" v-for="m in pagedMeetings" :key="m.id" @click="selectMeeting(m)">
                <div class="meeting-icon">
                  <span v-if="m.status === 'RECORDING'" class="status-icon status-recording">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
                  </span>
                  <span v-else-if="m.status === 'FINISHED'" class="status-icon status-finished">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span v-else-if="m.status === 'CANCELLED'" class="status-icon status-cancelled">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                  <span v-else class="status-icon status-pending">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </span>
                </div>
                <div class="meeting-info">
                  <div class="meeting-name">{{ m.title }}</div>
                  <div class="meeting-meta">
                    <span>{{ m.meetingNo || '' }}</span>
                    <span v-if="m.createdAt">{{ formatTime(m.createdAt) }}</span>
                    <span v-if="m.organizerName">{{ m.organizerName }}</span>
                    <span class="tag tag-sm" :class="summaryStatusClass(m)">{{ summaryStatusText(m) }}</span>
                  </div>
                </div>
                <div class="meeting-item-actions" @click.stop>
                  <span class="tag" :class="meetingStatusClass(m)">{{ meetingStatusText(m) }}</span>
                  <button class="btn btn-sm btn-ghost" @click="showEditModal(m)" title="编辑会议">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
                  </button>
                  <button class="btn btn-sm btn-ghost text-danger" @click="handleDeleteMeeting(m)" title="删除会议">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <!-- 分页 -->
            <div v-if="totalPages > 1" class="pagination-bar">
              <button class="btn btn-sm btn-ghost" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">‹</button>
              <span class="pagination-info">{{ currentPage }} / {{ totalPages }}</span>
              <button class="btn btn-sm btn-ghost" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">›</button>
              <span class="pagination-total">共 {{ filteredMeetings.length }} 条</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷入口 + 当前会议 -->
      <div>
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">快捷操作</span>
          </div>
          <div class="card-body">
            <div class="quick-list">
              <div class="quick-item" @click="$router.push('/transcription')">
                <span class="qi-icon" style="background: var(--danger-bg);">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                </span>
                <div class="qi-info">
                  <div class="qi-title">会议室</div>
                  <div class="qi-desc">创建并开始会议录制</div>
                </div>
                <span class="qi-arrow">→</span>
              </div>
              <div class="quick-item" @click="$router.push('/summary')">
                <span class="qi-icon" style="background: var(--primary-bg);">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </span>
                <div class="qi-info">
                  <div class="qi-title">会议摘要</div>
                  <div class="qi-desc">查看和生成纪要</div>
                </div>
                <span class="qi-arrow">→</span>
              </div>
              <div class="quick-item" @click="$router.push('/tasks')">
                <span class="qi-icon" style="background: var(--success-bg);">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                </span>
                <div class="qi-info">
                  <div class="qi-title">待办任务</div>
                  <div class="qi-desc">管理任务与进度</div>
                </div>
                <span class="qi-arrow">→</span>
              </div>
              <div class="quick-item" @click="$router.push('/export')">
                <span class="qi-icon" style="background: var(--warning-bg);">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </span>
                <div class="qi-info">
                  <div class="qi-title">导出同步</div>
                  <div class="qi-desc">导出文件或同步飞书</div>
                </div>
                <span class="qi-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card" v-if="store.currentMeeting">
          <div class="card-header">
            <span class="card-title">当前会议</span>
          </div>
          <div class="card-body card-body-compact">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="meeting-icon" style="flex-shrink: 0;">
                <span v-if="store.meetingStatus === 'RECORDING'" style="color: var(--danger); display: flex;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
                </span>
                <span v-else style="color: var(--text-muted); display: flex;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </span>
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 500;">{{ store.currentMeeting.title }}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                  {{ meetingStatusText(store.currentMeeting) }}
                </div>
              </div>
              <router-link to="/transcription" class="btn btn-sm btn-primary">查看</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑会议弹窗 -->
    <div class="modal-overlay" v-if="editMeetingTarget" @click.self="editMeetingTarget = null" @keydown.escape="editMeetingTarget = null" tabindex="-1">
      <div class="modal">
        <div class="modal-header">
          <h3>编辑会议</h3>
          <button class="modal-close" @click="editMeetingTarget = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">标题 <span class="text-danger">*</span></label>
            <input class="form-input" v-model="editForm.title" placeholder="会议标题" />
          </div>
          <div class="grid grid-2 gap-4">
            <div class="form-group">
              <label class="form-label">地点</label>
              <input class="form-input" v-model="editForm.location" placeholder="地点" />
            </div>
            <div class="form-group">
              <label class="form-label">组织者</label>
              <input class="form-input" v-model="editForm.organizerName" placeholder="组织者" />
            </div>
          </div>
          <div class="grid grid-2 gap-4">
            <div class="form-group">
              <label class="form-label">参会人数</label>
              <input class="form-input" type="number" v-model.number="editForm.participantCount" placeholder="人数" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">时间</label>
              <input class="form-input" type="datetime-local" v-model="editForm.startTime" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea class="form-textarea" v-model="editForm.remark" rows="2" placeholder="备注"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="editMeetingTarget = null">取消</button>
          <button class="btn btn-primary" @click="handleSaveEdit" :disabled="savingEdit || !editForm.title.trim()">
            {{ savingEdit ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetingStore } from '../stores/meetingStore'
import { useMeeting } from '../composables/useMeeting'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const store = useMeetingStore()
const meeting = useMeeting()
const router = useRouter()
const toast = useToast()
const { confirm } = useConfirm()
// ====== 筛选与分页 ======
const loading = ref(false)
const showAdvancedFilters = ref(false)
const filters = reactive({
  keyword: '',
  status: '',
  summaryStatus: '',
  startTimeFrom: '',
  startTimeTo: ''
})
const currentPage = ref(1)
const pageSize = 8

const filteredMeetings = computed(() => {
  let list = store.meetingList
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(m => (m.title || '').toLowerCase().includes(kw) || (m.meetingNo || '').toLowerCase().includes(kw))
  }
  if (filters.status) list = list.filter(m => m.status === filters.status)
  if (filters.summaryStatus) list = list.filter(m => m.summaryStatus === filters.summaryStatus)
  if (filters.startTimeFrom) list = list.filter(m => m.startTime && m.startTime >= filters.startTimeFrom)
  if (filters.startTimeTo) list = list.filter(m => m.startTime && m.startTime <= filters.startTimeTo)
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMeetings.value.length / pageSize)))
const pagedMeetings = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredMeetings.value.slice(start, start + pageSize)
})

function onFilterChange() {
  currentPage.value = 1
}

function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}

// ====== 选择会议 ======
async function selectMeeting(m) {
  store.currentMeeting = m
  router.push('/transcription')
}

// ====== 编辑会议 ======
const editMeetingTarget = ref(null)
const savingEdit = ref(false)
const editForm = reactive({
  title: '',
  location: '',
  organizerName: '',
  participantCount: null,
  startTime: '',
  remark: ''
})

function showEditModal(m) {
  editMeetingTarget.value = m
  editForm.title = m.title || ''
  editForm.location = m.location || ''
  editForm.organizerName = m.organizerName || ''
  editForm.participantCount = m.participantCount || null
  editForm.startTime = m.startTime ? m.startTime.substring(0, 16) : ''
  editForm.remark = m.remark || ''
}

async function handleSaveEdit() {
  if (!editMeetingTarget.value || !editForm.title.trim()) return
  savingEdit.value = true
  try {
    const payload = { title: editForm.title.trim() }
    if (editForm.location) payload.location = editForm.location
    if (editForm.organizerName) payload.organizerName = editForm.organizerName
    if (editForm.participantCount) payload.participantCount = editForm.participantCount
    if (editForm.startTime) payload.startTime = editForm.startTime
    if (editForm.remark) payload.remark = editForm.remark
    await meeting.updateMeeting(editMeetingTarget.value.id, payload)
    editMeetingTarget.value = null
    // 刷新列表
    loadMeetings()
  } catch (err) {
    toast.errorFrom(err, '编辑失败')
  } finally {
    savingEdit.value = false
  }
}

// ====== 删除会议 ======
async function handleDeleteMeeting(m) {
  if (m.status === 'RECORDING') {
    toast.warning('录制中的会议无法删除，请先结束会议')
    return
  }
  if (!await confirm({ title: '删除会议', message: `确定删除会议「${m.title}」？删除后无法恢复。`, danger: true })) return
  try {
    await meeting.deleteMeeting(m.id)
    loadMeetings()
    if (store.currentMeeting?.id === m.id) store.currentMeeting = null
  } catch (err) {
    toast.errorFrom(err, '删除失败')
  }
}

// ====== 刷新列表 ======
async function loadMeetings() {
  loading.value = true
  try {
    await meeting.listMeetings({ pageSize: 200 })
  } catch (e) {
  } finally {
    loading.value = false
  }
}

// ====== 状态辅助 ======
const statusMap = { NOT_STARTED: '未开始', RECORDING: '录制中', FINISHED: '已结束', CANCELLED: '已取消' }
const classMap = { NOT_STARTED: 'tag-warning', RECORDING: 'tag-danger', FINISHED: 'tag-success', CANCELLED: 'tag-outline' }
const summaryStatusMap = { NONE: '无纪要', GENERATING: '生成中', DONE: '已生成', FAILED: '失败' }
const summaryClassMap = { NONE: 'tag-outline', GENERATING: 'tag-warning', DONE: 'tag-success', FAILED: 'tag-danger' }

function meetingStatusText(m) { return statusMap[m.status] || m.status }
function meetingStatusClass(m) { return classMap[m.status] || 'tag-outline' }
function summaryStatusText(m) { return summaryStatusMap[m.summaryStatus] || m.summaryStatus || '' }
function summaryStatusClass(m) { return summaryClassMap[m.summaryStatus] || 'tag-outline' }

const currentStatusClass = computed(() => meetingStatusClass(store.currentMeeting))
const currentStatusText = computed(() => meetingStatusText(store.currentMeeting))

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  loadMeetings()
})
</script>

<style scoped>
.meeting-list { display: flex; flex-direction: column; }
.meeting-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 20px;
  border-bottom: 1px solid var(--border-light); transition: var(--transition); cursor: pointer;
}
.meeting-item:last-child { border-bottom: none; }
.meeting-item:hover { background: var(--primary-bg); }
.meeting-item-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.meeting-icon { font-size: 20px; flex-shrink: 0; }
.meeting-info { flex: 1; min-width: 0; }
.meeting-name { font-weight: 500; font-size: var(--text-body); margin-bottom: 2px; }
.meeting-meta { font-size: var(--text-caption); color: var(--text-muted); display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

.filter-bar { display: flex; gap: 8px; margin-bottom: 8px; }
.filter-row { display: flex; gap: 8px; margin-bottom: 8px; }

.filter-expand-enter-active,
.filter-expand-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
}
.filter-expand-enter-from,
.filter-expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}
.filter-expand-enter-to,
.filter-expand-leave-from {
  opacity: 1;
  max-height: 60px;
}

.pagination-bar {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 12px 20px; border-top: 1px solid var(--border-light);
  font-size: 13px; color: var(--text-muted);
}
.pagination-info { font-weight: 600; color: var(--text-primary); }
.pagination-total { color: var(--text-muted); }

.tag-sm { font-size: 10px; padding: 1px 6px; }

.quick-list { display: flex; flex-direction: column; gap: 2px; }
.quick-item {
  display: flex; align-items: center; gap: 14px; padding: 12px;
  border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition);
}
.quick-item:hover { background: var(--bg); }
.qi-icon { width: 40px; height: 40px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.qi-info { flex: 1; }
.qi-title { font-size: var(--text-body); font-weight: 500; }
.qi-desc { font-size: var(--text-caption); color: var(--text-muted); }
.qi-arrow { color: var(--text-muted); font-size: 16px; }
.quick-item:hover .qi-arrow { color: var(--primary); }

.status-icon { display: inline-flex; align-items: center; justify-content: center; }
.status-recording { color: var(--danger); }
.status-finished { color: var(--success); }
.status-cancelled { color: var(--text-muted); }
.status-pending { color: var(--warning); }
</style>
