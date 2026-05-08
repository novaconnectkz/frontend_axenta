import { ref, type Ref } from 'vue';
import usersService from '@/services/usersService';
import type { UserFilters, UserWithRelations } from '@/types/users';

export interface UsersListFilters extends UserFilters {
  source?: string | null;
}

interface UseUsersListContext {
  filters: Ref<UsersListFilters>;
}

export function useUsersList(ctx: UseUsersListContext) {
  const users = ref<UserWithRelations[]>([]);
  const usersData = ref<{ total: number; page: number; limit: number; pages: number; items: UserWithRelations[] } | null>(null);
  const loading = ref(false);

  const pagination = ref({ page: 1, limit: 10 });

  const wialonStats = ref({
    total: 0,
    active: 0,
    inactive: 0,
    wh: { total: 0, active: 0, inactive: 0 },
    wl: { total: 0, active: 0, inactive: 0 },
  });
  const axentaStats = ref({ total: 0, active: 0, inactive: 0 });
  const skifStats = ref({ total: 0, active: 0, inactive: 0 });

  const applyStatsFromResponse = (resp: any) => {
    if (!resp?.data?.stats) return;
    axentaStats.value = {
      total: resp.data.stats.axenta_total,
      active: resp.data.stats.axenta_active,
      inactive: resp.data.stats.axenta_total - resp.data.stats.axenta_active,
    };
    const whT = resp.data.stats.wialon_wh_total ?? 0;
    const whA = resp.data.stats.wialon_wh_active ?? 0;
    const wlT = resp.data.stats.wialon_wl_total ?? 0;
    const wlA = resp.data.stats.wialon_wl_active ?? 0;
    wialonStats.value = {
      total: resp.data.stats.wialon_total,
      active: resp.data.stats.wialon_active,
      inactive: resp.data.stats.wialon_total - resp.data.stats.wialon_active,
      wh: { total: whT, active: whA, inactive: whT - whA },
      wl: { total: wlT, active: wlA, inactive: wlT - wlA },
    };
    const skifT = resp.data.stats.skif_total ?? 0;
    const skifA = resp.data.stats.skif_active ?? 0;
    skifStats.value = { total: skifT, active: skifA, inactive: skifT - skifA };
  };

  // hasActiveFilters — true если применён search/role/active/user_type/source != all.
  // KPI-плашки сверху страницы должны отражать ВСЮ выборку, не отфильтрованную, поэтому при
  // активном фильтре stats из ответа /unified/users игнорируем.
  const hasActiveFilters = (): boolean => {
    const f = ctx.filters.value;
    if (f.search && f.search.trim() !== '') return true;
    if (f.role) return true;
    if (f.active !== undefined && f.active !== null) return true;
    if (f.user_type) return true;
    if (f.source && f.source !== 'all' && f.source !== null) return true;
    return false;
  };

  const loadUsers = async () => {
    loading.value = true;
    try {
      const response = await usersService.getUnifiedUsers(
        pagination.value.page,
        pagination.value.limit,
        {
          ...ctx.filters.value,
          source: ctx.filters.value.source || 'all',
        }
      );

      if (response.status === 'success') {
        const processed = response.data.items.map((u: any) => {
          if (u.creation_datetime) {
            (u as any)._creation_datetime_sort = new Date(u.creation_datetime).getTime();
          }
          return u;
        });

        users.value = processed;
        usersData.value = {
          total: response.data.total,
          page: response.data.page,
          limit: response.data.per_page,
          pages: response.data.total_pages,
          items: response.data.items,
        };

        if (!hasActiveFilters()) {
          applyStatsFromResponse(response);
        }
      }
      return response;
    } finally {
      loading.value = false;
    }
  };

  // loadGlobalStats — дёргает /unified/users?limit=1 без фильтров для актуализации KPI.
  // Используется при init и после мутаций (create/delete/toggle), когда фильтр активен и
  // обычный loadUsers не обновляет stats.
  const loadGlobalStats = async () => {
    try {
      const response = await usersService.getUnifiedUsers(1, 1, { source: 'all' } as any);
      if (response.status === 'success') applyStatsFromResponse(response);
    } catch (e) {
      console.error('Ошибка загрузки глобальной статистики users:', e);
    }
  };

  const handlePageChange = (page: number) => {
    pagination.value.page = page;
    return loadUsers();
  };

  const handlePerPageChange = (limit: number) => {
    const next = limit === -1 ? 100000 : limit;
    if (next === pagination.value.limit) return Promise.resolve();
    pagination.value.limit = next;
    pagination.value.page = 1;
    return loadUsers();
  };

  return {
    users,
    usersData,
    loading,
    pagination,
    wialonStats,
    axentaStats,
    skifStats,
    loadUsers,
    loadGlobalStats,
    handlePageChange,
    handlePerPageChange,
  };
}
