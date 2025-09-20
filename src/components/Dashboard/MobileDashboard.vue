<template>
  <div class="mobile-dashboard">
    <!-- Компактная статистика -->
    <v-row class="stats-row">
      <v-col cols="6" v-for="stat in compactStats" :key="stat.id">
        <v-card class="stats-card" elevation="2">
          <v-card-text class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="stats-number">{{ stat.value }}</div>
                <div class="stats-label">{{ stat.label }}</div>
              </div>
              <v-icon :icon="stat.icon" :color="stat.color" size="24" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Основные виджеты -->
    <div class="widgets-section">
      <template v-for="widget in mobileWidgets" :key="widget.id">
        <v-card class="widget-card mb-3" elevation="2">
          <v-card-title class="d-flex align-center justify-space-between pa-3">
            <div class="d-flex align-center">
              <v-icon :icon="widget.icon" class="me-2" size="20" />
              <span class="widget-title">{{ widget.title }}</span>
            </div>
            <v-btn
              icon="mdi-chevron-right"
              size="small"
              variant="text"
              @click="navigateToSection(widget.route)"
            />
          </v-card-title>
          
          <v-card-text class="pa-3">
            <component 
              :is="widget.component" 
              :mobile-mode="true"
              :compact="true"
            />
          </v-card-text>
        </v-card>
      </template>
    </div>

    <!-- Быстрые действия для мобильных -->
    <v-card class="quick-actions-mobile mb-3" elevation="2">
      <v-card-title class="pa-3">
        <v-icon icon="mdi-lightning-bolt" class="me-2" size="20" />
        Быстрые действия
      </v-card-title>
      
      <v-card-text class="pa-3">
        <!-- Адаптивная сетка для мобильных быстрых действий -->
        <div class="mobile-quick-actions-grid">
          <v-btn
            v-for="action in mobileQuickActions"
            :key="action.id"
            :color="action.color"
            variant="tonal"
            :to="action.route"
            class="mobile-action-btn"
          >
            <div class="d-flex flex-column align-center">
              <v-icon :icon="action.icon" size="18" class="mb-1" />
              <span class="action-text">{{ action.shortTitle || action.title }}</span>
            </div>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Последняя активность -->
    <v-card class="recent-activity-mobile" elevation="2">
      <v-card-title class="d-flex align-center justify-space-between pa-3">
        <div class="d-flex align-center">
          <v-icon icon="mdi-history" class="me-2" size="20" />
          <span>Последняя активность</span>
        </div>
        <v-btn
          variant="text"
          size="small"
          @click="showAllActivity = !showAllActivity"
        >
          {{ showAllActivity ? 'Скрыть' : 'Показать все' }}
        </v-btn>
      </v-card-title>
      
      <v-card-text class="pa-0">
        <v-list density="compact">
          <v-list-item
            v-for="(activity, index) in displayedActivity"
            :key="index"
            class="activity-item"
          >
            <template #prepend>
              <v-avatar :color="activity.color" size="32">
                <v-icon :icon="activity.icon" size="16" />
              </v-avatar>
            </template>
            
            <v-list-item-title class="activity-title">
              {{ activity.title }}
            </v-list-item-title>
            <v-list-item-subtitle class="activity-subtitle">
              {{ activity.time }} • {{ activity.user }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';

// Composables
const router = useRouter();
const { mobile } = useDisplay();

// Reactive data
const showAllActivity = ref(false);

// Mock data - в реальном приложении это будет из store
const compactStats = [
  { id: 'objects', label: 'Объекты', value: '156', icon: 'mdi-monitor', color: 'primary' },
  { id: 'users', label: 'Пользователи', value: '42', icon: 'mdi-account-group', color: 'success' },
  { id: 'alerts', label: 'Уведомления', value: '8', icon: 'mdi-bell', color: 'warning' },
  { id: 'tasks', label: 'Задачи', value: '25', icon: 'mdi-check-circle', color: 'info' }
];

const mobileWidgets = [
  {
    id: 'objects-summary',
    title: 'Объекты',
    icon: 'mdi-monitor',
    component: 'ObjectsSummary',
    route: '/objects'
  },
  {
    id: 'installations-summary', 
    title: 'Монтажи',
    icon: 'mdi-tools',
    component: 'InstallationsSummary',
    route: '/installations'
  },
  {
    id: 'warehouse-summary',
    title: 'Склад',
    icon: 'mdi-warehouse',
    component: 'WarehouseSummary',
    route: '/warehouse'
  }
];

const mobileQuickActions = [
  { id: 'add-object', title: 'Добавить объект', shortTitle: 'Объект', icon: 'mdi-plus', color: 'primary', route: '/objects/new' },
  { id: 'scan-qr', title: 'Сканировать QR', shortTitle: 'QR код', icon: 'mdi-qrcode-scan', color: 'secondary', route: '/scan' },
  { id: 'reports', title: 'Отчеты', shortTitle: 'Отчеты', icon: 'mdi-chart-line', color: 'success', route: '/reports' },
  { id: 'settings', title: 'Настройки', shortTitle: 'Настройки', icon: 'mdi-cog', color: 'warning', route: '/settings' },
  { id: 'support', title: 'Поддержка', shortTitle: 'Помощь', icon: 'mdi-help-circle', color: 'info', route: '/support' },
  { id: 'profile', title: 'Профиль', shortTitle: 'Профиль', icon: 'mdi-account', color: 'purple', route: '/profile' }
];

const recentActivity = [
  { title: 'Создан новый объект', time: '2 мин назад', user: 'Иван И.', icon: 'mdi-plus-circle', color: 'success' },
  { title: 'Обновлен статус монтажа', time: '15 мин назад', user: 'Мария С.', icon: 'mdi-update', color: 'info' },
  { title: 'Добавлено оборудование на склад', time: '1 ч назад', user: 'Петр К.', icon: 'mdi-package-variant', color: 'primary' },
  { title: 'Создан отчет по объектам', time: '2 ч назад', user: 'Анна Д.', icon: 'mdi-file-document', color: 'warning' },
  { title: 'Обновлены настройки пользователя', time: '3 ч назад', user: 'Сергей В.', icon: 'mdi-account-cog', color: 'secondary' }
];

// Computed
const displayedActivity = computed(() => {
  return showAllActivity.value ? recentActivity : recentActivity.slice(0, 3);
});

// Methods
const navigateToSection = (route: string) => {
  router.push(route);
};
</script>

<style scoped>
.mobile-dashboard {
  padding: 8px;
  background: rgb(var(--v-theme-background));
  min-height: 100vh;
}

.stats-row {
  margin: -4px;
}

.stats-row .v-col {
  padding: 4px;
}

.stats-card {
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stats-card:active {
  transform: scale(0.98);
}

.stats-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  line-height: 1;
}

.stats-label {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
  line-height: 1;
}

.widgets-section {
  margin-top: 16px;
}

.widget-card {
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}

.widget-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.quick-actions-mobile {
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}

/* Адаптивная сетка для мобильных быстрых действий */
.mobile-quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  align-items: stretch;
}

