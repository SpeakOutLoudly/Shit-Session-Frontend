<template>
  <div class="meeting-room">
    <div class="page-header">
      <h2>会议室</h2>
      <p>创建会议后由边缘设备录制并识别，实时字幕通过 SSE 推送</p>
    </div>

    <!-- ====== 状态：无会议 → 创建会议表单 ====== -->
    <template v-if="!store.currentMeeting">
      <div class="create-card">
        <div class="create-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
        <h3 class="create-title">创建新会议</h3>
        <p class="create-desc">填写会议信息，开始录制</p>
        <div class="create-form">
          <div class="form-group">
            <label class="form-label">会议标题 <span class="text-danger">*</span></label>
            <input class="form-input" v-model="form.title" placeholder="输入会议标题" maxlength="100" />
          </div>
          <div class="grid grid-2 gap-4">
            <div class="form-group">
              <label class="form-label">会议地点</label>
              <input class="form-input" v-model="form.location" placeholder="可选" />
            </div>
            <div class="form-group">
              <label class="form-label">组织者</label>
              <input class="form-input" v-model="form.organizerName" placeholder="默认当前用户" />
            </div>
          </div>
          <div class="grid grid-2 gap-4">
            <div class="form-group">
              <label class="form-label">参会人数</label>
              <input class="form-input" type="number" v-model.number="form.participantCount" placeholder="可选" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">备注</label>
              <input class="form-input" v-model="form.remark" placeholder="可选" />
            </div>
          </div>
          <button class="btn btn-primary btn-lg" style="width: 100%; margin-top: 8px;" @click="handleCreate"
                  :disabled="creating || !form.title.trim()">
            {{ creating ? '创建中...' : '创建会议' }}
          </button>
        </div>
      </div>
    </template>

    <!-- ====== 有会议 ====== -->
    <template v-else>
      <div class="meeting-header">
        <div class="mh-left">
          <div class="mh-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="mh-info">
            <h3>{{ store.currentMeeting.title }}</h3>
            <div class="mh-meta">
              <span v-if="store.currentMeeting.meetingNo">编号 {{ store.currentMeeting.meetingNo }}</span>
              <span v-if="store.currentMeeting.location">{{ store.currentMeeting.location }}</span>
              <span v-if="store.currentMeeting.organizerName">{{ store.currentMeeting.organizerName }}</span>
            </div>
          </div>
        </div>
        <div class="mh-right">
          <span class="status-badge" :class="statusBadgeClass">{{ statusLabel }}</span>
          <button v-if="store.meetingStatus === 'NOT_STARTED'" class="btn btn-primary" @click="handleStart" :disabled="starting">
            开始会议
          </button>
          <button v-if="store.meetingStatus === 'RECORDING'" class="btn btn-danger" @click="handleFinish" :disabled="finishing">
            结束会议
          </button>
          <button v-if="store.meetingStatus === 'NOT_STARTED'" class="btn btn-secondary" @click="handleCancel" :disabled="cancelling">
            取消会议
          </button>
          <button v-if="['FINISHED','CANCELLED'].includes(store.meetingStatus)" class="btn btn-secondary" @click="handleNewMeeting">
            新建会议
          </button>
        </div>
      </div>

      <div v-if="showConnectionInfo" class="sse-status" :class="sseStatusClass">
        <span class="sse-dot"></span>
        {{ sseStatusText }}
      </div>

      <!-- SSE 连接错误横幅 -->
      <div v-if="sse.sseError.value" class="sse-error-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{{ sse.sseError.value }}</span>
        <button class="btn btn-sm btn-ghost" @click="sse.connect(store.currentMeeting.id)">重试</button>
      </div>

      <!-- ====== 录制中 → 字幕展示 ====== -->
      <div v-if="store.meetingStatus === 'RECORDING'" class="transcription-grid">
        <div class="transcript-area">
          <div class="card">
            <div class="card-header">
              <span class="card-title">实时字幕</span>
              <div class="flex gap-2">
                <span class="tag tag-danger">● REC</span>
                <span class="tag tag-primary">{{ sse.speakers.value.length }} 位说话人</span>
                <span class="tag tag-success">{{ sse.finalSegments.value.length }} 条</span>
                <span v-if="sse.onlineSegments.value.length > 0" class="tag tag-primary">{{ sse.onlineSegments.value.length }} 实时</span>
              </div>
            </div>
            <div class="transcript-list" ref="transcriptListRef">
              <!-- 当前正在识别的 ONLINE 字幕 -->
              <div v-if="sse.interimText.value" class="utterance online">
                <div class="utterance-header">
                  <span class="speaker-tag" style="background: var(--primary-bg); color: var(--primary);">{{ lastSpeaker || '识别中' }}</span>
                  <span class="utterance-time">{{ now }}</span>
                  <span class="live-badge">实时</span>
                </div>
                <div class="utterance-text interim">
                  {{ sse.interimText.value }}<span class="cursor-blink">|</span>
                </div>
              </div>
              <!-- 已确认的 OFFLINE 字幕（AI 校正） -->
              <div v-for="seg in reversedSegments" :key="seg.segmentId" class="utterance" :class="seg.recognitionMode === 'ONLINE' ? 'online' : 'offline'">
                <div class="utterance-header">
                  <span class="speaker-tag" :style="{ background: getSpeakerColor(seg.speaker) + '20', color: getSpeakerColor(seg.speaker) }">
                    {{ seg.speaker }}
                  </span>
                  <span class="utterance-time">{{ formatMs(seg.startMs) }}</span>
                  <span v-if="seg.recognitionMode === 'OFFLINE'" class="corrected-badge">已确认</span>
                  <span v-else-if="seg.recognitionMode === 'ONLINE'" class="live-badge">实时</span>
                  <button class="btn btn-sm btn-ghost" style="margin-left: auto;" @click="copyText(seg.subtitle, seg.segmentId)">{{ isJustCopied(seg.segmentId) ? '已复制' : '复制' }}</button>
                </div>
                <div class="utterance-text" :class="{ interim: seg.recognitionMode !== 'OFFLINE' }">{{ seg.subtitle }}</div>
              </div>
              <div v-if="sse.displaySegments.value.length === 0 && !sse.interimText.value" class="empty-state">
                <div class="empty-text">等待字幕推送...</div>
                <div class="empty-hint">边缘设备识别后将实时显示在此处</div>
              </div>
            </div>
          </div>
        </div>
        <div class="transcript-sidebar">
          <div class="card">
            <div class="card-header">
              <span class="card-title">说话人</span>
              <span class="tag tag-primary">{{ sse.speakers.value.length }}</span>
            </div>
            <div class="card-body">
              <div class="speaker-list" v-if="sse.speakers.value.length > 0">
                <div class="speaker-item" v-for="sp in sse.speakers.value" :key="sp.name">
                  <div class="speaker-avatar" :style="{ background: getSpeakerColor(sp.name) }">{{ sp.name.charAt(0) }}</div>
                  <div class="speaker-detail">
                    <div class="speaker-name">{{ sp.name }}</div>
                    <div class="speaker-counts">{{ sp.count }} 条发言</div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state" style="padding: 24px;">
                <div class="empty-text" style="font-size: 13px;">等待说话人识别...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== 会议结束 ====== -->
      <div v-if="store.meetingStatus === 'FINISHED'">
        <div class="finished-actions">
          <div class="card">
            <div class="card-body card-body-lg">
              <div style="margin-bottom: 12px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
              </div>
              <h3 style="margin-bottom: 4px;">会议已结束</h3>
              <p style="color: var(--text-muted); margin-bottom: 24px;">
                {{ store.currentMeeting.title }} · {{ store.currentMeeting.endTime ? formatTime(store.currentMeeting.endTime) : '' }}
              </p>
              <div class="flex gap-3 justify-center" style="flex-wrap: wrap;">
                <button class="btn btn-primary btn-lg" @click="handleGenerateMinutes" :disabled="generatingMinutes">
                  {{ generatingMinutes ? '生成中...' : '生成纪要' }}
                </button>
                <button class="btn btn-secondary btn-lg" @click="$router.push('/summary')">查看纪要</button>
                <button class="btn btn-secondary btn-lg" @click="$router.push('/tasks')">查看任务</button>
                <button class="btn btn-secondary btn-lg" @click="$router.push('/export')">导出</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header">
            <span class="card-title">完整字幕回顾</span>
            <div class="flex gap-2">
              <span class="tag tag-outline">{{ historySegments.length }} 条</span>
              <button class="btn btn-sm btn-ghost" @click="loadSubtitleHistory" :disabled="loadingHistory">刷新</button>
            </div>
          </div>
          <div class="card-body">
            <div v-if="loadingHistory" class="text-muted text-sm">加载中...</div>
            <div v-else-if="historySegments.length === 0" class="text-muted text-sm">暂无字幕记录，可尝试刷新</div>
            <div v-else class="history-list">
              <div v-for="seg in historySegments" :key="seg.segmentId || seg.id" class="utterance history">
                <div class="utterance-header">
                  <span class="speaker-tag" :style="{ background: getSpeakerColor(seg.speaker) + '20', color: getSpeakerColor(seg.speaker) }">
                    {{ seg.speaker || '未知' }}
                  </span>
                  <span class="utterance-time">{{ formatMs(seg.startMs) }}</span>
                  <span v-if="seg.occurredAt" class="utterance-time">{{ formatTime(seg.occurredAt) }}</span>
                  <button class="btn btn-sm btn-ghost" style="margin-left: auto;" @click="copyText(seg.subtitle, seg.segmentId)">{{ isJustCopied(seg.segmentId) ? '已复制' : '复制' }}</button>
                </div>
                <div class="utterance-text">{{ seg.subtitle }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="store.meetingStatus === 'CANCELLED'" class="empty-state" style="margin-top: 40px;">
        <div class="empty-text">会议已取消</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetingStore } from '../stores/meetingStore'
