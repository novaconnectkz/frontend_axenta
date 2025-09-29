<template>
  <div 
    class="widget-container"
    :style="widgetStyle"
  >
    <v-card
      :class="widgetClasses"
      :elevation="elevation"
      :loading="loading"
    >
    <v-card-title v-if="showHeader" class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon v-if="icon" :icon="icon" class="me-2" />
        <span>{{ displayTitle }}</span>
      </div>
      <div class="d-flex align-center">
        <v-btn
          v-if="refreshable"
          icon="mdi-refresh"
          size="small"
          variant="text"
          @click="handleRefresh"
          :disabled="loading"
        />

        <v-menu v-if="configurable">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-cog"
              size="small"
              variant="text"
              v-bind="props"
            />
          </template>
          <v-list>
            <v-list-item @click="$emit('configure')">
              <v-list-item-title>Настроить</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('remove')">
              <v-list-item-title>Удалить</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-card-title>

    <v-divider v-if="showHeader" />

    <v-card-text class="widget-content">
      <div v-if="error" class="error-state">
        <v-alert
          type="error"
          variant="tonal"
          :text="error"
          class="mb-4"
        />
        <v-btn
          color="primary"
          variant="outlined"
          @click="handleRefresh"
        >
          Попробовать снова
        </v-btn>
      </div>
      
      <!-- Убираем loading состояние, чтобы не было размытия -->
      <!-- <div v-else-if="loading" class="loading-state">
        <v-skeleton-loader
          :type="skeletonType"
          class="mx-auto"
        />
      </div> -->
      
      <div class="content">
        <slot />
      </div>
    </v-card-text>

    <v-card-actions v-if="$slots.actions">
      <slot name="actions" />
    </v-card-actions>
    </v-card>

  </div>
</template>

<script lang="ts">
import type { WidgetSize } from '@/types/dashboard';
import { computed, defineComponent } from 'vue';

export default defineComponent({
  name: 'BaseWidget',
  props: {
    title: {
      type: String,
      required: true
    },
    size: {
      type: String as PropType<WidgetSize>,
      default: 'medium'
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    },
    icon: {
      type: String,
      default: null
    },
    color: {
      type: String,
      default: 'primary'
    },
    refreshable: {
      type: Boolean,
      default: true
    },
    configurable: {
      type: Boolean,
      default: true
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    customTitle: {
      type: String,
      default: null
    },
    elevation: {
      type: Number,
      default: 2
    },
    widgetId: {
      type: String,
      required: true
    }
  },
  emits: ['refresh', 'configure', 'remove'],
  setup(props, { emit }) {

    const widgetClasses = computed(() => [
      'base-widget',
      `widget-${props.size}`,
      {
        'widget-loading': props.loading,
        'widget-error': props.error
      }
    ]);

    const displayTitle = computed(() => 
      props.customTitle || props.title
    );

    const widgetStyle = computed(() => {
      return {};
    });

    const skeletonType = computed(() => {
      switch (props.size) {
        case 'small':
          return 'card-avatar, article@2';
        case 'medium':
          return 'card-avatar, article@3';
        case 'large':
          return 'card-avatar, article@4';
        case 'extra-large':
          return 'card-avatar, article@6';
        default:
          return 'card-avatar, article@3';
      }
    });

    const handleRefresh = () => {
      emit('refresh');
    };


    return {
      widgetClasses,
      widgetStyle,
      displayTitle,
      skeletonType,
      handleRefresh
    };
  }
});
</script>

<style scoped>
.widget-container {
  position: relative;
  height: 100%;
  transition: all 0.2s ease;
}


.base-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}


.widget-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Прокрутка если содержимое не помещается */
  overflow-x: hidden; /* Скрываем горизонтальную прокрутку */
  scrollbar-width: thin; /* Firefox - тонкая прокрутка */
  scrollbar-color: rgba(var(--v-theme-on-surface), 0.2) transparent; /* Firefox - цвет прокрутки */
}

/* Webkit стилизация прокрутки (Chrome, Safari, Edge) */
.widget-content::-webkit-scrollbar {
  width: 6px;
}

.widget-content::-webkit-scrollbar-track {
  background: transparent;
}

.widget-content::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.widget-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.3);
}

.content {
  flex: 1;
  padding: 4px 0; /* Небольшие отступы для лучшего использования пространства */
}

/* Компактный режим для содержимого виджетов */
.widget-content :deep(.v-row) {
  margin: -4px !important; /* Уменьшаем отступы между рядами */
}

.widget-content :deep(.v-col) {
  padding: 4px !important; /* Уменьшаем отступы в колонках */
}

.widget-content :deep(.v-card) {
  margin-bottom: 8px; /* Уменьшаем отступы между карточками */
}

.widget-content :deep(.v-list-item) {
  min-height: 36px !important; /* Компактные элементы списка */
  padding: 6px 12px !important;
}

.widget-content :deep(.v-alert) {
  margin-bottom: 8px !important; /* Компактные алерты */
}

.error-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1; /* Заполняем доступное пространство */
}

/* Убираем min-height для всех размеров виджетов, 
   так как высота теперь контролируется родительским контейнером */
.widget-small .widget-content,
.widget-medium .widget-content,
.widget-large .widget-content,
.widget-extra-large .widget-content {
  height: 100%;
}

.widget-loading {
  opacity: 0.7;
}

.widget-error {
  border-left: 4px solid rgb(var(--v-theme-error));
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .base-widget .v-card-title {
    padding: 10px 12px; /* Уменьшаем отступы на мобильных */
    font-size: 0.95rem;
  }
  
  .base-widget .v-card-text {
    padding: 8px 12px; /* Уменьшаем отступы на мобильных */
  }
  
  /* Сохраняем фиксированную высоту на мобильных */
  .widget-content {
    height: 100% !important;
  }
  
  /* Более компактные элементы на мобильных */
  .widget-content :deep(.v-list-item) {
    min-height: 32px !important;
    padding: 4px 8px !important;
  }
  
  .widget-content :deep(.v-row) {
    margin: -2px !important;
  }
  
  .widget-content :deep(.v-col) {
    padding: 2px !important;
  }
  
  .error-state,
  .loading-state {
    flex: 1;
  }

}

@media (max-width: 480px) {
  .base-widget .v-card-title {
    padding: 6px 10px; /* Еще более компактные отступы */
    font-size: 0.85rem;
  }
  
  .base-widget .v-card-text {
    padding: 6px 10px; /* Еще более компактные отступы */
  }
  
  /* Сохраняем фиксированную высоту на маленьких мобильных */
  .widget-content {
    height: 100% !important;
  }
  
  /* Максимально компактные элементы на маленьких экранах */
  .widget-content :deep(.v-list-item) {
    min-height: 28px !important;
    padding: 3px 6px !important;
    font-size: 0.8rem;
  }
  
  .widget-content :deep(.v-chip) {
    font-size: 0.7rem !important;
    height: 20px !important;
  }
  
  .error-state,
  .loading-state {
    flex: 1;
  }
}
</style>
