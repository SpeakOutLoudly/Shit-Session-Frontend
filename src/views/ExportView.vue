<template>
  <div class="export-view">
    <div class="page-header">
      <h2>导出与同步</h2>
      <p>导出会议纪要和任务列表，同步至飞书等协同办公平台</p>
    </div>

    <!-- 选择会议纪要 -->
    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title">选择会议纪要</span>
        <span v-if="selectedMinutes" class="tag tag-success" style="margin-left: 8px;">已选择</span>
      </div>
      <div class="card-body">
        <div v-if="loadingMeetings" class="text-muted text-sm">加载中...</div>
        <div v-else-if="meetings.length === 0" class="text-muted text-sm">暂无已生成纪要的会议，请先在会议摘要页生成纪要</div>
        <div v-else>
          <div class="meeting-select-list">
            <div
              v-for="m in meetings"
              :key="m.id"
              class="meeting-select-item"
              :class="{ selected: selectedMeetingId === m.id }"
              @click="selectMeeting(m)"
            >
              <div class="msi-left">
                <span class="msi-title">{{ m.title }}</span>
                <span class="msi-meta">
                  {{ m.meetingNo }} · {{ formatTime(m.startTime || m.createdAt) }}
                  <span v-if="m.organizerName"> · {{ m.organizerName }}</span>
                </span>
              </div>
              <div class="msi-right">
                <span v-if="selectedMeetingId === m.id" class="tag tag-success">已选</span>
                <span v-else-if="loadingMinutesId === m.id" class="tag tag-warning">加载中...</span>
              </div>
            </div>
          </div>
          <div v-if="selectedMinutes" class="minutes-preview">
            <div class="mp-label">纪要信息</div>
            <div class="mp-title">{{ selectedMinutes.title }}</div>
            <div v-if="selectedMinutes.summary" class="mp-summary">{{ selectedMinutes.summary }}</div>
            <div class="mp-meta">
              <span v-if="selectedMinutes.generatedAt">生成时间：{{ formatTime(selectedMinutes.generatedAt) }}</span>
              <span v-if="selectedMinutes.modelName">模型：{{ selectedMinutes.modelName }}</span>
              <span v-if="selectedMinutes.version">版本：v{{ selectedMinutes.version }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="export-grid">
      <!-- 左侧：导出 -->
      <div class="export-main">
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">导出格式</span>
          </div>
          <div class="card-body">
            <div class="export-formats">
              <div class="format-card" :class="{ selected: exportFormat === 'WORD' }" @click="exportFormat = 'WORD'">
                <div class="format-icon" style="background: var(--info-bg);">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M7 13h.01"/><path d="M10 13h.01"/><path d="M13 13h.01"/><path d="M16 13h.01"/><path d="M7 17h.01"/><path d="M10 17h.01"/><path d="M13 17h.01"/><path d="M16 17h.01"/></svg>
                </div>
                <div class="format-name">Word 文档</div>
                <div class="format-desc">.docx 格式</div>
              </div>
              <div class="format-card" :class="{ selected: exportFormat === 'PDF' }" @click="exportFormat = 'PDF'">
                <div class="format-icon" style="background: var(--danger-bg);">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15c-3 0-3-2-3-3v-1c0-1 0-3 3-3s3 2 3 3v1c0 1 0 3-3 3Z"/><path d="M14 15h1c1 0 2 1 2 2v0c1 0 2-1 2-2h-1v-4Z"/><path d="M13 11h1.5a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5H13"/></svg>
                </div>
                <div class="format-name">PDF 文档</div>
                <div class="format-desc">.pdf 格式</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出选项 -->
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">导出选项</span>
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
              <button class="btn btn-primary btn-lg" @click="handleExport" :disabled="exporting || !selectedMinutes">
                <span>{{ exporting ? '导出中...' : '导出' }}</span>
              </button>
              <span v-if="exportResult" class="text-muted text-sm">
                文件已生成 · <a :href="exportResult.downloadUrl" target="_blank" rel="noopener" style="color: var(--primary);">点此下载</a>
                （{{ exportResult.expiresAt ? formatTime(exportResult.expiresAt) + ' 前有效' : '' }}）
              </span>
            </div>
            <div v-if="!selectedMinutes && !loadingMeetings" style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">请先在上方选择一份会议纪要</div>
            <div v-if="errorMsg" style="margin-top: 12px; color: var(--danger); font-size: 13px;">{{ errorMsg }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：飞书同步 -->
      <div class="export-sidebar">
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">飞书同步</span>
          </div>
          <div class="card-body">
            <!-- OAuth 状态 -->
            <div v-if="oauthPending" class="oauth-section">
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">飞书授权处理中...</p>
            </div>
            <div v-else-if="!oauthUser" class="oauth-section">
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">连接飞书账号以同步会议纪要和任务</p>
              <button class="btn btn-outline" style="width: 100%;" @click="handleOAuth" :disabled="oauthLoading">
                {{ oauthLoading ? '跳转中...' : '授权飞书账号' }}
              </button>
              <div v-if="oauthError" style="margin-top: 8px; color: var(--danger); font-size: 13px;">{{ oauthError }}</div>
            </div>
            <div v-else class="oauth-section">
              <div class="flex items-center gap-2 mb-2">
                <span class="tag tag-success">已授权</span>
                <span style="font-size: 13px;">{{ oauthUser.name || oauthUser.openId || oauthUser.userKey }}</span>
                <button class="btn btn-sm btn-ghost" style="margin-left: auto; color: var(--danger);" @click="handleDisconnect">断开</button>
              </div>
              <!-- 同步内容选项（始终显示） -->
              <div class="form-group">
                <label class="form-label">同步内容</label>
                <label class="checkbox-label" style="margin-bottom: 6px;">
                  <input type="checkbox" v-model="syncOptions.syncDoc" checked />
                  <span class="checkbox-custom"></span>
                  飞书在线文档
                </label>
                <label class="checkbox-label" style="margin-bottom: 4px;">
                  <input type="checkbox" v-model="syncOptions.uploadWord" />
                  <span class="checkbox-custom"></span>
                  上传 Word
                </label>
                <label class="checkbox-label" style="margin-bottom: 6px;">
                  <input type="checkbox" v-model="syncOptions.uploadPdf" />
                  <span class="checkbox-custom"></span>
                  上传 PDF
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="syncOptions.syncTasks" checked />
                  <span class="checkbox-custom"></span>
                  同步任务
                </label>
              </div>
              <!-- 高级设置折叠 -->
              <button class="btn btn-sm btn-ghost" @click="showFeishuAdvanced = !showFeishuAdvanced" style="width: 100%; justify-content: center; gap: 6px; margin-bottom: 12px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: showFeishuAdvanced ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"><polyline points="9 18 15 12 9 6"/></svg>
                {{ showFeishuAdvanced ? '收起高级设置' : '高级设置' }}
              </button>
              <template v-if="showFeishuAdvanced">
                <!-- 负责人映射 -->
                <div class="form-group">
                  <div class="flex items-center gap-2 mb-1">
                    <label class="form-label" style="margin: 0;">负责人映射</label>
                    <button class="btn btn-sm btn-ghost" @click="addMapping" title="添加映射">＋</button>
                  </div>
                  <div v-if="assigneeMappings.length === 0" class="text-muted text-sm">无映射时任务将无负责人</div>
                  <div v-for="(m, idx) in assigneeMappings" :key="idx" class="mapping-row">
                    <input class="form-input" v-model="m.localAssigneeName" placeholder="本地负责人姓名" style="flex: 1;" />
                    <input class="form-input" v-model="m.feishuOpenId" placeholder="飞书用户 ID" style="flex: 1;" />
                    <button class="btn btn-sm btn-ghost text-danger" @click="assigneeMappings.splice(idx, 1)">✕</button>
                  </div>
                  <div class="mt-1">
                    <label class="form-label" style="font-size: 12px;">未匹配负责人策略</label>
                    <select class="form-select" v-model="syncOptions.unmatchedAssigneeStrategy" style="width: 100%;">
                      <option value="KEEP_UNASSIGNED">保持无负责人</option>
                      <option value="FAIL">同步失败</option>
                    </select>
                  </div>
                </div>
                <!-- 飞书文件夹选择 -->
                <div class="form-group">
                  <label class="form-label">目标文件夹</label>
                  <div class="folder-select-row">
                    <select class="form-select" v-model="syncOptions.folderToken" style="flex: 1;">
                      <option value="">根目录（默认）</option>
                      <option v-for="f in folders" :key="f.token" :value="f.token">{{ f.name }}</option>
                    </select>
                    <button class="btn btn-sm btn-ghost" @click="loadFolders" :disabled="loadingFolders" title="刷新文件夹列表">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    </button>
                  </div>
                  <div class="flex gap-2 mt-1">
                    <input class="form-input" v-model="newFolderName" placeholder="新建文件夹名称" style="flex: 1; font-size: 12px;" />
                    <button class="btn btn-sm btn-secondary" @click="handleCreateFolder" :disabled="creatingFolder || !newFolderName.trim()">
                      {{ creatingFolder ? '...' : '新建' }}
                    </button>
                  </div>
                </div>
              </template>
              <button class="btn btn-primary" style="width: 100%;" @click="handleSync" :disabled="syncing || !selectedMinutes">
                {{ syncing ? '同步中...' : '同步到飞书' }}
              </button>
              <div v-if="!selectedMinutes && !loadingMeetings" style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">请先在上方选择一份会议纪要</div>
              <div v-if="syncResult" style="margin-top: 12px; font-size: 13px;">
                <div :style="{ color: syncResult.syncStatus === 'SUCCESS' ? 'var(--success)' : syncResult.syncStatus === 'PARTIAL_SUCCESS' ? 'var(--warning)' : 'var(--danger)' }">
                  <div v-if="syncResult.docUrl">在线文档已同步 → <a :href="syncResult.docUrl" target="_blank" rel="noopener" style="color: var(--primary);">打开</a></div>
                  <div v-else-if="syncResult.syncStatus === 'SUCCESS'">同步成功</div>
                  <div v-if="syncResult.taskResults?.length">{{ syncResult.taskResults.length }} 个任务已同步</div>
                  <div v-if="syncResult.errorMessage" style="margin-top: 4px;">{{ syncResult.errorMessage }}</div>
                </div>
              </div>
              <div v-if="syncError" style="margin-top: 8px; color: var(--danger); font-size: 13px;">{{ syncError }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useMeetingStore } from '../stores/meetingStore'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'

const store = useMeetingStore()
const api = useApi()
const toast = useToast()

// ========== 会议纪要选择 ==========
const meetings = ref([])
const loadingMeetings = ref(false)
const selectedMeetingId = ref(null)
const selectedMinutes = ref(null)
const loadingMinutesId = ref(null)

async function loadMeetings() {
  loadingMeetings.value = true
  try {
    // 加载已生成纪要的已结束会议
    const page = await api.get('/meetings', {
      status: 'FINISHED',
      summaryStatus: 'DONE',
      pageSize: 50,
      pageNo: 1
    }, { timeout: 10000 })
    meetings.value = (page.records || []).filter(m => m.summaryStatus === 'DONE')
  } catch (e) {
    // 如果按 summaryStatus 过滤不支持，全量查已结束会议
    try {
      const page = await api.get('/meetings', {
        status: 'FINISHED',
        pageSize: 50,
        pageNo: 1
      }, { timeout: 10000 })
      meetings.value = (page.records || []).filter(m => m.summaryStatus === 'DONE')
    } catch (e2) {
      meetings.value = []
    }
  } finally {
    loadingMeetings.value = false
  }
}

async function selectMeeting(m) {
  if (loadingMinutesId.value) return
  selectedMeetingId.value = m.id
  loadingMinutesId.value = m.id
  try {
    const minutes = await api.get(`/meetings/${m.id}/minutes`)
    selectedMinutes.value = minutes
  } catch (e) {
    selectedMinutes.value = null
  } finally {
    loadingMinutesId.value = null
  }
}

// ========== 导出 ==========
const exportFormat = ref('WORD')
const exporting = ref(false)
const exportResult = ref(null)
const errorMsg = ref('')

const exportOptions = reactive({
  includeTasks: true,
  includeSubtitles: false
})

// ========== 飞书 OAuth ==========
const oauthUser = ref(null)
const oauthPending = ref(false)
const oauthLoading = ref(false)
const oauthError = ref('')
const showFeishuAdvanced = ref(false)
const syncing = ref(false)
const syncResult = ref(null)
const syncError = ref('')
const syncOptions = reactive({
  syncDoc: true,
  uploadWord: false,
  uploadPdf: false,
  syncTasks: true,
  folderToken: '',
  unmatchedAssigneeStrategy: 'KEEP_UNASSIGNED'
})

// ========== 飞书负责人映射 ==========
const assigneeMappings = ref([])
function addMapping() {
  assigneeMappings.value.push({ localAssigneeName: '', feishuOpenId: '' })
}

// ========== 飞书文件夹 ==========
const folders = ref([])
const loadingFolders = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)

// 从 localStorage 恢复飞书 OAuth 状态
function loadOAuthUser() {
  try {
    const stored = localStorage.getItem('feishu_oauth_user')
    if (stored) {
      oauthUser.value = JSON.parse(stored)
    }
  } catch (e) {
    localStorage.removeItem('feishu_oauth_user')
  }
}
loadOAuthUser()

// 检查是否有正在进行的 OAuth 回调（展示加载态）
if (!oauthUser.value && (sessionStorage.getItem('feishu_oauth_code') || new URLSearchParams(window.location.search).get('code'))) {
  oauthPending.value = true
}

async function handleOAuth() {
  oauthLoading.value = true
  oauthError.value = ''
  try {
    // 生成随机 state 用于 CSRF 防护
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('feishu_oauth_state', state)
    sessionStorage.setItem('feishu_oauth_return_path', window.location.pathname)

    const redirectUri = window.location.origin
    const auth = await api.get('/feishu/oauth/authorize-url', {
      redirectUri,
      state
    })
    if (auth.authorizeUrl) {
      window.location.href = auth.authorizeUrl
    } else {
      oauthError.value = '获取飞书授权地址失败'
    }
  } catch (err) {
    oauthError.value = `授权请求失败: ${err.message}`
    oauthLoading.value = false
  }
}

async function handleDisconnect() {
  oauthUser.value = null
  localStorage.removeItem('feishu_oauth_user')
  syncResult.value = null
  syncError.value = ''
  folders.value = []
}

// ========== 飞书文件夹 ==========
async function loadFolders() {
  if (!oauthUser.value?.userKey) return
  loadingFolders.value = true
  try {
    const result = await api.get('/feishu/drive/folders', {
      authMode: 'USER',
      oauthUserKey: oauthUser.value.userKey,
      parentFolderToken: undefined
    })
    folders.value = result || []
  } catch (e) {
    // 静默失败
  } finally {
    loadingFolders.value = false
  }
}

async function handleCreateFolder() {
  if (!oauthUser.value?.userKey || !newFolderName.value.trim()) return
  creatingFolder.value = true
  try {
    await api.post('/feishu/drive/folders', {
      authMode: 'USER',
      oauthUserKey: oauthUser.value.userKey,
      name: newFolderName.value.trim()
    })
    newFolderName.value = ''
    await loadFolders()
  } catch (err) {
    toast.errorFrom(err, '创建文件夹失败')
  } finally {
    creatingFolder.value = false
  }
}

// ========== 刷新 OAuth token ==========
async function refreshOAuthToken() {
  if (!oauthUser.value?.userKey) return false
  try {
    const refreshed = await api.post(`/feishu/oauth/users/${oauthUser.value.userKey}/refresh`)
    if (refreshed) {
      oauthUser.value = refreshed
      localStorage.setItem('feishu_oauth_user', JSON.stringify(refreshed))
      return true
    }
  } catch (e) {}
  return false
}

// ========== 导出 ==========
async function handleExport() {
  if (!selectedMinutes.value) {
    errorMsg.value = '请先选择一份会议纪要'
    return
  }
  exporting.value = true
  errorMsg.value = ''
  try {
    const result = await api.post(`/minutes/${selectedMinutes.value.id}/exports`, {
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

async function handleSync() {
  if (!selectedMinutes.value) {
    syncError.value = '请先选择一份会议纪要'
    return
  }
  if (!oauthUser.value?.userKey) {
    syncError.value = '飞书账号未授权或 userKey 缺失，请重新授权'
    return
  }
  syncing.value = true
  syncError.value = ''
  syncResult.value = null
  try {
    // 同步前刷新 OAuth token
    await refreshOAuthToken()

    const result = await api.post(`/minutes/${selectedMinutes.value.id}/sync/feishu`, {
      authMode: 'USER',
      oauthUserKey: oauthUser.value.userKey,
      syncDoc: syncOptions.syncDoc,
      uploadWord: syncOptions.uploadWord,
      uploadPdf: syncOptions.uploadPdf,
      syncTasks: syncOptions.syncTasks,
      folderToken: syncOptions.folderToken || null,
      unmatchedAssigneeStrategy: syncOptions.unmatchedAssigneeStrategy,
      assigneeMappings: assigneeMappings.value.filter(m => m.localAssigneeName && m.feishuOpenId) || undefined
    })
    syncResult.value = result
  } catch (err) {
    syncError.value = `同步失败: ${err.message}`
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
  const redirectUri = window.location.origin
  api.post('/feishu/oauth/token', { code, redirectUri })
    .then(user => {
      oauthUser.value = user
      localStorage.setItem('feishu_oauth_user', JSON.stringify(user))
    })
    .catch(() => {
      oauthError.value = '飞书授权失败，请重试'
    })
    .finally(() => {
      window.history.replaceState({}, '', window.location.pathname)
    })
}

// 等待 OAuth 兑换完成
async function waitForOAuthComplete() {
  const pendingCode = sessionStorage.getItem('feishu_oauth_code')
  if (!pendingCode) {
    oauthPending.value = false
    return
  }
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200))
    try {
      const stored = localStorage.getItem('feishu_oauth_user')
      if (stored) {
        oauthUser.value = JSON.parse(stored)
        oauthPending.value = false
        return
      }
    } catch (e) {}
  }
  oauthPending.value = false
  oauthError.value = '飞书授权处理超时，请刷新页面重试'
}

onMounted(async () => {
  // 加载可导出的会议列表
  loadMeetings()

  // 如果 store 中已有当前会议纪要，自动选中
  if (store.meetingMinutes?.id) {
    selectedMinutes.value = store.meetingMinutes
    selectedMeetingId.value = store.meetingMinutes.meetingId
  }

  // 飞书 OAuth 状态恢复
  if (oauthUser.value) {
    loadFolders()
    return
  }
  await waitForOAuthComplete()
  if (oauthUser.value) {
    loadFolders()
    return
  }
  try {
    const users = await api.get('/feishu/oauth/users')
    if (users && users.length > 0) {
      const last = users[users.length - 1]
      oauthUser.value = last
      localStorage.setItem('feishu_oauth_user', JSON.stringify(last))
      loadFolders()
    }
  } catch (e) {}
})
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
.format-name { font-size: var(--text-small); font-weight: 600; margin-bottom: 2px; }
.format-desc { font-size: var(--text-caption); color: var(--text-muted); }

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

/* 会议选择列表 */
.meeting-select-list { display: flex; flex-direction: column; gap: 4px; max-height: 240px; overflow-y: auto; }
.meeting-select-item {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  cursor: pointer; transition: var(--transition);
}
.meeting-select-item:hover { border-color: var(--primary-light); background: var(--primary-bg); }
.meeting-select-item.selected { border-color: var(--primary); background: var(--primary-bg); }
.msi-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.msi-title { font-size: var(--text-body); font-weight: 500; }
.msi-meta { font-size: var(--text-caption); color: var(--text-muted); }
.msi-right { flex-shrink: 0; }

/* 纪要预览 */
.minutes-preview {
  margin-top: 12px; padding: 14px; background: var(--bg); border-radius: var(--radius-sm);
  border: 1px solid var(--border-light); border-top: 2px solid var(--primary);
}
.mp-label { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; }
.mp-title { font-size: var(--text-subhead); font-weight: 600; margin-bottom: 6px; }
.mp-summary { font-size: var(--text-small); color: var(--text-secondary); line-height: 1.6; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.mp-meta { font-size: var(--text-caption); color: var(--text-muted); display: flex; gap: 12px; flex-wrap: wrap; }

.folder-select-row { display: flex; gap: 6px; align-items: center; }
.mt-1 { margin-top: 4px; }
.mb-1 { margin-bottom: 4px; }
.gap-2 { gap: 8px; }
.mapping-row {
  display: flex; gap: 6px; align-items: center; margin-bottom: 6px;
}

@media (max-width: 900px) { .export-grid { grid-template-columns: 1fr; } }
</style>
