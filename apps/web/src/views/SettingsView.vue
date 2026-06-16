<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import PageShell from '../components/PageShell.vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function logout() {
  await auth.logout();
  await router.push('/login');
}
</script>

<template>
  <PageShell title="设置" eyebrow="账号" show-back>
    <section class="settings-list">
      <div class="settings-row">
        <span>用户名</span>
        <strong>{{ auth.user?.username }}</strong>
      </div>
      <div class="settings-row">
        <span>用户 ID</span>
        <strong>{{ auth.user?.id }}</strong>
      </div>
    </section>
    <button class="secondary-button full-width" @click="logout">
      <LogOut :size="18" />
      退出登录
    </button>
  </PageShell>
</template>
