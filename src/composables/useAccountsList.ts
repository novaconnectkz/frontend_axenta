import { ref, type Ref } from 'vue';
import accountsService, {
  type UnifiedAccount,
  type UnifiedAccountsStats,
  type UnifiedAccountsResponse,
} from '@/services/accountsService';

interface FiltersValue {
  type: string | null;
  is_active: boolean | null;
  source?: string | null;
}

interface AccountsStats {
  total: number;
  active: number;
  blocked: number;
  clients: number;
  partners: number;
}

interface UseAccountsListContext {
  filters: Ref<FiltersValue>;
  searchQuery: Ref<string>;
  selectedParent: Ref<string>;
  getTotalPages?: () => number;
  onPageChange?: () => void;
}

const animateNumber = (
  current: number,
  target: number,
  setter: (v: number) => void,
  duration = 500,
) => {
  const start = current;
  const startTime = Date.now();
  const tick = () => {
    const progress = Math.min((Date.now() - startTime) / duration, 1);
    setter(Math.round(start + (target - start) * progress));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

export function useAccountsList(ctx: UseAccountsListContext) {
  const accounts = ref<UnifiedAccount[]>([]);
  const isLoading = ref(false);
  const isBackgroundLoading = ref(false);
  const isAxentaLoading = ref(false);
  const lastUpdateTime = ref<Date | null>(null);

  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalItems = ref(0);

  const sortBy = ref<string>('creationDatetime');
  const sortOrder = ref<'asc' | 'desc'>('desc');

  const stats = ref<AccountsStats>({
    total: 0,
    active: 0,
    blocked: 0,
    clients: 0,
    partners: 0,
  });

  const unifiedStats = ref<UnifiedAccountsStats>({
    axenta_total: 0,
    axenta_active: 0,
    axenta_clients: 0,
    axenta_partners: 0,
    wialon_total: 0,
    wialon_active: 0,
    wialon_wh_total: 0,
    wialon_wh_active: 0,
    wialon_wl_total: 0,
    wialon_wl_active: 0,
    skif_total: 0,
    skif_active: 0,
  });

  const updateStatsFromUnified = (s: UnifiedAccountsStats, animate: boolean) => {
    unifiedStats.value = s;
    // stats = axenta-only (для backward-compat с AccountsStats компонентом)
    const total = s.axenta_total;
    const active = s.axenta_active;
    const blocked = total - active;
    const clients = s.axenta_clients;
    const partners = s.axenta_partners;
    if (animate) {
      const cur = { ...stats.value };
      animateNumber(cur.total, total, v => (stats.value.total = v));
      animateNumber(cur.active, active, v => (stats.value.active = v));
      animateNumber(cur.blocked, blocked, v => (stats.value.blocked = v));
      animateNumber(cur.clients, clients, v => (stats.value.clients = v));
      animateNumber(cur.partners, partners, v => (stats.value.partners = v));
    } else {
      stats.value = { total, active, blocked, clients, partners };
    }
  };

  const buildOrdering = (): string => {
    return sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value;
  };

  const loadAccounts = async (isBackground = false): Promise<void> => {
    try {
      if (isBackground) {
        isBackgroundLoading.value = true;
      } else {
        isLoading.value = true;
        isAxentaLoading.value = true;
      }

      const response: UnifiedAccountsResponse = await accountsService.getUnifiedAccounts({
        page: currentPage.value,
        per_page: itemsPerPage.value,
        ordering: buildOrdering(),
        search: ctx.searchQuery.value?.trim() || undefined,
        source: (ctx.filters.value.source as any) || 'all',
        type: (ctx.filters.value.type as any) || undefined,
        is_active: ctx.filters.value.is_active,
        parent: ctx.selectedParent.value?.trim() || undefined,
      });

      accounts.value = response.items;
      totalItems.value = response.total;
      updateStatsFromUnified(response.stats, isBackground && stats.value.total > 0);
      lastUpdateTime.value = new Date();
    } catch (error) {
      console.error('Ошибка загрузки учетных записей:', error);
    } finally {
      if (isBackground) {
        isBackgroundLoading.value = false;
      } else {
        isLoading.value = false;
        isAxentaLoading.value = false;
      }
    }
  };

  const loadStats = async (_isBackground = false, _forceRefresh = false): Promise<void> => {
    // Stats теперь приходит вместе со страницей через unified API.
    // Метод оставлен для backward-compatible вызовов из AccountsPage.
  };

  const invalidateCache = () => {
    // Кэш убран — backend сам merge'ит и пагинирует.
  };

  const goToFirstPage = () => {
    currentPage.value = 1;
    ctx.onPageChange?.();
    loadAccounts();
  };

  const goToLastPage = () => {
    currentPage.value = ctx.getTotalPages?.() ?? 1;
    ctx.onPageChange?.();
    loadAccounts();
  };

  const goToPrevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value -= 1;
      ctx.onPageChange?.();
      loadAccounts();
    }
  };

  const goToNextPage = () => {
    const total = ctx.getTotalPages?.() ?? 1;
    if (currentPage.value < total) {
      currentPage.value += 1;
      ctx.onPageChange?.();
      loadAccounts();
    }
  };

  return {
    accounts,
    stats,
    unifiedStats,
    isLoading,
    isBackgroundLoading,
    isAxentaLoading,
    lastUpdateTime,
    currentPage,
    itemsPerPage,
    totalItems,
    sortBy,
    sortOrder,
    loadAccounts,
    loadStats,
    invalidateCache,
    goToFirstPage,
    goToLastPage,
    goToPrevPage,
    goToNextPage,
  };
}
