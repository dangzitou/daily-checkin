<template>
  <main class="page-shell">
    <header class="page-header">
      <div class="page-header-left">
        <button v-if="showBack" class="back-btn" type="button" aria-label="返回" @click="goBack">
          <ChevronLeft :size="20" />
        </button>
        <div>
          <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
          <h1>{{ title }}</h1>
        </div>
      </div>
      <slot name="action" />
    </header>
    <slot />
  </main>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const props = defineProps<{
  title: string;
  eyebrow?: string;
  showBack?: boolean;
}>();

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}
</script>