import { useMeeting } from '../composables/useMeeting'
import { useSubtitleSSE } from '../composables/useSubtitleSSE'
import { useApi } from '../composables/useApi'
import { useMinutes } from '../composables/useMinutes'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const router = useRouter()
const store = useMeetingStore()
const meetingApi = useMeeting()
const sse = useSubtitleSSE()
const api = useApi()
const minutesApi = useMinutes()
const toast = useToast()
const { confirm } = useConfirm()

const transcriptListRef = ref(null)
const now = ref('')
const justCopied = ref(new Set())
const creating = ref(false)
const starting = ref(false)
const finishing = ref(false)
const cancelling = ref(false)
const generatingMinutes = ref(false)
const historySegments = ref([])
const loadingHistory = ref(false)

const form = ref({
  title: '',
  location: '',
  organizerName: store.username || '',
  participantCount: null,
  remark: ''
})

async function handleCreate() {
  if (!form.value.title.trim()) return
  creating.value = true
  try {
    await meetingApi.createMeeting({
      title: form.value.title.trim(),
      location: form.value.location || undefined,
      organizerName: form.value.organizerName || undefined,
      participantCount: form.value.participantCount || undefined,
      remark: form.value.remark || undefined
    })
  } catch (err) {
    toast.errorFrom(err, '创建失败')
  } finally {
    creating.value = false
  }
}

