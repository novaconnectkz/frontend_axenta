import { ref, type Ref } from 'vue';
import getObjectsService from '@/services/objectsService';
import type { ObjectForm } from '@/types/objects';

interface UseObjectsLookupsContext {
  objectForm?: Ref<ObjectForm>;
  showSnackbar: (text: string, color?: string, timeout?: number) => void;
}

const objectsService = getObjectsService();

export function useObjectsLookups(ctx: UseObjectsLookupsContext) {
  const companyOptions = ref<Array<{ id: number; name: string }>>([]);
  const contractOptions = ref<Array<{ title: string; value: number }>>([]);
  const locationOptions = ref<Array<{ title: string; value: number }>>([]);
  const templateOptions = ref<any[]>([]);

  const loadingCompanies = ref(false);
  const loadingContracts = ref(false);
  const loadingLocations = ref(false);
  const loadingTemplates = ref(false);

  const selectedTemplate = ref<number | null>(null);

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

  const loadTemplates = async () => {
    try {
      const response = await objectsService.getObjectTemplates();
      if (response.status === 'success') {
        templateOptions.value = response.data.items.map((template: any) => ({
          title: template.name,
          value: template.id,
          name: template.name,
          description: template.description,
          icon: template.icon,
          config: template.config,
          default_settings: template.default_settings,
          category: template.category,
        }));
      }
    } catch (error: any) {
      console.error('Ошибка загрузки шаблонов:', error);
      ctx.showSnackbar('Ошибка загрузки шаблонов', 'error');
    }
  };

  const applyTemplate = (templateId: number | null) => {
    if (!templateId || !ctx.objectForm) return;
    const template = templateOptions.value.find(t => t.value === templateId);
    if (!template) return;

    ctx.objectForm.value.template_id = templateId;
    ctx.objectForm.value.type = template.category || ctx.objectForm.value.type;

    if (template.default_settings) {
      try {
        const settings = JSON.parse(template.default_settings);
        ctx.objectForm.value.settings = JSON.stringify(settings);
      } catch (error) {
        console.warn('Ошибка парсинга настроек шаблона:', error);
      }
    }

    ctx.showSnackbar(`Шаблон "${template.name}" применен`, 'success');
  };

  return {
    companyOptions,
    contractOptions,
    locationOptions,
    templateOptions,
    loadingCompanies,
    loadingContracts,
    loadingLocations,
    loadingTemplates,
    selectedTemplate,
    loadCompanies,
    loadContracts,
    loadLocations,
    loadTemplates,
    applyTemplate,
  };
}
