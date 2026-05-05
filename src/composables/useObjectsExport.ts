import { ref, type Ref } from 'vue';
import getObjectsService from '@/services/objectsService';
import type { ObjectFilters } from '@/types/objects';

interface UseObjectsExportContext {
  filters: Ref<ObjectFilters & { source?: string | null }>;
  showSnackbar: (text: string, color?: string, timeout?: number) => void;
}

const objectsService = getObjectsService();

export function useObjectsExport(ctx: UseObjectsExportContext) {
  const exporting = ref(false);

  const exportObjects = async () => {
    try {
      exporting.value = true;
      const blob = await objectsService.exportObjects('excel', ctx.filters.value);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `objects_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      ctx.showSnackbar('Экспорт завершен', 'success');
    } catch (error: any) {
      console.error('Ошибка экспорта:', error);
      ctx.showSnackbar('Ошибка экспорта объектов', 'error');
    } finally {
      exporting.value = false;
    }
  };

  return {
    exporting,
    exportObjects,
  };
}
