import { ref } from 'vue';
import getObjectsService from '@/services/objectsService';

interface UseObjectsLookupsContext {
  showSnackbar: (text: string, color?: string, timeout?: number) => void;
}

const objectsService = getObjectsService();

export function useObjectsLookups(ctx: UseObjectsLookupsContext) {
  const companyOptions = ref<Array<{ id: number; name: string }>>([]);
  const contractOptions = ref<Array<{ title: string; value: number }>>([]);
  const locationOptions = ref<Array<{ title: string; value: number }>>([]);

  const loadingCompanies = ref(false);
  const loadingContracts = ref(false);
  const loadingLocations = ref(false);

  const loadCompanies = async () => {
    try {
      loadingCompanies.value = true;
      const response = await objectsService.getCompanies();
      if (response.status === 'success') {
        companyOptions.value = response.data;
      } else {
        ctx.showSnackbar(response.error || 'Ошибка загрузки компаний', 'error');
      }
    } catch (error) {
      console.error('Ошибка загрузки компаний:', error);
      ctx.showSnackbar('Ошибка загрузки компаний', 'error');
    } finally {
      loadingCompanies.value = false;
    }
  };

  // contracts/locations — UI-фильтры отключены, реальный API не реализован.
  const loadContracts = async () => {
    contractOptions.value = [];
  };

  const loadLocations = async () => {
    locationOptions.value = [];
  };

  return {
    companyOptions,
    contractOptions,
    locationOptions,
    loadingCompanies,
    loadingContracts,
    loadingLocations,
    loadCompanies,
    loadContracts,
    loadLocations,
  };
}
