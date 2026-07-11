# 🎙️ 智能会议同传与纪要系统

基于 Vue 3 的会议管理前端，对接后端 REST API + SSE 实时字幕流。会议音频由边缘设备采集识别，前端只负责展示和交互。

---

## 快速开始

```bash
cd meeting-system
npm install
npm run dev
```

启动后访问 **http://localhost:3000**

> 默认通过 Vite 代理 `/api` 到 `http://127.0.0.1:8080`（后端地址），见 `vite.config.js`。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| **Vue 3** (Composition API + `<script setup>`) | 前端框架 |
| **Vue Router 4** | 路由管理 |
| **Pinia** | 状态管理（仅做缓存，数据从 API 获取） |
| **Vite 5** | 构建工具 + 开发代理 |
| **SSE (EventSource)** | 接收后端实时字幕流 |
| **REST API** | 会议/纪要/任务/飞书 CRUD |

---

## 项目结构

```
meeting-system/
├── index.html
├── package.json
├── vite.config.js                  # 代理 /api → 127.0.0.1:8080
└── src/
    ├── main.js
    ├── App.vue                     # 主布局（侧边栏 + 顶部栏 + 路由）
    ├── assets/styles.css           # 全局样式（CSS 变量）
    ├── router/index.js             # 路由（6 页面 + 登录 guard）
    ├── stores/meetingStore.js      # Pinia 缓存（当前会议、纪要、列表）
    ├── composables/
    │   ├── useApi.js               # API 基座（fetch + 超时 + 错误处理）
    │   ├── useMeeting.js           # 会议 CRUD
    │   ├── useSubtitleSSE.js       # SSE 字幕流接收
    │   ├── useMinutes.js           # 纪要生成/查询/修订
    │   └── useTask.js              # 任务 CRUD + 枚举映射
    └── views/
        ├── Login.vue               # 登录页（磨砂玻璃，仅前端用户名）
        ├── Dashboard.vue           # 工作台（会议列表 + 统计）
        ├── TranscriptionView.vue   # 会议室（创建→录制→SSE→结束）
        ├── SummaryView.vue         # 会议摘要（AI 生成 + 修订）
        ├── TasksView.vue           # 待办任务（增删改 + 状态流转）
        └── ExportView.vue          # 导出与飞书同步
```

---

## 系统架构

```
边缘设备（物理会议室）
   │  录音 + ASR + 说话人分离
   │
   ▼  字幕 WebSocket
后端服务器
   │  会议状态管理、字幕落库、SSE 推送、DeepSeek 纪要生成
   │
   ├── REST API ──────→ 前端（会议/纪要/任务 CRUD）
   │
   ├── SSE ───────────→ 前端（实时字幕流）
   │                     GET /api/v1/meetings/{id}/subtitles/stream
   │
   └── REST ──────────→ 飞书（OAuth、在线文档、任务同步、机器人通知）
```

### 数据流对比

```
之前（纯前端）:
  浏览器 getUserMedia → SpeechRecognition / WebSocket → 显示文字

之后（对接后端）:
  边缘设备录音 → ASR 识别 → WebSocket → 后端 → SSE → 前端显示
```

### 三端职责

| 端 | 职责 | 协议 |
|------|--------|------|
| **前端（你）** | 创建/开始/结束会议、展示 SSE 字幕、查看纪要任务、导出同步 | REST + SSE |
| **后端** | 管理会议状态、调用本地服务、接收/转发/落库字幕、DeepSeek 生成纪要 | REST + WebSocket + SSE |
| **本地服务** | 控制边缘设备录制、ASR 识别、说话人标注、回传字幕 | REST + WebSocket |

---

## API Composable 一览

### `useApi.js` — 基础层

封装 `fetch` + 3 秒超时 + 统一错误处理。所有 API 调用响应体为 `{ code, message, data }`。

```js
const { get, post, put, patch, del } = useApi()
```

### `useMeeting.js` — 会议 CRUD

| 方法 | 后端接口 |
|------|---------|
| `createMeeting(data)` | `POST /api/v1/meetings` |
| `getMeeting(id)` | `GET /api/v1/meetings/{id}` |
| `listMeetings(params)` | `GET /api/v1/meetings` |
| `startMeeting(id)` | `POST /api/v1/meetings/{id}/start` |
| `finishMeeting(id)` | `POST /api/v1/meetings/{id}/finish` |
| `cancelMeeting(id)` | `POST /api/v1/meetings/{id}/cancel` |

