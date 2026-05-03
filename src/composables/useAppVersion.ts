import { ref, computed, type ComputedRef } from 'vue';
import packageJson from '../../package.json';
import apiClient from '@/services/api';

declare const __COMMIT_COUNT__: number;

const FRONTEND_COMMIT_COUNT: number = (typeof __COMMIT_COUNT__ !== 'undefined') ? __COMMIT_COUNT__ : 0;
const MAJOR: string = (packageJson.version || '1.0.0').split('.')[0] || '1';

const backendCommitCount = ref<number | null>(null);
let fetchInFlight = false;

async function fetchBackendVersion(): Promise<void> {
  if (fetchInFlight || backendCommitCount.value !== null) return;
  fetchInFlight = true;
  try {
    const res = await apiClient.get<{ backend_commit_count: string }>('/version');
    const count = parseInt(res.data?.backend_commit_count || '0', 10);
    backendCommitCount.value = isNaN(count) ? 0 : count;
  } catch {
    backendCommitCount.value = 0;
  } finally {
    fetchInFlight = false;
  }
}

/**
 * Composable для версии приложения в формате "MAJOR.{backend_commit_count}.{frontend_commit_count}".
 * Backend count подтягивается с GET /api/version (lazy + кэш).
 * До получения ответа возвращает frontend-only "1.0.{front}" чтобы не было пустого места.
 */
export function useAppVersion(): { version: ComputedRef<string>; refresh: () => Promise<void> } {
  // Триггерим fetch при первом использовании
  if (backendCommitCount.value === null && !fetchInFlight) {
    fetchBackendVersion();
  }

  const version = computed(() => {
    const isDev = import.meta.env.DEV === true;
    const back = backendCommitCount.value ?? 0;
    const front = FRONTEND_COMMIT_COUNT;
    const base = `${MAJOR}.${back}.${front}`;
    return isDev ? `${base}-dev` : base;
  });

  return { version, refresh: fetchBackendVersion };
}
