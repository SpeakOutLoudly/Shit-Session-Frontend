<template>
  <div class="export-view">
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
      <!-- 左侧：导出到本地 -->
      <div class="export-main">
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">导出到本地</span>
          </div>
          <div class="card-body">
            <div class="export-formats">
              <div class="format-card" :class="{ selected: exportFormat === 'WORD' }" @click="exportFormat = 'WORD'">
                <div class="format-icon" style="background: var(--info-bg);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M7 13h.01"/><path d="M10 13h.01"/><path d="M13 13h.01"/><path d="M16 13h.01"/><path d="M7 17h.01"/><path d="M10 17h.01"/><path d="M13 17h.01"/><path d="M16 17h.01"/></svg></div>
                <div class="format-name">Word 文档</div>
                <div class="format-desc">.docx 格式</div>
              </div>
              <div class="format-card" :class="{ selected: exportFormat === 'PDF' }" @click="exportFormat = 'PDF'">
                <div class="format-icon" style="background: var(--danger-bg);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15c-3 0-3-2-3-3v-1c0-1 0-3 3-3s3 2 3 3v1c0 1 0 3-3 3Z"/><path d="M14 15h1c1 0 2 1 2 2v0c1 0 2-1 2-2h-1v-4Z"/><path d="M13 11h1.5a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5H13"/></svg></div>
                <div class="format-name">PDF 文档</div>
                <div class="format-desc">.pdf 格式</div>
              </div>
            </div>
            <div class="form-group" style="margin-top: 16px;">
              <label class="checkbox-label" style="margin-bottom: 6px;">
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
            <button class="btn btn-primary" style="width: 100%;" @click="handleExport" :disabled="exporting || !selectedMinutes">
              {{ exporting ? '导出中...' : '导出' }}
            </button>
            <div v-if="exportResult" style="margin-top: 8px; font-size: 13px;">
              文件已生成 · <a :href="exportResult.downloadUrl" target="_blank" rel="noopener" style="color: var(--primary);">点此下载</a>
              （{{ exportResult.expiresAt ? formatTime(exportResult.expiresAt) + ' 前有效' : '' }}）
            </div>
            <div v-if="errorMsg" style="margin-top: 8px; color: var(--danger); font-size: 13px;">{{ errorMsg }}</div>
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

              <!-- ===== 同步到飞书 ===== -->
              <div class="section-divider-label">同步到飞书</div>

              <div class="flex items-center gap-2 mb-2">
                <span class="tag tag-success">已授权</span>
                <span style="font-size: 13px;">{{ oauthUser.name || oauthUser.openId || oauthUser.userKey }}</span>
                <button class="btn btn-sm btn-ghost" style="margin-left: auto; color: var(--danger);" @click="handleDisconnect">断开</button>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="syncOptions.syncTasks" checked />
                  <span class="checkbox-custom"></span>
                  同步任务到飞书
                </label>
              </div>

              <!-- 上传文件 + 目标文件夹（关联） -->
              <div class="form-group">
                <label class="form-label">上传文件</label>
                <label class="checkbox-label" style="margin-bottom: 4px;">
                  <input type="checkbox" v-model="syncOptions.uploadWord" />
                  <span class="checkbox-custom"></span>
                  上传 Word
                </label>
                <label class="checkbox-label" style="margin-bottom: 12px;">
                  <input type="checkbox" v-model="syncOptions.uploadPdf" />
                  <span class="checkbox-custom"></span>
                  上传 PDF
                </label>
                <label class="form-label" style="font-size: 12px;">保存到飞书文件夹</label>
                <div class="folder-browser" @click="openFolderBrowser">
                  <div class="folder-browser-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11Z"/></svg>
                  </div>
                  <span class="folder-browser-path">{{ folderPath || '根目录（默认）' }}</span>
                  <span class="folder-browser-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </span>
                </div>

                <!-- 文件夹浏览器弹窗 -->
                <div class="modal-overlay" v-if="showFolderBrowser" @click.self="showFolderBrowser = false" @keydown.escape="showFolderBrowser = false" tabindex="-1">
                  <div class="modal" style="max-width: 480px;">
                    <div class="modal-header">
                      <h3>选择飞书文件夹</h3>
                      <button class="modal-close" @click="showFolderBrowser = false">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div class="modal-body">
                      <div class="folder-nav">
                        <button class="btn btn-sm btn-ghost" @click="folderBrowseUp" :disabled="!folderParentToken" title="返回上级">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button class="btn btn-sm btn-ghost" @click="folderBrowseRoot" title="根目录">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                        </button>
                        <span class="folder-nav-path">{{ folderPath || '根目录' }}</span>
                        <button class="btn btn-sm btn-ghost" @click="loadFolderBrowser()" :disabled="loadingFolders" title="刷新" style="margin-left: auto;">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                        </button>
                      </div>

                      <div v-if="loadingFolders" class="folder-list-loading">加载中...</div>
                      <div v-else-if="browserFolders.length === 0" class="folder-list-empty">此文件夹为空</div>
                      <div v-else class="folder-list">
                        <div v-for="f in browserFolders" :key="f.token" class="folder-item" @click="folderBrowseEnter(f)">
                          <div class="folder-item-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11Z"/></svg>
                          </div>
                          <div class="folder-item-info">
                            <div class="folder-item-name">{{ f.name }}</div>
                          </div>
                          <button class="btn btn-sm btn-ghost" @click.stop="selectFolderInBrowser(f)" title="选择此文件夹">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                        </div>
                      </div>

                      <button class="btn btn-secondary" style="width: 100%; margin-top: 12px;" @click="selectFolderAtCurrent" :disabled="!folderParentToken">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        选择当前文件夹
                      </button>

                      <div class="folder-divider"></div>

                      <div class="folder-create-row">
                        <input class="form-input" v-model="newFolderName" placeholder="新建文件夹名称" style="flex: 1;" />
                        <button class="btn btn-sm btn-secondary" @click="handleCreateFolderInBrowser" :disabled="creatingFolder || !newFolderName.trim()">
                          {{ creatingFolder ? '创建中...' : '新建' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button class="btn btn-sm btn-ghost" @click="showFeishuAdvanced = !showFeishuAdvanced" style="width: 100%; justify-content: center; gap: 6px; margin-bottom: 12px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: showFeishuAdvanced ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"><polyline points="9 18 15 12 9 6"/></svg>
                {{ showFeishuAdvanced ? '收起负责人关联' : '任务负责人关联' }}
              </button>
              <template v-if="showFeishuAdvanced">
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="syncMyself" />
                    <span class="checkbox-custom"></span>
                    同步任务负责人设为自己
                  </label>
                  <div v-if="syncMyself" class="notify-self" @click.stop style="margin-top: 8px;">
                    <div class="notify-self-avatar">{{ (myFeishuName || '我').charAt(0) }}</div>
                    <div class="notify-self-info"><div class="notify-self-name">{{ myFeishuName || '我' }}</div><div class="notify-self-hint">发送给自己</div></div>
                    <div class="notify-self-check"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                  </div>
                  <div class="mt-1">
                    <label class="form-label" style="font-size: 12px;">找不到负责人时</label>
                    <select class="form-select" v-model="syncOptions.unmatchedAssigneeStrategy" style="width: 100%;">
                      <option value="KEEP_UNASSIGNED">跳过，不设负责人</option>
                      <option value="FAIL">报错，不同步</option>
                    </select>
                  </div>
                </div>
              </template>
              <button class="btn btn-primary" style="width: 100%;" @click="handleSync" :disabled="syncing">
                {{ syncing ? '同步中...' : '同步到飞书' }}
              </button>
              <div v-if="syncResult" style="margin-top: 8px; font-size: 13px;">
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
import { ref, reactive, computed, onMounted } from 'vue'
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
    const page = await api.get('/meetings', {
      status: 'FINISHED',
      pageSize: 50,
      pageNo: 1
    }, { timeout: 10000 })
    meetings.value = (page.records || []).filter(m => m.summaryStatus === 'DONE')
  } catch (e) {
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
  uploadWord: false,
  uploadPdf: false,
  syncTasks: true,
  folderToken: '',
  unmatchedAssigneeStrategy: 'KEEP_UNASSIGNED'
})

