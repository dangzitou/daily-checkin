<script setup lang="ts">
import { Check, Circle, ListTodo, Plus, RefreshCw, Target, Trash2 } from 'lucide-vue-next';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import PageShell from '../components/PageShell.vue';
import { formatLocalDate } from '../lib/date';
import { useAuthStore } from '../stores/auth';
import type { Goal, Task } from '../types';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const activeTab = ref<'tasks' | 'goals'>('tasks');

// Sync tab with query param
if (route.query.tab === 'goals') activeTab.value = 'goals';
watch(activeTab, (tab) => {
  router.replace({ query: tab === 'goals' ? { tab: 'goals' } : {} });
});

// ===== Tasks =====
const MAX_ACTIVE_TASKS = 20;
const tasks = ref<Task[]>([]);
const taskForm = reactive({ title: '', description: '', reminderTime: '' });
const taskError = ref('');
const taskBusy = ref(false);
const atLimit = computed(() => tasks.value.length >= MAX_ACTIVE_TASKS);

async function loadTasks() {
  const result = await api.get<Task[]>('/tasks');
  tasks.value = result.filter((t) => t.scope === 'resident');
}

async function createTask() {
  if (!taskForm.title.trim()) return;
  taskError.value = '';
  taskBusy.value = true;
  try {
    await api.post('/tasks', {
      title: taskForm.title,
      description: taskForm.description || undefined,
      scope: 'resident',
      reminderTime: taskForm.reminderTime || undefined,
    });
    taskForm.title = '';
    taskForm.description = '';
    taskForm.reminderTime = '';
    await loadTasks();
  } catch (err) {
    taskError.value = err instanceof Error ? err.message : '创建失败';
  } finally {
    taskBusy.value = false;
  }
}

async function removeTask(task: Task) {
  await api.delete(`/tasks/${task.id}`);
  await loadTasks();
}

// ===== Goals =====
const goals = ref<Goal[]>([]);
const goalLoading = ref(true);
const goalCreating = ref(false);
const busyGoalId = ref<number | null>(null);
const goalError = ref('');
const goalLoadError = ref('');
const toast = ref('');
const toastType = ref<'success' | 'warn'>('success');
const goalForm = reactive({
  title: '',
  description: '',
  startDate: formatLocalDate(),
  targetDate: '',
  targetCount: 30,
});

function showToast(msg: string, type: 'success' | 'warn' = 'success') {
  toast.value = msg;
  toastType.value = type;
  setTimeout(() => { toast.value = ''; }, 2500);
}

async function loadGoals() {
  goalLoading.value = true;
  goalLoadError.value = '';
  try {
    goals.value = await api.get<Goal[]>('/goals');
  } catch (err) {
    goalLoadError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    goalLoading.value = false;
  }
}

async function createGoal() {
  if (!goalForm.title.trim()) return;
  goalError.value = '';
  goalCreating.value = true;
  try {
    await api.post('/goals', {
      title: goalForm.title,
      description: goalForm.description || undefined,
      startDate: goalForm.startDate,
      targetDate: goalForm.targetDate,
      targetCount: Number(goalForm.targetCount),
    });
    goalForm.title = '';
    goalForm.description = '';
    goalForm.targetDate = '';
    goalForm.targetCount = 30;
    await loadGoals();
  } catch (err) {
    goalError.value = err instanceof Error ? err.message : '创建失败';
  } finally {
    goalCreating.value = false;
  }
}

async function toggleToday(goal: Goal) {
  busyGoalId.value = goal.id;
  goalLoadError.value = '';
  try {
    if (goal.checkedToday) {
      const res = await api.delete<{ ok: boolean; pointsDeducted: number }>(`/tasks/${goal.taskId}/checkins?date=${formatLocalDate()}`);
      if (res.pointsDeducted > 0) showToast(`-${res.pointsDeducted} 积分`, 'warn');
    } else {
      const res = await api.post<{ pointsEarned: number }>(`/tasks/${goal.taskId}/checkins?date=${formatLocalDate()}`);
      if (res.pointsEarned > 0) showToast(`+${res.pointsEarned} 积分 ✨`);
    }
    await auth.loadMe();
    await loadGoals();
  } catch (err) {
    goalLoadError.value = err instanceof Error ? err.message : '操作失败';
  } finally {
    busyGoalId.value = null;
  }
}

async function deleteGoal(goal: Goal) {
  if (!confirm(`确定删除目标「${goal.title}」吗？`)) return;
  busyGoalId.value = goal.id;
  goalLoadError.value = '';
  try {
    await api.delete(`/goals/${goal.id}`);
    await loadGoals();
  } catch (err) {
    goalLoadError.value = err instanceof Error ? err.message : '删除失败';
  } finally {
    busyGoalId.value = null;
  }
}

// Load data on mount and when tab changes
onMounted(() => {
  loadTasks();
  loadGoals();
});

const title = computed(() => activeTab.value === 'tasks' ? '常驻任务' : '目标');
const eyebrow = computed(() => activeTab.value === 'tasks' ? '每天出现' : '倒计时');
</script>

