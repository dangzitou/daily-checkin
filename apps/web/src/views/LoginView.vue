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
      <div class="login-hero">
        <div class="login-logo">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <path d="M14 25l7 7 13-14" stroke="#1d6b61" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="login-brand">每日打卡</h1>
        <p class="login-tagline">记录每天完成的小事</p>
      </div>

      <div class="segmented">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</button>
      </div>

      <form class="form" @submit.prevent="submit">
        <label v-if="mode === 'login'">
          <span>用户名或 ID</span>
          <input v-model="identifier" autocomplete="username" required placeholder="输入用户名" />
        </label>
        <template v-else>
          <label>
            <span>用户名</span>
            <input v-model="username" autocomplete="username" minlength="2" required placeholder="给自己取个名字" />
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
            placeholder="至少 6 位"
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