// ========== 飞书任务负责人关联 ==========
const syncMyself = ref(false)
const myFeishuOpenId = computed(() => {
  try { const s = localStorage.getItem('feishu_oauth_user'); if (s) return JSON.parse(s).openId || '' } catch (e) {}
  return ''
})
const myFeishuName = computed(() => {
  try { const s = localStorage.getItem('feishu_oauth_user'); if (s) return JSON.parse(s).name || '' } catch (e) {}
  return ''
})

// ========== 飞书文件夹 ==========
const folders = ref([])
const loadingFolders = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)

// 文件夹浏览器状态
const showFolderBrowser = ref(false)
const folderPath = ref('')
const folderParentToken = ref('')
const browserFolders = ref([])
const folderHistory = ref([])  // 浏览历史栈 { token, name }

function openFolderBrowser() {
  showFolderBrowser.value = true
  folderPath.value = ''
  folderParentToken.value = ''
  folderHistory.value = []
  loadFolderBrowser()
}

async function loadFolderBrowser(parentToken) {
  if (!oauthUser.value?.userKey) return
  loadingFolders.value = true
  try {
    const result = await api.get('/feishu/drive/folders', {
      authMode: 'USER',
      oauthUserKey: oauthUser.value.userKey,
      parentFolderToken: parentToken || undefined
    })
    browserFolders.value = result || []
  } catch (e) {
  } finally {
    loadingFolders.value = false
  }
}

