// =============================================
// useMeeting — 会议 CRUD composable
// 对接后端 POST/GET/PUT /api/v1/meetings
// =============================================
import { useApi } from './useApi'
import { useMeetingStore } from '../stores/meetingStore'

export function useMeeting() {
  const api = useApi()
  const store = useMeetingStore()

  async function createMeeting(data) {
    const meeting = await api.post('/meetings', {
      title: data.title,
      deviceId: data.deviceId || null,
      location: data.location || null,
      organizerName: data.organizerName || store.username || null,
      participantCount: data.participantCount || null,
      startTime: data.startTime || null,
      remark: data.remark || null
    })
    store.currentMeeting = meeting
    return meeting
  }

  async function getMeeting(id) {
    const meeting = await api.get(`/meetings/${id}`)
    store.currentMeeting = meeting
    return meeting
  }

  async function listMeetings(params = {}) {
    const page = await api.get('/meetings', params)
    store.meetingList = page.records || []
    store.meetingListTotal = page.total || 0
    return page
  }

  async function updateMeeting(id, data) {
    const meeting = await api.put(`/meetings/${id}`, data)
    if (store.currentMeeting?.id === id) store.currentMeeting = meeting
    return meeting
  }

  async function startMeeting(id) {
    const meeting = await api.post(`/meetings/${id}/start`)
    store.currentMeeting = meeting
    return meeting
  }

  async function finishMeeting(id) {
    const meeting = await api.post(`/meetings/${id}/finish`)
    store.currentMeeting = meeting
    return meeting
  }

  async function cancelMeeting(id) {
    const meeting = await api.post(`/meetings/${id}/cancel`)
    store.currentMeeting = meeting
    return meeting
  }

  async function deleteMeeting(id) {
    await api.del(`/meetings/${id}`)
    if (store.currentMeeting?.id === id) store.currentMeeting = null
  }

  function clearCurrentMeeting() {
    store.currentMeeting = null
  }

  return {
    createMeeting,
    getMeeting,
    listMeetings,
    updateMeeting,
    startMeeting,
    finishMeeting,
    cancelMeeting,
    deleteMeeting,
    clearCurrentMeeting
  }
}
