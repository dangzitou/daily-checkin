<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import PageShell from '../components/PageShell.vue';
import TaskRow from '../components/TaskRow.vue';
import CheckinModal from '../components/CheckinModal.vue';
import StatePanel from '../components/StatePanel.vue';
import { api, ApiError } from '../api';
import { formatLocalDate } from '../lib/date';
import { summarizeToday } from '../lib/progress';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import type { Goal, MoodEmoji, StatsSummary, Task } from '../types';

const auth = useAuthStore();
const { show: showToast } = useToast();
const today = formatLocalDate();
const tasks = ref<Task[]>([]);
const goals = ref<Goal[]>([]);
const stats = ref<StatsSummary | null>(null);
const busyTaskId = ref<number | null>(null);
const loading = ref(true);
const loadError = ref('');
const skipBusyId = ref<number | null>(null);
const todayProgress = computed(() => summarizeToday(tasks.value));
const pendingTasks = computed(() => tasks.value.filter((task) => !task.checked));
const completedTasks = computed(() => tasks.value.filter((task) => task.checked));
const allDone = computed(() => todayProgress.value.total > 0 && todayProgress.value.completed === todayProgress.value.total);

// Time-based greeting
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 9) return '早上好';
  if (h < 12) return '上午好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
});

// Modal state
const modalVisible = ref(false);
const modalTask = ref<Task | null>(null);
const checkinLoading = ref(false);

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const [taskResult, statsResult, goalResult] = await Promise.all([
      api.get<Task[]>(`/tasks?date=${today}`),
      api.get<StatsSummary>('/stats/summary'),
      api.get<Goal[]>('/goals'),
    ]);
    tasks.value = taskResult;
    stats.value = statsResult;
    goals.value = goalResult;
  } catch (err) {
    loadError.value = err instanceof ApiError ? err.message : '加载失败，请检查网络';
  } finally {
    loading.value = false;
  }
}

function openCheckin(task: Task) {
  modalTask.value = task;
  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
  modalTask.value = null;
}

async function handleCheckinSubmit(data: { photo: File | null; mood: MoodEmoji | null; note: string }) {
  if (!modalTask.value) return;

  checkinLoading.value = true;
  try {
    const formData = new FormData();
    if (data.photo) formData.append('photo', data.photo);
    if (data.mood) formData.append('mood', data.mood);
    if (data.note) formData.append('note', data.note);

    const res = await api.upload<{ pointsEarned: number }>(
      `/tasks/${modalTask.value.id}/checkins?date=${today}`,
      formData,
    );

    if (res.pointsEarned > 0) {
      showToast(`+${res.pointsEarned} 积分`);
    }
    closeModal();
    await auth.loadMe();
    await load();
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : '打卡失败', 'error');
  } finally {
    checkinLoading.value = false;
  }
}

async function toggle(task: Task) {
  busyTaskId.value = task.id;
  try {
    const res = await api.delete<{ ok: boolean; pointsDeducted: number }>(`/tasks/${task.id}/checkins?date=${today}`);
    if (res.pointsDeducted > 0) {
      showToast(`-${res.pointsDeducted} 积分`, 'warn');
    }
    await auth.loadMe();
    await load();
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : '操作失败', 'error');
  } finally {
    busyTaskId.value = null;
  }
}

async function skipTask(task: Task) {
  skipBusyId.value = task.id;
  try {
    await api.post(`/tasks/${task.id}/skip`, { date: today });
    showToast(`已跳过「${task.title}」`);
    await load();
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : '跳过失败', 'error');
  } finally {
    skipBusyId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <PageShell :title="greeting" :eyebrow="stats?.today ?? today">
    <div class="today-layout">
      <section class="today-overview">
        <div class="today-hero-card">
          <div class="today-hero-head">
            <div>
              <p class="today-hero-label">今日节奏</p>
              <h2 class="today-hero-title">{{ todayProgress.completed }}/{{ todayProgress.total }}</h2>
              <p class="today-hero-copy">今天的常驻和当天任务都在这里，完成进度会即时更新。</p>
            </div>
            <div class="today-hero-side">
              <span>最佳连续</span>
              <strong>{{ stats?.bestStreak ?? 0 }} 天</strong>
            </div>
          </div>
          <div class="today-hero-meter" aria-label="今日完成进度">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${todayProgress.percent}%` }" />
            </div>
            <span class="progress-label">{{ todayProgress.percent }}%</span>
          </div>
        </div>

        <section class="stats-row">
          <div class="stat-card">
            <span class="stat-label">完成</span>
            <strong class="stat-value">{{ todayProgress.completed }}<small>/{{ todayProgress.total }}</small></strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">连续</span>
            <strong class="stat-value">{{ stats?.currentStreak ?? 0 }}<small>天</small></strong>
          </div>
          <div class="stat-card stat-card--accent">
            <span class="stat-label">积分</span>
            <strong class="stat-value">{{ auth.user?.points ?? 0 }}</strong>
          </div>
        </section>

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
      </section>

      <section class="today-main">
        <section v-if="loading" class="task-list">
          <div v-for="i in 3" :key="i" class="skeleton-row" />
        </section>

        <StatePanel v-else-if="loadError" title="今天的数据没有加载出来" :description="loadError" compact>
          <button class="secondary-button" type="button" @click="load">重新加载</button>
        </StatePanel>

        <StatePanel
          v-else-if="tasks.length === 0"
          title="今天还没有任务"
          description="先添加常驻任务或当天任务，打卡页才会开始累计进度。"
          compact
        >
          <RouterLink to="/tasks" class="secondary-button">添加任务</RouterLink>
        </StatePanel>

        <template v-else>
          <section v-if="allDone" class="celebration">
            <div class="celebration-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#b08520" stroke="#b08520" stroke-width="1"/>
              </svg>
            </div>
            <span>今天全部完成</span>
          </section>

          <section v-if="pendingTasks.length" class="task-section">
            <h3>待打卡</h3>
            <TaskRow
              v-for="task in pendingTasks"
              :key="task.id"
              :task="task"
              :busy="busyTaskId === task.id"
              :skip-busy="skipBusyId === task.id"
              :show-scope="true"
              @toggle="toggle"
              @open-checkin="openCheckin"
              @skip="skipTask"
            />
          </section>

          <section v-if="completedTasks.length" class="task-section task-section--completed">
            <div class="page-intro compact">
              <h2>今天记录</h2>
              <p>{{ completedTasks.length }} 项已完成，展开后可以查看照片和小记。</p>
            </div>
            <div class="task-list completed-task-list">
              <TaskRow
                v-for="task in completedTasks"
                :key="task.id"
                :task="task"
                :busy="busyTaskId === task.id"
                :show-scope="true"
                @toggle="toggle"
                @open-checkin="openCheckin"
              />
            </div>
          </section>
        </template>
      </section>
    </div>

    <CheckinModal
      v-if="modalTask"
      :task="modalTask"
      :visible="modalVisible"
      :loading="checkinLoading"
      @close="closeModal"
      @submit="handleCheckinSubmit"
    />
  </PageShell>
</template>
