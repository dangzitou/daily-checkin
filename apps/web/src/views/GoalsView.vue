<script setup lang="ts">
import { Check, Circle, Plus, RefreshCw, Target, Trash2 } from 'lucide-vue-next';
import { onMounted, reactive, ref } from 'vue';
import { api } from '../api';
import PageShell from '../components/PageShell.vue';
import { formatLocalDate } from '../lib/date';
import { useAuthStore } from '../stores/auth';
import type { Goal } from '../types';

const auth = useAuthStore();
const goals = ref<Goal[]>([]);
const loading = ref(true);
const creating = ref(false);
const busyGoalId = ref<number | null>(null);
const error = ref('');
const loadError = ref('');
const toast = ref('');
const toastType = ref<'success' | 'warn'>('success');
const form = reactive({
  title: '',
  description: '',
  startDate: formatLocalDate(),
  targetDate: '',
  targetCount: 30
});

function showToast(msg: string, type: 'success' | 'warn' = 'success') {
  toast.value = msg;
  toastType.value = type;
  setTimeout(() => { toast.value = ''; }, 2500);
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    goals.value = await api.get<Goal[]>('/goals');
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    loading.value = false;
  }
}

async function createGoal() {
  if (!form.title.trim()) return;
  error.value = '';
  creating.value = true;
  try {
    await api.post('/goals', {
      title: form.title,
      description: form.description || undefined,
      startDate: form.startDate,
      targetDate: form.targetDate,
      targetCount: Number(form.targetCount)
    });
    form.title = '';
    form.description = '';
    form.targetDate = '';
    form.targetCount = 30;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '创建失败';
  } finally {
    creating.value = false;
  }
}

async function toggleToday(goal: Goal) {
  busyGoalId.value = goal.id;
  loadError.value = '';
  try {
    if (goal.checkedToday) {
      const res = await api.delete<{ ok: boolean; pointsDeducted: number }>(`/tasks/${goal.taskId}/checkins?date=${formatLocalDate()}`);
      if (res.pointsDeducted > 0) {
        showToast(`-${res.pointsDeducted} 积分`, 'warn');
      }
    } else {
      const res = await api.post<{ pointsEarned: number }>(`/tasks/${goal.taskId}/checkins?date=${formatLocalDate()}`);
      if (res.pointsEarned > 0) {
        showToast(`+${res.pointsEarned} 积分 ✨`);
      }
    }
    await auth.loadMe();
    await load();
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : '操作失败';
  } finally {
    busyGoalId.value = null;
  }
}

async function deleteGoal(goal: Goal) {
  if (!confirm(`确定删除目标「${goal.title}」吗？删除后不可恢复。`)) return;
  busyGoalId.value = goal.id;
  loadError.value = '';
  try {
    await api.delete(`/goals/${goal.id}`);
    await load();
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : '删除失败';
  } finally {
    busyGoalId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <PageShell title="目标" eyebrow="倒计时">
    <div v-if="toast" class="toast" :class="toastType">{{ toast }}</div>

    <form class="goal-form" @submit.prevent="createGoal">
      <label>
        <span>目标名</span>
        <input v-model="form.title" maxlength="120" placeholder="比如：30 天运动" required />
      </label>
      <label>
        <span>备注</span>
        <input v-model="form.description" maxlength="500" placeholder="可不填" />
      </label>
      <div class="form-grid">
        <label>
          <span>开始</span>
          <input v-model="form.startDate" type="date" required />
        </label>
        <label>
          <span>目标日</span>
          <input v-model="form.targetDate" type="date" required />
        </label>
      </div>
      <label>
        <span>目标次数</span>
        <input v-model.number="form.targetCount" type="number" min="1" max="999" required />
      </label>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="primary-button" :disabled="creating" type="submit">
        <Plus :size="18" />
        创建目标
      </button>
    </form>

    <section v-if="loading" class="empty-state">正在加载</section>
    <section v-else-if="loadError" class="empty-state actionable-empty">
      <span>{{ loadError }}</span>
      <button class="secondary-button" type="button" @click="load">
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
            :aria-label="`${goal.checkedToday ? '取消今天打卡' : '完成今天打卡'} ${goal.title}`"
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
          <span>
            <strong>{{ goal.completedCount }}/{{ goal.targetCount }}</strong>
            完成次数
          </span>
          <span>
            <strong>{{ goal.daysLeft }}</strong>
            剩余天
          </span>
          <span>
            <strong>{{ goal.percent }}%</strong>
            进度
          </span>
        </div>
        <p class="goal-date">{{ goal.startDate }} - {{ goal.targetDate }}</p>
      </article>
    </section>
  </PageShell>
</template>
