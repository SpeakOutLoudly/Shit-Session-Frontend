<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="svgPath"
  />
</template>

<script setup>
import { computed } from 'vue'
import { svg } from '../composables/useIcons'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
  color: { type: String, default: 'currentColor' },
  strokeWidth: { type: Number, default: 2 }
})

const svgPath = computed(() => {
  const s = svg(props.name, {
    size: props.size,
    color: props.color,
    strokeWidth: props.strokeWidth
  })
  // 提取 path 标签内容（去掉 svg 外层 wrapper）
  const match = s.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
  return match ? match[1] : s
})
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
