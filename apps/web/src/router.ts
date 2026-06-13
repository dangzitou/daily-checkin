import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';
import CalendarView from './views/CalendarView.vue';
import GoalsView from './views/GoalsView.vue';
import LoginView from './views/LoginView.vue';
import SettingsView from './views/SettingsView.vue';
import TasksView from './views/TasksView.vue';
import TodayView from './views/TodayView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { guest: true } },
    { path: '/', component: TodayView },
    { path: '/calendar', component: CalendarView },
    { path: '/goals', component: GoalsView },
    { path: '/tasks', component: TasksView },
    { path: '/settings', component: SettingsView }
  ]
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.user && !auth.loading) {
    await auth.loadMe();
  }

  if (!to.meta.guest && !auth.user) {
    return '/login';
  }

  if (to.meta.guest && auth.user) {
    return '/';
  }

  return true;
});
