<template>
  <div class="dashboard-grid" ref="gridContainer">
    <v-row v-if="!isLayoutLoaded" class="fill-height">
      <v-col cols="12" class="d-flex align-center justify-center">
        <v-progress-circular indeterminate size="64" />
        <span class="ml-4">Загрузка панели управления...</span>
      </v-col>
    </v-row>

    <div v-else-if="currentLayout" class="grid-container">
      <!-- Drag and Drop Toggle -->
      <div class="drag-controls mb-4">
        <v-btn
          :color="isDragMode ? 'success' : 'primary'"
          :variant="isDragMode ? 'flat' : 'outlined'"
          @click="toggleDragMode"
          class="me-2"
        >
          <v-icon start :icon="isDragMode ? 'mdi-check' : 'mdi-drag'" />
          {{ isDragMode ? 'Завершить перестановку' : 'Переставить виджеты' }}
        </v-btn>
        
        <v-chip v-if="isDragMode" color="info" variant="outlined" class="me-2">
          <v-icon start icon="mdi-information" />
          Перетащите виджеты для изменения порядка
        </v-chip>
        
        <v-btn
          v-if="isDragMode"
          color="secondary"
          variant="outlined"
          @click="resetWidgetOrder"
          class="me-2"
        >
          <v-icon start icon="mdi-restore" />
          Сбросить порядок
        </v-btn>

        <!-- Quick Actions Position Control -->
        <v-btn
          v-if="isDragMode"
          :color="quickActionsPosition === 'top' ? 'warning' : 'info'"
          variant="outlined"
          @click="toggleQuickActionsPosition"
        >
          <v-icon start :icon="quickActionsPosition === 'top' ? 'mdi-arrow-down' : 'mdi-arrow-up'" />
          {{ quickActionsPosition === 'top' ? 'Быстрые действия вниз' : 'Быстрые действия вверх' }}
        </v-btn>
      </div>

      <!-- Quick Actions Section - Top Position -->
      <div v-if="showQuickActions && quickActionsPosition === 'top'">
        <QuickActionsBlock 
          :is-drag-mode="isDragMode"
          :is-quick-actions-drag-mode="isQuickActionsDragMode"
          :available-quick-actions="availableQuickActions"
          :draggable-quick-actions="draggableQuickActions"
          :is-rail-mode="isRailMode"
          @toggle-quick-actions-drag="toggleQuickActionsDragMode"
          @quick-action-drag-start="onQuickActionDragStart"
          @quick-action-drag-end="onQuickActionDragEnd"
        />
      </div>

      <!-- Draggable Widgets Container -->
      <VueDraggable
        v-if="isDragMode"
        v-model="draggableWidgets"
        :animation="200"
        ghost-class="ghost-widget"
        chosen-class="chosen-widget"
        drag-class="drag-widget"
        @start="onDragStart"
        @end="onDragEnd"
        class="draggable-container"
      >
        <div 
          v-for="widget in visibleWidgets" 
          :key="widget.id"
          class="draggable-widget-wrapper"
        >
          <div class="drag-handle">
            <v-icon icon="mdi-drag-horizontal" />
            <span class="widget-title">{{ widget.title }}</span>
          </div>
          <div class="widget-content">
            <component 
              :is="getWidgetComponent(widget.type)" 
              :refresh-interval="widget.config.refreshInterval || 300"
              @configure="configureWidget(widget)" 
              @remove="removeWidget(widget.id)" 
              v-bind="widget.config" 
            />
          </div>
        </div>
      </VueDraggable>

      <!-- Normal Grid View -->
      <v-row v-else>
        <template v-for="widget in visibleWidgets" :key="widget.id">
          <v-col 
            cols="12" 
            sm="12" 
            md="6" 
            lg="6" 
            xl="6" 
            class="widget-column">
            <component :is="getWidgetComponent(widget.type)" :refresh-interval="widget.config.refreshInterval || 300"
              @configure="configureWidget(widget)" @remove="removeWidget(widget.id)" v-bind="widget.config" />
          </v-col>
        </template>
      </v-row>

      <!-- Quick Actions Section - Bottom Position -->
      <QuickActionsBlock 
        v-if="showQuickActions && quickActionsPosition === 'bottom'"
        :is-drag-mode="isDragMode"
        :is-quick-actions-drag-mode="isQuickActionsDragMode"
        :available-quick-actions="availableQuickActions"
        :draggable-quick-actions="draggableQuickActions"
        :is-rail-mode="isRailMode"
        @toggle-quick-actions-drag="toggleQuickActionsDragMode"
        @quick-action-drag-start="onQuickActionDragStart"
        @quick-action-drag-end="onQuickActionDragEnd"
        class="mt-4"
      />
    </div>

    <!-- Widget Configuration Dialog -->
    <v-dialog v-model="configDialog" max-width="600">
      <v-card v-if="selectedWidget">
        <v-card-title>
          <v-icon start icon="mdi-cog" />
          Настройка виджета: {{ selectedWidget.title }}
        </v-card-title>

        <v-card-text>
          <v-form ref="configForm">
            <v-text-field v-model="widgetConfig.customTitle" label="Заголовок виджета"
              :placeholder="selectedWidget.title" />

            <v-select v-model="widgetConfig.refreshInterval" label="Интервал обновления" :items="refreshIntervals"
              item-title="label" item-value="value" />

            <v-switch v-model="widgetConfig.showHeader" label="Показывать заголовок" color="primary" />

            <v-select v-if="selectedWidget.type === 'chart'" v-model="widgetConfig.chartType" label="Тип графика"
              :items="chartTypes" item-title="label" item-value="value" />

            <v-select v-model="widgetConfig.dataRange" label="Период данных" :items="dataRanges" item-title="label"
              item-value="value" />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="configDialog = false">
            Отмена
          </v-btn>
          <v-btn color="primary" @click="saveWidgetConfig">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Layout Management FAB -->
    <v-fab location="bottom end" size="small" icon="mdi-cog" color="primary" @click="showLayoutDialog = true" />

    <!-- Layout Management Dialog -->
    <v-dialog v-model="showLayoutDialog" max-width="800">
      <v-card>
        <v-card-title>
          <v-icon start icon="mdi-view-dashboard" />
          Управление макетами
        </v-card-title>

        <v-card-text>
          <v-tabs v-model="layoutTab">
            <v-tab value="current">Текущий макет</v-tab>
            <v-tab value="saved">Сохраненные</v-tab>
            <v-tab value="widgets">Виджеты</v-tab>
          </v-tabs>

          <v-tabs-window v-model="layoutTab">
            <!-- Current Layout Tab -->
            <v-tabs-window-item value="current">
              <div class="pa-4">
                <v-text-field v-if="currentLayout" v-model="currentLayout.name" label="Название макета"
                  prepend-icon="mdi-rename-box" />

                <div class="d-flex gap-2 mt-4">
                  <v-btn color="primary" @click="saveLayout" :loading="loading">
                    <v-icon start icon="mdi-content-save" />
                    Сохранить макет
                  </v-btn>

                  <v-btn color="secondary" variant="outlined" @click="resetToDefault">
                    <v-icon start icon="mdi-restore" />
                    Сбросить
                  </v-btn>
                </div>
              </div>
            </v-tabs-window-item>

            <!-- Saved Layouts Tab -->
            <v-tabs-window-item value="saved">
              <div class="pa-4">
                <v-list>
                  <v-list-item v-for="layout in availableLayouts" :key="layout.id"
                    :active="currentLayout?.id === layout.id">
                    <template v-slot:prepend>
                      <v-icon icon="mdi-view-dashboard" />
                    </template>

                    <v-list-item-title>{{ layout.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ layout.widgets.length }} виджетов
                      <v-chip v-if="layout.isDefault" color="primary" size="x-small" class="ml-2">
                        По умолчанию
                      </v-chip>
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <v-btn-group variant="text" density="compact">
                        <v-btn icon="mdi-eye" size="small" @click="switchLayout(layout.id)"
                          :disabled="currentLayout?.id === layout.id" />
                        <v-btn icon="mdi-star" size="small" @click="setDefaultLayout(layout.id)"
                          :disabled="layout.isDefault" />
                        <v-btn icon="mdi-delete" size="small" color="error" @click="deleteLayout(layout.id)"
                          :disabled="layout.isDefault" />
                      </v-btn-group>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
            </v-tabs-window-item>

            <!-- Widgets Tab -->
            <v-tabs-window-item value="widgets">
              <div class="pa-4">
                <v-list>
                  <v-list-subheader>Доступные виджеты</v-list-subheader>
                  <v-list-item v-for="widgetType in availableWidgetTypes" :key="widgetType.type">
                    <template v-slot:prepend>
                      <v-icon :icon="widgetType.icon" />
                    </template>

                    <v-list-item-title>{{ widgetType.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ widgetType.description }}</v-list-item-subtitle>

                    <template v-slot:append>
                      <v-btn color="primary" variant="outlined" size="small" @click="addWidget(widgetType)"
                        :disabled="hasWidget(widgetType.type)">
                        <v-icon start icon="mdi-plus" />
                        Добавить
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showLayoutDialog = false">
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { useAuth } from '@/context/auth';
import { useDashboardStoreWithInit } from '@/store/dashboard';
import type { Widget, WidgetType } from '@/types/dashboard';
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

