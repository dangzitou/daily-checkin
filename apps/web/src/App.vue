<script setup lang="ts">
import { CalendarDays, CheckCircle2, ListTodo, Megaphone, User, ShoppingBag } from 'lucide-vue-next';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();
</script>

<template>
  <RouterView />
  <nav v-if="$route.path !== '/login'" class="bottom-nav" aria-label="主导航">
    <RouterLink to="/" class="nav-item" aria-label="今日">
      <CheckCircle2 :size="22" />
      <span>今日</span>
    </RouterLink>
    <RouterLink to="/calendar" class="nav-item" aria-label="日历">
      <CalendarDays :size="22" />
      <span>日历</span>
    </RouterLink>
    <RouterLink :to="auth.user?.isAdmin ? '/admin/prizes' : '/tasks'" class="nav-item" :aria-label="auth.user?.isAdmin ? '管理' : '任务'">
      <ShoppingBag v-if="auth.user?.isAdmin" :size="22" />
      <ListTodo v-else :size="22" />
      <span>{{ auth.user?.isAdmin ? '管理' : '任务' }}</span>
    </RouterLink>
    <RouterLink to="/feed" class="nav-item" aria-label="广场">
      <Megaphone :size="22" />
      <span>广场</span>
    </RouterLink>
    <RouterLink to="/profile" class="nav-item" aria-label="我的">
      <User :size="22" />
      <span>我的</span>
    </RouterLink>
  </nav>
</template>