### `useSubtitleSSE.js` — 实时字幕接收

通过 `EventSource` 连接 `/api/v1/meetings/{id}/subtitles/stream`，处理三种 SSE 事件：

| 事件 | 处理 |
|------|------|
| `subtitle` | `isFinal=true` 按 `segmentId` 去重存入列表；`false` 更新中间结果 |
| `recording_status` | 更新会议录制状态（RECORDING / FINISHED） |
| `heartbeat` | 连接确认，不做展示 |

### `useMinutes.js` — 会议纪要

| 方法 | 后端接口 |
|------|---------|
| `generateMinutes(meetingId)` | `POST /meetings/{id}/minutes/generate` |
| `getMinutes(meetingId)` | `GET /meetings/{id}/minutes` |
| `updateMinutes(id, data)` | `PUT /minutes/{id}` |
| `generateTasks(minutesId)` | `POST /minutes/{id}/tasks/generate` |

### `useTask.js` — 任务管理

| 方法 | 后端接口 |
|------|---------|
| `listTasks(params)` | `GET /api/v1/tasks` |
| `createTask(data)` | `POST /api/v1/tasks` |
| `updateTask(id, data)` | `PUT /api/v1/tasks/{id}` |
| `updateTaskStatus(id, status)` | `PATCH /api/v1/tasks/{id}/status` |
| `deleteTask(id)` | `DELETE /api/v1/tasks/{id}` |

---

## 用户流程

```
进入系统 → 无会议
              ↓
        填写会议标题 → 创建会议
              ↓
        开始会议（POST /meetings/{id}/start）
              ↓
        边缘设备开始录制 → SSE 连接 → 实时显示字幕
              ↓
        结束会议（POST /meetings/{id}/finish）
              ↓
        ┌─────┴─────┐
        ↓            ↓
    查看纪要     查看任务
   (AI 生成)    (从行动项生成)
        ↓            ↓
    导出 Word/PDF   同步飞书
```

---

## 页面功能对照

| 页面 | 路由 | 数据来源 | 功能 |
|------|------|---------|------|
| **登录** | `/login` | 前端 localStorage | 输入用户名（仅前端展示） |
| **工作台** | `/dashboard` | `GET /meetings` | 会议列表 + 统计概览 |
| **会议室** | `/transcription` | SSE + `POST /meetings` | 创建→开始→SSE 字幕→结束 |
| **会议摘要** | `/summary` | `GET/PUT /minutes` | AI 纪要、修订、生成任务 |
| **待办任务** | `/tasks` | `GET/PATCH /tasks` | 任务列表、状态更新、CRUD |
| **导出同步** | `/export` | `POST /exports` + 飞书 API | 导出文件、飞书 OAuth/同步/通知 |

---

## 之前版本的关键设计（历史参考）

### 此前端架构（纯前后端分离版）

以下章节记录了该项目的早期设计，此时前端自己做 ASR 和 WebRTC 音频分发，尚未对接后端。

#### WebRTC 实时音频分发

早期版本基于 `RTCPeerConnection` 实现 P2P 音频流分发：

```
你的麦克风
     │
     ├→ getUserMedia → MediaRecorder
     │                    └→ WebSocket → 后端 ASR → 文字
     │
     └→ RTCPeerConnection → 信令服务 → 其他参与者 → 扬声器播放
```

STUN 服务器使用 Google 公共服务：`stun:stun.l.google.com:19302`。

#### 双 ASR 模式

TranscriptionView 支持下拉切换 ASR 模式：

| 能力 | `useSpeechRecognition`（本地） | `useBackendAsr`（后端） |
|------|------|----------------|
| 麦克风采集 | `getUserMedia` | `getUserMedia` |
| 波形可视化 | `AnalyserNode` | `AnalyserNode` |
| 语音转文字 | `SpeechRecognition`（Chrome 内置） | 后端 ASR（WebSocket） |
| 音频发送格式 | 无（浏览器内部处理） | WebM/Opus 切片（200ms） |
| 浏览器依赖 | 仅 Chrome/Edge | 所有现代浏览器 |

