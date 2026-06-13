<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../api';
import TaskRow from '../components/TaskRow.vue';
import PageShell from '../components/PageShell.vue';
import { buildMonthCells } from '../lib/calendar';
import { formatLocalDate, formatMonth } from '../lib/date';
import { summarizeToday } from '../lib/progress';
import type { CalendarStatus, Task } from '../types';

const currentMonth = ref(formatMonth());
const selectedDate = ref(formatLocalDate());
const statusByDate = ref<Record<string, CalendarStatus>>({});
const tasks = ref<Task[]>([]);
const busyTaskId = ref<number | null>(null);
const loadingTasks = ref(false);
const form = reactive({
  title: '',
  description: ''
});
const creating = ref(false);
const error = ref('');
const cells = computed(() => buildMonthCells(currentMonth.value, statusByDate.value));
const residentTasks = computed(() => tasks.value.filter((task) => task.scope === 'resident'));
const datedTasks = computed(() => tasks.value.filter((task) => task.scope === 'dated'));
const progress = computed(() => summarizeToday(tasks.value));

function shiftMonth(delta: number) {
  const [year, month] = currentMonth.value.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  currentMonth.value = next.toISOString().slice(0, 7);
  void load();
}

async function load() {
  statusByDate.value = await api.get<Record<string, CalendarStatus>>(`/checkins/calendar?month=${currentMonth.value}`);
}

async function loadSelectedDate() {
  loadingTasks.value = true;
  tasks.value = await api.get<Task[]>(`/tasks?date=${selectedDate.value}`);
  loadingTasks.value = false;
}

async function selectDate(date: string) {
  selectedDate.value = date;
  if (!date.startsWith(currentMonth.value)) {
    currentMonth.value = date.slice(0, 7);
    await load();
  }
  await loadSelectedDate();
}

async function toggle(task: Task) {
  busyTaskId.value = task.id;
  if (task.checked) {
    await api.delete(`/tasks/${task.id}/checkins?date=${selectedDate.value}`);
  } else {
    await api.post(`/tasks/${task.id}/checkins?date=${selectedDate.value}`);
  }
  await Promise.all([load(), loadSelectedDate()]);
  busyTaskId.value = null;
}

async function createDatedTask() {
  if (!form.title.trim()) return;
  error.value = '';
  creating.value = true;
  try {
    await api.post('/tasks', {
      title: form.title,
      description: form.description || undefined,
      scope: 'dated',
      scheduledDate: selectedDate.value
    });
    form.title = '';
    form.description = '';
    await Promise.all([load(), loadSelectedDate()]);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '创建失败';
  } finally {
    creating.value = false;
  }
}

onMounted(async () => {
  await load();
  await loadSelectedDate();
});
</script>

<template>
  <PageShell title="打卡日历" :eyebrow="currentMonth">
    <template #action>
      <div class="month-switcher">
        <button aria-label="上个月" @click="shiftMonth(-1)"><ChevronLeft :size="20" /></button>
        <button aria-label="下个月" @click="shiftMonth(1)"><ChevronRight :size="20" /></button>
      </div>
    </template>

    <section class="calendar-grid">
      <span v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day" class="weekday">{{ day }}</span>
      <button
        v-for="cell in cells"
        :key="cell.date"
        class="day-cell"
        :class="{
          muted: !cell.inMonth,
          selected: cell.date === selectedDate,
          complete: cell.complete,
          partial: !cell.complete && (cell.completionRate ?? 0) > 0
        }"
        @click="selectDate(cell.date)"
      >
        <strong>{{ cell.day }}</strong>
        <span v-if="cell.totalTasks">{{ cell.completedTasks }}/{{ cell.totalTasks }}</span>
      </button>
    </section>

    <section class="day-detail">
      <header class="detail-header">
        <div>
          <p class="eyebrow">选中日期</p>
          <h2>{{ selectedDate }}</h2>
        </div>
        <strong>{{ progress.completed }}/{{ progress.total }}</strong>
      </header>

      <form class="compact-form" @submit.prevent="createDatedTask">
        <label>
          <span>当天任务</span>
          <input v-model="form.title" maxlength="120" placeholder="比如：买花、体检、整理房间" required />
        </label>
        <label>
          <span>备注</span>
          <input v-model="form.description" maxlength="500" placeholder="可不填" />
        </label>
        <p v-if="error" class="error-text">{{ error }}</p>
        <button class="primary-button" :disabled="creating" type="submit">
          <Plus :size="18" />
          添加到这一天
        </button>
      </form>

      <section v-if="loadingTasks" class="empty-state">正在加载</section>
      <template v-else>
        <section v-if="datedTasks.length" class="task-section">
          <h3>这一天</h3>
          <TaskRow v-for="task in datedTasks" :key="task.id" :task="task" :busy="busyTaskId === task.id" @toggle="toggle" />
        </section>
        <section v-if="residentTasks.length" class="task-section">
          <h3>常驻</h3>
          <TaskRow
            v-for="task in residentTasks"
            :key="task.id"
            :task="task"
            :busy="busyTaskId === task.id"
            @toggle="toggle"
          />
        </section>
        <section v-if="tasks.length === 0" class="empty-state">这一天还没有任务。</section>
      </template>
    </section>
  </PageShell>
</template>
