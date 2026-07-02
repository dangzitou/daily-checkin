<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
          {{ toast.msg }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(16px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  width: min(90%, 380px);
}

.toast-enter-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
}
</style>