function folderBrowseEnter(f) {
  folderHistory.value.push({ token: folderParentToken.value, name: folderPath.value || '根目录' })
  folderParentToken.value = f.token
  folderPath.value = f.name
  loadFolderBrowser(f.token)
}

function folderBrowseUp() {
  const prev = folderHistory.value.pop()
  if (prev) {
    folderParentToken.value = prev.token
    folderPath.value = prev.name
    loadFolderBrowser(prev.token)
  }
}

function folderBrowseRoot() {
  folderHistory.value = []
  folderParentToken.value = ''
  folderPath.value = ''
  loadFolderBrowser()
}

function selectFolderInBrowser(f) {
  syncOptions.folderToken = f.token
  folderParentToken.value = f.token
  folderPath.value = f.name
  showFolderBrowser.value = false
  loadFolders(f.token)
}

function selectFolderAtCurrent() {
  showFolderBrowser.value = false
  syncOptions.folderToken = folderParentToken.value || ''
  loadFolders(folderParentToken.value || undefined)
}

async function handleCreateFolderInBrowser() {
  if (!oauthUser.value?.userKey || !newFolderName.value.trim()) return
  creatingFolder.value = true
  try {
    const result = await api.post('/feishu/drive/folders', {
      authMode: 'USER',
      oauthUserKey: oauthUser.value.userKey,
      name: newFolderName.value.trim(),
      parentFolderToken: folderParentToken.value || undefined
    })
    newFolderName.value = ''
    await loadFolderBrowser(folderParentToken.value || undefined)
    if (result?.token && !folderParentToken.value) {
      syncOptions.folderToken = result.token
      folderPath.value = result.name || newFolderName.value.trim()
    }
  } catch (err) {
    toast.errorFrom(err, '创建文件夹失败')
  } finally {
    creatingFolder.value = false
  }
}

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

if (!oauthUser.value && (sessionStorage.getItem('feishu_oauth_code') || new URLSearchParams(window.location.search).get('code'))) {
  oauthPending.value = true
}

async function handleOAuth() {
  oauthLoading.value = true
  oauthError.value = ''
  localStorage.removeItem('feishu_oauth_disconnected')
  try {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('feishu_oauth_state', state)
    sessionStorage.setItem('feishu_oauth_return_path', window.location.pathname)
    const redirectUri = window.location.origin
    const auth = await api.get('/feishu/oauth/authorize-url', { redirectUri, state })
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
  localStorage.setItem('feishu_oauth_disconnected', 'true')
  syncResult.value = null
  syncError.value = ''
  folders.value = []
}

async function loadFolders(parentToken) {
  if (!oauthUser.value?.userKey) return
  loadingFolders.value = true
  try {
    const result = await api.get('/feishu/drive/folders', {
      authMode: 'USER',
      oauthUserKey: oauthUser.value.userKey,
      parentFolderToken: parentToken || undefined
    })
    folders.value = result || []
  } catch (e) {
  } finally {
    loadingFolders.value = false
  }
}

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
    toast.warning('请先在「选择会议纪要」中选择一份已生成的纪要')
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
    await refreshOAuthToken()

    // 自动导出需要的文档
    if (syncOptions.uploadWord) {
      try { await api.post(`/minutes/${selectedMinutes.value.id}/exports`, { format: 'WORD', includeTasks: syncOptions.syncTasks, includeSubtitles: false }) } catch (e) {}
    }
    if (syncOptions.uploadPdf) {
      try { await api.post(`/minutes/${selectedMinutes.value.id}/exports`, { format: 'PDF', includeTasks: syncOptions.syncTasks, includeSubtitles: false }) } catch (e) {}
    }

    // folderToken: 空字符串 → undefined（不走根目录，走后端默认逻辑）
    const result = await api.post(`/minutes/${selectedMinutes.value.id}/sync/feishu`, {
      authMode: 'USER',
      oauthUserKey: oauthUser.value.userKey,
      uploadWord: syncOptions.uploadWord,
      uploadPdf: syncOptions.uploadPdf,
      syncTasks: syncOptions.syncTasks,
      folderToken: syncOptions.folderToken || null,
      unmatchedAssigneeStrategy: syncOptions.unmatchedAssigneeStrategy,
      assigneeMappings: syncMyself.value && myFeishuOpenId.value
        ? [{ localAssigneeName: '', feishuOpenId: myFeishuOpenId.value }]
        : undefined
    })

    syncResult.value = result

    // 判断是否真的失败了
    // syncTasks=true 但无任务时后端返回 PARTIAL_SUCCESS，这不影响文件上传
    const hasFailed = result.syncStatus === 'FAILED'
    const isPartialWithError = result.syncStatus === 'PARTIAL_SUCCESS' && result.errorMessage && !result.wordFileUrl && !result.pdfFileUrl

    if (result.syncStatus === 'SUCCESS' || (result.syncStatus === 'PARTIAL_SUCCESS' && !result.errorMessage)) {
      toast.success('同步到飞书成功')
    } else if (isPartialWithError || hasFailed) {
      toast.error(result.errorMessage || '同步失败')
    } else {
      // PARTIAL_SUCCESS 但文件上传成功 → 也算成功
      toast.success('同步到飞书成功')
    }
  } catch (err) {
    syncError.value = `同步失败: ${err.message}`
    toast.error('同步到飞书失败')
  } finally {
    syncing.value = false  // 确保按钮无论如何都恢复
  }
}

