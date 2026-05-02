import { ref, onScopeDispose } from 'vue';

interface UseAutoRefreshContext {
  delay: number;
  callback: () => void | Promise<void>;
}

export function useAutoRefresh(ctx: UseAutoRefreshContext) {
  const intervalId = ref<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value);
    }
    intervalId.value = setInterval(() => {
      ctx.callback();
    }, ctx.delay);
  };

  const stop = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value);
      intervalId.value = null;
    }
  };

  onScopeDispose(stop);

  return { start, stop };
}
