// =============================================
// useConfirm — 可组合的确认对话框
// 用法: const { confirmRender } = useConfirm()
// 模板: <ConfirmModal v-bind="confirmRender" @confirm="..." @cancel="..." />
// 或异步: const ok = await confirm({ title, message })
// =============================================
import { ref } from 'vue'

const confirmState = ref({
  show: false,
  title: '确认操作',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  danger: false,
  resolve: null
})

export function useConfirm() {
  function confirm(opts = {}) {
    return new Promise((resolve) => {
      confirmState.value = {
        show: true,
        title: opts.title || '确认操作',
        message: opts.message || '',
        confirmText: opts.confirmText || '确定',
        cancelText: opts.cancelText || '取消',
        danger: opts.danger || false,
        resolve
      }
    })
  }

  function resolveConfirm(result) {
    const r = confirmState.value.resolve
    confirmState.value.show = false
    if (r) r(result)
  }

  return { confirmState, confirm, resolveConfirm }
}
