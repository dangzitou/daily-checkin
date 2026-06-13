<script setup lang="ts">
import { Plus, Pencil, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import PageShell from '../components/PageShell.vue';
import { api, ApiError } from '../api';
import type { Prize, Redemption } from '../types';

const prizes = ref<Prize[]>([]);
const redemptions = ref<Redemption[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const formError = ref('');
const busyAction = ref(false);

const form = ref({
  name: '',
  description: '',
  imageUrl: '',
  pointsCost: 100,
  stock: 10,
  sortOrder: 0
});

const activeTab = ref<'prizes' | 'orders'>('prizes');

async function load() {
  loading.value = true;
  try {
    const [p, r] = await Promise.all([
      api.get<Prize[]>('/prizes'),
      api.get<{ redemptions: Redemption[] }>('/redemptions/all').catch(() => ({ redemptions: [] }))
    ]);
    prizes.value = p;
    redemptions.value = r.redemptions;
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.value = { name: '', description: '', imageUrl: '', pointsCost: 100, stock: 10, sortOrder: 0 };
  editingId.value = null;
  formError.value = '';
}

function openCreate() {
  resetForm();
  showForm.value = true;
}

function openEdit(prize: Prize) {
  editingId.value = prize.id;
  form.value = {
    name: prize.name,
    description: prize.description ?? '',
    imageUrl: prize.imageUrl ?? '',
    pointsCost: prize.pointsCost,
    stock: prize.stock,
    sortOrder: prize.sortOrder
  };
  showForm.value = true;
}

async function submitForm() {
  if (!form.value.name.trim()) { formError.value = '请输入奖品名称'; return; }
  if (form.value.pointsCost < 1) { formError.value = '积分需 ≥ 1'; return; }
  busyAction.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await api.put(`/prizes/${editingId.value}`, form.value);
    } else {
      await api.post('/prizes', form.value);
    }
    showForm.value = false;
    await load();
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : '操作失败';
  } finally {
    busyAction.value = false;
  }
}

async function toggleActive(prize: Prize) {
  await api.put(`/prizes/${prize.id}`, { isActive: !prize.isActive });
  await load();
}

async function removePrize(prize: Prize) {
  if (!confirm(`确认删除「${prize.name}」？`)) return;
  await api.delete(`/prizes/${prize.id}`);
  await load();
}

async function updateRedemptionStatus(r: Redemption, status: string) {
  busyAction.value = true;
  try {
    await api.put(`/redemptions/${r.id}/status`, { status });
    await load();
  } finally {
    busyAction.value = false;
  }
}

function statusText(s: string) {
  return { pending: '待处理', approved: '已通过', rejected: '已拒绝', delivered: '已发放' }[s] ?? s;
}

onMounted(load);
</script>

<template>
  <PageShell title="奖品管理">
    <template #action>
      <button v-if="activeTab === 'prizes'" class="primary-button" style="min-height:40px;font-size:14px;" @click="openCreate">
        <Plus :size="18" />
        新增
      </button>
    </template>

    <nav class="segmented">
      <button :class="{ active: activeTab === 'prizes' }" @click="activeTab = 'prizes'">奖品列表</button>
      <button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">兑换订单</button>
    </nav>

    <section v-if="loading" class="empty-state">加载中…</section>

    <!-- Prize List -->
    <template v-else-if="activeTab === 'prizes'">
      <section v-if="prizes.length === 0" class="empty-state actionable-empty">还没有奖品，点击右上角新增</section>
      <section v-else class="manage-list">
        <article v-for="prize in prizes" :key="prize.id" class="manage-row" :class="{ inactive: !prize.isActive }">
          <div>
            <strong>{{ prize.name }}</strong>
            <span>⭐{{ prize.pointsCost }} · 库存{{ prize.stock }} · {{ prize.isActive ? '上架中' : '已下架' }}</span>
          </div>
          <div class="admin-actions">
            <button class="icon-button" aria-label="编辑" @click="openEdit(prize)">
              <Pencil :size="18" />
            </button>
            <button class="icon-button" :aria-label="prize.isActive ? '下架' : '上架'" @click="toggleActive(prize)">
              <ArrowDownCircle v-if="prize.isActive" :size="18" />
              <ArrowUpCircle v-else :size="18" />
            </button>
            <button class="icon-button danger" aria-label="删除" @click="removePrize(prize)">
              <Trash2 :size="18" />
            </button>
          </div>
        </article>
      </section>
    </template>

    <!-- Orders -->
    <template v-else>
      <section v-if="redemptions.length === 0" class="empty-state">暂无兑换记录</section>
      <section v-else class="manage-list">
        <article v-for="r in redemptions" :key="r.id" class="manage-row">
          <div>
            <strong>{{ r.user?.username ?? '用户' }} → {{ r.prize?.name ?? '奖品' }}</strong>
            <span>⭐{{ r.pointsCost }} · {{ new Date(r.createdAt).toLocaleString() }}</span>
          </div>
          <select
            :value="r.status"
            :disabled="busyAction"
            class="status-select"
            @change="updateRedemptionStatus(r, ($event.target as HTMLSelectElement).value)"
          >
            <option value="pending">待处理</option>
            <option value="approved">已通过</option>
            <option value="delivered">已发放</option>
            <option value="rejected">已拒绝</option>
          </select>
        </article>
      </section>
    </template>

    <!-- Modal Form -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-content">
        <h2>{{ editingId ? '编辑奖品' : '新增奖品' }}</h2>
        <form @submit.prevent="submitForm">
          <label>
            奖品名称
            <input v-model="form.name" placeholder="如：星巴克拿铁" />
          </label>
          <label>
            描述（可选）
            <input v-model="form.description" placeholder="简短描述" />
          </label>
          <label>
            图片URL（可选）
            <input v-model="form.imageUrl" placeholder="https://..." />
          </label>
          <label>
            所需积分
            <input v-model.number="form.pointsCost" type="number" min="1" />
          </label>
          <label>
            库存数量
            <input v-model.number="form.stock" type="number" min="0" />
          </label>
          <p v-if="formError" class="error-text">{{ formError }}</p>
          <div class="form-actions">
            <button type="button" class="secondary-button" @click="showForm = false">取消</button>
            <button type="submit" class="primary-button" :disabled="busyAction">
              {{ busyAction ? '保存中…' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </PageShell>
</template>