async function handleStart() {
  starting.value = true
  try {
    await meetingApi.startMeeting(store.currentMeeting.id)
    sse.connect(store.currentMeeting.id, async (meetingId, fromSeq, limit) => {
      try { return await api.get(`/meetings/${meetingId}/subtitles`, { fromSequence: fromSeq, limit }) }
      catch (e) { return [] }
    })
  } catch (err) {
    toast.errorFrom(err, '开始会议失败')
  } finally {
    starting.value = false
  }
}

async function handleFinish() {
  if (!await confirm({ title: '结束会议', message: '确定结束当前会议？结束后将停止录制并生成最终字幕。', confirmText: '结束会议', danger: true })) return
  finishing.value = true
  try {
    sse.disconnect()
    await meetingApi.finishMeeting(store.currentMeeting.id)
    toast.success('会议已结束')
  } catch (err) {
    toast.errorFrom(err, '结束会议失败')
  } finally {
    finishing.value = false
  }
}

async function handleCancel() {
  cancelling.value = true
  try {
    await meetingApi.cancelMeeting(store.currentMeeting.id)
    toast.success('会议已取消')
  } catch (err) {
    toast.errorFrom(err, '取消会议失败')
  } finally {
    cancelling.value = false
  }
}

function handleNewMeeting() {
  meetingApi.clearCurrentMeeting()
}

