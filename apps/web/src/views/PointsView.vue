<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageShell from '../components/PageShell.vue';
import { api } from '../api';
import { useAuthStore } from '../stores/auth';
import type { PointLog } from '../types';

const auth = useAuthStore();
const logs = ref<PointLog[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const result = await api.get<{ logs: PointLog[] }>('/points/logs');
    logs.value = result.logs;
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
  <PageShell title="我的积分">
    <template #action>
      <RouterLink to="/shop" class="secondary-button" style="min-height:40px;font-size:14px;">
        去兑换
      </RouterLink>
    </template>

    <section class="points-hero">
      <div class="points-balance">
        <span>当前积分</span>
        <strong>{{ auth.user?.points ?? 0 }}</strong>
      </div>
    </section>

    <section v-if="loading" class="log-list">
      <div v-for="i in 4" :key="i" class="skeleton-row" style="height:52px" />
    </section>
    <section v-else-if="logs.length === 0" class="empty-state">还没有积分记录，快去打卡吧</section>
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
  </PageShell>
</template>
