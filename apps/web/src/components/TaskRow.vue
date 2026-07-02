<script setup lang="ts">
import { ref } from 'vue';
import { Bell, Check, Circle, ChevronDown, ChevronUp, Image } from 'lucide-vue-next';
import type { Task } from '../types';

defineProps<{
  task: Task;
  busy?: boolean;
  showScope?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', task: Task): void;
  (e: 'openCheckin', task: Task): void;
}>();

const expanded = ref(false);

function handleClick(task: Task) {
  if (task.checked) {
    expanded.value = !expanded.value;
  } else {
    emit('openCheckin', task);
  }
}
</script>

<template>
  <div class="task-row-wrapper" :class="{ checked: task.checked }">
    <button
      class="task-row"
      :class="{ checked: task.checked }"
      :disabled="busy"
      :aria-pressed="task.checked"
      :aria-label="`${task.checked ? '取消完成' : '完成'} ${task.title}`"
      @click="handleClick(task)"
    >
      <span class="check-icon">
        <Check v-if="task.checked" :size="20" />
        <Circle v-else :size="20" />
      </span>
      <span class="task-copy">
        <span class="task-title-line">
          <strong>{{ task.title }}</strong>
          <span class="task-status-pack">
            <span class="status-pill">{{ task.checked ? '已完成' : '待完成' }}</span>
            <span v-if="task.mood" class="task-mood-badge">{{ task.mood }}</span>
            <span v-if="task.photoUrl" class="task-photo-badge">
              <Image :size="12" />
            </span>
          </span>
        </span>
        <span v-if="task.description" class="task-desc">{{ task.description }}</span>
        <span v-if="showScope || task.reminderTime" class="task-meta-row">
          <span v-if="showScope" class="task-meta">
            {{ task.scope === 'resident' ? '常驻任务' : '当天任务' }}
          </span>
          <span v-if="task.reminderTime" class="task-meta">
            <Bell :size="14" />
            {{ task.reminderTime }}
          </span>
        </span>
      </span>
      <span v-if="task.checked" class="expand-icon">
        <ChevronUp v-if="expanded" :size="16" />
        <ChevronDown v-else :size="16" />
      </span>
    </button>

    <!-- Expanded checkin details -->
    <div v-if="task.checked && expanded" class="checkin-detail">
      <div class="checkin-detail-header">
        <span class="detail-label">本次打卡</span>
        <span class="status-pill approved">已记录</span>
      </div>
      <div v-if="task.photoUrl" class="detail-photo">
        <img :src="task.photoUrl" alt="打卡照片" loading="lazy" />
      </div>
      <div v-if="task.note" class="detail-note">
        <span class="detail-label">小记</span>
        <p>{{ task.note }}</p>
      </div>
      <div class="detail-actions">
        <button class="btn-uncheck" @click="$emit('toggle', task)">
          取消打卡
        </button>
      </div>
    </div>
  </div>
</template>
