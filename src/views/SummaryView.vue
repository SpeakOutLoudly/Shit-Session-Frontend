<template>
  <div class="summary-view">

    <!-- 选择会议 -->
    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title">选择会议</span>
        <div class="flex gap-2">
          <span v-if="selectedMeeting" class="tag tag-success">已选择</span>
          <button class="btn btn-sm btn-ghost" @click="loadMeetings" :disabled="loadingMeetings">刷新</button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loadingMeetings" class="text-muted text-sm">加载中...</div>
        <div v-else-if="meetings.length === 0" class="text-muted text-sm">暂无已结束的会议，请先在会议室创建并结束会议</div>
        <div v-else>
          <div class="meeting-select-list">
            <div v-for="m in meetings" :key="m.id" class="meeting-select-item" :class="{ selected: selectedMeeting?.id === m.id }" @click="selectMeeting(m)">
              <div class="msi-left">
                <span class="msi-title">{{ m.title }}</span>
                <span class="msi-meta">
                  {{ m.meetingNo }} · {{ formatTime(m.startTime || m.createdAt) }}
                  <span v-if="m.organizerName"> · {{ m.organizerName }}</span>
                  <span class="tag" :class="summaryTagClass(m)" style="margin-left: 4px;">{{ summaryTagText(m) }}</span>
                </span>
              </div>
              <div class="msi-right">
                <span v-if="selectedMeeting?.id === m.id" class="tag tag-success">已选</span>
                <span v-else-if="loadingMeetingId === m.id" class="tag tag-warning">加载中...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedMeeting && !store.meetingMinutes" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      <div class="empty-text">「{{ selectedMeeting.title }}」尚未生成纪要</div>
      <div class="empty-hint">点击下方按钮，AI 将根据字幕自动生成结构化纪要</div>
      <button class="btn btn-primary" style="margin-top: 16px;" @click="handleGenerate" :disabled="generating">
        {{ generating ? '生成中...' : '生成纪要' }}
      </button>
      <div v-if="errorMsg" style="margin-top: 12px; color: var(--danger); font-size: 13px;">{{ errorMsg }}</div>
    </div>

    <div v-if="!selectedMeeting && !store.meetingMinutes" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      <div class="empty-text">暂未选择会议</div>
      <div class="empty-hint">请在上方选择一个已结束的会议</div>
    </div>

    <template v-if="store.meetingMinutes">
      <div class="meeting-info-card">
        <div class="meeting-info-main">
          <div class="mi-left">
            <span class="mi-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </span>
            <div>
              <h3>{{ minutes.title || selectedMeeting?.title || '会议纪要' }}</h3>
              <div class="mi-meta">
                <span v-if="minutes.generatedAt">{{ formatTime(minutes.generatedAt) }}</span>
                <span v-if="minutes.modelName">{{ minutes.modelName }}</span>
                <span class="tag" :class="statusTag">{{ statusText }}</span>
              </div>
            </div>
          </div>
          <div class="mi-right">
            <button v-if="minutes.generateStatus !== 'GENERATING'" class="btn btn-primary" @click="handleGenerate" :disabled="generating">
              {{ generating ? '生成中...' : minutes.generateStatus === 'DONE' ? '重新生成' : '生成纪要' }}
            </button>
            <button class="btn btn-secondary" @click="$router.push('/export')">导出</button>
            <button class="btn btn-secondary" @click="showEditModal = true" v-if="minutes.generateStatus === 'DONE'">修订</button>
            <button class="btn btn-sm btn-ghost text-danger" @click="handleDeleteMinutes">删除</button>
          </div>
        </div>
        <div class="meeting-attendees">
          <span class="attendee-label" v-if="selectedMeeting">{{ selectedMeeting.location || '未设置地点' }}</span>
          <span class="attendee-label" v-if="selectedMeeting">{{ selectedMeeting.organizerName || '未知组织者' }}</span>
          <span class="attendee-label" v-if="selectedMeeting">{{ selectedMeeting.participantCount || '-' }} 人</span>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card" v-if="minutes.summary">
          <div class="card-header"><span class="card-title">会议摘要</span></div>
          <div class="card-body"><p style="font-size: 14px; line-height: 1.8; color: var(--text-secondary);">{{ minutes.summary }}</p></div>
        </div>
        <div class="card" v-if="minutes.keyPoints && minutes.keyPoints.length > 0">
          <div class="card-header"><span class="card-title">重点内容</span></div>
          <div class="card-body">
            <ul class="conclusion-list">
              <li v-for="(kp, i) in minutes.keyPoints" :key="i"><span class="conclusion-bullet"></span><span>{{ typeof kp === 'string' ? kp : kp.content || kp.text || '' }}</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="card mt-4" v-if="minutes.decisions && minutes.decisions.length > 0">
        <div class="card-header"><span class="card-title">会议决策</span></div>
        <div class="card-body card-body-flush">
          <div class="decision-list">
            <div class="decision-item" v-for="(d, i) in minutes.decisions" :key="i">
              <div class="decision-left"><span class="decision-check"></span><div class="decision-content">{{ typeof d === 'string' ? d : d.content || d.text || '' }}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-4" v-if="minutes.actionItemsSnapshot && minutes.actionItemsSnapshot.length > 0">
        <div class="card-header">
          <span class="card-title">待办行动项</span>
          <button class="btn btn-sm btn-primary" @click="handleGenerateTasks" :disabled="generatingTasks">
            {{ generatingTasks ? '生成中...' : '生成任务' }}
          </button>
        </div>
        <div class="card-body card-body-flush">
          <div class="decision-list">
            <div class="decision-item" v-for="(item, i) in minutes.actionItemsSnapshot" :key="i">
              <div class="decision-left">
                <span class="decision-check" style="background: var(--warning-bg); color: var(--warning);"></span>
                <div>
                  <div class="decision-content" style="font-weight: 500;">{{ item.title }}</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                    <span v-if="item.assigneeName">{{ item.assigneeName }}</span>
                    <span v-if="item.dueTime" style="margin-left: 12px;">{{ formatTime(item.dueTime) }}</span>
                    <span v-if="item.priority" style="margin-left: 12px;">{{ item.priority }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-4" v-if="minutes.content">
        <div class="card-header"><span class="card-title">完整纪要</span><button class="btn btn-sm btn-primary" @click="copyContent">复制全文</button></div>
        <div class="card-body"><pre class="full-content">{{ minutes.content }}</pre></div>
      </div>
    </template>

    <div class="modal-overlay" v-if="showEditModal" @click.self="showEditModal = false" @keydown.escape="showEditModal = false" tabindex="-1">
      <div class="modal modal-lg">
        <div class="modal-header"><h3>修订会议纪要</h3><button class="modal-close" @click="showEditModal = false">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">标题</label><input class="form-input" v-model="editForm.title" placeholder="纪要标题" /></div>
          <div class="form-group"><label class="form-label">摘要</label><textarea class="form-textarea" v-model="editForm.summary" rows="3" placeholder="摘要"></textarea></div>
          <div class="form-group"><label class="form-label">正文（Markdown）</label>
            <div class="editor-tabs"><button class="editor-tab" :class="{ active: editTab === 'edit' }" @click="editTab = 'edit'">编辑</button><button class="editor-tab" :class="{ active: editTab === 'preview' }" @click="editTab = 'preview'">预览</button></div>
            <textarea v-if="editTab === 'edit'" class="form-textarea font-mono" v-model="editForm.content" rows="10" placeholder="正文"></textarea>
            <div v-else class="markdown-preview">{{ editForm.content || '暂无内容' }}</div>
          </div>
          <div class="grid grid-2 gap-4">
            <div class="form-group"><label class="form-label">重点</label>
              <div class="list-editor">
                <div v-for="(item, i) in editForm.keyPoints" :key="i" class="list-item-row"><input class="form-input" v-model="editForm.keyPoints[i]" placeholder="重点内容" style="flex: 1;" /><button class="btn btn-sm btn-ghost text-danger" @click="editForm.keyPoints.splice(i, 1)">✕</button></div>
                <button class="btn btn-sm btn-ghost" @click="editForm.keyPoints.push('')">＋ 添加重点</button>
              </div>
            </div>
            <div class="form-group"><label class="form-label">决策</label>
              <div class="list-editor">
                <div v-for="(item, i) in editForm.decisions" :key="i" class="list-item-row"><input class="form-input" v-model="editForm.decisions[i]" placeholder="决策内容" style="flex: 1;" /><button class="btn btn-sm btn-ghost text-danger" @click="editForm.decisions.splice(i, 1)">✕</button></div>
                <button class="btn btn-sm btn-ghost" @click="editForm.decisions.push('')">＋ 添加决策</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="showEditModal = false">取消</button><button class="btn btn-primary" @click="handleSaveEdit" :disabled="saving">{{ saving ? '保存中...' : '保存修订' }}</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMeetingStore } from '../stores/meetingStore'
