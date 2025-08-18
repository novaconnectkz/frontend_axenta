<template>
  <div class="dashboard-grid" ref="gridContainer">
    <v-row v-if="!isLayoutLoaded" class="fill-height">
      <v-col cols="12" class="d-flex align-center justify-center">
        <v-progress-circular indeterminate size="64" />
        <span class="ml-4">Загрузка панели управления...</span>
      </v-col>
    </v-row>

    <div v-else-if="currentLayout" class="grid-container">
      <v-row>
        <template v-for="widget in visibleWidgets" :key="widget.id">
          <v-col
            :cols="getColSize(widget.position.width)"
            :md="getColSize(widget.position.width)"
            :lg="getColSize(widget.position.width)"
            class="widget-column"
          >
            <component
              :is="getWidgetComponent(widget.type)"
              :refresh-interval="widget.config.refreshInterval || 300"
              @configure="configureWidget(widget)"
              @remove="removeWidget(widget.id)"
              v-bind="widget.config"
            />
          </v-col>
        </template>
      </v-row>

      <!-- Quick Actions Section -->
      <v-row v-if="showQuickActions" class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon start icon="mdi-lightning-bolt" />
              Быстрые действия
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col
                  v-for="action in availableQuickActions"
                  :key="action.id"
                  cols="6"
                  sm="4"
                  md="3"
                  lg="2"
                >
                  <v-btn
                    :color="action.color"
                    variant="outlined"
                    block
                    :to="action.route"
                    class="quick-action-btn"
                  >
                    <v-icon start :icon="action.icon" />
                    {{ action.title }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
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
            <v-text-field
              v-model="widgetConfig.customTitle"
              label="Заголовок виджета"
              :placeholder="selectedWidget.title"
            />
            
            <v-select
              v-model="widgetConfig.refreshInterval"
              label="Интервал обновления"
              :items="refreshIntervals"
              item-title="label"
              item-value="value"
            />
            
            <v-switch
              v-model="widgetConfig.showHeader"
              label="Показывать заголовок"
              color="primary"
            />
            
            <v-select
              v-if="selectedWidget.type === 'chart'"
              v-model="widgetConfig.chartType"
              label="Тип графика"
              :items="chartTypes"
              item-title="label"
              item-value="value"
            />
            
            <v-select
              v-model="widgetConfig.dataRange"
              label="Период данных"
              :items="dataRanges"
              item-title="label"
              item-value="value"
            />
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
    <v-fab
      location="bottom end"
      size="small"
      icon="mdi-cog"
      color="primary"
      @click="showLayoutDialog = true"
    />

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
                <v-text-field
                  v-if="currentLayout"
                  v-model="currentLayout.name"
                  label="Название макета"
                  prepend-icon="mdi-rename-box"
                />
                
                <div class="d-flex gap-2 mt-4">
                  <v-btn
                    color="primary"
                    @click="saveLayout"
                    :loading="loading"
                  >
                    <v-icon start icon="mdi-content-save" />
                    Сохранить макет
                  </v-btn>
                  
                  <v-btn
                    color="secondary"
                    variant="outlined"
                    @click="resetToDefault"
                  >
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
                  <v-list-item
                    v-for="layout in availableLayouts"
                    :key="layout.id"
                    :active="currentLayout?.id === layout.id"
                  >
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
                        <v-btn
                          icon="mdi-eye"
                          size="small"
                          @click="switchLayout(layout.id)"
                          :disabled="currentLayout?.id === layout.id"
                        />
                        <v-btn
                          icon="mdi-star"
                          size="small"
                          @click="setDefaultLayout(layout.id)"
                          :disabled="layout.isDefault"
                        />
                        <v-btn
                          icon="mdi-delete"
                          size="small"
                          color="error"
                          @click="deleteLayout(layout.id)"
                          :disabled="layout.isDefault"
                        />
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
                  <v-list-item
                    v-for="widgetType in availableWidgetTypes"
                    :key="widgetType.type"
                  >
                    <template v-slot:prepend>
                      <v-icon :icon="widgetType.icon" />
                    </template>
                    
                    <v-list-item-title>{{ widgetType.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ widgetType.description }}</v-list-item-subtitle>
                    
                    <template v-slot:append>
                      <v-btn
                        color="primary"
                        variant="outlined"
                        size="small"
                        @click="addWidget(widgetType)"
                        :disabled="hasWidget(widgetType.type)"
                      >
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
// import { useAuth } from '@/context/auth'; // Временно отключаем
import { useDashboardStore } from '@/store/dashboard';
import type { Widget, WidgetType } from '@/types/dashboard';
import { computed, defineComponent, onMounted, ref } from 'vue';

// Import widget components
import BillingOverviewWidget from './BillingOverviewWidget.vue';
import InstallationsOverviewWidget from './InstallationsOverviewWidget.vue';
import ObjectsOverviewWidget from './ObjectsOverviewWidget.vue';
import RecentActivityWidget from './RecentActivityWidget.vue';
import UsersOverviewWidget from './UsersOverviewWidget.vue';
import WarehouseOverviewWidget from './WarehouseOverviewWidget.vue';

export default defineComponent({
  name: 'DashboardGrid',
  components: {
    ObjectsOverviewWidget,
    UsersOverviewWidget,
    BillingOverviewWidget,
    InstallationsOverviewWidget,
    WarehouseOverviewWidget,
    RecentActivityWidget
  },
  setup() {
    const dashboardStore = useDashboardStore();
    // const auth = useAuth(); // Временно отключаем
    
    // Заглушка для auth
    const auth = { user: { value: { name: 'Пользователь' } } };
    
    // Reactive refs
    const gridContainer = ref<HTMLElement>();
    const configDialog = ref(false);
    const showLayoutDialog = ref(false);
    const showQuickActions = ref(true);
    const layoutTab = ref('current');
    const selectedWidget = ref<Widget | null>(null);
    const widgetConfig = ref<any>({});
    
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

    const visibleWidgets = computed(() => 
      currentLayout?.widgets.filter(w => w.visible) || []
    );

    const availableQuickActions = computed(() => 
      quickActions.filter(action => 
        !action.permission || auth.hasPermission(action.permission)
      )
    );

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

    // Lifecycle
    onMounted(async () => {
      try {
        await dashboardStore.refreshAll();
      } catch (error) {
        console.error('Ошибка инициализации Dashboard:', error);
      }
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
      
      // Store
      currentLayout,
      availableLayouts,
      loading,
      isLayoutLoaded,
      
      // Computed
      visibleWidgets,
      availableQuickActions,
      
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
      resetToDefault
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
}

.quick-action-btn {
  height: 64px;
  flex-direction: column;
  gap: 4px;
}

.quick-action-btn .v-icon {
  margin-bottom: 4px;
}
</style>