const showConnectionInfo = computed(() => store.meetingStatus === 'RECORDING')
const sseStatusText = computed(() => {
  if (!sse.isConnected.value) return '正在连接字幕服务...'
  return `字幕服务已连接 · ${sse.finalSegments.value.length} 条字幕`
})
const sseStatusClass = computed(() => sse.isConnected.value ? 'sse-connected' : 'sse-connecting')
const reversedSegments = computed(() => [...sse.displaySegments.value].reverse())
const lastSpeaker = computed(() => {
  const segs = sse.finalSegments.value
  return segs.length === 0 ? '' : segs[segs.length - 1].speaker
})

const speakerColors = ['#D1453B','#E4A11B','#22A06B','#D9754A','#8B5CF6','#EC4899','#06B6D4','#F97316']

function getSpeakerColor(speaker) {
  let hash = 0
  for (let i = 0; i < speaker.length; i++) hash = ((hash << 5) - hash) + speaker.charCodeAt(i)
  return speakerColors[Math.abs(hash) % speakerColors.length]
}

function formatMs(ms) {
  if (!ms && ms !== 0) return ''
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').substring(0, 16)
}

function isJustCopied(segId) { return justCopied.value.has(segId) }

async function copyText(text, segId) {
  try {
    await navigator.clipboard.writeText(text)
    justCopied.value.add(segId)
    // 触发响应式
    justCopied.value = new Set(justCopied.value)
    setTimeout(() => {
      justCopied.value.delete(segId)
      justCopied.value = new Set(justCopied.value)
    }, 1500)
  } catch {}
}

const statusBadgeClass = computed(() => {
  const map = { NOT_STARTED: 'status-pending', RECORDING: 'status-recording', FINISHED: 'status-finished', CANCELLED: 'status-cancelled' }
  return map[store.meetingStatus] || ''
})
const statusLabel = computed(() => {
  const map = { NOT_STARTED: '未开始', RECORDING: '录制中', FINISHED: '已结束', CANCELLED: '已取消' }
  return map[store.meetingStatus] || store.meetingStatus
})

async function loadSubtitleHistory() {
  if (!store.currentMeeting?.id) return
  loadingHistory.value = true
  try {
    const result = await api.get(`/meetings/${store.currentMeeting.id}/subtitles`, { fromSequence: 0, limit: 500 })
    historySegments.value = result || []
  } catch (e) { historySegments.value = [] }
  finally { loadingHistory.value = false }
}

async function handleGenerateMinutes() {
  if (!store.currentMeeting?.id) return
  generatingMinutes.value = true
  try {
    await minutesApi.generateMinutes(store.currentMeeting.id, false)
    router.push('/summary')
  } catch (err) {
    toast.errorFrom(err, '生成纪要失败')
  } finally { generatingMinutes.value = false }
}

let timeInterval = null
watch(() => store.meetingStatus, (s) => {
  if (s === 'RECORDING') {
    timeInterval = setInterval(() => {
      const d = new Date()
      now.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    }, 1000)
  } else { if (timeInterval) { clearInterval(timeInterval); timeInterval = null } }
})

watch([() => sse.finalSegments.value.length, () => sse.interimText.value], async () => {
  await nextTick()
  const el = transcriptListRef.value
  if (el) el.scrollTop = 0
})

