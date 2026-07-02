<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import PageShell from '../components/PageShell.vue';
import StatePanel from '../components/StatePanel.vue';
import { api } from '../api';
import { useAuthStore } from '../stores/auth';
import type { PointLog } from '../types';

const auth = useAuthStore();
const logs = ref<PointLog[]>([]);
const loading = ref(true);
const loadError = ref('');

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await api.get<{ logs: PointLog[] }>('/points/logs');
    logs.value = result.logs;
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    loading.value = false;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

onMounted(load);
</script>

<template>
  <PageShell title="积分明细" show-back>
    <template #action>
      <RouterLink to="/shop" class="secondary-button points-action-link">
        去兑换
      </RouterLink>
    </template>

    <div class="points-stack">
      <section class="points-hero">
        <div class="points-balance">
          <span>当前积分</span>
          <strong>{{ auth.user?.points ?? 0 }}</strong>
        </div>
      </section>

      <section class="points-panel">
        <header>
          <h2>积分流水</h2>
          <p>每次打卡奖励、扣减和兑换都会记录在这里，方便回看每天的积分变化。</p>
        </header>
      </section>

      <section v-if="loading" class="log-list">
        <div v-for="i in 4" :key="i" class="skeleton-row short" />
      </section>
      <StatePanel v-else-if="loadError" title="积分记录加载失败" :description="loadError" compact>
        <button class="secondary-button" type="button" @click="load">
          <RefreshCw :size="18" />
          重新加载
        </button>
      </StatePanel>
      <StatePanel v-else-if="logs.length === 0" title="还没有积分记录" description="完成打卡后，这里会显示每一笔积分变化。" compact />
      <section v-else class="log-list">
        <article v-for="log in logs" :key="log.id" class="log-item">
          <div class="log-info">
            <span class="log-reason">{{ log.reason }}</span>
            <span class="log-time">{{ formatDate(log.createdAt) }}</span>
          </div>
          <span class="log-amount" :class="log.amount > 0 ? 'gain' : 'cost'">
            {{ log.amount > 0 ? '+' : '' }}{{ log.amount }}
          </span>
        </article>
      </section>
    </div>
  </PageShell>
</template>