import { useMeeting } from '../composables/useMeeting'
import { useMinutes } from '../composables/useMinutes'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const store = useMeetingStore()
const meetingApi = useMeeting()
const minutesApi = useMinutes()
const api = useApi()
const toast = useToast()
const { confirm: confirmDialog } = useConfirm()

const meetings = ref([])
const loadingMeetings = ref(false)
const selectedMeeting = ref(null)
const loadingMeetingId = ref(null)
const errorMsg = ref('')
const generating = ref(false)
const generatingTasks = ref(false)

async function loadMeetings() {
  loadingMeetings.value = true
  try {
    const page = await api.get('/meetings', { pageSize: 50, pageNo: 1 }, { timeout: 10000 })
    meetings.value = (page.records || []).filter(m => m.status === 'FINISHED' || m.status === 'CANCELLED' || m.summaryStatus === 'DONE')
  } catch (e) { meetings.value = [] }
  finally { loadingMeetings.value = false }
}

async function selectMeeting(m) {
  if (loadingMeetingId.value) return
  selectedMeeting.value = m
  loadingMeetingId.value = m.id
  errorMsg.value = ''
  try { await minutesApi.getMinutes(m.id) }
  catch (e) { store.meetingMinutes = null }
  finally { loadingMeetingId.value = null }
}

