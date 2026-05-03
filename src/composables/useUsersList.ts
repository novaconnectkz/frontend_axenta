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

  const wialonStats = ref({ total: 0, active: 0, inactive: 0 });
  const axentaStats = ref({ total: 0, active: 0, inactive: 0 });

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

        if (response.data.stats) {
          axentaStats.value = {
            total: response.data.stats.axenta_total,
            active: response.data.stats.axenta_active,
            inactive: response.data.stats.axenta_total - response.data.stats.axenta_active,
          };
          wialonStats.value = {
            total: response.data.stats.wialon_total,
            active: response.data.stats.wialon_active,
            inactive: response.data.stats.wialon_total - response.data.stats.wialon_active,
          };
        }
      }
      return response;
    } finally {
      loading.value = false;
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
    loadUsers,
    handlePageChange,
    handlePerPageChange,
  };
}
