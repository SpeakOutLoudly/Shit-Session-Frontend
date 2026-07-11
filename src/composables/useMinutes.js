// =============================================
// useMinutes — 会议纪要 composable
// 对接后端 /api/v1/meetings/{id}/minutes 等接口
// =============================================
import { useApi } from './useApi'
import { useMeetingStore } from '../stores/meetingStore'

export function useMinutes() {
  const api = useApi()
  const store = useMeetingStore()

  async function generateMinutes(meetingId, regenerate = false) {
    const minutes = await api.post(`/meetings/${meetingId}/minutes/generate`, {
      regenerate
    })
    store.meetingMinutes = minutes
    return minutes
  }

  async function getMinutes(meetingId) {
    const minutes = await api.get(`/meetings/${meetingId}/minutes`)
    store.meetingMinutes = minutes
    return minutes
  }

  async function getMinutesById(id) {
    const minutes = await api.get(`/minutes/${id}`)
    store.meetingMinutes = minutes
    return minutes
  }

  async function updateMinutes(id, data) {
    const minutes = await api.put(`/minutes/${id}`, data)
    store.meetingMinutes = minutes
    return minutes
  }

  async function generateTasks(minutesId) {
    const tasks = await api.post(`/minutes/${minutesId}/tasks/generate`)
    store.tasks = tasks || []
    return tasks
  }

  async function deleteMinutes(id) {
    await api.del(`/minutes/${id}`)
    store.meetingMinutes = null
  }

  return {
    generateMinutes,
    getMinutes,
    getMinutesById,
    updateMinutes,
    generateTasks,
    deleteMinutes
  }
}
