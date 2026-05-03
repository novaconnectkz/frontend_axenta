import { computed, type Ref, type ComputedRef } from 'vue';
import type { Account } from '@/services/accountsService';

interface FiltersValue {
  type: string | null;
  is_active: boolean | null;
  source?: string | null;
}

interface UseMergedAccountsContext {
  accounts: Ref<Account[]>;
  wialonAccounts: Ref<Array<Account & { source: string; billingAccountId: number }>>;
  filters: Ref<FiltersValue>;
  searchQuery: Ref<string>;
  selectedParent: Ref<string>;
  currentPage: Ref<number>;
  itemsPerPage: Ref<number>;
  totalItems: Ref<number>;
  sortBy: Ref<string>;
  sortOrder: Ref<'asc' | 'desc'>;
}

const sortAccounts = <T extends Account & { source?: string }>(
  list: T[],
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): T[] => {
  if (!sortBy) return list;
  const dir = sortOrder === 'desc' ? -1 : 1;
  const getValue = (a: any): number | string => {
    switch (sortBy) {
      case 'id': return Number(a.id) || 0;
      case 'name': return (a.name || '').toLowerCase();
      case 'type': return (a.type || '').toLowerCase();
      case 'objectsTotal': return Number(a.objectsTotal ?? a.objects_total ?? 0);
      case 'isActive': return a.isActive ? 1 : 0;
      case 'source': return (a.source || '').toLowerCase();
      case 'creationDatetime': {
        const d = a.creationDatetime || a.creation_datetime;
        return d ? new Date(d).getTime() : 0;
      }
      default: return (a[sortBy] ?? '') as any;
    }
  };
  return [...list].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
};

const filterWialonByCommon = (
  list: Array<Account & { source: string }>,
  filters: FiltersValue,
  selectedParent: string,
) => {
  let result = [...list];

  if (selectedParent && selectedParent.trim() !== '') {
    result = result.filter(account => {
      if (!account.hierarchy) return false;
      const parts = account.hierarchy.split(' > ');
      if (parts.length < 2) return false;
      // Только прямой родитель (предпоследний элемент иерархии), не предки выше
      const directParent = parts[parts.length - 2];
      return directParent === selectedParent;
    });
  }

  if (filters.is_active !== null) {
    result = result.filter(a => a.isActive === filters.is_active);
  }

  if (filters.type) {
    result = result.filter(a => {
      if (filters.type === 'partner') return (a as any).dealer_rights === true;
      if (filters.type === 'client') return (a as any).dealer_rights !== true;
      return true;
    });
  }

  return result;
};

const filterWialonBySource = (
  list: Array<Account & { source: string }>,
  source: string | null | undefined,
) => {
  return list.filter(acc => {
    const s = acc.source?.toLowerCase() || '';
    if (source === 'wialon') return s !== 'axenta' && s !== '';
    if (source === 'wh') return s.startsWith('wh(') || s.startsWith('wh ');
    if (source === 'wl') return s.startsWith('wl(') || s.startsWith('wl ');
    return true;
  });
};

export function useMergedAccounts(ctx: UseMergedAccountsContext): {
  accountsWithNumbers: ComputedRef<Array<Account & { source: string; rowNumber: number }>>;
  effectiveTotalItems: ComputedRef<number>;
} {
  const accountsWithNumbers = computed(() => {
    const startNumber = (ctx.currentPage.value - 1) * ctx.itemsPerPage.value + 1;

    const axentaAccountsWithSource = ctx.accounts.value.map(account => ({
      ...account,
      source: 'axenta',
    }));

    let filteredWialon = [...ctx.wialonAccounts.value];

    if (ctx.searchQuery.value && ctx.searchQuery.value.trim() !== '') {
      const searchTerms = ctx.searchQuery.value
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      if (searchTerms.length > 0) {
        // Поиск по name и id. hierarchy исключён — проходят дочерние родителей с матчем, поведение неинтуитивное (см. concepts/accounts-pagination)
        filteredWialon = filteredWialon.filter(account => {
          const name = account.name.toLowerCase();
          const id = account.id?.toString() || '';
          return searchTerms.some(t => name.includes(t) || id.includes(t));
        });
      }
    }

    filteredWialon = filterWialonByCommon(filteredWialon, ctx.filters.value, ctx.selectedParent.value);

    let filteredAxenta = axentaAccountsWithSource;
    if (ctx.filters.value.is_active !== null) {
      filteredAxenta = axentaAccountsWithSource.filter(a => a.isActive === ctx.filters.value.is_active);
    }

    let allAccounts: typeof axentaAccountsWithSource = [];

    if (ctx.filters.value.source === 'axenta') {
      allAccounts = filteredAxenta;
    } else if (ctx.filters.value.source === 'wialon' || ctx.filters.value.source === 'wl' || ctx.filters.value.source === 'wh') {
      allAccounts = filterWialonBySource(filteredWialon, ctx.filters.value.source);
    } else {
      allAccounts = [...filteredAxenta, ...filteredWialon];
    }

    allAccounts = sortAccounts(allAccounts, ctx.sortBy.value, ctx.sortOrder.value);

    let paginatedAccounts: typeof allAccounts;
    if (ctx.filters.value.source === 'axenta') {
      paginatedAccounts = allAccounts;
    } else {
      const startIndex = (ctx.currentPage.value - 1) * ctx.itemsPerPage.value;
      const endIndex = startIndex + ctx.itemsPerPage.value;
      paginatedAccounts = allAccounts.slice(startIndex, endIndex);
    }

    return paginatedAccounts.map((account, index) => ({
      ...account,
      rowNumber: startNumber + index,
    }));
  });

  const effectiveTotalItems = computed(() => {
    const f = ctx.filters.value;

    if (f.source === 'axenta') {
      if (f.is_active !== null) {
        return ctx.accounts.value.filter(a => a.isActive === f.is_active).length;
      }
      return ctx.totalItems.value;
    }

    if (f.source === 'wialon' || f.source === 'wl' || f.source === 'wh') {
      let filteredWialon = filterWialonByCommon(
        ctx.wialonAccounts.value,
        f,
        ctx.selectedParent.value,
      );
      filteredWialon = filterWialonBySource(filteredWialon, f.source);
      return filteredWialon.length;
    }

    const filteredWialon = filterWialonByCommon(
      ctx.wialonAccounts.value,
      f,
      ctx.selectedParent.value,
    );
    return ctx.totalItems.value + filteredWialon.length;
  });

  const totalPages = computed(() => {
    if (ctx.itemsPerPage.value === -1 || ctx.itemsPerPage.value >= effectiveTotalItems.value) {
      return 1;
    }
    return Math.ceil(effectiveTotalItems.value / ctx.itemsPerPage.value);
  });

  const getDisplayRange = (): string => {
    if (effectiveTotalItems.value === 0) return '0-0';
    if (ctx.itemsPerPage.value === -1 || ctx.itemsPerPage.value >= effectiveTotalItems.value) {
      return `1-${effectiveTotalItems.value}`;
    }
    const start = (ctx.currentPage.value - 1) * ctx.itemsPerPage.value + 1;
    const end = Math.min(ctx.currentPage.value * ctx.itemsPerPage.value, effectiveTotalItems.value);
    return `${start}-${end}`;
  };

  return { accountsWithNumbers, effectiveTotalItems, totalPages, getDisplayRange };
}
