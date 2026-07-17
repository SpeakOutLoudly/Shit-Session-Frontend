# 🎙️ 智能会议同传与纪要系统

基于 Vue 3 的会议管理前端，会议音频由边缘设备采集识别。

---

## 快速开始

```bash
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


## 构建生产版本

```bash
npm run build
```

输出到 `dist/` 目录，可部署到任意静态服务器。生产环境需配置 `/api` 反向代理到后端地址。
