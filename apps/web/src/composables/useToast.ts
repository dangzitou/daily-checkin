import { ref } from 'vue';

export type ToastType = 'success' | 'warn' | 'error';

interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
  function show(msg: string, type: ToastType = 'success', duration = 2500) {
    const id = nextId++;
    toasts.value.push({ id, msg, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, duration);
  }

  return { toasts, show };
}
