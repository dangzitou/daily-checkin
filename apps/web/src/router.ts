import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('./views/LoginView.vue'), meta: { guest: true } },
    { path: '/', component: () => import('./views/TodayView.vue') },
    { path: '/calendar', component: () => import('./views/CalendarView.vue') },
    { path: '/tasks', component: () => import('./views/ManageView.vue') },
    { path: '/goals', redirect: '/tasks' },
    { path: '/feed', component: () => import('./views/FeedView.vue') },
    { path: '/settings', component: () => import('./views/SettingsView.vue') },
    { path: '/shop', component: () => import('./views/ShopView.vue') },
    { path: '/points', component: () => import('./views/PointsView.vue') },
    { path: '/profile', component: () => import('./views/ProfileView.vue') },
    { path: '/admin/prizes', component: () => import('./views/AdminPrizesView.vue'), meta: { admin: true } },
  ],
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

  if (to.meta.admin && !auth.user?.isAdmin) {
    return '/';
  }

  return true;
});
