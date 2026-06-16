import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';
import AdminPrizesView from './views/AdminPrizesView.vue';
import CalendarView from './views/CalendarView.vue';
import FeedView from './views/FeedView.vue';
import LoginView from './views/LoginView.vue';
import ManageView from './views/ManageView.vue';
import PointsView from './views/PointsView.vue';
import ProfileView from './views/ProfileView.vue';
import SettingsView from './views/SettingsView.vue';
import ShopView from './views/ShopView.vue';
import TodayView from './views/TodayView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { guest: true } },
    { path: '/', component: TodayView },
    { path: '/calendar', component: CalendarView },
    { path: '/tasks', component: ManageView },
    { path: '/goals', redirect: '/tasks' },
    { path: '/feed', component: FeedView },
    { path: '/settings', component: SettingsView },
    { path: '/shop', component: ShopView },
    { path: '/points', component: PointsView },
    { path: '/profile', component: ProfileView },
    { path: '/admin/prizes', component: AdminPrizesView, meta: { admin: true } },
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
