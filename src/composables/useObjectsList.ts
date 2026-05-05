import { ref, type Ref } from 'vue';
import getObjectsService from '@/services/objectsService';
import type { ObjectFilters, ObjectWithRelations } from '@/types/objects';

interface StatItem {
  key: string;
  label: string;
  value: number;
  icon: string;
  color: string;
}

interface UseObjectsListContext {
  filters: Ref<ObjectFilters & { source?: string | null }>;
  showDeletedObjects: Ref<boolean>;
  showSnackbar: (text: string, color?: string, timeout?: number) => void;
}

const objectsService = getObjectsService();

export function useObjectsList(ctx: UseObjectsListContext) {
  const objects = ref<ObjectWithRelations[]>([]);
  const objectsData = ref<any>(null);
  const loading = ref(false);

  const pagination = ref({
    page: 1,
    per_page: 10,
  });

  const stats = ref<StatItem[]>([
    { key: 'total', label: 'Всего объектов', value: 0, icon: 'mdi-office-building', color: 'primary' },
    { key: 'active', label: 'Активные', value: 0, icon: 'mdi-check-circle', color: 'success' },
    { key: 'inactive', label: 'Неактивные', value: 0, icon: 'mdi-pause-circle', color: 'warning' },
    { key: 'trash', label: 'В корзине', value: 0, icon: 'mdi-delete', color: 'error' },
    { key: 'scheduled', label: 'К удалению', value: 0, icon: 'mdi-clock-alert', color: 'error' },
  ]);

  const loadObjects = async (): Promise<void> => {
    try {
      loading.value = true;
      // Корзина — отдельный path (там soft-deleted Axenta-объекты).
      if (ctx.showDeletedObjects.value) {
        const response = await objectsService.getDeletedObjects(
          pagination.value.page,
          pagination.value.per_page,
          ctx.filters.value.search,
        );
        if (response.status === 'success') {
          objects.value = response.data.items || [];
          objectsData.value = response.data;
        } else {
          ctx.showSnackbar(response.error || 'Ошибка загрузки объектов', 'error');
          objects.value = [];
        }
        return;
      }

      // Основной путь — единый /unified/objects (Axenta + WH + WL)
      const response = await objectsService.getUnifiedObjects(
        pagination.value.page,
        pagination.value.per_page,
        ctx.filters.value,
      );

      if (response.status === 'success') {
        objects.value = (response.data.items || []) as any[];
        objectsData.value = response.data;

        const st = response.data.stats;
        if (st) {
          stats.value[0].value = st.axenta_total + st.wialon_total;
          stats.value[1].value = st.axenta_active + st.wialon_active;
          stats.value[2].value = st.axenta_inactive;
          stats.value[4].value = st.axenta_scheduled_delete;
        }

        // Корзина — отдельным запросом (Axenta /trash, не покрыто snapshot)
        try {
          const trashStats = await objectsService.getTrashStats();
          stats.value[3].value = trashStats.count;
        } catch {
          stats.value[3].value = 0;
        }
      } else {
        ctx.showSnackbar((response as any).error || 'Ошибка загрузки объектов', 'error');
        objects.value = [];
      }
    } catch (error: any) {
      console.error('Ошибка загрузки объектов:', error);
      ctx.showSnackbar('Ошибка загрузки объектов: ' + (error.message || 'Неизвестная ошибка'), 'error');
      objects.value = [];
    } finally {
      loading.value = false;
    }
  };

  const loadStats = async (): Promise<void> => {
    try {
      const statsData = await objectsService.getObjectsStats(true);
      stats.value[0].value = statsData.total;
      stats.value[1].value = statsData.active;
      stats.value[2].value = statsData.inactive;
      stats.value[4].value = statsData.scheduled_for_delete;
      try {
        const trashStats = await objectsService.getTrashStats();
        stats.value[3].value = trashStats.count;
      } catch {
        stats.value[3].value = 0;
      }
    } catch (error) {
      console.warn('Stats API недоступен:', error);
    }
  };

  const handlePageChange = (page: number) => {
    pagination.value.page = page;
    loadObjects();
  };

  const handlePerPageChange = (per_page: number) => {
    pagination.value.per_page = per_page;
    pagination.value.page = 1;
    loadObjects();
  };

  const handleSortChange = (sortBy: any[]) => {
    if (sortBy.length > 0) {
      const sort = sortBy[0];
      const field = sort.key;
      const order = sort.order === 'desc' ? '-' : '';
      ctx.filters.value.ordering = `${order}${field}`;
    } else {
      ctx.filters.value.ordering = 'name';
    }
    pagination.value.page = 1;
    loadObjects();
  };

  return {
    objects,
    objectsData,
    loading,
    pagination,
    stats,
    loadObjects,
    loadStats,
    handlePageChange,
    handlePerPageChange,
    handleSortChange,
  };
}
