<script setup lang="ts">
import { CalendarDays, CheckCircle2, ListTodo, Megaphone, User, ShoppingBag } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import ToastContainer from './components/ToastContainer.vue';

const auth = useAuthStore();
const route = useRoute();

function navActive(path: string): boolean {
  return route.path === path;
}
</script>

<template>
  <RouterView />
  <ToastContainer />
  <nav v-if="$route.path !== '/login'" class="bottom-nav" aria-label="主导航">
    <RouterLink to="/" class="nav-item" :class="{ active: navActive('/') }" aria-label="今日">
      <CheckCircle2 :size="20" :stroke-width="1.8" />
      <span>今日</span>
    </RouterLink>
    <RouterLink to="/calendar" class="nav-item" :class="{ active: navActive('/calendar') }" aria-label="日历">
      <CalendarDays :size="20" :stroke-width="1.8" />
      <span>日历</span>
    </RouterLink>
    <RouterLink :to="auth.user?.isAdmin ? '/admin/prizes' : '/tasks'" class="nav-item" :class="{ active: navActive('/tasks') || navActive('/admin/prizes') }" :aria-label="auth.user?.isAdmin ? '管理' : '任务'">
      <ShoppingBag v-if="auth.user?.isAdmin" :size="20" :stroke-width="1.8" />
      <ListTodo v-else :size="20" :stroke-width="1.8" />
      <span>{{ auth.user?.isAdmin ? '管理' : '任务' }}</span>
    </RouterLink>
    <RouterLink to="/feed" class="nav-item" :class="{ active: navActive('/feed') }" aria-label="广场">
      <Megaphone :size="20" :stroke-width="1.8" />
      <span>广场</span>
    </RouterLink>
    <RouterLink to="/profile" class="nav-item" :class="{ active: navActive('/profile') }" aria-label="我的">
      <User :size="20" :stroke-width="1.8" />
      <span>我的</span>
    </RouterLink>
  </nav>
</template>
