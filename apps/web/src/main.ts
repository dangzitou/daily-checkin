import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './styles.css';

createApp(App).use(createPinia()).use(router).mount('#app');

// Signal that the app loaded successfully (disables fallback error UI)
(window as any).__appLoaded?.();
