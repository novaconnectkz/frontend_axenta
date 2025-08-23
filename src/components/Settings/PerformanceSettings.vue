<template>
  <div class="performance-settings">
    <!-- Заголовок секции -->
    <div class="section-header mb-6">
      <h3 class="text-h6 font-weight-bold mb-2">Производительность и безопасность</h3>
      <p class="text-body-2 text-medium-emphasis">
        Мониторинг системы, оптимизация производительности и управление безопасностью
      </p>
    </div>

    <!-- Вкладки производительности -->
    <v-tabs v-model="activeTab" class="mb-6" color="primary">
      <v-tab value="overview">
        <v-icon start>mdi-chart-line</v-icon>
        Обзор
      </v-tab>
      <v-tab value="cache">
        <v-icon start>mdi-database</v-icon>
        Кэширование
      </v-tab>
      <v-tab value="database">
        <v-icon start>mdi-server</v-icon>
        База данных
      </v-tab>
      <v-tab value="security">
        <v-icon start>mdi-shield-check</v-icon>
        Безопасность
      </v-tab>
      <v-tab value="audit">
        <v-icon start>mdi-file-document</v-icon>
        Аудит логи
      </v-tab>
    </v-tabs>

    <!-- Контент вкладок -->
    <v-tabs-window v-model="activeTab">
      <!-- Обзор -->
      <v-tabs-window-item value="overview">
        <PerformanceOverview />
      </v-tabs-window-item>

      <!-- Кэширование -->
      <v-tabs-window-item value="cache">
        <CacheManagement />
      </v-tabs-window-item>

      <!-- База данных -->
      <v-tabs-window-item value="database">
        <DatabasePerformance />
      </v-tabs-window-item>

      <!-- Безопасность -->
      <v-tabs-window-item value="security">
        <SecurityMonitoring />
      </v-tabs-window-item>

      <!-- Аудит логи -->
      <v-tabs-window-item value="audit">
        <AuditLogs />
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Диалог оптимизации -->
    <OptimizationDialog
      v-model="optimizationDialog"
      @apply="handleOptimizationApply"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Импорты компонентов производительности
import AuditLogs from '@/components/Performance/AuditLogs.vue';
import CacheManagement from '@/components/Performance/CacheManagement.vue';
import DatabasePerformance from '@/components/Performance/DatabasePerformance.vue';
import OptimizationDialog from '@/components/Performance/OptimizationDialog.vue';
import PerformanceOverview from '@/components/Performance/PerformanceOverview.vue';
import SecurityMonitoring from '@/components/Performance/SecurityMonitoring.vue';

// Реактивные данные
const activeTab = ref('overview');
const optimizationDialog = ref(false);

// Методы
const handleOptimizationApply = (recommendations: any[]) => {
  console.log('Применение рекомендаций:', recommendations);
  // Здесь будет логика применения рекомендаций
};
</script>

<style scoped>
.performance-settings {
  max-width: 100%;
}

.section-header {
  padding: 16px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.v-tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.v-tabs-window {
  margin-top: 0;
}

.v-tabs-window-item {
  padding: 0;
}

/* Темная тема */
[data-theme="dark"] .section-header {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .v-tabs {
  border-bottom-color: rgba(84, 84, 136, 0.16);
}
</style>
