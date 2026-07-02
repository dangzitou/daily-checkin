<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref } from 'vue';
import { api, ApiError } from '../api';
import TaskRow from '../components/TaskRow.vue';
import PageShell from '../components/PageShell.vue';
import StatePanel from '../components/StatePanel.vue';
import { buildMonthCells } from '../lib/calendar';
import { formatLocalDate, formatMonth } from '../lib/date';
import { summarizeToday } from '../lib/progress';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import type { CalendarStatus, Task } from '../types';

const auth = useAuthStore();
const { show: showToast } = useToast();
const currentMonth = ref(formatMonth());
const selectedDate = ref(formatLocalDate());
const statusByDate = ref<Record<string, CalendarStatus>>({});
const tasks = ref<Task[]>([]);
const busyTaskId = ref<number | null>(null);
const loadingTasks = ref(false);
const loadingCalendar = ref(false);
const calendarError = ref('');
const form = reactive({ title: '', description: '' });
const creating = ref(false);
const error = ref('');
const cells = computed(() => buildMonthCells(currentMonth.value, statusByDate.value));
const residentTasks = computed(() => tasks.value.filter((t) => t.scope === 'resident'));
const datedTasks = computed(() => tasks.value.filter((t) => t.scope === 'dated'));
const progress = computed(() => summarizeToday(tasks.value));

function shiftMonth(delta: number) {
  const [year, month] = currentMonth.value.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  currentMonth.value = next.toISOString().slice(0, 7);
  void load();
}

async function load() {
  loadingCalendar.value = true;
  calendarError.value = '';
  try {
    statusByDate.value = await api.get<Record<string, CalendarStatus>>(`/checkins/calendar?month=${currentMonth.value}`);
  } catch (err) {
    calendarError.value = err instanceof ApiError ? err.message : '加载日历失败';
  } finally {
    loadingCalendar.value = false;
  }
}

async function loadSelectedDate() {
  loadingTasks.value = true;
  try {
    tasks.value = await api.get<Task[]>(`/tasks?date=${selectedDate.value}`);
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : '加载任务失败', 'error');
  } finally {
    loadingTasks.value = false;
  }
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
  try {
    if (task.checked) {
      const res = await api.delete<{ ok: boolean; pointsDeducted: number }>(`/tasks/${task.id}/checkins?date=${selectedDate.value}`);
      if (res.pointsDeducted > 0) showToast(`-${res.pointsDeducted} 积分`, 'warn');
    } else {
      const res = await api.post<{ pointsEarned: number }>(`/tasks/${task.id}/checkins?date=${selectedDate.value}`);
      if (res.pointsEarned > 0) showToast(`+${res.pointsEarned} 积分`);
    }
    await auth.loadMe();
    await Promise.all([load(), loadSelectedDate()]);
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : '操作失败', 'error');
  } finally {
    busyTaskId.value = null;
  }
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
      scheduledDate: selectedDate.value,
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
  await Promise.all([load(), loadSelectedDate()]);
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

    <div class="calendar-layout">
      <section class="calendar-panel">
        <header class="calendar-panel-head">
          <div>
            <p class="eyebrow">月视图</p>
            <h2>{{ currentMonth }}</h2>
          </div>
          <p>查看整个月的完成情况，选中某一天后可在右侧直接补充当天任务和记录。</p>
        </header>
        <StatePanel v-if="calendarError" title="这个月的日历没有加载出来" :description="calendarError" compact>
          <button class="secondary-button" type="button" @click="load">重新加载</button>
        </StatePanel>
        <section v-else class="calendar-grid">
          <span v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day" class="weekday">{{ day }}</span>
          <button
            v-for="cell in cells"
            :key="cell.date"
            class="day-cell"
            :class="{
              muted: !cell.inMonth,
              selected: cell.date === selectedDate,
              complete: cell.complete,
              partial: !cell.complete && (cell.completionRate ?? 0) > 0,
            }"
            @click="selectDate(cell.date)"
          >
            <strong>{{ cell.day }}</strong>
            <span v-if="cell.totalTasks">{{ cell.completedTasks }}/{{ cell.totalTasks }}</span>
          </button>
        </section>
      </section>

      <section class="day-detail">
        <header class="detail-header">
          <div class="detail-header-copy">
            <p class="eyebrow">选中日期</p>
            <h2>{{ selectedDate }}</h2>
            <p class="detail-header-note">
              {{ tasks.length ? `今天共有 ${tasks.length} 个任务，已完成 ${progress.completed} 个。` : '先添加当天任务，或查看常驻任务在这一天的安排。' }}
            </p>
          </div>
          <div class="detail-header-progress">
            <strong>{{ progress.completed }}/{{ progress.total }}</strong>
            <span>完成进度</span>
          </div>
        </header>

        <section class="detail-summary-row">
          <article class="mini-stat-card">
            <span>已完成</span>
            <strong>{{ progress.completed }}</strong>
          </article>
          <article class="mini-stat-card">
            <span>待处理</span>
            <strong>{{ Math.max(progress.total - progress.completed, 0) }}</strong>
          </article>
          <article class="mini-stat-card">
            <span>总任务</span>
            <strong>{{ progress.total }}</strong>
          </article>
        </section>

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

        <section v-if="loadingTasks" class="task-list">
          <div v-for="i in 2" :key="i" class="skeleton-row" />
        </section>
        <template v-else>
          <section v-if="datedTasks.length" class="task-section">
            <h3>这一天</h3>
            <TaskRow v-for="task in datedTasks" :key="task.id" :task="task" :busy="busyTaskId === task.id" @toggle="toggle" />
          </section>
          <section v-if="residentTasks.length" class="task-section">
            <h3>常驻</h3>
            <TaskRow v-for="task in residentTasks" :key="task.id" :task="task" :busy="busyTaskId === task.id" @toggle="toggle" />
          </section>
          <StatePanel
            v-if="tasks.length === 0"
            title="这一天还没有任务"
            description="可以添加一个当天任务，或者等常驻任务在这里出现。"
            compact
          />
        </template>
      </section>
    </div>
  </PageShell>
</template>
