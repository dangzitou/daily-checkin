<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import PageShell from '../components/PageShell.vue';
import TaskRow from '../components/TaskRow.vue';
import { api } from '../api';
import { formatLocalDate } from '../lib/date';
import { summarizeToday } from '../lib/progress';
import type { Goal, StatsSummary, Task } from '../types';

const today = formatLocalDate();
const tasks = ref<Task[]>([]);
const goals = ref<Goal[]>([]);
const stats = ref<StatsSummary | null>(null);
const busyTaskId = ref<number | null>(null);
const loading = ref(true);
const todayProgress = computed(() => summarizeToday(tasks.value));
const allDone = computed(() => todayProgress.value.total > 0 && todayProgress.value.completed === todayProgress.value.total);

async function load() {
  loading.value = true;
  const [taskResult, statsResult, goalResult] = await Promise.all([
    api.get<Task[]>(`/tasks?date=${today}`),
    api.get<StatsSummary>('/stats/summary'),
    api.get<Goal[]>('/goals')
  ]);
  tasks.value = taskResult;
  stats.value = statsResult;
  goals.value = goalResult;
  loading.value = false;
}

async function toggle(task: Task) {
  busyTaskId.value = task.id;
  if (task.checked) {
    await api.delete(`/tasks/${task.id}/checkins?date=${today}`);
  } else {
    await api.post(`/tasks/${task.id}/checkins?date=${today}`);
  }
  await load();
  busyTaskId.value = null;
}

onMounted(load);
</script>

<template>
  <PageShell title="今日打卡" :eyebrow="stats?.today">
    <section class="summary-band">
      <div>
        <span>完成进度</span>
        <strong>{{ todayProgress.completed }}/{{ todayProgress.total }}</strong>
      </div>
      <div>
        <span>连续</span>
        <strong>{{ stats?.currentStreak ?? 0 }} 天</strong>
      </div>
      <div>
        <span>最好</span>
        <strong>{{ stats?.bestStreak ?? 0 }} 天</strong>
      </div>
    </section>

    <div class="progress-track" aria-label="今日完成进度">
      <div class="progress-fill" :style="{ width: `${todayProgress.percent}%` }" />
    </div>

    <section v-if="goals.length" class="today-goals">
      <article v-for="goal in goals.slice(0, 2)" :key="goal.id" class="goal-strip" :class="goal.status">
        <div>
          <span>{{ goal.status === 'completed' ? '已完成' : goal.status === 'overdue' ? '已超期' : '目标倒计时' }}</span>
          <strong>{{ goal.title }}</strong>
        </div>
        <div class="goal-strip-meter">
          <i :style="{ width: `${goal.percent}%` }" />
        </div>
        <b>{{ goal.daysLeft }} 天</b>
      </article>
    </section>

    <section v-if="loading" class="empty-state">正在加载</section>
    <section v-else-if="tasks.length === 0" class="empty-state">还没有任务，去“任务”里添加一个。</section>
    <template v-else>
      <section v-if="allDone" class="done-note">今天完成啦</section>
      <section class="task-list">
        <TaskRow
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :busy="busyTaskId === task.id"
          :show-scope="true"
          @toggle="toggle"
        />
      </section>
    </template>
  </PageShell>
</template>