// Import widget components
import BillingOverviewWidget from './BillingOverviewWidget.vue';
import InstallationsOverviewWidget from './InstallationsOverviewWidget.vue';
import ObjectsOverviewWidget from './ObjectsOverviewWidget.vue';
import RecentActivityWidget from './RecentActivityWidget.vue';
import UsersOverviewWidget from './UsersOverviewWidget.vue';
import WarehouseOverviewWidget from './WarehouseOverviewWidget.vue';
import QuickActionsBlock from './QuickActionsBlock.vue';

export default defineComponent({
  name: 'DashboardGrid',
  components: {
    ObjectsOverviewWidget,
    UsersOverviewWidget,
    BillingOverviewWidget,
    InstallationsOverviewWidget,
    WarehouseOverviewWidget,
    RecentActivityWidget,
    VueDraggable,
    QuickActionsBlock
  },
  setup() {
    const dashboardStore = useDashboardStoreWithInit();
    const auth = useAuth();

    // Reactive refs
    const gridContainer = ref<HTMLElement>();
    const configDialog = ref(false);
    const showLayoutDialog = ref(false);
    const showQuickActions = ref(true);
    const layoutTab = ref('current');
    const selectedWidget = ref<Widget | null>(null);
    const widgetConfig = ref<any>({});
    const isDragMode = ref(false);
    const isDragging = ref(false);
    const isQuickActionsDragMode = ref(false);

    // Configuration options
    const refreshIntervals = [
      { label: 'Без автообновления', value: 0 },
      { label: 'Каждые 30 секунд', value: 30 },
      { label: 'Каждую минуту', value: 60 },
      { label: 'Каждые 2 минуты', value: 120 },
      { label: 'Каждые 5 минут', value: 300 },
      { label: 'Каждые 10 минут', value: 600 }
    ];

    const chartTypes = [
      { label: 'Линейный график', value: 'line' },
      { label: 'Столбчатая диаграмма', value: 'bar' },
      { label: 'Круговая диаграмма', value: 'pie' },
      { label: 'Кольцевая диаграмма', value: 'doughnut' }
    ];

    const dataRanges = [
      { label: 'Сегодня', value: 'today' },
      { label: 'Эта неделя', value: 'week' },
      { label: 'Этот месяц', value: 'month' },
      { label: 'Этот год', value: 'year' }
    ];

    const availableWidgetTypes = [
      {
        type: 'objects-overview',
        title: 'Обзор объектов',
        description: 'Статистика по объектам мониторинга',
        icon: 'mdi-monitor'
      },
      {
        type: 'users-overview',
        title: 'Обзор пользователей',
        description: 'Статистика по пользователям системы',
        icon: 'mdi-account-group'
      },
      {
        type: 'billing-overview',
        title: 'Обзор биллинга',
        description: 'Финансовая статистика и счета',
        icon: 'mdi-currency-usd'
      },
      {
        type: 'installations-overview',
        title: 'Обзор монтажей',
        description: 'Статистика по монтажным работам',
        icon: 'mdi-hammer-wrench'
      },
      {
        type: 'warehouse-overview',
        title: 'Обзор склада',
        description: 'Состояние складских запасов',
        icon: 'mdi-warehouse'
      },
      {
        type: 'recent-activity',
        title: 'Последняя активность',
        description: 'Недавние действия в системе',
        icon: 'mdi-history'
      }
    ];

    // Computed properties
    const {
      currentLayout,
      availableLayouts,
      quickActions,
      isLoading: loading,
      isLayoutLoaded
    } = dashboardStore;
    
    // Реактивное свойство для позиции быстрых действий
    const quickActionsPosition = computed(() => dashboardStore.quickActionsPosition);

    const visibleWidgets = computed(() =>
      currentLayout?.widgets.filter(w => w.visible) || []
    );

    // Draggable widgets model
    const draggableWidgets = computed({
      get: () => visibleWidgets.value,
      set: (newOrder: Widget[]) => {
        dashboardStore.updateWidgetOrder(newOrder);
      }
    });

    // Draggable quick actions model
    const draggableQuickActions = computed({
      get: () => availableQuickActions.value,
      set: (newOrder: any[]) => {
        dashboardStore.saveQuickActionsOrder(newOrder);
      }
    });

    const availableQuickActions = computed(() =>
      quickActions.filter(action =>
        !action.permission || (auth?.hasPermission && auth.hasPermission(action.permission)) || true
      )
    );

    // Определяем состояние rail mode из родительского компонента (AppLayout)
    const isRailMode = ref(false);

    // Methods
    const getWidgetComponent = (type: WidgetType) => {
      const componentMap: Record<string, any> = {
        'objects-overview': ObjectsOverviewWidget,
        'users-overview': UsersOverviewWidget,
        'billing-overview': BillingOverviewWidget,
        'installations-overview': InstallationsOverviewWidget,
        'warehouse-overview': WarehouseOverviewWidget,
        'recent-activity': RecentActivityWidget
      };
      return componentMap[type] || 'div';
    };

    const getColSize = (width: number): number => {
      return Math.min(12, Math.max(1, width));
    };

    const configureWidget = (widget: Widget) => {
      selectedWidget.value = widget;
      widgetConfig.value = { ...widget.config };
      configDialog.value = true;
    };

    const saveWidgetConfig = () => {
      if (selectedWidget.value) {
        dashboardStore.updateWidget(selectedWidget.value.id, {
          config: { ...widgetConfig.value }
        });
        configDialog.value = false;
        selectedWidget.value = null;
      }
    };

    const removeWidget = (widgetId: string) => {
      dashboardStore.removeWidget(widgetId);
    };

    const addWidget = (widgetType: any) => {
      const newWidget: Widget = {
        id: `${widgetType.type}-${Date.now()}`,
        title: widgetType.title,
        type: widgetType.type,
        size: 'medium',
        position: { row: 0, col: 0, width: 6, height: 4 },
        config: { refreshInterval: 300 },
        visible: true
      };
      dashboardStore.addWidget(newWidget);
    };

    const hasWidget = (type: string): boolean => {
      return visibleWidgets.value.some(w => w.type === type);
    };

    const saveLayout = async () => {
      try {
        await dashboardStore.saveCurrentLayout();
        showLayoutDialog.value = false;
      } catch (error) {
        console.error('Ошибка сохранения макета:', error);
      }
    };

    const switchLayout = async (layoutId: string) => {
      try {
        await dashboardStore.switchLayout(layoutId);
      } catch (error) {
        console.error('Ошибка переключения макета:', error);
      }
    };

    const setDefaultLayout = async (layoutId: string) => {
      try {
        await dashboardStore.setDefaultLayout(layoutId);
      } catch (error) {
        console.error('Ошибка установки макета по умолчанию:', error);
      }
    };

    const deleteLayout = async (layoutId: string) => {
      try {
        await dashboardStore.deleteLayout(layoutId);
      } catch (error) {
        console.error('Ошибка удаления макета:', error);
      }
    };

    const resetToDefault = () => {
      // Implementation for resetting to default layout
      dashboardStore.clearError();
      dashboardStore.loadLayouts();
    };

    // Drag and Drop methods
    const toggleDragMode = () => {
      isDragMode.value = !isDragMode.value;
      if (!isDragMode.value) {
        // Сохраняем позиции при выходе из режима перетаскивания
        dashboardStore.saveWidgetPositions();
        // Выключаем режим перетаскивания быстрых действий
        isQuickActionsDragMode.value = false;
      }
    };

    const onDragStart = () => {
      isDragging.value = true;
    };

    const onDragEnd = () => {
      isDragging.value = false;
      // Сохраняем новый порядок
      dashboardStore.saveWidgetPositions();
    };

    const resetWidgetOrder = () => {
      // Сбрасываем к исходному порядку (можно загрузить из бэкенда или использовать дефолтный)
      dashboardStore.clearError();
      dashboardStore.loadLayouts();
      isDragMode.value = false;
    };

    // Quick Actions Drag and Drop methods
    const toggleQuickActionsDragMode = () => {
      isQuickActionsDragMode.value = !isQuickActionsDragMode.value;
    };

    const onQuickActionDragStart = () => {
      console.log('Начало перетаскивания быстрого действия');
    };

    const onQuickActionDragEnd = () => {
      console.log('Завершение перетаскивания быстрого действия');
      // Сохранение произойдет автоматически через draggableQuickActions setter
    };

    const toggleQuickActionsPosition = () => {
      console.log('Нажата кнопка переключения позиции, текущая позиция:', quickActionsPosition.value);
      dashboardStore.toggleQuickActionsPosition();
      console.log('После переключения позиция:', quickActionsPosition.value);
    };

    // Определяем состояние rail mode через медиа-запросы и локальное хранилище
    const checkRailMode = () => {
      // Проверяем ширину экрана и состояние в localStorage
      const isLargeScreen = window.innerWidth >= 1280;
      const savedRailState = localStorage.getItem('sidebar-rail') === 'true';
      isRailMode.value = isLargeScreen && savedRailState;
    };

    // Lifecycle
    onMounted(async () => {
      try {
        await dashboardStore.refreshAll();
        
        // Проверяем rail mode при загрузке
        checkRailMode();
        
        // Слушаем изменения размера окна
        window.addEventListener('resize', checkRailMode);
        
        // Слушаем изменения в localStorage для rail mode
        window.addEventListener('storage', (e) => {
          if (e.key === 'sidebar-rail') {
            checkRailMode();
          }
        });
      } catch (error) {
        console.error('Ошибка инициализации Dashboard:', error);
      }
    });

    onUnmounted(() => {
      // Очищаем event listeners
      window.removeEventListener('resize', checkRailMode);
      window.removeEventListener('storage', checkRailMode);
    });

    return {
      // Refs
      gridContainer,
      configDialog,
      showLayoutDialog,
      showQuickActions,
      layoutTab,
      selectedWidget,
      widgetConfig,
      isDragMode,
      isDragging,
      isQuickActionsDragMode,

      // Store
      currentLayout,
      availableLayouts,
      loading,
      isLayoutLoaded,

      // Computed
      visibleWidgets,
      draggableWidgets,
      draggableQuickActions,
      availableQuickActions,
      quickActionsPosition,
      isRailMode,

      // Configuration
      refreshIntervals,
      chartTypes,
      dataRanges,
      availableWidgetTypes,

      // Methods
      getWidgetComponent,
      getColSize,
      configureWidget,
      saveWidgetConfig,
      removeWidget,
      addWidget,
      hasWidget,
      saveLayout,
      switchLayout,
      setDefaultLayout,
      deleteLayout,
      resetToDefault,
      toggleDragMode,
      onDragStart,
      onDragEnd,
      resetWidgetOrder,
      toggleQuickActionsDragMode,
      onQuickActionDragStart,
      onQuickActionDragEnd,
      toggleQuickActionsPosition
    };
  }
});
</script>