const showEditModal = ref(false)
const saving = ref(false)
const editTab = ref('edit')
const editForm = ref({ title: '', summary: '', content: '', keyPoints: [], decisions: [] })

watch(showEditModal, (val) => {
  if (val && store.meetingMinutes) {
    const m = store.meetingMinutes
    editTab.value = 'edit'
    editForm.value = {
      title: m.title || '', summary: m.summary || '', content: m.content || '',
      keyPoints: (m.keyPoints || []).map(k => typeof k === 'string' ? k : k.content || k.text || ''),
      decisions: (m.decisions || []).map(d => typeof d === 'string' ? d : d.content || d.text || '')
    }
  }
})

async function handleSaveEdit() {
  if (!store.meetingMinutes?.id) return
  saving.value = true
  try {
    await minutesApi.updateMinutes(store.meetingMinutes.id, {
      title: editForm.value.title || undefined, summary: editForm.value.summary || undefined,
      content: editForm.value.content || undefined,
      keyPoints: editForm.value.keyPoints.filter(s => s.trim()),
      decisions: editForm.value.decisions.filter(s => s.trim())
    })
    showEditModal.value = false
  } catch (err) { toast.errorFrom(err, '修订保存失败') }
  finally { saving.value = false }
}

async function handleDeleteMinutes() {
  if (!store.meetingMinutes?.id) return
  if (!await confirmDialog({ title: '删除纪要', message: '确定删除此会议纪要？删除后不可恢复。', danger: true })) return
  try { await minutesApi.deleteMinutes(store.meetingMinutes.id) }
  catch (err) { toast.errorFrom(err, '删除失败') }
}

const minutes = computed(() => store.meetingMinutes)
const statusTag = computed(() => {
  const map = { GENERATING: 'tag-warning', DONE: 'tag-success', FAILED: 'tag-danger' }
  return map[minutes.value?.generateStatus] || 'tag-outline'
})
const statusText = computed(() => {
  const map = { GENERATING: '生成中...', DONE: '已生成', FAILED: '生成失败' }
  return map[minutes.value?.generateStatus] || minutes.value?.generateStatus || ''
})

function summaryTagClass(m) {
  if (!m) return 'tag-outline'
  return m.summaryStatus === 'DONE' ? 'tag-success' : m.summaryStatus === 'GENERATING' ? 'tag-warning' : 'tag-outline'
}
function summaryTagText(m) {
  if (!m) return ''
  return m.summaryStatus === 'DONE' ? '已生成' : m.summaryStatus === 'GENERATING' ? '生成中' : '无纪要'
}

