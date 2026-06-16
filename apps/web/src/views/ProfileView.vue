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
    <!-- User Card -->
    <section class="profile-card">
      <div class="profile-avatar">
        {{ auth.user?.username?.charAt(0)?.toUpperCase() ?? '?' }}
      </div>
      <div class="profile-info">
        <h2>{{ auth.user?.username }}</h2>
        <p class="profile-points">
          <Star :size="14" class="points-star" />
          {{ loading ? '…' : balance }} 积分
        </p>
      </div>
      <div v-if="auth.user?.isAdmin" class="profile-badge">
        <Award :size="14" />
        管理员
      </div>
    </section>

    <!-- Menu Items -->
    <section class="profile-menu">
      <button class="profile-menu-item" @click="router.push('/shop')">
        <Gift :size="18" />
        <span>积分商城</span>
        <ChevronRight :size="16" class="arrow" />
      </button>
      <button class="profile-menu-item" @click="router.push('/points')">
        <Star :size="18" />
        <span>积分明细</span>
        <ChevronRight :size="16" class="arrow" />
      </button>
      <button class="profile-menu-item" @click="router.push('/settings')">
        <Settings :size="18" />
        <span>账号设置</span>
        <ChevronRight :size="16" class="arrow" />
      </button>
    </section>

    <button class="secondary-button full-width logout-btn" @click="logout">
      <LogOut :size="16" />
      退出登录
    </button>
  </PageShell>
</template>
