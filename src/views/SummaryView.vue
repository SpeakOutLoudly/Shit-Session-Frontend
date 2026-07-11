<template>
  <div class="summary-view">
    <div class="page-header">
      <h2>会议智能摘要</h2>
      <p>AI 自动提取会议核心要素，生成结构化会议纪要</p>
    </div>

    <!-- 无会议 -->
    <div v-if="!store.currentMeeting && !store.meetingMinutes" class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂未有会议纪要</div>
      <div class="empty-hint">请先在会议室创建并结束会议</div>
      <button class="btn btn-primary" style="margin-top: 16px;" @click="$router.push('/transcription')">去会议室</button>
    </div>

    <!-- 有会议但无纪要 -->
    <div v-else-if="!store.meetingMinutes" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-text">当前会议尚未生成纪要</div>
      <div class="empty-hint">点击下方按钮，AI 将根据字幕自动生成结构化纪要</div>
      <button class="btn btn-primary" style="margin-top: 16px;" @click="handleGenerate" :disabled="generating">
        {{ generating ? '生成中...' : '🤖 生成纪要' }}
      </button>
    </div>

    <!-- 显示纪要 -->
    <template v-else>
      <div class="meeting-info-card">
        <div class="meeting-info-main">
          <div class="mi-left">
            <span class="mi-icon">📋</span>
            <div>
              <h3>{{ minutes.title || store.currentMeeting?.title || '会议纪要' }}</h3>
              <div class="mi-meta">
                <span v-if="minutes.generatedAt">📅 {{ formatTime(minutes.generatedAt) }}</span>
                <span v-if="minutes.modelName">🤖 {{ minutes.modelName }}</span>
                <span class="tag" :class="statusTag">{{ statusText }}</span>
              </div>
            </div>
          </div>
          <div class="mi-right">
            <button class="btn btn-primary" @click="handleGenerate" :disabled="generating">
              {{ generating ? '生成中...' : '🔄 重新生成' }}
            </button>
            <button class="btn btn-secondary" @click="$router.push('/export')">📤 导出</button>
          </div>
        </div>
        <div class="meeting-attendees" v-if="store.currentMeeting">
          <span class="attendee-label">📍 {{ store.currentMeeting.location || '未设置地点' }}</span>
          <span class="attendee-label">👤 {{ store.currentMeeting.organizerName || '未知组织者' }}</span>
        </div>
      </div>

      <div class="grid grid-2">
        <!-- 摘要 -->
        <div class="card" v-if="minutes.summary">
          <div class="card-header"><span class="card-title">📌 会议摘要</span></div>
          <div class="card-body">
            <p style="font-size: 14px; line-height: 1.8; color: var(--text-secondary);">{{ minutes.summary }}</p>
          </div>
        </div>

        <!-- 重点 -->
        <div class="card" v-if="minutes.keyPoints && minutes.keyPoints.length > 0">
          <div class="card-header"><span class="card-title">✅ 重点内容</span></div>
          <div class="card-body">
            <ul class="conclusion-list">
              <li v-for="(kp, i) in minutes.keyPoints" :key="i">
                <span class="conclusion-bullet"></span>
                <span>{{ typeof kp === 'string' ? kp : kp.content || kp.text || '' }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 决策 -->
      <div class="card mt-4" v-if="minutes.decisions && minutes.decisions.length > 0">
        <div class="card-header"><span class="card-title">📋 会议决策</span></div>
        <div class="card-body" style="padding: 0;">
          <div class="decision-list">
            <div class="decision-item" v-for="(d, i) in minutes.decisions" :key="i">
              <div class="decision-left">
                <span class="decision-check">✓</span>
                <div class="decision-content">{{ typeof d === 'string' ? d : d.content || d.text || '' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 行动项 -->
      <div class="card mt-4" v-if="minutes.actionItemsSnapshot && minutes.actionItemsSnapshot.length > 0">
        <div class="card-header">
          <span class="card-title">🎯 待办行动项</span>
          <button class="btn btn-sm btn-primary" @click="handleGenerateTasks" :disabled="generatingTasks">
            {{ generatingTasks ? '生成中...' : '生成任务 →' }}
          </button>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="decision-list">
            <div class="decision-item" v-for="(item, i) in minutes.actionItemsSnapshot" :key="i">
              <div class="decision-left">
                <span class="decision-check" style="background: var(--warning-bg); color: var(--warning);">!</span>
                <div>
                  <div class="decision-content" style="font-weight: 500;">{{ item.title }}</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                    <span v-if="item.assigneeName">👤 {{ item.assigneeName }}</span>
                    <span v-if="item.dueTime" style="margin-left: 12px;">📅 {{ formatTime(item.dueTime) }}</span>
                    <span v-if="item.priority" style="margin-left: 12px;">🏷 {{ item.priority }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 完整正文 -->
      <div class="card mt-4" v-if="minutes.content">
        <div class="card-header">
          <span class="card-title">📄 完整纪要</span>
          <button class="btn btn-sm btn-primary" @click="copyContent">📋 复制全文</button>
        </div>
        <div class="card-body">
          <pre class="full-content">{{ minutes.content }}</pre>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMeetingStore } from '../stores/meetingStore'
import { useMinutes } from '../composables/useMinutes'

const store = useMeetingStore()
const minutesApi = useMinutes()

const generating = ref(false)
const generatingTasks = ref(false)

const minutes = computed(() => store.meetingMinutes)

const statusTag = computed(() => {
  const map = { GENERATING: 'tag-warning', DONE: 'tag-success', FAILED: 'tag-danger' }
  return map[minutes.value?.generateStatus] || 'tag-outline'
})

const statusText = computed(() => {
  const map = { GENERATING: '生成中...', DONE: '已生成', FAILED: '生成失败' }
  return map[minutes.value?.generateStatus] || minutes.value?.generateStatus || ''
})

async function handleGenerate() {
  if (!store.currentMeeting?.id && !store.meetingMinutes?.meetingId) {
    alert('请先创建并开始会议')
    return
  }
  const meetingId = store.currentMeeting?.id || store.meetingMinutes?.meetingId
  generating.value = true
  try {
    await minutesApi.generateMinutes(meetingId, true)
  } catch (err) {
    alert('生成失败: ' + err.message)
  } finally {
    generating.value = false
  }
}

async function handleGenerateTasks() {
  if (!store.meetingMinutes?.id) return
  generatingTasks.value = true
  try {
    await minutesApi.generateTasks(store.meetingMinutes.id)
    alert('任务已生成，可在待办任务页面查看')
  } catch (err) {
    alert('任务生成失败: ' + err.message)
  } finally {
    generatingTasks.value = false
  }
}

async function copyContent() {
  try { await navigator.clipboard.writeText(minutes.value?.content || '') } catch {}
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  // 后台静默加载纪要，不阻塞渲染
  if (store.currentMeeting?.id) {
    minutesApi.getMinutes(store.currentMeeting.id).catch(() => {})
  }
})
</script>

<style scoped>
.meeting-info-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
}
.meeting-info-main {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 12px;
}
.mi-left { display: flex; align-items: flex-start; gap: 14px; }
.mi-icon { font-size: 32px; flex-shrink: 0; }
.mi-left h3 { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.mi-meta { display: flex; gap: 12px; font-size: 13px; color: var(--text-muted); align-items: center; flex-wrap: wrap; }
.mi-right { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
.meeting-attendees { display: flex; gap: 16px; padding-top: 12px; border-top: 1px solid var(--border-light); font-size: 13px; color: var(--text-muted); }

.conclusion-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.conclusion-list li {
  display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.6;
  padding: 10px 14px; background: var(--success-bg); border-radius: var(--radius-sm); border-left: 3px solid var(--success);
}
.conclusion-bullet { width: 6px; height: 6px; background: var(--success); border-radius: 50%; margin-top: 8px; flex-shrink: 0; }

.decision-list { display: flex; flex-direction: column; }
.decision-item { display: flex; align-items: flex-start; padding: 14px 20px; border-bottom: 1px solid var(--border-light); gap: 12px; }
.decision-item:last-child { border-bottom: none; }
.decision-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; }
.decision-check {
  width: 24px; height: 24px; border-radius: 50%; background: var(--success-bg); color: var(--success);
  display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.decision-content { font-size: 14px; line-height: 1.5; }

.full-content {
  font-size: 14px; line-height: 1.8; color: var(--text-secondary);
  white-space: pre-wrap; word-break: break-word;
  font-family: inherit; margin: 0; max-height: 400px; overflow-y: auto;
}
</style>
