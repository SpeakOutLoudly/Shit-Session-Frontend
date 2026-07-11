// =============================================
// useSubtitleSSE — SSE 字幕流接收 composable
// 对接后端 GET /api/v1/meetings/{id}/subtitles/stream
// =============================================
import { ref, computed } from 'vue'

export function useSubtitleSSE() {
  let eventSource = null
  let reconnectTimer = null

  const isConnected = ref(false)
  const interimText = ref('')
  const finalSegments = ref([])       // { segmentId, sequence, subtitle, speaker, startMs, endMs, occurredAt }
  const meetingStatus = ref('')       // 来自 recording_status 事件
  const error = ref('')

  // 说话人列表（从字幕中提取）
  const speakers = computed(() => {
    const map = new Map()
    finalSegments.value.forEach(seg => {
      if (!seg.speaker) return
      if (!map.has(seg.speaker)) {
        map.set(seg.speaker, { name: seg.speaker, count: 0 })
      }
      map.get(seg.speaker).count++
    })
    return Array.from(map.values())
  })

  function connect(meetingId) {
    if (eventSource) disconnect()

    const url = `/api/v1/meetings/${meetingId}/subtitles/stream`
    interimText.value = ''
    finalSegments.value = []
    meetingStatus.value = ''
    error.value = ''

    try {
      eventSource = new EventSource(url)

      eventSource.addEventListener('subtitle', (event) => {
        try {
          const data = JSON.parse(event.data)
          if (!data.subtitle) return

          if (data.isFinal) {
            // 最终结果 — 按 segmentId 去重
            const idx = finalSegments.value.findIndex(s => s.segmentId === data.segmentId)
            const segment = {
              segmentId: data.segmentId,
              sequence: data.sequence || 0,
              subtitle: data.subtitle,
              speaker: data.speaker || '未知',
              startMs: data.startMs || 0,
              endMs: data.endMs || 0,
              occurredAt: data.occurredAt || ''
            }
            if (idx >= 0) {
              finalSegments.value[idx] = segment
            } else {
              finalSegments.value.push(segment)
            }
            // 如果 interim 匹配同一说话人的最新内容，清除
            interimText.value = ''
          } else {
            // 临时结果
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
        // 连接确认，不处理
      })

      eventSource.onopen = () => {
        isConnected.value = true
        error.value = ''
      }

      eventSource.onerror = () => {
        isConnected.value = false
        // EventSource 会自动重连
      }

    } catch (err) {
      error.value = `SSE 连接失败: ${err.message}`
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
  }

  return {
    isConnected,
    interimText,
    finalSegments,
    speakers,
    meetingStatus,
    error,
    connect,
    disconnect
  }
}
