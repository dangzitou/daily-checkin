<script setup lang="ts">
import { Plus, Pencil, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import PageShell from '../components/PageShell.vue';
import StatePanel from '../components/StatePanel.vue';
import { api, ApiError } from '../api';
import type { Prize, Redemption } from '../types';

const prizes = ref<Prize[]>([]);
const redemptions = ref<Redemption[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const formError = ref('');
const actionError = ref('');
const busyAction = ref(false);
const deleteTarget = ref<Prize | null>(null);

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
  busyAction.value = true;
  actionError.value = '';
  try {
    await api.put(`/prizes/${prize.id}`, { isActive: !prize.isActive });
    await load();
  } catch (e) {
    actionError.value = e instanceof ApiError ? e.message : '操作失败';
  } finally {
    busyAction.value = false;
  }
}

async function removePrize(prize: Prize) {
  deleteTarget.value = prize;
}

function closeDelete() {
  deleteTarget.value = null;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  busyAction.value = true;
  try {
    await api.delete(`/prizes/${deleteTarget.value.id}`);
    await load();
    closeDelete();
  } finally {
    busyAction.value = false;
  }
}

async function updateRedemptionStatus(r: Redemption, status: string) {
  busyAction.value = true;
  actionError.value = '';
  try {
    await api.put(`/redemptions/${r.id}/status`, { status });
    await load();
  } catch (e) {
    actionError.value = e instanceof ApiError ? e.message : '状态更新失败';
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
      <button v-if="activeTab === 'prizes'" class="primary-button compact-btn" @click="openCreate">
        <Plus :size="18" />
        新增
      </button>
    </template>

    <nav class="segmented">
      <button :class="{ active: activeTab === 'prizes' }" @click="activeTab = 'prizes'">奖品列表</button>
      <button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">兑换订单</button>
    </nav>

    <StatePanel v-if="loading" title="正在加载奖品后台" description="奖品和兑换订单正在同步。" compact />
    <p v-if="actionError" class="error-text" style="margin: 0 0 12px; padding: 8px 12px; border-radius: 8px; background: #fdf0f0;">{{ actionError }}</p>

    <template v-else-if="activeTab === 'prizes'">
      <div class="admin-stack">
        <section class="admin-summary">
          <article class="stat-card">
            <span class="stat-label">奖品总数</span>
            <strong class="stat-value">{{ prizes.length }}</strong>
          </article>
          <article class="stat-card stat-card--accent">
            <span class="stat-label">已上架</span>
            <strong class="stat-value">{{ prizes.filter((prize) => prize.isActive).length }}</strong>
          </article>
          <article class="stat-card">
            <span class="stat-label">库存件数</span>
            <strong class="stat-value">{{ prizes.reduce((sum, prize) => sum + prize.stock, 0) }}</strong>
          </article>
        </section>
        <section class="admin-panel">
          <header>
            <h2>奖品目录</h2>
            <p>当前共 {{ prizes.length }} 个奖品，支持上架、下架、编辑和删除。</p>
          </header>
        </section>
        <StatePanel
          v-if="prizes.length === 0"
          title="还没有奖品"
          description="先新增一个奖品，前台商城才会开始显示可兑换内容。"
          compact
        >
          <button class="secondary-button" type="button" @click="openCreate">新增奖品</button>
        </StatePanel>
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
      </div>
    </template>

    <template v-else>
      <div class="admin-stack">
        <section class="admin-summary">
          <article class="stat-card">
            <span class="stat-label">订单总数</span>
            <strong class="stat-value">{{ redemptions.length }}</strong>
          </article>
          <article class="stat-card stat-card--accent">
            <span class="stat-label">待处理</span>
            <strong class="stat-value">{{ redemptions.filter((item) => item.status === 'pending').length }}</strong>
          </article>
          <article class="stat-card">
            <span class="stat-label">已发放</span>
            <strong class="stat-value">{{ redemptions.filter((item) => item.status === 'delivered').length }}</strong>
          </article>
        </section>
        <section class="admin-panel">
          <header>
            <h2>兑换订单</h2>
            <p>在这里处理用户的兑换状态，状态更新后会立即反映在前台记录里。</p>
          </header>
        </section>
        <StatePanel
          v-if="redemptions.length === 0"
          title="还没有兑换订单"
          description="等用户在前台兑换奖品后，这里会开始显示待处理记录。"
          compact
        />
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
      </div>
    </template>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-content">
        <div class="modal-head">
          <p class="eyebrow">{{ editingId ? '更新奖品信息' : '创建新的奖品条目' }}</p>
          <h2>{{ editingId ? '编辑奖品' : '新增奖品' }}</h2>
        </div>
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
          <div class="form-grid">
            <label>
              所需积分
              <input v-model.number="form.pointsCost" type="number" min="1" />
            </label>
            <label>
              库存数量
              <input v-model.number="form.stock" type="number" min="0" />
            </label>
          </div>
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

    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="closeDelete">
        <div class="confirm-sheet">
          <div class="confirm-head">
            <p class="eyebrow">不可恢复的操作</p>
            <h2>删除奖品</h2>
          </div>
          <div class="confirm-copy">
            <p>删除后将无法恢复这个奖品。</p>
            <p>「{{ deleteTarget.name }}」</p>
          </div>
          <div class="confirm-actions">
            <button type="button" class="secondary-button" @click="closeDelete">取消</button>
            <button type="button" class="danger-button" :disabled="busyAction" @click="confirmDelete">确认删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </PageShell>
</template>
