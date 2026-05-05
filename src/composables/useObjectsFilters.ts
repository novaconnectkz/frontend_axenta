import { computed, ref, type Ref } from 'vue';
import { debounce } from 'lodash-es';
import type { ObjectFilters } from '@/types/objects';

interface UseObjectsFiltersContext {
  loadObjects: () => Promise<void>;
  pagination: Ref<{ page: number; per_page: number }>;
}

export const OBJECTS_PERSIST_KEY = 'objects_page_state_v2';

interface PersistedState {
  search?: string;
  source?: string | null;
  status?: string | null;
  type?: string | null;
  contract_id?: number | null;
  location_id?: number | null;
  template_id?: number | null;
  ordering?: string;
  showDeleted?: boolean;
  page?: number;
  per_page?: number;
}

export function loadPersistedObjectsState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(OBJECTS_PERSIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useObjectsFilters(ctx: UseObjectsFiltersContext) {
  const persisted = loadPersistedObjectsState();

  const showDeletedObjects = ref<boolean>(!!persisted?.showDeleted);

  const filters = ref<ObjectFilters & { source?: string | null }>({
    search: persisted?.search ?? '',
    status: (persisted?.status as any) ?? undefined,
    type: (persisted?.type as any) ?? undefined,
    contract_id: persisted?.contract_id ?? undefined,
    location_id: persisted?.location_id ?? undefined,
    template_id: persisted?.template_id ?? undefined,
    source: persisted?.source ?? null,
    ordering: persisted?.ordering ?? '-createdAt',
  });

  const advancedFilters = ref({
    accountName: '',
    creatorName: '',
    deviceTypeName: '',
    uniqueId: '',
    imei: '',
    phoneNumber: '',
  });

  const showSearchHistory = ref(false);
  const showAdvancedSearch = ref(false);
  const showFilters = ref(false);
  const loadingSuggestions = ref(false);
  const searchSuggestions = ref<Array<{ title: string; subtitle: string; icon: string; value: string }>>([]);
  const searchHistory = ref<string[]>([]);

  const hasActiveFilters = computed(() => {
    return !!(filters.value.search || filters.value.source) || showDeletedObjects.value;
  });

  const activeFiltersCount = computed(() => {
    let count = 0;
    if (filters.value.search) count++;
    if (filters.value.source) count++;
    if (showDeletedObjects.value) count++;
    return count;
  });

  const savePersistedState = () => {
    try {
      localStorage.setItem(OBJECTS_PERSIST_KEY, JSON.stringify({
        search: filters.value.search,
        source: filters.value.source ?? null,
        status: filters.value.status ?? null,
        type: filters.value.type ?? null,
        contract_id: filters.value.contract_id ?? null,
        location_id: filters.value.location_id ?? null,
        template_id: filters.value.template_id ?? null,
        ordering: filters.value.ordering,
        showDeleted: showDeletedObjects.value,
        page: ctx.pagination.value.page,
        per_page: ctx.pagination.value.per_page,
      }));
    } catch {/* ignore */}
  };

  const debouncedSearch = debounce(() => {
    if (filters.value.search && filters.value.search.trim() && !searchHistory.value.includes(filters.value.search.trim())) {
      searchHistory.value.unshift(filters.value.search.trim());
      if (searchHistory.value.length > 10) {
        searchHistory.value = searchHistory.value.slice(0, 10);
      }
      localStorage.setItem('objects_search_history', JSON.stringify(searchHistory.value));
    }
    ctx.pagination.value.page = 1;
    ctx.loadObjects();
  }, 500);

  const debouncedAdvancedSearch = debounce(() => {
    Object.assign(filters.value, advancedFilters.value);
    ctx.pagination.value.page = 1;
    ctx.loadObjects();
  }, 500);

  const clearFilters = () => {
    filters.value = {
      search: '',
      status: undefined,
      type: undefined,
      contract_id: undefined,
      location_id: undefined,
      template_id: undefined,
      source: null,
    };
    advancedFilters.value = {
      accountName: '',
      creatorName: '',
      deviceTypeName: '',
      uniqueId: '',
      imei: '',
      phoneNumber: '',
    };
    showDeletedObjects.value = false;
    ctx.pagination.value.page = 1;
    ctx.loadObjects();
  };

  const handleSearchInput = async (value: string) => {
    if (!value || value.length < 2) {
      searchSuggestions.value = [];
      return;
    }

    loadingSuggestions.value = true;

    try {
      const suggestions: Array<{ title: string; subtitle: string; icon: string; value: string }> = [];

      searchHistory.value
        .filter(item => item.toLowerCase().includes(value.toLowerCase()))
        .forEach(item => {
          suggestions.push({
            title: item,
            subtitle: 'Из истории поиска',
            icon: 'mdi-history',
            value: item,
          });
        });

      if (value.match(/^\d+$/)) {
        suggestions.push({
          title: `Поиск по ID: ${value}`,
          subtitle: 'Поиск объекта по идентификатору',
          icon: 'mdi-identifier',
          value,
        });
      }

      if (value.match(/^\d{15}$/)) {
        suggestions.push({
          title: `Поиск по IMEI: ${value}`,
          subtitle: 'Поиск объекта по IMEI',
          icon: 'mdi-barcode',
          value,
        });
      }

      if (value.match(/^\+?\d[\d\s\-\(\)]+$/)) {
        suggestions.push({
          title: `Поиск по номеру: ${value}`,
          subtitle: 'Поиск объекта по номеру телефона',
          icon: 'mdi-phone',
          value,
        });
      }

      searchSuggestions.value = suggestions.slice(0, 8);
    } catch (error) {
      console.error('Ошибка получения предложений поиска:', error);
    } finally {
      loadingSuggestions.value = false;
    }
  };

  const loadSearchHistory = () => {
    try {
      const saved = localStorage.getItem('objects_search_history');
      if (saved) searchHistory.value = JSON.parse(saved);
    } catch (error) {
      console.error('Ошибка загрузки истории поиска:', error);
    }
  };

  const clearSearchHistory = () => {
    searchHistory.value = [];
    localStorage.removeItem('objects_search_history');
  };

  const removeFromHistory = (index: number) => {
    searchHistory.value.splice(index, 1);
    localStorage.setItem('objects_search_history', JSON.stringify(searchHistory.value));
  };

  const applyHistorySearch = (searchTerm: string) => {
    filters.value.search = searchTerm;
    debouncedSearch();
  };

  const quickFilters = ref([
    { key: 'active', label: 'Активные', icon: 'mdi-check-circle', filter: { is_active: true } },
    { key: 'inactive', label: 'Неактивные', icon: 'mdi-pause-circle', filter: { is_active: false } },
    { key: 'vehicles', label: 'Транспорт', icon: 'mdi-car', filter: { type: 'vehicle' } },
    { key: 'equipment', label: 'Оборудование', icon: 'mdi-tools', filter: { type: 'equipment' } },
    { key: 'scheduled_delete', label: 'К удалению', icon: 'mdi-clock-alert', filter: { status: 'scheduled_delete' } },
    { key: 'recent', label: 'Недавние', icon: 'mdi-clock-outline', filter: { ordering: '-created_at' } },
  ]);

  const isQuickFilterActive = (filter: any): boolean => {
    return Object.entries(filter.filter).every(([key, value]) => {
      return (filters.value as any)[key] === value;
    });
  };

  const toggleQuickFilter = (filter: any) => {
    if (isQuickFilterActive(filter)) {
      Object.keys(filter.filter).forEach(key => {
        if (key === 'ordering') {
          filters.value.ordering = 'name';
        } else {
          (filters.value as any)[key] = undefined;
        }
      });
    } else {
      Object.assign(filters.value, filter.filter);
    }
    ctx.pagination.value.page = 1;
    ctx.loadObjects();
  };

  return {
    filters,
    advancedFilters,
    showDeletedObjects,
    showSearchHistory,
    showAdvancedSearch,
    showFilters,
    loadingSuggestions,
    searchSuggestions,
    searchHistory,
    quickFilters,
    hasActiveFilters,
    activeFiltersCount,
    savePersistedState,
    debouncedSearch,
    debouncedAdvancedSearch,
    clearFilters,
    handleSearchInput,
    loadSearchHistory,
    clearSearchHistory,
    removeFromHistory,
    applyHistorySearch,
    isQuickFilterActive,
    toggleQuickFilter,
  };
}
