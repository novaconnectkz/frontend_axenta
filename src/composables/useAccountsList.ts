import { ref, type Ref } from 'vue';
import accountsService, { type Account } from '@/services/accountsService';

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
  isMultipleCompanySearch: () => boolean;
  companySearchTermsArray: () => string[];
  getTotalPages?: () => number;
  onPageChange?: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

export function useAccountsList(ctx: UseAccountsListContext) {
  const accounts = ref<Account[]>([]);
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

  const allAccountsCache = ref<Account[]>([]);
  const cacheTimestamp = ref<Date | null>(null);

  const areAccountsEqual = (oldAccounts: Account[], newAccounts: Account[]): boolean => {
    if (oldAccounts.length !== newAccounts.length) return false;
    for (let i = 0; i < oldAccounts.length; i++) {
      const o = oldAccounts[i];
      const n = newAccounts[i];
      if (
        o.id !== n.id ||
        o.name !== n.name ||
        o.isActive !== n.isActive ||
        o.objectsActive !== n.objectsActive ||
        o.objectsTotal !== n.objectsTotal ||
        o.blockingDatetime !== n.blockingDatetime ||
        o.daysBeforeBlocking !== n.daysBeforeBlocking
      ) {
        return false;
      }
    }
    return true;
  };

  const updateAccountsSmooth = async (newAccounts: Account[]): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => {
        accounts.value = newAccounts;
        resolve();
      }, 50);
    });
  };

  const updateStatsSmooth = async (newStats: AccountsStats): Promise<void> => {
    return new Promise(resolve => {
      const duration = 500;
      const startTime = Date.now();
      const startStats = { ...stats.value };

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        stats.value = {
          total: Math.round(startStats.total + (newStats.total - startStats.total) * progress),
          active: Math.round(startStats.active + (newStats.active - startStats.active) * progress),
          blocked: Math.round(startStats.blocked + (newStats.blocked - startStats.blocked) * progress),
          clients: Math.round(startStats.clients + (newStats.clients - startStats.clients) * progress),
          partners: Math.round(startStats.partners + (newStats.partners - startStats.partners) * progress),
        };

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  };

  const loadAccounts = async (isBackground = false) => {
    try {
      if (isBackground) {
        isBackgroundLoading.value = true;
      } else {
        isLoading.value = true;
        isAxentaLoading.value = true;
      }

      let searchParam = ctx.searchQuery.value || '';
      if (ctx.selectedParent.value && ctx.selectedParent.value.trim() !== '') {
        searchParam = searchParam ? `${searchParam} ${ctx.selectedParent.value}` : ctx.selectedParent.value;
      }

      const requestParams = {
        ...ctx.filters.value,
        page: currentPage.value,
        per_page: itemsPerPage.value,
        search: searchParam || undefined,
        ordering: sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value,
      };

      const response = await accountsService.getAccounts(requestParams);

      const hasServerSupportedFilters = ctx.filters.value.type ||
        (ctx.selectedParent.value && ctx.selectedParent.value.trim() !== '') ||
        (ctx.searchQuery.value && ctx.searchQuery.value.trim() !== '') ||
        ctx.filters.value.is_active !== null;

      const isMultiSearch = ctx.searchQuery.value && ctx.searchQuery.value.includes(',');
      const hasClientOnlyFilters = !!isMultiSearch;
      // Merge-режим: source = null (все системы) — нужно грузить все axenta для корректного merge с wialon на стороне клиента, иначе двойная пагинация (бэк paginated + client slice) теряет записи на стр.2+
      const isMergeMode = !ctx.filters.value.source;
      const hasActiveFilters = !!hasServerSupportedFilters || hasClientOnlyFilters || isMergeMode;

      if (hasActiveFilters) {
        if (hasServerSupportedFilters && !hasClientOnlyFilters && !isMergeMode) {
          accounts.value = response.results;
          totalItems.value = response.count;
          lastUpdateTime.value = new Date();
          return;
        }

        const allRecordsParams = {
          page: 1,
          per_page: 1000,
          ordering: requestParams.ordering,
        };

        const now = new Date();
        const isCacheValid = cacheTimestamp.value &&
          allAccountsCache.value.length > 0 &&
          (now.getTime() - cacheTimestamp.value.getTime()) < CACHE_DURATION;

        let allRecordsResponse: { results: Account[] };
        if (isCacheValid) {
          allRecordsResponse = { results: [...allAccountsCache.value] };
        } else {
          // Загружаем page=1 чтобы узнать count, потом остальные страницы параллельно через Promise.all.
          // Раньше было sequential while-loop — каждая страница ждала предыдущую (3 страницы × 1с = 3с).
          // Теперь page=1 (~1с) + max(page2..N) ≈ ~1.5с total.
          const firstPage = await accountsService.getAccounts({
            ...allRecordsParams,
            page: 1,
          });

          const total = firstPage.count || 0;
          const perPage = allRecordsParams.per_page;
          const totalPages = Math.min(Math.ceil(total / perPage), 10); // safety cap = 10K records max

          let allResults: Account[] = [...firstPage.results];

          if (totalPages > 1 && firstPage.results.length === perPage) {
            const remainingRequests: Promise<{ results: Account[] }>[] = [];
            for (let p = 2; p <= totalPages; p++) {
              remainingRequests.push(
                accountsService.getAccounts({ ...allRecordsParams, page: p })
              );
            }
            const restResponses = await Promise.all(remainingRequests);
            for (const resp of restResponses) {
              allResults = [...allResults, ...resp.results];
            }
          }

          allRecordsResponse = { results: allResults };
          allAccountsCache.value = allResults;
          cacheTimestamp.value = now;
        }

        let allFilteredResults = [...allRecordsResponse.results];

        if (ctx.filters.value.is_active !== null && ctx.filters.value.is_active !== undefined) {
          allFilteredResults = allFilteredResults.filter(a => a.isActive === ctx.filters.value.is_active);
        }

        if (ctx.filters.value.type) {
          allFilteredResults = allFilteredResults.filter(a => a.type === ctx.filters.value.type);
        }

        if (ctx.searchQuery.value) {
          if (ctx.isMultipleCompanySearch()) {
            const searchTerms = ctx.companySearchTermsArray().map(term => term.toLowerCase());
            // Multi-search ищет только в name + adminFullname. parent/hierarchy исключены, иначе при поиске "ООО,Иваново" проходят дочерние записи родителей с "ООО" в названии — поведение неинтуитивное
            allFilteredResults = allFilteredResults.filter(account => {
              const name = account.name?.toLowerCase() || '';
              const admin = account.adminFullname?.toLowerCase() || '';
              return searchTerms.some(t => name.includes(t) || admin.includes(t));
            });
          } else {
            const query = ctx.searchQuery.value.toLowerCase();
            allFilteredResults = allFilteredResults.filter(a =>
              a.name.toLowerCase().includes(query) ||
              a.adminFullname?.toLowerCase().includes(query) ||
              a.parentAccountName?.toLowerCase().includes(query)
            );
          }
        }

        if (ctx.selectedParent.value && ctx.selectedParent.value.trim() !== '') {
          const parent = ctx.selectedParent.value;
          allFilteredResults = allFilteredResults.filter(account => {
            // Прямой parent через parentAccountName (точное совпадение, не includes)
            if (account.parentAccountName === parent) return true;
            // Fallback: разбираем hierarchy, берём только direct parent (предпоследний элемент)
            if (account.hierarchy) {
              const parts = account.hierarchy.split(' > ');
              if (parts.length >= 2 && parts[parts.length - 2] === parent) return true;
            }
            return false;
          });
        }

        // В merge-режиме отдаём полный список — пагинацию делает useMergedAccounts после слияния с wialon. Иначе при двойной пагинации (бэк → useAccountsList → useMergedAccounts) на стр.2+ список ломается, т.к. в merged-массиве [paginated_axenta + wialon] слайс выкидывает axenta, оставляя только хвост wialon
        if (isMergeMode) {
          response.results = allFilteredResults;
          response.count = allFilteredResults.length;
        } else {
          const startIndex = (currentPage.value - 1) * itemsPerPage.value;
          const endIndex = startIndex + itemsPerPage.value;
          const paginatedResults = allFilteredResults.slice(startIndex, endIndex);

          response.results = paginatedResults;
          response.count = allFilteredResults.length;
        }
      }

      if (response.count !== undefined && response.count >= 0) {
        totalItems.value = response.count;
      }

      if (!hasActiveFilters) {
        if (isBackground && accounts.value.length > 0) {
          const hasChanges = !areAccountsEqual(accounts.value, response.results);
          if (hasChanges) {
            await updateAccountsSmooth(response.results);
          }
        } else {
          accounts.value = response.results;
        }
      } else {
        accounts.value = response.results;
      }
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

  const loadStats = async (isBackground = false, forceRefresh = false) => {
    try {
      const statsData = await accountsService.getAccountsStats(forceRefresh);

      if (isBackground) {
        const hasChanged =
          stats.value.total !== statsData.total ||
          stats.value.active !== statsData.active ||
          stats.value.clients !== statsData.clients ||
          stats.value.partners !== statsData.partners;

        if (hasChanged) {
          await updateStatsSmooth(statsData);
        }
      } else {
        stats.value = statsData;
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const invalidateCache = () => {
    allAccountsCache.value = [];
    cacheTimestamp.value = null;
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