watch(() => store.meetingStatus, (status) => {
  if (status === 'FINISHED') loadSubtitleHistory()
})

onUnmounted(() => { sse.disconnect(); if (timeInterval) clearInterval(timeInterval) })
</script>

<style scoped>
.meeting-room { display: flex; flex-direction: column; }
.create-card { max-width: 520px; margin: 40px auto; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 40px 32px; text-align: center; }
.create-icon { margin-bottom: 12px; }
.create-title { font-size: var(--text-heading); font-weight: 600; margin-bottom: 4px; }
.create-desc { color: var(--text-muted); font-size: var(--text-body); margin-bottom: 24px; }
.create-form { text-align: left; }

.meeting-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 12px; flex-wrap: wrap; gap: 12px; }
.mh-left { display: flex; align-items: center; gap: 14px; }
.mh-icon { font-size: 28px; }
.mh-info h3 { font-size: var(--text-subhead); font-weight: 600; margin: 0; }
.mh-meta { display: flex; gap: 12px; font-size: var(--text-small); color: var(--text-muted); margin-top: 4px; }
.mh-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.status-badge { display: inline-flex; align-items: center; padding: 4px 14px; border-radius: 20px; font-size: var(--text-small); font-weight: 600; }
.status-pending { background: var(--warning-bg); color: var(--warning); }
.status-recording { background: var(--danger-bg); color: var(--danger); }
.status-finished { background: var(--success-bg); color: var(--success); }
.status-cancelled { background: var(--border-light); color: var(--text-muted); }

.sse-status { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--radius-sm); margin-bottom: 12px; font-size: var(--text-caption); }
.sse-connecting { background: var(--warning-bg); color: var(--warning); }
.sse-connected { background: var(--primary-bg); color: var(--primary); }
.sse-error-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--danger-bg); color: var(--danger); border-radius: var(--radius-sm); margin-bottom: 12px; font-size: var(--text-small); }.sse-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.sse-connecting .sse-dot { animation: pulse-dot 1s ease-in-out infinite; }

.transcription-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; height: calc(100vh - 340px); }
.transcript-area { overflow: hidden; display: flex; flex-direction: column; }
.transcript-area .card { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.transcript-list { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; }

.utterance { padding: 12px 16px; margin-bottom: 8px; border-radius: var(--radius-sm); animation: fadeInUp 0.25s ease-out; flex-shrink: 0; }
.utterance.offline { background: var(--bg-card); border: 1px solid var(--border); }
.utterance.online { background: transparent; border: 1px solid var(--border-light); }
.utterance.history { background: transparent; border: 1px solid var(--border-light); }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.utterance-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.speaker-tag { padding: 2px 10px; border-radius: 4px; font-size: var(--text-small); font-weight: 600; }
.utterance-time { font-size: var(--text-caption); color: var(--text-muted); font-variant-numeric: tabular-nums; }
.utterance-text { font-size: var(--text-body); line-height: 1.8; color: var(--text-primary); }
.utterance-text.interim { color: var(--primary); font-style: italic; }
.cursor-blink { animation: blink 0.6s step-end infinite; color: var(--primary); font-weight: bold; }
@keyframes blink { 50% { opacity: 0; } }
.live-badge { font-size: 10px; font-weight: 700; color: var(--primary); background: var(--primary-bg); padding: 1px 6px; border-radius: 3px; }
.corrected-badge { font-size: 10px; font-weight: 700; color: var(--success); background: var(--success-bg); padding: 1px 6px; border-radius: 3px; }

.transcript-sidebar { display: flex; flex-direction: column; }
.speaker-list { display: flex; flex-direction: column; gap: 10px; }
.speaker-item { display: flex; align-items: center; gap: 10px; }
.speaker-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 13px; flex-shrink: 0; }
.speaker-detail { flex: 1; min-width: 0; }
.speaker-name { font-size: var(--text-small); font-weight: 500; }
.speaker-counts { font-size: var(--text-caption); color: var(--text-muted); }

.finished-actions { max-width: 520px; margin: 40px auto; width: 100%; }
</style>