async function handleGenerate() {
  const meetingId = selectedMeeting.value?.id || store.meetingMinutes?.meetingId
  if (!meetingId) { errorMsg.value = '请先选择一个会议'; return }
  generating.value = true; errorMsg.value = ''
  try {
    await minutesApi.generateMinutes(meetingId, true)
    toast.success('纪要已生成成功')
  } catch (err) { errorMsg.value = `生成失败: ${err.message}` }
  finally { generating.value = false }
}

async function handleGenerateTasks() {
  if (!store.meetingMinutes?.id) return
  generatingTasks.value = true
  try {
    await minutesApi.generateTasks(store.meetingMinutes.id)
    toast.success('任务已生成，可在待办任务页面查看')
  } catch (err) { toast.errorFrom(err, '任务生成失败') }
  finally { generatingTasks.value = false }
}

async function copyContent() {
  try { await navigator.clipboard.writeText(minutes.value?.content || '') } catch {}
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  loadMeetings()
  if (store.currentMeeting?.id) {
    const unwatch = watch(meetings, (list) => {
      const match = list.find(m => m.id === store.currentMeeting?.id)
      if (match) { selectMeeting(match); unwatch() }
    })
    if (meetings.value.length > 0) {
      const match = meetings.value.find(m => m.id === store.currentMeeting?.id)
      if (match) { selectMeeting(match); unwatch() }
    }
  }
})
</script>

<style scoped>
.meeting-info-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px; }
.meeting-info-main { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 12px; }
.mi-left { display: flex; align-items: flex-start; gap: 14px; }
.mi-icon { flex-shrink: 0; }
.mi-left h3 { font-size: var(--text-heading); font-weight: 600; margin-bottom: 6px; }
.mi-meta { display: flex; gap: 12px; font-size: var(--text-small); color: var(--text-muted); align-items: center; flex-wrap: wrap; }
.mi-right { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
.meeting-attendees { display: flex; gap: 16px; padding-top: 12px; border-top: 1px solid var(--border-light); font-size: var(--text-small); color: var(--text-muted); }
.conclusion-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.conclusion-list li { display: flex; align-items: flex-start; gap: 10px; font-size: var(--text-body); line-height: 1.6; padding: 10px 14px; background: var(--success-bg); border-radius: var(--radius-sm); }
.conclusion-bullet { width: 6px; height: 6px; background: var(--success); border-radius: 50%; margin-top: 8px; flex-shrink: 0; }
.decision-list { display: flex; flex-direction: column; }
.decision-item { display: flex; align-items: flex-start; padding: 14px 20px; border-bottom: 1px solid var(--border-light); gap: 12px; }
.decision-item:last-child { border-bottom: none; }
.decision-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; }
.decision-check { width: 24px; height: 24px; border-radius: 50%; background: var(--success-bg); color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; border: 1.5px solid var(--success); }
.full-content { font-size: var(--text-body); line-height: var(--leading-loose); color: var(--text-secondary); white-space: pre-wrap; word-break: break-word; font-family: inherit; margin: 0; max-height: 400px; overflow-y: auto; }
.font-mono { font-family: 'Consolas', 'Courier New', monospace; font-size: 13px; line-height: 1.5; }
.modal-lg { max-width: 700px; }
.editor-tabs { display: flex; gap: 0; margin-bottom: 8px; }
.editor-tab { padding: 6px 16px; border: 1px solid var(--border); background: var(--bg); cursor: pointer; font-size: 13px; color: var(--text-secondary); transition: var(--transition); }
.editor-tab:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.editor-tab:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.editor-tab.active { background: var(--primary); color: white; border-color: var(--primary); }
.markdown-preview { padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); min-height: 200px; font-size: 14px; line-height: 1.8; white-space: pre-wrap; word-break: break-word; color: var(--text-secondary); }
.list-editor { display: flex; flex-direction: column; gap: 4px; }
.list-item-row { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: var(--bg); border-radius: var(--radius-sm); }
.meeting-select-list { display: flex; flex-direction: column; gap: 4px; max-height: 240px; overflow-y: auto; }
.meeting-select-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); }
.meeting-select-item:hover { border-color: var(--primary-light); background: var(--primary-bg); }
.meeting-select-item.selected { border-color: var(--primary); background: var(--primary-bg); }
.msi-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.msi-title { font-size: var(--text-body); font-weight: 500; }
.msi-meta { font-size: var(--text-caption); color: var(--text-muted); display: flex; align-items: center; flex-wrap: wrap; }
.msi-right { flex-shrink: 0; }
</style>
