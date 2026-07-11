<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>工作台概览</h2>
      <p v-if="store.currentMeeting">当前会议：{{ store.currentMeeting.title }}
        <span class="tag" :class="currentStatusClass" style="margin-left: 8px;">{{ currentStatusText }}</span>
      </p>
      <p v-else>欢迎回来，请创建或开始一场会议</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-4 mb-6">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--primary-bg);">📊</div>
        <div class="stat-label">总会议数</div>
        <div class="stat-value">{{ store.stats.total }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--danger-bg);">🔴</div>
        <div class="stat-label">录制中</div>
        <div class="stat-value text-danger">{{ store.stats.recording }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--success-bg);">✅</div>
        <div class="stat-label">已结束</div>
        <div class="stat-value text-success">{{ store.stats.finished }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--info-bg);">📝</div>
        <div class="stat-label">已生成纪要</div>
        <div class="stat-value text-primary">{{ store.stats.withSummary }}</div>
      </div>
    </div>

    <div class="grid grid-2">
      <!-- 最近会议 -->
      <div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 最近会议</span>
            <router-link to="/transcription" class="btn btn-sm btn-ghost">新建会议 →</router-link>
          </div>
          <div class="card-body" style="padding: 0;">
            <div v-if="store.meetingList.length === 0" class="empty-state" style="padding: 32px;">
              <div class="empty-text">暂无会议记录</div>
              <div class="empty-hint">点击"新建会议"开始</div>
            </div>
            <div v-else class="meeting-list">
              <div class="meeting-item" v-for="m in store.meetingList.slice(0, 8)" :key="m.id" @click="selectMeeting(m)">
                <div class="meeting-icon">
                  <span v-if="m.status === 'RECORDING'">🔴</span>
                  <span v-else-if="m.status === 'FINISHED'">✅</span>
                  <span v-else-if="m.status === 'CANCELLED'">✕</span>
                  <span v-else>⏳</span>
                </div>
                <div class="meeting-info">
                  <div class="meeting-name">{{ m.title }}</div>
                  <div class="meeting-meta">
                    <span>{{ m.meetingNo || '' }}</span>
                    <span v-if="m.createdAt">{{ formatTime(m.createdAt) }}</span>
                    <span v-if="m.organizerName">{{ m.organizerName }}</span>
                  </div>
                </div>
                <span class="tag" :class="meetingStatusClass(m)">{{ meetingStatusText(m) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div>
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">🚀 快捷操作</span>
          </div>
          <div class="card-body">
            <div class="quick-list">
              <div class="quick-item" @click="$router.push('/transcription')">
                <span class="qi-icon" style="background: rgba(239,68,68,0.1);">🎤</span>
                <div class="qi-info">
                  <div class="qi-title">会议室</div>
                  <div class="qi-desc">创建并开始会议录制</div>
                </div>
                <span class="qi-arrow">→</span>
              </div>
              <div class="quick-item" @click="$router.push('/summary')">
                <span class="qi-icon" style="background: rgba(79,110,247,0.1);">📝</span>
                <div class="qi-info">
                  <div class="qi-title">会议摘要</div>
                  <div class="qi-desc">查看和生成纪要</div>
                </div>
                <span class="qi-arrow">→</span>
              </div>
              <div class="quick-item" @click="$router.push('/tasks')">
                <span class="qi-icon" style="background: rgba(34,197,94,0.1);">✅</span>
                <div class="qi-info">
                  <div class="qi-title">待办任务</div>
                  <div class="qi-desc">管理任务与进度</div>
                </div>
                <span class="qi-arrow">→</span>
              </div>
              <div class="quick-item" @click="$router.push('/export')">
                <span class="qi-icon" style="background: rgba(245,158,11,0.1);">📤</span>
                <div class="qi-info">
                  <div class="qi-title">导出同步</div>
                  <div class="qi-desc">导出文件或同步飞书</div>
                </div>
                <span class="qi-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 当前会议状态 -->
        <div class="card" v-if="store.currentMeeting">
          <div class="card-header">
            <span class="card-title">🎯 当前会议</span>
          </div>
          <div class="card-body" style="padding: 16px 20px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="meeting-icon" style="flex-shrink: 0;">
                <span v-if="store.meetingStatus === 'RECORDING'" style="font-size: 24px;">🔴</span>
                <span v-else style="font-size: 24px;">📋</span>
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
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetingStore } from '../stores/meetingStore'
import { useMeeting } from '../composables/useMeeting'

const store = useMeetingStore()
const meeting = useMeeting()
const router = useRouter()

async function selectMeeting(m) {
  store.currentMeeting = m
  router.push('/transcription')
}

const statusMap = { NOT_STARTED: '未开始', RECORDING: '录制中', FINISHED: '已结束', CANCELLED: '已取消' }
const classMap = { NOT_STARTED: 'tag-warning', RECORDING: 'tag-danger', FINISHED: 'tag-success', CANCELLED: 'tag-outline' }

function meetingStatusText(m) {
  if (!m) return ''
  return statusMap[m.status] || m.status
}

function meetingStatusClass(m) {
  if (!m) return 'tag-outline'
  return classMap[m.status] || 'tag-outline'
}

const currentStatusClass = computed(() => meetingStatusClass(store.currentMeeting))
const currentStatusText = computed(() => meetingStatusText(store.currentMeeting))

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  // 后台静默加载，不阻塞渲染
  meeting.listMeetings({ pageSize: 20 }).catch(() => {})
})
</script>

<style scoped>
.meeting-list { display: flex; flex-direction: column; }
.meeting-item {
  display: flex; align-items: center; gap: 12px; padding: 14px 20px;
  border-bottom: 1px solid var(--border-light); transition: var(--transition); cursor: pointer;
}
.meeting-item:last-child { border-bottom: none; }
.meeting-item:hover { background: var(--primary-bg); }
.meeting-icon { font-size: 20px; flex-shrink: 0; }
.meeting-info { flex: 1; min-width: 0; }
.meeting-name { font-weight: 500; font-size: 14px; margin-bottom: 2px; }
.meeting-meta { font-size: 12px; color: var(--text-muted); display: flex; gap: 10px; flex-wrap: wrap; }

.quick-list { display: flex; flex-direction: column; gap: 2px; }
.quick-item {
  display: flex; align-items: center; gap: 14px; padding: 12px;
  border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition);
}
.quick-item:hover { background: var(--bg); }
.qi-icon { width: 40px; height: 40px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.qi-info { flex: 1; }
.qi-title { font-size: 14px; font-weight: 500; }
.qi-desc { font-size: 12px; color: var(--text-muted); }
.qi-arrow { color: var(--text-muted); font-size: 16px; }
.quick-item:hover .qi-arrow { color: var(--primary); }
</style>