<style scoped>
.dashboard-grid {
  height: 100%;
  padding: 16px;
}

.grid-container {
  height: 100%;
}

.widget-column {
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.widget-column > * {
  flex: 1;
  display: flex;
  flex-direction: column;
}


/* Mobile optimizations */
@media (max-width: 768px) {
  .dashboard-grid {
    padding: 8px;
  }
  
  .widget-column {
    min-height: 280px;
    margin-bottom: 8px;
  }
  
  
  /* Ensure proper spacing on mobile */
  .v-row {
    margin: -4px;
  }
  
  .v-col {
    padding: 4px;
  }
}

@media (max-width: 480px) {
  .dashboard-grid {
    padding: 4px;
  }
  
  .widget-column {
    min-height: 250px;
    margin-bottom: 4px;
  }
  
  
  .v-row {
    margin: -2px;
  }
  
  .v-col {
    padding: 2px;
  }
}

/* iPhone 14 Pro Max specific optimizations */
@media (max-width: 430px) and (max-height: 932px) {
  .dashboard-grid {
    padding: 6px;
  }
  
  .widget-column {
    min-height: 240px;
  }
  
}

/* Drag and Drop Styles */
.drag-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.draggable-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.draggable-widget-wrapper {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.8);
  transition: all 0.3s ease;
  cursor: move;
}

