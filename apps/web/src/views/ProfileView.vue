<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { LogOut, Star, Gift, Settings, ChevronRight, Award } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import PageShell from '../components/PageShell.vue';
import { useAuthStore } from '../stores/auth';
import { api } from '../api';

const auth = useAuthStore();
const router = useRouter();
const balance = ref(0);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await api.get<{ balance: number }>('/points/balance');
    balance.value = res.balance;
  } catch {
    balance.value = auth.user?.points ?? 0;
  } finally {
    loading.value = false;
  }
});

async function logout() {
  await auth.logout();
  await router.push('/login');
}
</script>

<template>
  <PageShell title="我的">
    <div class="account-stack">
      <section class="profile-card">
        <div class="profile-main">
          <div class="profile-avatar">
            {{ auth.user?.username?.charAt(0)?.toUpperCase() ?? '?' }}
          </div>
          <div class="profile-info">
            <p class="eyebrow">当前账号</p>
            <h2>{{ auth.user?.username }}</h2>
            <p class="profile-points">
              <Star :size="14" class="points-star" />
              {{ loading ? '…' : balance }} 积分
            </p>
          </div>
        </div>
        <div class="profile-meta">
          <div v-if="auth.user?.isAdmin" class="profile-badge">
            <Award :size="14" />
            管理员
          </div>
          <div class="profile-badge profile-badge--soft">
            ID {{ auth.user?.id }}
          </div>
        </div>
      </section>

      <section class="account-panel">
        <header class="account-panel-head">
          <div>
            <p class="eyebrow">快捷入口</p>
            <h2>常用操作</h2>
          </div>
          <p>把积分、兑换和账号设置放在一个固定区域里，查找更直接。</p>
        </header>
        <section class="profile-menu">
          <button class="profile-menu-item" type="button" @click="router.push('/shop')">
            <Gift :size="18" />
            <span>积分商城</span>
            <ChevronRight :size="16" class="arrow" />
          </button>
          <button class="profile-menu-item" type="button" @click="router.push('/points')">
            <Star :size="18" />
            <span>积分明细</span>
            <ChevronRight :size="16" class="arrow" />
          </button>
          <button class="profile-menu-item" type="button" @click="router.push('/settings')">
            <Settings :size="18" />
            <span>账号设置</span>
            <ChevronRight :size="16" class="arrow" />
          </button>
        </section>
      </section>

      <section class="account-panel account-panel--quiet">
        <header class="account-panel-head">
          <div>
            <p class="eyebrow">会话</p>
            <h2>登录状态</h2>
          </div>
          <p>退出后需要重新登录，当前的打卡、目标和积分记录不会丢失。</p>
        </header>
        <button class="secondary-button full-width logout-btn" type="button" @click="logout">
          <LogOut :size="16" />
          退出登录
        </button>
      </section>
    </div>
  </PageShell>
</template>
