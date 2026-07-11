<template>
  <div class="export-view">
    <div class="page-header">
      <h2>导出与同步</h2>
      <p>导出会议纪要和任务列表，同步至飞书等协同办公平台</p>
    </div>

    <div class="export-grid">
      <!-- 左侧：导出 -->
      <div class="export-main">
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">📄 导出格式</span>
          </div>
          <div class="card-body">
            <div class="export-formats">
              <div class="format-card" :class="{ selected: exportFormat === 'WORD' }" @click="exportFormat = 'WORD'">
                <div class="format-icon" style="background: rgba(59,130,246,0.1);">📝</div>
                <div class="format-name">Word 文档</div>
                <div class="format-desc">.docx 格式</div>
              </div>
              <div class="format-card" :class="{ selected: exportFormat === 'PDF' }" @click="exportFormat = 'PDF'">
                <div class="format-icon" style="background: rgba(239,68,68,0.1);">📕</div>
                <div class="format-name">PDF 文档</div>
                <div class="format-desc">.pdf 格式</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出选项 -->
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">⚙️ 导出选项</span>
          </div>
          <div class="card-body">
            <div class="export-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportOptions.includeTasks" checked />
                <span class="checkbox-custom"></span>
                包含任务列表
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportOptions.includeSubtitles" />
                <span class="checkbox-custom"></span>
                包含完整字幕原文
              </label>
            </div>
          </div>
        </div>

        <!-- 导出和下载 -->
        <div class="card mb-4">
          <div class="card-body">
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-primary btn-lg" @click="handleExport" :disabled="exporting">
                <span>{{ exporting ? '⏳ 导出中...' : '📤 导出' }}</span>
              </button>
              <span v-if="exportResult" class="text-muted text-sm">
                文件已生成 · <a :href="exportResult.downloadUrl" target="_blank" style="color: var(--primary);">点此下载</a>
                （{{ exportResult.expiresAt ? formatTime(exportResult.expiresAt) + ' 前有效' : '' }}）
              </span>
            </div>
            <div v-if="errorMsg" style="margin-top: 12px; color: var(--danger); font-size: 13px;">{{ errorMsg }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：飞书同步 -->
      <div class="export-sidebar">
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">🌐 飞书同步</span>
          </div>
          <div class="card-body">
            <!-- OAuth 状态 -->
            <div v-if="!oauthUser" class="oauth-section">
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">连接飞书账号以同步会议纪要和任务</p>
              <button class="btn btn-outline" style="width: 100%;" @click="handleOAuth">🔗 飞书 OAuth 授权</button>
            </div>
            <div v-else class="oauth-section">
              <div class="flex items-center gap-2 mb-2">
                <span class="tag tag-success">已授权</span>
                <span style="font-size: 13px;">{{ oauthUser.name || oauthUser.openId }}</span>
              </div>
              <!-- 同步选项 -->
              <div class="form-group">
                <label class="form-label">同步内容</label>
                <label class="checkbox-label" style="margin-bottom: 6px;">
                  <input type="checkbox" v-model="syncOptions.syncDoc" checked /> 飞书在线文档
                </label>
                <label class="checkbox-label" style="margin-bottom: 6px;">
                  <input type="checkbox" v-model="syncOptions.uploadPdf" /> 上传 PDF
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="syncOptions.syncTasks" checked /> 同步任务
                </label>
              </div>
              <button class="btn btn-primary" style="width: 100%;" @click="handleSync" :disabled="syncing">
                {{ syncing ? '同步中...' : '📤 同步到飞书' }}
              </button>
              <div v-if="syncResult" style="margin-top: 12px; font-size: 13px;">
                <div :style="{ color: syncResult.syncStatus === 'SUCCESS' ? 'var(--success)' : 'var(--warning)' }">
                  {{ syncResult.docUrl ? '✅ 文档已同步' : '' }}
                  {{ syncResult.taskResults?.length ? `✅ ${syncResult.taskResults.length} 个任务已同步` : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useMeetingStore } from '../stores/meetingStore'
import { useApi } from '../composables/useApi'

const store = useMeetingStore()
const api = useApi()

const exportFormat = ref('WORD')
const exporting = ref(false)
const exportResult = ref(null)
const errorMsg = ref('')

const exportOptions = reactive({
  includeTasks: true,
  includeSubtitles: false
})

// 飞书 OAuth
const oauthUser = ref(null)
const syncing = ref(false)
const syncResult = ref(null)
const syncOptions = reactive({
  syncDoc: true,
  uploadPdf: false,
  syncTasks: true
})

async function handleExport() {
  const minutesId = store.meetingMinutes?.id
  if (!minutesId) {
    errorMsg.value = '请先生成会议纪要'
    return
  }
  exporting.value = true
  errorMsg.value = ''
  try {
    const result = await api.post(`/minutes/${minutesId}/exports`, {
      format: exportFormat.value,
      includeTasks: exportOptions.includeTasks,
      includeSubtitles: exportOptions.includeSubtitles
    })
    exportResult.value = {
      ...result,
      downloadUrl: api.getDownloadUrl(`/exports/${result.exportId}/download`)
    }
  } catch (err) {
    errorMsg.value = `导出失败: ${err.message}`
  } finally {
    exporting.value = false
  }
}

async function handleOAuth() {
  try {
    const auth = await api.get('/feishu/oauth/authorize-url', {
      redirectUri: window.location.origin
    })
    if (auth.authorizeUrl) {
      window.location.href = auth.authorizeUrl
    }
  } catch (err) {
    errorMsg.value = `OAuth 请求失败: ${err.message}`
  }
}

async function handleSync() {
  const minutesId = store.meetingMinutes?.id
  if (!minutesId) {
    errorMsg.value = '请先生成会议纪要'
    return
  }
  syncing.value = true
  try {
    const result = await api.post(`/minutes/${minutesId}/sync/feishu`, {
      authMode: 'USER',
      oauthUserKey: oauthUser.value?.userKey,
      syncDoc: syncOptions.syncDoc,
      uploadPdf: syncOptions.uploadPdf,
      syncTasks: syncOptions.syncTasks
    })
    syncResult.value = result
  } catch (err) {
    errorMsg.value = `同步失败: ${err.message}`
  } finally {
    syncing.value = false
  }
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').substring(0, 16)
}

// 检查 URL 中是否有 OAuth code
const urlParams = new URLSearchParams(window.location.search)
const code = urlParams.get('code')
if (code) {
  api.post('/feishu/oauth/token', { code, redirectUri: window.location.origin })
    .then(user => { oauthUser.value = user })
    .catch(() => { errorMsg.value = 'OAuth 授权失败' })
    .finally(() => {
      // 清理 URL
      window.history.replaceState({}, '', window.location.pathname)
    })
}
</script>

<style scoped>
.export-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
.export-main { display: flex; flex-direction: column; }
.export-sidebar { display: flex; flex-direction: column; gap: 12px; }

.export-formats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.format-card {
  position: relative; padding: 16px 12px; border: 2px solid var(--border);
  border-radius: var(--radius-md); text-align: center; cursor: pointer; transition: var(--transition);
}
.format-card:hover { border-color: var(--primary-light); }
.format-card.selected { border-color: var(--primary); background: var(--primary-bg); }
.format-icon { width: 40px; height: 40px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 22px; margin: 0 auto 8px; }
.format-name { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.format-desc { font-size: 11px; color: var(--text-muted); }

.export-options { display: flex; flex-direction: column; gap: 10px; }
.checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; user-select: none; }
.checkbox-label input[type="checkbox"] { display: none; }
.checkbox-custom {
  width: 18px; height: 18px; border: 2px solid var(--border);
  border-radius: 4px; display: flex; align-items: center; justify-content: center;
  transition: var(--transition); flex-shrink: 0;
}
.checkbox-label input:checked + .checkbox-custom { background: var(--primary); border-color: var(--primary); }
.checkbox-label input:checked + .checkbox-custom::after { content: '✓'; color: white; font-size: 12px; font-weight: 700; }

@media (max-width: 900px) { .export-grid { grid-template-columns: 1fr; } }
</style>
