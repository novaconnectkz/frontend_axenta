import type { Ref } from 'vue';

interface FiltersValue {
  type: string | null;
  is_active: boolean | null;
  source?: string | null;
}

interface UseFiltersStorageContext {
  storageKey: string;
  searchQuery: Ref<string>;
  filters: Ref<FiltersValue>;
  selectedParent: Ref<string>;
  currentPage: Ref<number>;
  itemsPerPage: Ref<number>;
  sortBy: Ref<string>;
  sortOrder: Ref<'asc' | 'desc'>;
}

export function useFiltersStorage(ctx: UseFiltersStorageContext) {
  const saveFilters = () => {
    try {
      const data = {
        searchQuery: ctx.searchQuery.value,
        type: ctx.filters.value.type,
        is_active: ctx.filters.value.is_active,
        source: ctx.filters.value.source ?? null,
        selectedParent: ctx.selectedParent.value,
        currentPage: ctx.currentPage.value,
        itemsPerPage: ctx.itemsPerPage.value,
        sortBy: ctx.sortBy.value,
        sortOrder: ctx.sortOrder.value,
      };
      localStorage.setItem(ctx.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения фильтров:', error);
    }
  };

  const loadFilters = (): boolean => {
    try {
      const saved = localStorage.getItem(ctx.storageKey);
      if (!saved) return false;

      const data = JSON.parse(saved);
      ctx.searchQuery.value = data.searchQuery || '';
      ctx.filters.value.type = data.type ?? null;
      ctx.filters.value.is_active = data.is_active ?? null;
      ctx.filters.value.source = data.source ?? null;
      ctx.selectedParent.value = data.selectedParent || '';
      ctx.currentPage.value = data.currentPage || 1;
      ctx.itemsPerPage.value = data.itemsPerPage || 10;
      ctx.sortBy.value = data.sortBy || 'creationDatetime';
      ctx.sortOrder.value = data.sortOrder || 'desc';
      return true;
    } catch (error) {
      console.error('Ошибка загрузки фильтров:', error);
      return false;
    }
  };

  const clearFilters = () => {
    try {
      localStorage.removeItem(ctx.storageKey);
    } catch (error) {
      console.error('Ошибка удаления фильтров:', error);
    }
  };

  return { saveFilters, loadFilters, clearFilters };
}
