<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  compact?: boolean;
}>();
</script>

<template>
  <section class="state-panel" :class="{ compact }">
    <div class="state-panel-mark"></div>
    <div class="state-panel-copy">
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="state-panel-actions">
      <slot />
    </div>
  </section>
</template>
