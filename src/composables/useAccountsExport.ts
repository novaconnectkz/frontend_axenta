import { ref } from 'vue';
import accountsService, { type Account } from '@/services/accountsService';

interface FiltersValue {
  type: string | null;
  is_active: boolean | null;
  source?: string | null;
}

interface ExportContext {
  accounts: () => Account[];
  wialonAccounts: () => Array<Account & { source: string }>;
  filters: () => FiltersValue;
  selectedParent: () => string;
  searchQuery: () => string;
  sortBy: () => string;
  sortOrder: () => 'asc' | 'desc';
  showSnackbar: (text: string, color?: string) => void;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
};

export function useAccountsExport(ctx: ExportContext) {
  const isExporting = ref(false);

  const getFilteredAccountsForExport = async (): Promise<any[]> => {
    let allAxentaAccounts: Account[] = [];

    try {
      let currentPageNum = 1;
      let hasMore = true;
      const perPage = 500;

      while (hasMore) {
        const response = await accountsService.getAccounts({
          page: currentPageNum,
          per_page: perPage,
          ordering: ctx.sortOrder() === 'desc' ? `-${ctx.sortBy()}` : ctx.sortBy(),
          type: ctx.filters().type || undefined,
          is_active: ctx.filters().is_active !== null ? ctx.filters().is_active : undefined,
          search: ctx.searchQuery() || undefined,
        });

        allAxentaAccounts = [...allAxentaAccounts, ...response.results];
        hasMore = response.results.length === perPage && allAxentaAccounts.length < response.count;
        currentPageNum++;

        if (currentPageNum > 20) break;
      }
    } catch {
      allAxentaAccounts = [...ctx.accounts()];
    }

    const axentaAccountsWithSource = allAxentaAccounts.map(account => ({
      ...account,
      source: 'axenta',
    }));

    let filteredWialon = [...ctx.wialonAccounts()];
    const filters = ctx.filters();

    if (ctx.searchQuery() && ctx.searchQuery().trim() !== '') {
      const searchTerms = ctx.searchQuery()
        .split(',')
        .map(term => term.trim().toLowerCase())
        .filter(term => term.length > 0);

      if (searchTerms.length > 0) {
        filteredWialon = filteredWialon.filter(account => {
          const accountName = account.name.toLowerCase();
          const hierarchy = account.hierarchy?.toLowerCase() || '';
          const id = account.id?.toString() || '';
          return searchTerms.some(term =>
            accountName.includes(term) ||
            hierarchy.includes(term) ||
            id.includes(term)
          );
        });
      }
    }

    if (ctx.selectedParent() && ctx.selectedParent().trim() !== '') {
      const parent = ctx.selectedParent();
      filteredWialon = filteredWialon.filter(account => {
        if (account.hierarchy?.includes(parent)) {
          const parts = account.hierarchy.split(' > ');
          const parents = parts.slice(0, -1);
          return parents.some(p => p === parent || p.includes(parent));
        }
        return false;
      });
    }

    if (filters.is_active !== null) {
      filteredWialon = filteredWialon.filter(account => account.isActive === filters.is_active);
    }

    if (filters.type) {
      filteredWialon = filteredWialon.filter(account => {
        if (filters.type === 'partner') return (account as any).dealer_rights === true;
        if (filters.type === 'client') return (account as any).dealer_rights !== true;
        return true;
      });
    }

    let allAccounts: any[] = [];

    if (filters.source === 'axenta') {
      allAccounts = axentaAccountsWithSource;
    } else if (filters.source === 'wialon' || filters.source === 'wl' || filters.source === 'wh') {
      allAccounts = filteredWialon.filter(acc => {
        const source = acc.source?.toLowerCase() || '';
        if (filters.source === 'wialon') return source !== 'axenta' && source !== '';
        if (filters.source === 'wh') return source.startsWith('wh(') || source.startsWith('wh ');
        if (filters.source === 'wl') return source.startsWith('wl(') || source.startsWith('wl ');
        return true;
      });
    } else {
      allAccounts = [...axentaAccountsWithSource, ...filteredWialon];
    }

    return allAccounts;
  };

  const exportToExcel = async () => {
    try {
      isExporting.value = true;
      const sourceFilter = ctx.filters().source;

      if ((sourceFilter === 'wialon' || sourceFilter === 'wh' || sourceFilter === 'wl')
        && ctx.wialonAccounts().length === 0) {
        ctx.showSnackbar('Данные Wialon ещё загружаются. Подождите и попробуйте снова.', 'warning');
        return;
      }

      const dataToExport = await getFilteredAccountsForExport();

      if (dataToExport.length === 0) {
        ctx.showSnackbar('Нет данных для экспорта. Проверьте фильтры.', 'warning');
        return;
      }

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Axenta CRM';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Учетные записи');

      const columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Название', key: 'name', width: 35 },
        { header: 'Тип', key: 'type', width: 12 },
        { header: 'Права дилера', key: 'dealer_rights', width: 14 },
        { header: 'Статус', key: 'status', width: 14 },
        { header: 'Дней до блокировки', key: 'days_before_blocking', width: 18 },
        { header: 'Дата блокировки', key: 'blocking_date', width: 16 },
        { header: 'Объекты акт.', key: 'objects_active', width: 13 },
        { header: 'Объекты деакт.', key: 'objects_deactivated', width: 14 },
        { header: 'Объекты всего', key: 'objects_total', width: 14 },
        { header: 'Баланс', key: 'balance', width: 12 },
        { header: 'Ежемес. платеж', key: 'monthly_payment', width: 15 },
        { header: 'Система', key: 'source', width: 25 },
        { header: 'Иерархия', key: 'hierarchy', width: 50 },
        { header: 'Родитель', key: 'parent', width: 25 },
        { header: 'Администратор', key: 'admin', width: 25 },
        { header: 'ID админа', key: 'admin_id', width: 10 },
        { header: 'Комментарий', key: 'comment', width: 30 },
        { header: 'Дата создания', key: 'created_at', width: 14 }
      ];

      worksheet.columns = columns;

      dataToExport.forEach((acc: any) => {
        worksheet.addRow({
          id: acc.id || '',
          name: acc.name || '',
          type: acc.type === 'partner' ? 'Партнёр' : 'Клиент',
          dealer_rights: acc.dealer_rights ? 'Да' : 'Нет',
          status: acc.isActive ? 'Активен' : 'Заблокирован',
          days_before_blocking: acc.daysBeforeBlocking !== null && acc.daysBeforeBlocking !== undefined ? acc.daysBeforeBlocking : '',
          blocking_date: formatDate(acc.blockingDatetime),
          objects_active: acc.objectsActive || 0,
          objects_deactivated: acc.objectsDeactivated || 0,
          objects_total: acc.objectsTotal || 0,
          balance: acc.balance !== undefined ? acc.balance : '',
          monthly_payment: acc.monthlyPayment !== undefined ? acc.monthlyPayment : '',
          source: acc.source || 'Axenta',
          hierarchy: acc.hierarchy || '',
          parent: acc.parentAccountName || '',
          admin: acc.adminFullname || '',
          admin_id: acc.adminId || '',
          comment: acc.comment || '',
          created_at: formatDate(acc.creationDatetime || acc.createdAt)
        });
      });

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: dataToExport.length + 1, column: columns.length }
      };

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let fileName = 'accounts';
      if (sourceFilter) fileName += `_${sourceFilter}`;
      if (ctx.filters().type) fileName += `_${ctx.filters().type}`;
      fileName += `_${new Date().toISOString().split('T')[0]}.xlsx`;

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      ctx.showSnackbar(`Экспортировано ${dataToExport.length} записей в Excel`, 'success');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      ctx.showSnackbar('Ошибка экспорта учетных записей', 'error');
    } finally {
      isExporting.value = false;
    }
  };

  return {
    isExporting,
    exportToExcel,
  };
}