#### WebSocket 音频协议

前端通过 MediaRecorder 产出 WebM/Opus，通过 WebSocket 二进制帧发送：

```
→ { type: "start", lang: "zh-CN", format: "audio/webm;codecs=opus" }
→ [Binary Frame: WebM/Opus chunk]  每 200ms
→ { type: "stop" }
← { type: "interim", text: "..." }
← { type: "final", text: "...", speaker: "...", confidence: 0.95 }
```

#### 参会人管理（等待后端实现）

早期使用 `BroadcastChannel` 做跨标签页用户状态同步（仅同端口多标签页可用），未对接后端用户系统。迁移路径：

```
BroadcastChannel       →    WebSocket 信令服务器
localStorage 用户名     →    JWT Token 认证
单会议室               →    多会议室（房间ID）
同一用户多标签页       →    不同用户跨设备
```

---

## 开发历程

### v1 — 初始构建

- 搭建 Vue 3 + Vite + Pinia + Vue Router 项目骨架
- 实现 5 个页面：Dashboard、Transcription、Summary、Tasks、Export
- 内置模拟数据（10 条会议转写、6 个待办任务、完整摘要）
- 模拟录音功能（`simulateLiveSpeech` 每 4 秒 push 一条假数据）

### v2 — WebRTC + 语音转文字

- 新增 `composables/useSpeechRecognition.js`
- **`getUserMedia`**：采集真实麦克风音频
- **`AnalyserNode`**：实时音频能量计算 → 驱动波形动画
- **`SpeechRecognition`**：Chrome 内置语音转文字（`interimResults` 流式输出）
- 移除所有模拟录音代码

#### v2 Bug 修复

| Bug | 根因 | 修复 |
|-----|------|------|
| 页面加载即录音、停止无反应 | `speech.isRecording` 在 script 中是 Ref 对象（始终 truthy） | 所有 composable 返回的 ref 在 script 中加 `.value` 访问 |
| 按钮始终红色"停止录音" | 模板中 `speech.isRecording` 嵌套在普通对象不解包 | 解构为顶层 ref |
| 录音时间显示 `NaN:NaN` | `formatDuration(Ref对象)` → `Ref/60 = NaN` | 传入 `recordingDuration.value`（数字） |
| 转写滚动到底而非顶 | `scrollTop = scrollHeight` | 改为 `scrollTop = 0`（新条目在列表顶部） |
| 错误提示"麦克风识别异常" | `speech.error` 始终 truthy（Ref 对象） | 解构为顶层 `error` |
| 顶部栏状态不同步 | App.vue 直接读 `speech.*` 未解包 | 解构 `isRecording`、`recordingDuration` 为局部变量 |

### v3 — 后端 ASR 接入 + WebRTC 音频分发

- 新增 `composables/useBackendAsr.js`
- **`MediaRecorder`**：WebM/Opus 格式，200ms 切片
- **`WebSocket`**：发送二进制音频帧，接收 JSON 结果
- 与 `useSpeechRecognition` 保持相同接口，TranscriptionView 双模式可切换
- 新增 `composables/useWebRTC.js`：基于 `RTCPeerConnection` 的 P2P 音频分发
- 支持本地回环测试（同一页面内验证 WebRTC 连通性）
- TranscriptionView 增加音频共享控制栏
- 侧边栏增加「远程参与者」列表，显示连接状态 + 自动播放远程音频
- WebRTC 与 ASR 可同时启用或单独使用

### v4 — 登录 + 会议室重构

- **新增登录页** `views/Login.vue`：输入用户名进入系统，暂时无需密码
- **路由守卫**：未登录自动跳转登录页
- **统一会议室**：「转写」页面改为会议室概念，所有用户默认在同一房间
- **一键开麦**：「打开麦克风」按钮同时启动音频共享（WebRTC）和语音识别（ASR）
- **参会人侧边栏**：合并原「说话人」和「远程参与者」为统一「参会人」列表，显示开/关麦状态
- **在线人数**：控制栏居中显示实时在线人数
- **跨标签同步**：新增 `composables/usePresence.js`，基于 BroadcastChannel 实现同源跨标签页用户在线状态同步
- **退出登录**：顶部栏增加退出按钮，清除用户信息返回登录页

