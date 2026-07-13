// =============================================
// useSubtitleSSE — SSE 字幕流接收 composable
// 对接后端 GET /api/v1/meetings/{id}/subtitles/stream
// 支持双流协议：ONLINE（在线增量） + OFFLINE（离线最终）
// 已展示 OFFLINE 后不会被迟到的 ONLINE 降级覆盖
// =============================================
import { ref, computed } from 'vue'

export function useSubtitleSSE() {
  let eventSource = null
  let reconnectTimer = null
  let currentMeetingId = null
  let fetchHistoryCallback = null

  const isConnected = ref(false)
  const interimText = ref('')
  const finalSegments = ref([])    // OFFLINE 已确认字幕
  const onlineSegments = ref([])   // ONLINE 在线增量字幕（未确认）
  const meetingStatus = ref('')
  const error = ref('')
  const sseError = ref('')         // 用户可见的连接错误信息
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 3

  // 已收到 OFFLINE 的 segmentId 集合，用于防降级
  const offlineConfirmed = new Set()

  // 当前最大 sequence，用于断线重连补拉
  let maxSequence = 0

  // 合并后的展示列表：finalSegments + 未被 OFFLINE 覆盖的 onlineSegments
  const displaySegments = computed(() => {
    const all = [...finalSegments.value]
    onlineSegments.value.forEach(os => {
      if (!offlineConfirmed.has(os.segmentId)) {
        // 如果 finalSegments 已包含相同 segmentId，不重复添加
        const exists = all.some(s => s.segmentId === os.segmentId)
        if (!exists) all.push(os)
      }
    })
    return all
  })

  const speakers = computed(() => {
    const map = new Map()
    displaySegments.value.forEach(seg => {
      if (!seg.speaker) return
      if (!map.has(seg.speaker)) {
        map.set(seg.speaker, { name: seg.speaker, count: 0 })
      }
      map.get(seg.speaker).count++
    })
    return Array.from(map.values())
  })

  function setHistoryCallback(cb) {
    fetchHistoryCallback = cb
  }

  async function backfillMissing() {
    if (!currentMeetingId || !fetchHistoryCallback) return
    try {
      const segments = await fetchHistoryCallback(currentMeetingId, maxSequence, 200)
      if (segments && segments.length > 0) {
        segments.forEach(seg => {
          // 历史查询只返回 OFFLINE，直接写入 finalSegments
          const idx = finalSegments.value.findIndex(s => s.segmentId === seg.segmentId)
          const segment = {
            ...seg,
            recognitionMode: seg.recognitionMode || 'OFFLINE',
            isFinal: true
          }
          if (idx >= 0) {
            finalSegments.value[idx] = segment
          } else {
            finalSegments.value.push(segment)
          }
          if (seg.sequence > maxSequence) maxSequence = seg.sequence
        })
      }
    } catch (e) {
      sseError.value = '字幕历史拉取失败，部分字幕可能缺失'
    }
  }

  function connect(meetingId, historyCb) {
    if (eventSource) disconnect()

    currentMeetingId = meetingId
    if (historyCb) fetchHistoryCallback = historyCb

    const url = `/api/v1/meetings/${meetingId}/subtitles/stream`
    interimText.value = ''
    meetingStatus.value = ''
    error.value = ''

    try {
      eventSource = new EventSource(url)

      eventSource.addEventListener('subtitle', (event) => {
        try {
          const data = JSON.parse(event.data)
          if (!data.subtitle) return

          const mode = data.recognitionMode || 'ONLINE'
          const isOffline = mode === 'OFFLINE' || data.isFinal === true

          if (isOffline) {
            // === OFFLINE：最终确认，落库替换 ===
            offlineConfirmed.add(data.segmentId)

            // 从 onlineSegments 中移除
            const oi = onlineSegments.value.findIndex(s => s.segmentId === data.segmentId)
            if (oi >= 0) onlineSegments.value.splice(oi, 1)

            // 写入或更新 finalSegments
            const fi = finalSegments.value.findIndex(s => s.segmentId === data.segmentId)
            const segment = {
              segmentId: data.segmentId,
              sequence: data.sequence || 0,
              subtitle: data.subtitle,
              speaker: data.speaker || '未知',
              recognitionMode: 'OFFLINE',
              isFinal: true,
              startMs: data.startMs || 0,
              endMs: data.endMs || 0,
              occurredAt: data.occurredAt || ''
            }
            if (fi >= 0) {
              finalSegments.value[fi] = segment
            } else {
              finalSegments.value.push(segment)
            }
            if (segment.sequence > maxSequence) maxSequence = segment.sequence
            interimText.value = ''

          } else {
            // === ONLINE：实时增量 ===
            // 防降级：已确认 OFFLINE 的 segmentId，忽略迟到 ONLINE
            if (offlineConfirmed.has(data.segmentId)) return

            const oi = onlineSegments.value.findIndex(s => s.segmentId === data.segmentId)
            const segment = {
              segmentId: data.segmentId,
              sequence: data.sequence || 0,
              subtitle: data.subtitle,
              speaker: data.speaker || '未知',
              recognitionMode: 'ONLINE',
              isFinal: false,
              startMs: data.startMs || 0,
              endMs: data.endMs || 0,
              occurredAt: data.occurredAt || ''
            }
            if (oi >= 0) {
              onlineSegments.value[oi] = segment
            } else {
              onlineSegments.value.push(segment)
            }
            // 更新 interimText 为当前正在识别的文本
            interimText.value = data.subtitle
          }
        } catch (e) {
          console.warn('SSE subtitle 解析失败:', e)
        }
      })

      eventSource.addEventListener('recording_status', (event) => {
        try {
          const data = JSON.parse(event.data)
          meetingStatus.value = data.status || ''
        } catch (e) {
          console.warn('SSE recording_status 解析失败:', e)
        }
      })

      eventSource.addEventListener('heartbeat', () => {
        // 连接确认
      })

      eventSource.onerror = () => {
        isConnected.value = false
        reconnectAttempts++
        if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
          sseError.value = '字幕服务连接中断，正在尝试重连...'
        } else {
          sseError.value = '字幕服务连接失败，请检查网络或刷新页面重试'
        }
      }

      eventSource.onopen = () => {
        isConnected.value = true
        error.value = ''
        sseError.value = ''
        reconnectAttempts = 0
        // 重连后补拉遗漏字幕
        if (maxSequence > 0) {
          backfillMissing()
        }
      }

    } catch (err) {
      sseError.value = '字幕服务连接失败，请确认会议已开始录制'
    }
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    isConnected.value = false
    reconnectAttempts = 0
    currentMeetingId = null
  }

  function resetSegments() {
    finalSegments.value = []
    onlineSegments.value = []
    interimText.value = ''
    maxSequence = 0
    offlineConfirmed.clear()
  }

  return {
    isConnected,
    interimText,
    finalSegments,
    onlineSegments,
    displaySegments,
    speakers,
    meetingStatus,
    error,
    sseError,
    connect,
    disconnect,
    resetSegments,
    setHistoryCallback
  }
}