<template>
  <PageShell :title="title" :eyebrow="eyebrow">
    <!-- Sub-tabs -->
    <div class="sub-tabs">
      <button
        class="sub-tab"
        :class="{ active: activeTab === 'tasks' }"
        type="button"
        @click="activeTab = 'tasks'"
      >
        <ListTodo :size="16" />
        常驻任务
      </button>
      <button
        class="sub-tab"
        :class="{ active: activeTab === 'goals' }"
        type="button"
        @click="activeTab = 'goals'"
      >
        <Target :size="16" />
        目标
      </button>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="toast" :class="toastType">{{ toast }}</div>

    <!-- ===== Tasks Tab ===== -->
    <div v-if="activeTab === 'tasks'">
      <form class="task-form" @submit.prevent="createTask">
        <label>
          <span>任务名</span>
          <input v-model="taskForm.title" maxlength="120" placeholder="比如：喝水、运动、早睡" required />
        </label>
        <label>
          <span>备注</span>
          <input v-model="taskForm.description" maxlength="500" placeholder="可不填" />
        </label>
        <label>
          <span>提醒时间</span>
          <input v-model="taskForm.reminderTime" type="time" />
        </label>
        <p v-if="taskError" class="error-text">{{ taskError }}</p>
        <p v-if="atLimit" class="error-text">最多创建 {{ MAX_ACTIVE_TASKS }} 个活跃任务</p>
        <button v-if="!atLimit" class="primary-button" :disabled="taskBusy" type="submit">
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
            <Trash2 :size="18" />
          </button>
        </article>
      </section>
    </div>

    <!-- ===== Goals Tab ===== -->
    <div v-if="activeTab === 'goals'">
      <form class="goal-form" @submit.prevent="createGoal">
        <label>
          <span>目标名</span>
          <input v-model="goalForm.title" maxlength="120" placeholder="比如：30 天运动" required />
        </label>
        <label>
          <span>备注</span>
          <input v-model="goalForm.description" maxlength="500" placeholder="可不填" />
        </label>
        <div class="form-grid">
          <label>
            <span>开始</span>
            <input v-model="goalForm.startDate" type="date" required />
          </label>
          <label>
            <span>目标日</span>
            <input v-model="goalForm.targetDate" type="date" required />
          </label>
        </div>
        <label>
          <span>目标次数</span>
          <input v-model.number="goalForm.targetCount" type="number" min="1" max="999" required />
        </label>
        <p v-if="goalError" class="error-text">{{ goalError }}</p>
        <button class="primary-button" :disabled="goalCreating" type="submit">
          <Plus :size="18" />
          创建目标
        </button>
      </form>

      <section v-if="goalLoading" class="empty-state">正在加载</section>
      <section v-else-if="goalLoadError" class="empty-state actionable-empty">
        <span>{{ goalLoadError }}</span>
        <button class="secondary-button" type="button" @click="loadGoals">
          <RefreshCw :size="18" />
          重新加载
        </button>
      </section>
      <section v-else-if="goals.length === 0" class="empty-state">还没有目标。</section>
      <section v-else class="goal-list">
        <article v-for="goal in goals" :key="goal.id" class="goal-card" :class="goal.status">
          <header>
            <div>
              <p class="eyebrow">{{ goal.status === 'completed' ? '已完成' : goal.status === 'overdue' ? '已超期' : '进行中' }}</p>
              <h2>{{ goal.title }}</h2>
            </div>
            <div class="goal-header-actions">
              <Target :size="24" />
              <button
                class="goal-delete-button"
                :disabled="busyGoalId === goal.id"
                type="button"
                aria-label="删除目标"
                @click="deleteGoal(goal)"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </header>
          <p v-if="goal.description" class="goal-desc">{{ goal.description }}</p>
          <div class="goal-today">
            <div>
              <span>今天</span>
              <strong>{{ goal.checkedToday ? '已打卡' : '待打卡' }}</strong>
            </div>
            <button
              class="goal-check-button"
              :class="{ checked: goal.checkedToday }"
              :disabled="busyGoalId === goal.id"
              type="button"
              :aria-pressed="goal.checkedToday"
              @click="toggleToday(goal)"
            >
              <Check v-if="goal.checkedToday" :size="20" />
              <Circle v-else :size="20" />
              {{ goal.checkedToday ? '已完成' : '打卡' }}
            </button>
          </div>
          <div class="goal-meter">
            <div :style="{ width: `${goal.percent}%` }" />
          </div>
          <div class="goal-stats">
            <span><strong>{{ goal.completedCount }}/{{ goal.targetCount }}</strong> 完成次数</span>
            <span><strong>{{ goal.daysLeft }}</strong> 剩余天</span>
            <span><strong>{{ goal.percent }}%</strong> 进度</span>
          </div>
          <p class="goal-date">{{ goal.startDate }} - {{ goal.targetDate }}</p>
        </article>
      </section>
    </div>
  </PageShell>
</template>