/* Для очень маленьких экранов - 2 кнопки в ряд */
@media (max-width: 360px) {
  .mobile-quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
}

/* Для больших мобильных экранов - больше кнопок в ряд */
@media (min-width: 480px) {
  .mobile-quick-actions-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
}

.mobile-action-btn {
  height: 56px !important;
  border-radius: 8px;
  font-size: 0.7rem;
  min-width: unset;
  width: 100%;
  transition: all 0.2s ease;
}

.mobile-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.action-text {
  font-size: 0.65rem;
  line-height: 1.1;
  text-align: center;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-activity-mobile {
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}

.activity-item {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.2;
}

.activity-subtitle {
  font-size: 0.75rem;
  line-height: 1.1;
  margin-top: 2px;
}

/* Dark theme adjustments */
[data-theme="dark"] .mobile-dashboard {
  background: rgb(var(--v-theme-background));
}

[data-theme="dark"] .stats-card,
[data-theme="dark"] .widget-card,
[data-theme="dark"] .quick-actions-mobile,
[data-theme="dark"] .recent-activity-mobile {
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(10px);
}

/* iPhone specific adjustments */
@media (max-width: 430px) and (max-height: 932px) {
  .mobile-dashboard {
    padding: 6px;
  }
  
  .stats-number {
    font-size: 1.25rem;
  }
  
  .mobile-quick-actions-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  
  .mobile-action-btn {
    height: 48px !important;
  }
  
  .action-text {
    font-size: 0.6rem;
    line-height: 1;
  }
}
</style>
