<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../api';
import PageShell from '../components/PageShell.vue';
import type { Task } from '../types';

const MAX_ACTIVE_TASKS = 20;
const tasks = ref<Task[]>([]);
const form = reactive({
  title: '',
  description: '',
  reminderTime: ''
});
const error = ref('');
const busy = ref(false);
const atLimit = computed(() => tasks.value.length >= MAX_ACTIVE_TASKS);

async function load() {
  const result = await api.get<Task[]>('/tasks');
  tasks.value = result.filter((task) => task.scope === 'resident');
}

async function createTask() {
  if (!form.title.trim()) return;
  error.value = '';
  busy.value = true;
  try {
    await api.post('/tasks', {
      title: form.title,
      description: form.description || undefined,
      scope: 'resident',
      reminderTime: form.reminderTime || undefined
    });
    form.title = '';
    form.description = '';
    form.reminderTime = '';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '创建失败';
  } finally {
    busy.value = false;
  }
}

async function removeTask(task: Task) {
  await api.delete(`/tasks/${task.id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <PageShell title="常驻任务" eyebrow="每天出现">
    <form class="task-form" @submit.prevent="createTask">
      <label>
        <span>任务名</span>
        <input v-model="form.title" maxlength="120" placeholder="比如：喝水、运动、早睡" required />
      </label>
      <label>
        <span>备注</span>
        <input v-model="form.description" maxlength="500" placeholder="可不填" />
      </label>
      <label>
        <span>提醒时间</span>
        <input v-model="form.reminderTime" type="time" />
      </label>
      <p v-if="error" class="error-text">{{ error }}</p>
      <p v-if="atLimit" class="error-text">最多创建 {{ MAX_ACTIVE_TASKS }} 个活跃任务，请先停用不需要的任务</p>
      <button v-if="!atLimit" class="primary-button" :disabled="busy" type="submit">
        <Plus :size="18" />
        添加常驻任务
      </button>
    </form>

    <section class="manage-list">
      <article v-for="task in tasks" :key="task.id" class="manage-row">
        <div>
          <strong>{{ task.title }}</strong>
          <span>{{ task.reminderTime ? `提醒 ${task.reminderTime}` : '不提醒' }}</span>
        </div>
        <button class="icon-button danger" :aria-label="`停用 ${task.title}`" @click="removeTask(task)">
          <Trash2 :size="19" />
        </button>
      </article>
    </section>
  </PageShell>
</template>