.draggable-widget-wrapper:hover {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-surface), 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.drag-handle {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(var(--v-theme-primary), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 8px 8px 0 0;
  cursor: grab;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.widget-title {
  margin-left: 8px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.widget-content {
  padding: 0;
}

.widget-content :deep(.v-card) {
  border-radius: 0 0 8px 8px;
  box-shadow: none;
}

/* Ghost element during drag */
.ghost-widget {
  opacity: 0.5;
  background: rgba(var(--v-theme-primary), 0.1);
  border: 2px dashed rgba(var(--v-theme-primary), 0.5);
}

/* Element being dragged */
.drag-widget {
  transform: rotate(5deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

/* Chosen element */
.chosen-widget {
  border-color: rgba(var(--v-theme-primary), 0.8);
  background: rgba(var(--v-theme-primary), 0.05);
}

/* Mobile optimizations for drag mode */
@media (max-width: 768px) {
  .draggable-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .drag-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .drag-handle {
    padding: 12px 16px;
  }
  
  .widget-title {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .draggable-container {
    gap: 8px;
  }
  
  .drag-handle {
    padding: 8px 12px;
  }
  
  .widget-title {
    font-size: 0.85rem;
  }
}

/* Tablet optimizations */
@media (min-width: 769px) and (max-width: 1024px) {
  .draggable-container {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

/* Large screen optimizations */
@media (min-width: 1280px) {
  .draggable-container {
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 20px;
  }
  
  .drag-handle {
    padding: 10px 20px;
  }
}


/* Дополнительные стили для оптимизации текста */
.widget-column :deep(.v-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-column :deep(.v-card-text) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Защита от переносов для всех текстовых элементов в виджетах */
.widget-column :deep(.stat-label),
.widget-column :deep(.stat-title) {
  word-break: keep-all !important;
  overflow-wrap: normal !important;
  line-height: 1.3 !important;
}

.widget-column :deep(.v-list-item-title) {
  white-space: normal !important;
  word-break: keep-all !important;
  overflow-wrap: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
}
</style>
