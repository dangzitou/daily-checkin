<script setup lang="ts">
import { LogOut, ShieldCheck, UserRound, Fingerprint } from 'lucide-vue-next';
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
    <div class="account-stack">
      <section class="account-panel account-panel--identity">
        <header>
          <p class="eyebrow">身份信息</p>
          <h2>账号概览</h2>
          <p>当前登录身份与权限会显示在这里，便于确认使用的是哪个账号。</p>
        </header>
        <section class="settings-list">
          <div class="settings-row">
            <span class="task-meta">
              <UserRound :size="14" />
              用户名
            </span>
            <strong>{{ auth.user?.username }}</strong>
          </div>
          <div class="settings-row">
            <span class="task-meta">
              <Fingerprint :size="14" />
              用户 ID
            </span>
            <strong>{{ auth.user?.id }}</strong>
          </div>
          <div class="settings-row">
            <span class="task-meta">
              <ShieldCheck :size="14" />
              权限
            </span>
            <strong>{{ auth.user?.isAdmin ? '管理员' : '普通用户' }}</strong>
          </div>
        </section>
      </section>
      <section class="account-panel account-panel--quiet">
        <header>
          <p class="eyebrow">会话管理</p>
          <h2>登录状态</h2>
          <p>退出后需要重新登录才能继续记录打卡、目标和积分操作。</p>
        </header>
        <button class="secondary-button full-width" type="button" @click="logout">
          <LogOut :size="18" />
          退出登录
        </button>
      </section>
    </div>
  </PageShell>
</template>
