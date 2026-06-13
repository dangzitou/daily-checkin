<script setup lang="ts">
import { CalendarDays, CheckCircle2, ListTodo, Settings, Target } from 'lucide-vue-next';
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
    <RouterLink to="/goals" class="nav-item" aria-label="目标">
      <Target :size="22" />
      <span>目标</span>
    </RouterLink>
    <RouterLink to="/tasks" class="nav-item" aria-label="任务">
      <ListTodo :size="22" />
      <span>任务</span>
    </RouterLink>
    <RouterLink to="/settings" class="nav-item" aria-label="设置">
      <Settings :size="22" />
      <span>设置</span>
    </RouterLink>
  </nav>
</template>
