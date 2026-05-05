import { ref, type Ref } from 'vue';
import { debounce } from 'lodash-es';
import settingsService from '@/services/settingsService';
import { wialonCacheService, type CachedWialonAccount } from '@/services/wialonCacheService';
import accountsService, { type Account } from '@/services/accountsService';

interface ParentOption {
  title: string;
  value: string;
}

interface UseWialonAccountsContext {
  parentAccountOptions: Ref<ParentOption[]>;
  getVisibleAccounts: () => Array<Account & { source?: string }>;
  mirrorAccounts?: Ref<Array<Account & { source?: string; connectionId?: number; objectsTotal?: number; objectsActive?: number }>>;
}

export function useWialonAccounts(ctx: UseWialonAccountsContext) {
  const wialonStats = ref({
    total: 0,
    active: 0,
    blocked: 0,
    objects: 0,
    clients: 0,
    dealers: 0,
    wl: { total: 0, active: 0, clients: 0, dealers: 0 },
    wh: { total: 0, active: 0, clients: 0, dealers: 0 },
  });

  const wialonAccounts = ref<Array<Account & { source: string; billingAccountId: number }>>([]);

  const isWialonLoading = ref(false);
  const isWialonRefreshing = ref(false);
  const isWialonFromCache = ref(false);
  const wialonLoadError = ref<string | null>(null);

  const objectsStatsLoaded = ref<Set<number>>(new Set());
  const isLoadingObjectsStats = ref(false);
  const wialonConnectionIds = ref<number[]>([]);

  const updateWialonStats = (items: CachedWialonAccount[]) => {
    let wlTotal = 0, wlActive = 0, wlClients = 0, wlDealers = 0;
    let whTotal = 0, whActive = 0, whClients = 0, whDealers = 0;

    items.forEach(item => {
      const isDealer = item.dealerRights === true;
      const sourceLabel = (item.sourceLabel || '').toLowerCase();

      if (sourceLabel.startsWith('wl')) {
        wlTotal++;
        if (item.isActive) wlActive++;
        if (isDealer) wlDealers++;
        else wlClients++;
      } else if (sourceLabel.startsWith('wh')) {
        whTotal++;
        if (item.isActive) whActive++;
        if (isDealer) whDealers++;
        else whClients++;
      }
    });

    wialonStats.value.total = items.length;
    wialonStats.value.active = items.filter(i => i.isActive).length;
    wialonStats.value.blocked = items.filter(i => !i.isActive).length;
    wialonStats.value.objects = items.reduce((sum, i) => sum + (i.objectsTotal || 0), 0);
    wialonStats.value.clients = wlClients + whClients;
    wialonStats.value.dealers = wlDealers + whDealers;
    wialonStats.value.wl = { total: wlTotal, active: wlActive, clients: wlClients, dealers: wlDealers };
    wialonStats.value.wh = { total: whTotal, active: whActive, clients: whClients, dealers: whDealers };
  };

  const updateWialonStatsFromApi = (items: Array<{ is_active: boolean; dealer_rights?: boolean; source_label?: string; objects_total?: number }>) => {
    let wlTotal = 0, wlActive = 0, wlClients = 0, wlDealers = 0;
    let whTotal = 0, whActive = 0, whClients = 0, whDealers = 0;

    items.forEach(item => {
      const isDealer = item.dealer_rights === true;
      const sourceLabel = (item.source_label || '').toLowerCase();

      if (sourceLabel.startsWith('wl')) {
        wlTotal++;
        if (item.is_active) wlActive++;
        if (isDealer) wlDealers++;
        else wlClients++;
      } else if (sourceLabel.startsWith('wh')) {
        whTotal++;
        if (item.is_active) whActive++;
        if (isDealer) whDealers++;
        else whClients++;
      }
    });

    wialonStats.value.total = items.length;
    wialonStats.value.active = items.filter(i => i.is_active).length;
    wialonStats.value.blocked = items.filter(i => !i.is_active).length;
    wialonStats.value.objects = items.reduce((sum, i) => sum + (i.objects_total || 0), 0);
    wialonStats.value.clients = wlClients + whClients;
    wialonStats.value.dealers = wlDealers + whDealers;
    wialonStats.value.wl = { total: wlTotal, active: wlActive, clients: wlClients, dealers: wlDealers };
    wialonStats.value.wh = { total: whTotal, active: whActive, clients: whClients, dealers: whDealers };
  };

  const updateParentAccountsWithWialon = () => {
    const currentOptions = ctx.parentAccountOptions.value.slice(1);
    const uniqueParentsSet = new Set<string>(currentOptions.map(opt => opt.value));

    wialonAccounts.value.forEach(account => {
      if (account.hierarchy) {
        const parts = account.hierarchy.split(' > ');
        if (parts.length >= 2) {
          uniqueParentsSet.add(parts[0].trim());
          if (parts.length >= 3) {
            uniqueParentsSet.add(parts[1].trim());
          }
        }
      }
    });

    const parentNames = Array.from(uniqueParentsSet).sort();

    ctx.parentAccountOptions.value = [
      { title: 'Все родители', value: '' },
      ...parentNames.map(name => ({ title: name, value: name })),
    ];
  };

  const loadWialonObjectsStats = async (connectionIds: number[]) => {
    if (!connectionIds || connectionIds.length === 0) return;

    for (const connectionId of connectionIds) {
      try {
        const statsData = await settingsService.getWialonConnectionObjectsStats(connectionId);

        if (statsData && statsData.stats) {
          wialonAccounts.value = wialonAccounts.value.map(account => {
            const billingId = (account as Account & { billingAccountId?: number }).billingAccountId || 0;
            const accountStats = statsData.stats[billingId] || statsData.stats[account.id];
            if (accountStats) {
              return {
                ...account,
                objectsTotal: accountStats.objectsTotal,
                objectsActive: accountStats.objectsActive,
                objectsDeactivated: accountStats.objectsDeactivated || 0,
              };
            }
            if (account.objectsTotal === -1) {
              return { ...account, objectsTotal: 0, objectsActive: 0, objectsDeactivated: 0 };
            }
            return account;
          });

          wialonStats.value.objects = wialonAccounts.value.reduce(
            (sum, acc) => sum + (acc.objectsTotal > 0 ? acc.objectsTotal : 0), 0
          );
        }
      } catch (error) {
        console.error(`Wialon objects stats error (connection ${connectionId}):`, error);
      }
    }

    const updatedCacheData = wialonAccounts.value.map(acc => ({
      id: acc.id,
      connectionId: (acc as any).connection_id || 0,
      name: acc.name,
      type: acc.type,
      isActive: acc.isActive,
      objectsTotal: acc.objectsTotal,
      objectsActive: acc.objectsActive || 0,
      objectsDeactivated: (acc as any).objectsDeactivated || 0,
      sourceLabel: acc.source,
      createdAt: acc.creationDatetime || '',
      dealerRights: (acc as any).dealer_rights || false,
      hierarchy: acc.hierarchy || '',
      billingAccountId: (acc as any).billingAccountId || 0,
      _cachedAt: Date.now(),
    }));
    wialonCacheService.setAccounts(updatedCacheData);
  };

  const loadWialonAccounts = async () => {
    try {
      wialonLoadError.value = null;

      const cachedAccounts = await wialonCacheService.getAccounts();

      if (cachedAccounts.length > 0) {
        isWialonFromCache.value = true;
        isWialonRefreshing.value = true;

        wialonAccounts.value = cachedAccounts.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type as 'client' | 'partner',
          isActive: item.isActive,
          objectsTotal: item.objectsTotal,
          objectsActive: item.objectsActive || 0,
          objectsDeactivated: item.objectsDeactivated || 0,
          objectsDeleted: 0,
          source: item.sourceLabel || 'wialon',
          dealer_rights: item.dealerRights || false,
          connection_id: item.connectionId || 0,
          parentAccountId: 0,
          parentAccountName: '',
          hierarchy: item.hierarchy || '',
          adminId: 0,
          adminFullname: '',
          adminIsActive: true,
          comment: '',
          billingClientId: '',
          balance: 0,
          monthlyPayment: 0,
          blockingBalance: 0,
          daysBeforeBlocking: null,
          blockingDatetime: null,
          creationDatetime: item.createdAt || '',
          billingAccountId: item.billingAccountId || 0,
        } as Account & { source: string; connection_id: number; billingAccountId: number }));

        updateWialonStats(cachedAccounts);
      } else {
        isWialonLoading.value = true;
      }

      const wialonData = await settingsService.getWialonAccounts();

      if (wialonData && wialonData.items) {
        const accountsForCache: CachedWialonAccount[] = wialonData.items.map(item => ({
          id: item.id,
          connectionId: item.connection_id || 0,
          name: item.name,
          type: item.type,
          isActive: item.is_active,
          objectsTotal: item.objects_total,
          objectsActive: item.objects_active || 0,
          sourceLabel: item.source_label || 'wialon',
          createdAt: item.created_at || '',
          dealerRights: item.dealer_rights || false,
          hierarchy: item.hierarchy || '',
          billingAccountId: item.billing_account_id || 0,
          _cachedAt: Date.now(),
        }));

        wialonCacheService.setAccounts(accountsForCache);

        wialonAccounts.value = wialonData.items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type as 'client' | 'partner',
          isActive: item.is_active,
          objectsTotal: item.objects_total,
          objectsActive: item.objects_active || 0,
          objectsDeleted: 0,
          source: item.source_label || 'wialon',
          dealer_rights: item.dealer_rights || false,
          connection_id: item.connection_id || 0,
          parentAccountId: 0,
          parentAccountName: '',
          hierarchy: item.hierarchy || '',
          adminId: 0,
          adminFullname: '',
          adminIsActive: true,
          comment: '',
          billingClientId: '',
          balance: 0,
          monthlyPayment: 0,
          blockingBalance: 0,
          daysBeforeBlocking: null,
          blockingDatetime: null,
          creationDatetime: item.created_at || '',
          billingAccountId: item.billing_account_id || 0,
        } as Account & { source: string; connection_id: number; billingAccountId: number }));

        updateWialonStatsFromApi(wialonData.items);
        updateParentAccountsWithWialon();

        wialonConnectionIds.value = wialonData.connectionIds || [];

        if (wialonConnectionIds.value.length > 0) {
          loadWialonObjectsStats(wialonConnectionIds.value);
        }
      }

      isWialonFromCache.value = false;
    } catch (error) {
      console.error('Ошибка загрузки аккаунтов Wialon:', error);
      wialonLoadError.value = error instanceof Error ? error.message : 'Неизвестная ошибка';
      if (!isWialonFromCache.value) {
        wialonAccounts.value = [];
      }
    } finally {
      isWialonLoading.value = false;
      isWialonRefreshing.value = false;
    }
  };

  const loadVisibleObjectsStats = debounce(async () => {
    const table = document.querySelector('.accounts-table');
    if (!table) return;

    const visibleRows = table.querySelectorAll('tbody tr');
    if (visibleRows.length === 0) return;

    const accountsToLoad: Array<{ id: number; connectionId: number; billingAccountId: number }> = [];

    const visibleAccountsAll = ctx.getVisibleAccounts();
    const visibleAccounts = visibleAccountsAll.slice(0, Math.min(20, visibleAccountsAll.length));

    visibleRows.forEach((_row, rowIndex) => {
      const account = visibleAccounts[rowIndex];

      if (account && account.source && account.source.startsWith('W') && !objectsStatsLoaded.value.has(account.id)) {
        // unified items: connectionId (camelCase). legacy wialonAccounts: connection_id.
        const a = account as any;
        accountsToLoad.push({
          id: account.id,
          connectionId: a.connection_id || a.connectionId || 0,
          billingAccountId: a.billingAccountId || a.id || 0,
        });
      }
    });

    if (accountsToLoad.length === 0) return;

    isLoadingObjectsStats.value = true;

    const byConnection = new Map<number, typeof accountsToLoad>();
    accountsToLoad.forEach(acc => {
      const list = byConnection.get(acc.connectionId) || [];
      list.push(acc);
      byConnection.set(acc.connectionId, list);
    });

    for (const [connectionId, accs] of byConnection) {
      if (connectionId === 0) continue;

      try {
        const statsData = await settingsService.getWialonConnectionObjectsStats(connectionId);

        if (statsData && statsData.stats) {
          wialonAccounts.value = wialonAccounts.value.map(account => {
            const requested = accs.find(a => a.id === account.id);
            if (!requested) return account;

            const billingId = (account as any).billingAccountId || 0;
            const accountStats = statsData.stats[billingId] || statsData.stats[account.id];

            if (accountStats) {
              objectsStatsLoaded.value.add(account.id);
              return {
                ...account,
                objectsTotal: accountStats.objectsTotal,
                objectsActive: accountStats.objectsActive,
                objectsDeactivated: accountStats.objectsDeactivated || 0,
              };
            }
            return account;
          });

          // Зеркальный апдейт unified accounts (источник для рендера таблицы).
          // Без этого spinner в колонке "Объекты" не уходит — UI рендерит accounts,
          // а fetcher обновлял только legacy wialonAccounts.
          if (ctx.mirrorAccounts) {
            const stats = statsData.stats as Record<number, { objectsTotal: number; objectsActive: number; objectsDeactivated?: number }>;
            ctx.mirrorAccounts.value = ctx.mirrorAccounts.value.map((account: any) => {
              const requested = accs.find(a => a.id === account.id);
              if (!requested) return account;
              const accountStats = stats[requested.billingAccountId] || stats[account.id];
              if (!accountStats) return account;
              return {
                ...account,
                objectsTotal: accountStats.objectsTotal,
                objectsActive: accountStats.objectsActive,
                objectsDeactivated: accountStats.objectsDeactivated || 0,
              };
            });
          }
        }
      } catch (error) {
        console.error(`Lazy loading error (connection ${connectionId}):`, error);
      }
    }

    isLoadingObjectsStats.value = false;
  }, 500);

  const loadParentAccounts = async () => {
    try {
      const response = await accountsService.getAccounts({
        per_page: 1000,
        ordering: 'name',
      });

      const uniqueParents = new Set<string>();
      response.results.forEach(account => {
        if (account.parentAccountName && account.parentAccountName.trim()) {
          uniqueParents.add(account.parentAccountName.trim());
        }
      });

      wialonAccounts.value.forEach(account => {
        if (account.hierarchy) {
          const parts = account.hierarchy.split(' > ');
          if (parts.length >= 2) {
            uniqueParents.add(parts[0].trim());
            if (parts.length >= 3) {
              uniqueParents.add(parts[1].trim());
            }
          }
        }
      });

      const sorted = Array.from(uniqueParents).sort();
      ctx.parentAccountOptions.value = [
        { title: 'Все родители', value: '' },
        ...sorted.map(name => ({ title: name, value: name })),
      ];
    } catch (error) {
      console.error('Ошибка загрузки родительских аккаунтов:', error);
    }
  };

  return {
    wialonAccounts,
    wialonStats,
    isWialonLoading,
    isWialonRefreshing,
    isWialonFromCache,
    wialonLoadError,
    objectsStatsLoaded,
    isLoadingObjectsStats,
    wialonConnectionIds,
    loadWialonAccounts,
    loadVisibleObjectsStats,
    updateParentAccountsWithWialon,
    loadParentAccounts,
  };
}
