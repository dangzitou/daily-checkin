<script setup lang="ts">
import { Bell, Check, Circle } from 'lucide-vue-next';
import type { Task } from '../types';

defineProps<{
  task: Task;
  busy?: boolean;
  showScope?: boolean;
}>();

defineEmits<{
  toggle: [task: Task];
}>();
</script>

<template>
  <button
    class="task-row"
    :class="{ checked: task.checked }"
    :disabled="busy"
    :aria-pressed="task.checked"
    :aria-label="`${task.checked ? '取消完成' : '完成'} ${task.title}`"
    @click="$emit('toggle', task)"
  >
    <span class="check-icon">
      <Check v-if="task.checked" :size="22" />
      <Circle v-else :size="22" />
    </span>
    <span class="task-copy">
      <span class="task-title-line">
        <strong>{{ task.title }}</strong>
        <span class="status-pill">{{ task.checked ? '已完成' : '待完成' }}</span>
      </span>
      <span v-if="task.description">{{ task.description }}</span>
      <span v-if="showScope" class="task-meta">
        {{ task.scope === 'resident' ? '常驻任务' : '当天任务' }}
      </span>
      <span v-if="task.reminderTime" class="task-meta">
        <Bell :size="14" />
        {{ task.reminderTime }}
      </span>
    </span>
  </button>
</template>
