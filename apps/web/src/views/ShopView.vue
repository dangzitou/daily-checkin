<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import PageShell from '../components/PageShell.vue';
import StatePanel from '../components/StatePanel.vue';
import { api, ApiError } from '../api';
import { useToast } from '../composables/useToast';
import { useAuthStore } from '../stores/auth';
import type { Prize, Redemption } from '../types';

const auth = useAuthStore();
const { show: showToast } = useToast();
const prizes = ref<Prize[]>([]);
const myRedemptions = ref<Redemption[]>([]);
const loading = ref(true);
const loadError = ref('');
const busyId = ref<number | null>(null);

const myPoints = computed(() => auth.user?.points ?? 0);

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const p = await api.get<Prize[]>('/prizes');
    prizes.value = Array.isArray(p) ? p.filter(pr => pr.isActive && pr.stock > 0) : [];
    try {
      const r = await api.get<{ redemptions: Redemption[] }>('/redemptions/my');
      myRedemptions.value = r.redemptions ?? [];
    } catch {
      myRedemptions.value = [];
    }
  } catch (e) {
    loadError.value = e instanceof ApiError ? `${e.status}: ${e.message}` : '加载失败';
  } finally {
    loading.value = false;
  }
}

async function redeem(prize: Prize) {
  if (myPoints.value < prize.pointsCost) return;
  busyId.value = prize.id;
  try {
    await api.post('/redemptions', { prizeId: prize.id });
    await auth.loadMe();
    await load();
    showToast('兑换成功');
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '兑换失败', 'error');
  } finally {
    busyId.value = null;
  }
}

function statusText(s: string) {
  return { pending: '待处理', approved: '已通过', rejected: '已拒绝', delivered: '已发放' }[s] ?? s;
}

onMounted(load);
</script>

<template>
  <PageShell title="积分商城" show-back>
    <template #action>
      <RouterLink to="/points" class="points-badge" aria-label="我的积分">
        ⭐ {{ myPoints }}
      </RouterLink>
    </template>

    <div class="points-stack">
      <section class="points-hero">
        <div class="points-balance shop-balance">
          <span>当前可用积分</span>
          <strong>{{ myPoints }}</strong>
          <p>有库存且已上架的奖品会出现在这里，兑换后会同步进入处理记录。</p>
        </div>
      </section>

      <section class="points-panel">
        <header>
          <h2>可兑换奖品</h2>
          <p>本期共 {{ prizes.length }} 个奖品可兑换，支持实时扣减积分。</p>
        </header>
      </section>

      <section v-if="loading" class="prize-grid">
        <div v-for="i in 3" :key="i" class="skeleton-row tall" />
      </section>

      <StatePanel v-else-if="loadError" title="奖品没有加载出来" :description="loadError" compact>
        <button class="secondary-button" type="button" @click="load">重新加载</button>
      </StatePanel>

      <StatePanel
        v-else-if="prizes.length === 0"
        title="暂时没有可兑换的奖品"
        description="等管理员上架新奖品后，这里会自动更新。"
        compact
      >
        <RouterLink to="/points" class="secondary-button">查看积分明细</RouterLink>
      </StatePanel>

      <section v-else class="prize-grid">
        <article v-for="prize in prizes" :key="prize.id" class="prize-card">
          <div class="prize-image" :class="{ 'has-img': prize.imageUrl }">
            <img v-if="prize.imageUrl" :src="prize.imageUrl" :alt="prize.name" />
            <span v-else class="prize-emoji">🎁</span>
          </div>
          <div class="prize-info">
            <strong>{{ prize.name }}</strong>
            <p v-if="prize.description" class="prize-desc">{{ prize.description }}</p>
            <div class="prize-meta">
              <span class="prize-cost">⭐ {{ prize.pointsCost }}</span>
              <span class="prize-stock">库存 {{ prize.stock }}</span>
            </div>
            <button
              class="primary-button full-width"
              :disabled="myPoints < prize.pointsCost || busyId === prize.id"
              @click="redeem(prize)"
            >
              {{ myPoints < prize.pointsCost ? '积分不足' : busyId === prize.id ? '兑换中…' : '立即兑换' }}
            </button>
          </div>
        </article>
      </section>

      <section v-if="!loading && myRedemptions.length" class="redemption-history">
        <div class="page-intro">
          <h2>兑换记录</h2>
          <p>最近的兑换申请会在这里显示处理状态。</p>
        </div>
        <article v-for="r in myRedemptions" :key="r.id" class="redemption-row">
          <div>
            <strong>{{ r.prize?.name ?? '奖品' }}</strong>
            <span class="redemption-time">{{ new Date(r.createdAt).toLocaleDateString() }}</span>
          </div>
          <span class="status-pill" :class="r.status">{{ statusText(r.status) }}</span>
        </article>
      </section>
    </div>
  </PageShell>
</template>
