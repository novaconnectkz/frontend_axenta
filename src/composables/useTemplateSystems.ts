import { settingsService } from '@/services/settingsService';
import type { TemplateSystem, IntegrationType } from '@/types/settings';
import { 
  INTEGRATION_TO_TEMPLATE_SYSTEM_MAP, 
  TEMPLATE_SYSTEM_LABELS,
  INTEGRATION_STATUSES 
} from '@/types/settings';
import { ref, computed } from 'vue';

/**
 * Композабл для работы с системами шаблонов на основе активных интеграций
 */
export function useTemplateSystems() {
  const loading = ref(false);
  const availableSystems = ref<TemplateSystem[]>([]);

  /**
   * Получает список доступных систем из активных интеграций
   */
  const loadAvailableSystems = async () => {
    loading.value = true;
    try {
      const response = await settingsService.getIntegrations();
      
      // Фильтруем только активные и включенные интеграции
      const activeIntegrations = response.integrations.filter(
        (integration) => 
          integration.enabled && 
          integration.status === INTEGRATION_STATUSES.ACTIVE
      );

      // Маппим типы интеграций на системы шаблонов
      const systems = new Set<TemplateSystem>();
      
      activeIntegrations.forEach((integration) => {
        const system = INTEGRATION_TO_TEMPLATE_SYSTEM_MAP[integration.type as IntegrationType];
        if (system) {
          systems.add(system);
        }
      });

      availableSystems.value = Array.from(systems);
    } catch (error) {
      console.error('Ошибка загрузки доступных систем:', error);
      // В случае ошибки используем Axenta по умолчанию
      availableSystems.value = ['axenta' as TemplateSystem];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Опции для select с доступными системами
   */
  const systemOptions = computed(() => {
    const options = [
      { value: '', title: 'Все системы' }
    ];

    availableSystems.value.forEach((system) => {
      options.push({
        value: system,
        title: TEMPLATE_SYSTEM_LABELS[system] || system
      });
    });

    return options;
  });

  /**
   * Получить метку системы
   */
  const getSystemLabel = (system: TemplateSystem): string => {
    return TEMPLATE_SYSTEM_LABELS[system] || system;
  };

  /**
   * Проверить, доступна ли система
   */
  const isSystemAvailable = (system: TemplateSystem): boolean => {
    return availableSystems.value.includes(system);
  };

  /**
   * Получить первую доступную систему (для использования по умолчанию)
   */
  const getDefaultSystem = (): TemplateSystem | '' => {
    return availableSystems.value.length > 0 ? availableSystems.value[0] : '';
  };

  return {
    loading,
    availableSystems,
    systemOptions,
    loadAvailableSystems,
    getSystemLabel,
    isSystemAvailable,
    getDefaultSystem,
  };
}

