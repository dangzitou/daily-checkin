<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const mode = ref<'login' | 'register'>('login');
const identifier = ref('');
const username = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

const title = computed(() => (mode.value === 'login' ? '登录' : '创建账号'));

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    if (mode.value === 'login') {
      await auth.login(identifier.value, password.value);
    } else {
      await auth.register(username.value, password.value);
    }
    await router.push('/');
  } catch (err) {
    error.value = err instanceof Error ? err.message : '操作失败';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-panel">
      <!-- Hero visual -->
      <div class="login-hero">
        <div class="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="23" fill="#1f7268" opacity="0.1"/>
            <circle cx="24" cy="24" r="16" fill="#1f7268" opacity="0.15"/>
            <path d="M16 24.5l5 5 11-12" stroke="#1f7268" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="login-brand">每日打卡</p>
        <p class="login-tagline">记录每天完成的小事</p>
      </div>

      <div class="segmented">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</button>
      </div>

      <form class="form" @submit.prevent="submit">
        <label v-if="mode === 'login'">
          <span>用户名或 ID</span>
          <input v-model="identifier" autocomplete="username" required />
        </label>
        <template v-else>
          <label>
            <span>用户名</span>
            <input v-model="username" autocomplete="username" minlength="2" required />
          </label>
        </template>
        <label>
          <span>密码</span>
          <input
            v-model="password"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            minlength="6"
            required
          />
        </label>
        <p v-if="error" class="error-text">{{ error }}</p>
        <button class="primary-button" :disabled="busy" type="submit">
          {{ busy ? '处理中…' : title }}
        </button>
      </form>
    </section>
  </main>
</template>
