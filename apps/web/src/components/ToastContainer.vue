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
  gap: 6px;
  pointer-events: none;
  width: min(90%, 380px);
}

.toast {
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(23, 32, 29, 0.1);
}

.toast.success {
  background: var(--primary-soft, #e0f2ee);
  color: var(--primary-strong, #155c55);
  border: 1px solid #9bcfc6;
}

.toast.warn {
  background: #fdf0f0;
  color: var(--danger, #b42318);
  border: 1px solid #e8a0a0;
}

.toast.error {
  background: #fdf0f0;
  color: var(--danger, #b42318);
  border: 1px solid #e8a0a0;
}

.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
