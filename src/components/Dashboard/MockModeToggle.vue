<template>
  <v-card variant="outlined" class="mock-mode-toggle" v-if="showToggle">
    <v-card-text class="py-2">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-test-tube" size="20" class="me-2" />
          <span class="text-caption">
            Режим тестовых данных
          </span>
        </div>

        <div class="d-flex align-center gap-2">
          <v-chip :color="isMockMode ? 'warning' : 'success'" size="x-small" variant="flat">
            {{ isMockMode ? 'Mock-данные' : 'Реальные данные' }}
          </v-chip>

          <v-switch v-model="isMockMode" @update:model-value="toggleMockMode" color="warning" density="compact"
            hide-details inset />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { dashboardService } from '@/services/dashboardService';
import { useDashboardStore } from '@/store/dashboard';
import { computed, defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'MockModeToggle',
  setup() {
    const dashboardStore = useDashboardStore();
    const isMockMode = ref(dashboardService.isMockMode());

    // Показывать переключатель только в development режиме
    const showToggle = computed(() => {
      return import.meta.env.DEV || import.meta.env.MODE === 'development';
    });

    const toggleMockMode = async (enabled: boolean) => {
      try {
        dashboardService.setMockMode(enabled);
        isMockMode.value = enabled;

        // Обновляем данные в store
        if (enabled) {
          // Если включаем mock режим, инициализируем mock-данные
          dashboardStore.initializeMockData();
        } else {
          // Если выключаем mock режим, перезагружаем данные с сервера
          await dashboardStore.refreshAll();
        }
      } catch (error) {
        console.error('Ошибка переключения режима данных:', error);
        // Возвращаем предыдущее состояние при ошибке
        isMockMode.value = !enabled;
        dashboardService.setMockMode(!enabled);
      }
    };

    return {
      isMockMode,
      showToggle,
      toggleMockMode,
    };
  },
});
</script>

<style scoped>
.mock-mode-toggle {
  position: fixed;
  top: 80px;
  right: 16px;
  z-index: 1000;
  min-width: 280px;
  backdrop-filter: blur(8px);
  background: rgba(var(--v-theme-surface), 0.9);
}

.gap-2 {
  gap: 8px;
}
</style>