### v5 — 真实文件导出

- 新增 `composables/useFileExport.js` 实现纯前端文件生成与下载
- **Word (.doc)**：生成完整 HTML 文档（含样式、表格、页脚），保存为 `.doc` 格式
- **PDF**：生成打印优化版 HTML，打开新窗口触发 `window.print()`，用户选择"另存为 PDF"
- **Markdown (.md)**：生成结构化 Markdown 文档，Blob 下载
- **纯文本 (.txt)**：去除标记的纯文本版本

### v6 — 后端 API 对接（当前版本）

**删除的前端模块（职责移交后端）：**

| 删除文件 | 原因 |
|---------|------|
| `useSpeechRecognition.js` | ASR 由边缘设备负责 |
| `useBackendAsr.js` | 音频不进入前端协议（边缘设备直连后端） |
| `useWebRTC.js` | P2P 分发由边缘设备处理 |
| `useFileExport.js` | 后端生成 .docx/.pdf（Apache POI / iText） |
| `usePresence.js` | 用户管理暂不实现 |

**新增 composable：**

| 文件 | 职责 |
|------|------|
| `useApi.js` | 请求封装、3 秒超时、统一错误处理（检查 `{ code, message, data }`） |
| `useMeeting.js` | 会议 CRUD（创建/开始/结束/取消/列表/详情） |
| `useSubtitleSSE.js` | SSE EventSource 连接、字幕去重、说话人提取 |
| `useMinutes.js` | 纪要生成/查询/修订/任务生成 |
| `useTask.js` | 任务 CRUD + 状态枚举映射（TODO/DOING/DONE/CANCELLED） |

**页面改造：**

| 页面 | 改动 |
|------|------|
| `TranscriptionView.vue` | 从"打开麦克风+ASR+WebRTC"改为"创建会议→开始→SSE 收字幕→结束"三段式流程 |
| `SummaryView.vue` | mock 数据改为调 `GET/PUT /minutes` API，新增"从行动项生成任务" |
| `TasksView.vue` | mock 数据改为调 `GET/PATCH /tasks` API，枚举映射（TODO→待处理/DOING→进行中/DONE→已完成） |
| `ExportView.vue` | 前端生成文件改为调用后端导出（`POST /minutes/{id}/exports`），飞书 OAuth/同步/通知三件套 |
| `Dashboard.vue` | mock 数据改为调 `GET /meetings` 分页查询 |
| `App.vue` | 侧边栏 badge 改为从 `store.tasks` 实时计算待办数 |

**Store 重构：**

从集中存放全部 mock 数据（`utterances`、`meetingSummary`、`tasks`、`pastMeetings`）改为轻量缓存层——只缓存当前会议、纪要、任务列表，数据由 composable 从 API 获取后写入。

**API 超时处理：**

所有 API 请求加 3 秒 `AbortController` 超时，无后端时快速降级显示空状态，不卡页面。

**Vite 代理：**

```js
proxy: { '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true } }
```

#### v6 Bug 修复

| Bug | 根因 | 修复 |
|-----|------|------|
| 切换到工作台页面卡死，点其他标签变空白 | `Dashboard.vue` script setup 顶层直接调用 `meetingStatusClass(store.currentMeeting)`，此时 `store.currentMeeting` 为 `null`，函数内 `m.status` 抛 TypeError，组件崩溃连带 Vue Router 渲染异常 | 改为 `computed` 延迟求值，函数加 `if (!m) return ''` 空值兜底 |
| 侧边栏任务徽章显示 NaN | `App.vue` 引用 `store.stats.pendingTasks`，新 store 中不存在该字段 | 改为 `computed` 直接从 `store.tasks` 计算待办数 |
| 无后端时页面挂起不显示 | `fetch` 请求无超时，默认等待直到浏览器超时 | 所有 API 请求加 `AbortController` 3 秒超时 |
| Summary/Tasks/Dashboard onMounted 阻塞渲染 | 页面挂载时 `await` API 调用，请求未完成前页面空白 | 改为后台静默调用 `.catch(() => {})`，不阻塞渲染 |

---

## 构建生产版本

```bash
npm run build
```

输出到 `dist/` 目录，可部署到任意静态服务器。生产环境需配置 `/api` 反向代理到后端地址。
