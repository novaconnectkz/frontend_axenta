<template>
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
        <v-tooltip v-if="realTimeEnabled" location="top">
          <template v-slot:activator="{ props }">
            <v-icon
              v-bind="props"
              :icon="isConnected ? 'mdi-wifi' : 'mdi-wifi-off'"
              :color="isConnected ? 'success' : 'error'"
              size="small"
              class="me-2"
            />
          </template>
          <span>
            {{ isConnected ? 'Real-time обновления включены' : 'Real-time обновления отключены' }}
          </span>
        </v-tooltip>

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
      
      <div v-else-if="loading" class="loading-state">
        <v-skeleton-loader
          :type="skeletonType"
          class="mx-auto"
        />
      </div>
      
      <div v-else class="content">
        <slot />
      </div>
    </v-card-text>

    <v-card-actions v-if="$slots.actions">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import type { WidgetSize } from '@/types/dashboard';
import type { PropType } from 'vue';
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
    realTimeEnabled: {
      type: Boolean,
      default: false
    },
    isConnected: {
      type: Boolean,
      default: false
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
      displayTitle,
      skeletonType,
      handleRefresh
    };
  }
});
</script>

<style scoped>
.base-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
}

.error-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.widget-small .widget-content {
  min-height: 150px;
}

.widget-medium .widget-content {
  min-height: 250px;
}

.widget-large .widget-content {
  min-height: 350px;
}

.widget-extra-large .widget-content {
  min-height: 450px;
}

.widget-loading {
  opacity: 0.7;
}

.widget-error {
  border-left: 4px solid rgb(var(--v-theme-error));
}
</style>
