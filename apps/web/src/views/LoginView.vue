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

const title = computed(() => (mode.value === 'login' ? '登录打卡' : '创建账号'));

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
      <p class="eyebrow">每日任务</p>
      <h1>{{ title }}</h1>
      <p class="login-subtitle">用一个账号记录每天完成的小事。</p>

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
          {{ busy ? '处理中' : title }}
        </button>
      </form>
    </section>
  </main>
</template>