function formatTime(iso) {
  if (!iso) return ''
  return iso.replace('T', ' ').substring(0, 16)
}

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
  loadMeetings()
  if (store.meetingMinutes?.id) {
    selectedMinutes.value = store.meetingMinutes
    selectedMeetingId.value = store.meetingMinutes.meetingId
  }
  // 飞书 OAuth 状态恢复
  if (oauthUser.value) {
    try {
      await refreshOAuthToken()
      loadFolders()
    } catch (e) {
      oauthUser.value = null
      localStorage.removeItem('feishu_oauth_user')
    }
    return
  }
  await waitForOAuthComplete()
  if (oauthUser.value) {
    loadFolders()
    return
  }
  if (localStorage.getItem('feishu_oauth_disconnected')) {
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

.minutes-preview {
  margin-top: 12px; padding: 14px; background: var(--bg); border-radius: var(--radius-sm);
  border: 1px solid var(--border-light); border-top: 2px solid var(--primary);
}
.mp-label { font-size: var(--text-caption); font-weight: 600; color: var(--text-muted); margin-bottom: 4px; }
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

/* 文件夹浏览器 */
.folder-browser {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  border: 1.5px solid var(--border); border-radius: var(--radius-md);
  cursor: pointer; transition: var(--transition);
}
.folder-browser:hover { border-color: var(--primary-light); background: var(--primary-bg); }
.folder-browser-icon { width: 20px; display: flex; align-items: center; color: var(--text-muted); flex-shrink: 0; }
.folder-browser-path { flex: 1; font-size: var(--text-small); color: var(--text-primary); }
.folder-browser-arrow { color: var(--text-muted); }

.folder-nav { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-light); }
.folder-nav-path { flex: 1; font-size: var(--text-small); color: var(--text-secondary); }
.folder-list-loading { padding: 24px; text-align: center; color: var(--text-muted); font-size: var(--text-small); }
.folder-list-empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: var(--text-small); }
.folder-list { display: flex; flex-direction: column; gap: 4px; max-height: 280px; overflow-y: auto; }
.folder-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition);
}
.folder-item:hover { background: var(--primary-bg); }
.folder-item-icon { flex-shrink: 0; display: flex; }
.folder-item-info { flex: 1; }
.folder-item-name { font-size: var(--text-small); font-weight: 500; color: var(--text-primary); }
.folder-divider { height: 1px; background: var(--border-light); margin: 12px 0; }
.folder-create-row { display: flex; gap: 8px; }

/* 分割标签 */
.section-divider {
  height: 1px;
  background: var(--border);
  margin: 20px 0;
}

.section-divider-label {
  font-size: var(--text-caption);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 16px;
  padding-top: 4px;
}

@media (max-width: 900px) { .export-grid { grid-template-columns: 1fr; } }

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
