import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMeetingStore = defineStore('meeting', () => {
  // ==================== 用户信息 ====================
  const username = ref(localStorage.getItem('username') || '')

  function setUsername(name) {
    username.value = name
    localStorage.setItem('username', name)
  }

  // ==================== 当前会议 ====================
  const currentMeeting = ref(null)       // MeetingVO
  const meetingStatus = computed(() => currentMeeting.value?.status || null)

  // ==================== 纪要 ====================
  const meetingMinutes = ref(null)        // MeetingMinutesVO

  // ==================== 任务列表 ====================
  const tasks = ref([])                   // MeetingTaskVO[]

  // ==================== 会议列表（工作台） ====================
  const meetingList = ref([])             // MeetingVO[]
  const meetingListTotal = ref(0)

  // ==================== 统计（从列表计算） ====================
  const stats = computed(() => {
    const total = meetingListTotal.value
    const recording = meetingList.value.filter(m => m.status === 'RECORDING').length
    const finished = meetingList.value.filter(m => m.status === 'FINISHED').length
    const notStarted = meetingList.value.filter(m => m.status === 'NOT_STARTED').length
    const withSummary = meetingList.value.filter(m => m.summaryStatus === 'DONE').length
    return { total, recording, finished, notStarted, withSummary }
  })

  return {
    // 用户
    username,
    setUsername,

    // 当前会议
    currentMeeting,
    meetingStatus,

    // 纪要
    meetingMinutes,

    // 任务
    tasks,

    // 会议列表
    meetingList,
    meetingListTotal,
    stats
  }
})
