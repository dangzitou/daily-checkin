<script setup lang="ts">
import { CalendarDays, CheckCircle2, ListTodo, User, Target, ShoppingBag } from 'lucide-vue-next';
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
    <RouterLink :to="auth.user?.isAdmin ? '/admin/prizes' : '/goals'" class="nav-item" :aria-label="auth.user?.isAdmin ? '管理' : '目标'">
      <Target v-if="!auth.user?.isAdmin" :size="22" />
      <ShoppingBag v-else :size="22" />
      <span>{{ auth.user?.isAdmin ? '管理' : '目标' }}</span>
    </RouterLink>
    <RouterLink to="/tasks" class="nav-item" aria-label="任务">
      <ListTodo :size="22" />
      <span>任务</span>
    </RouterLink>
    <RouterLink to="/profile" class="nav-item" aria-label="我的">
      <User :size="22" />
      <span>我的</span>
    </RouterLink>
  </nav>
</template>
