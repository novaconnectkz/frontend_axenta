<template>
  <v-row class="mb-4">
    <v-col cols="12">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon start icon="mdi-lightning-bolt" />
            Быстрые действия
          </div>
          <v-btn
            v-if="isDragMode"
            :color="isQuickActionsDragMode ? 'success' : 'info'"
            :variant="isQuickActionsDragMode ? 'flat' : 'outlined'"
            size="small"
            @click="$emit('toggleQuickActionsDrag')"
          >
            <v-icon start :icon="isQuickActionsDragMode ? 'mdi-check' : 'mdi-drag'" />
            {{ isQuickActionsDragMode ? 'Готово' : 'Изменить порядок' }}
          </v-btn>
        </v-card-title>
        <v-card-text>
          <!-- Draggable Quick Actions -->
          <VueDraggable
            v-if="isQuickActionsDragMode"
            v-model="draggableQuickActions"
            :animation="200"
            ghost-class="ghost-quick-action"
            chosen-class="chosen-quick-action"
            drag-class="drag-quick-action"
            @start="$emit('quickActionDragStart')"
            @end="$emit('quickActionDragEnd')"
            class="quick-actions-drag-container"
          >
            <div 
              v-for="action in availableQuickActions" 
              :key="action.id"
              class="draggable-quick-action"
            >
              <div class="quick-action-drag-handle">
                <v-icon icon="mdi-drag-horizontal" size="small" />
              </div>
              <v-btn 
                :color="action.color" 
                variant="outlined" 
                :to="action.route" 
                class="quick-action-btn draggable-btn"
                :class="{ 'rail-quick-btn': $vuetify.display.lgAndUp && isRailMode }"
              >
                <v-icon start :icon="action.icon" />
                <span class="action-text">{{ action.title }}</span>
              </v-btn>
            </div>
          </VueDraggable>

          <!-- Normal Quick Actions Grid -->
          <div v-else class="quick-actions-grid" :class="{ 'rail-mode': $vuetify.display.lgAndUp && isRailMode }">
            <v-btn 
              v-for="action in availableQuickActions" 
              :key="action.id" 
              :color="action.color" 
              variant="outlined" 
              :to="action.route" 
              class="quick-action-btn"
              :class="{ 'rail-quick-btn': $vuetify.display.lgAndUp && isRailMode }"
            >
              <v-icon start :icon="action.icon" />
              <span class="action-text">{{ action.title }}</span>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

export default defineComponent({
  name: 'QuickActionsBlock',
  components: {
    VueDraggable
  },
  props: {
    isDragMode: {
      type: Boolean,
      required: true
    },
    isQuickActionsDragMode: {
      type: Boolean,
      required: true
    },
    availableQuickActions: {
      type: Array,
      required: true
    },
    draggableQuickActions: {
      type: Object,
      required: true
    },
    isRailMode: {
      type: Boolean,
      required: true
    }
  },
  emits: ['toggleQuickActionsDrag', 'quickActionDragStart', 'quickActionDragEnd']
});
</script>

<style scoped>
/* Адаптивная сетка для быстрых действий */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  align-items: stretch;
}

/* Для больших экранов - все кнопки в одну строку */
@media (min-width: 1280px) {
  .quick-actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
  }
}

/* Для экстра больших экранов */
@media (min-width: 1920px) {
  .quick-actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
  }
}

/* Режим свернутого меню - больше места для кнопок */
.quick-actions-grid.rail-mode {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.quick-action-btn {
  height: 64px;
  flex-direction: column;
  gap: 4px;
  font-size: 0.875rem;
  min-width: 140px;
  transition: all 0.2s ease;
}

.quick-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.rail-quick-btn {
  min-width: 180px;
  height: 72px;
}

.quick-action-btn .v-icon {
  margin-bottom: 4px;
}

.action-text {
  text-align: center;
  line-height: 1.2;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Quick Actions Drag & Drop Styles */
.quick-actions-drag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 80px;
  padding: 8px;
  border: 2px dashed rgba(var(--v-theme-info), 0.3);
  border-radius: 8px;
  background: rgba(var(--v-theme-info), 0.05);
}

.draggable-quick-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: 1px solid rgba(var(--v-theme-info), 0.3);
  border-radius: 6px;
  background: rgba(var(--v-theme-surface), 1);
  transition: all 0.3s ease;
  cursor: move;
}

.draggable-quick-action:hover {
  border-color: rgba(var(--v-theme-info), 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-action-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(var(--v-theme-info), 0.1);
  border-radius: 4px;
  cursor: grab;
  flex-shrink: 0;
}

.quick-action-drag-handle:active {
  cursor: grabbing;
}

.draggable-btn {
  cursor: pointer !important;
  pointer-events: auto;
}

/* Ghost states for quick actions */
.ghost-quick-action {
  opacity: 0.5;
  background: rgba(var(--v-theme-info), 0.2);
  border: 2px dashed rgba(var(--v-theme-info), 0.5);
}

.drag-quick-action {
  transform: rotate(3deg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.chosen-quick-action {
  border-color: rgba(var(--v-theme-info), 0.8);
  background: rgba(var(--v-theme-info), 0.1);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  /* Мобильная сетка - 2 кнопки в ряд */
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .quick-action-btn {
    height: 56px;
    font-size: 0.75rem;
    min-width: unset;
  }
  
  .action-text {
    font-size: 0.7rem;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .quick-actions-drag-container {
    flex-direction: column;
    gap: 8px;
  }
  
  .draggable-quick-action {
    width: 100%;
    justify-content: flex-start;
  }
  
  .quick-action-drag-handle {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 480px) {
  /* Очень маленькие экраны - 3 кнопки в ряд */
  .quick-actions-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  
  .quick-action-btn {
    height: 48px;
    font-size: 0.7rem;
    min-width: unset;
    padding: 4px;
  }
  
  .action-text {
    font-size: 0.65rem;
    line-height: 1.1;
  }

  .quick-actions-drag-container {
    gap: 6px;
    padding: 6px;
  }
  
  .draggable-quick-action {
    padding: 2px;
  }
  
  .quick-action-drag-handle {
    width: 18px;
    height: 18px;
  }
}

/* iPhone 14 Pro Max specific optimizations */
@media (max-width: 430px) and (max-height: 932px) {
  .quick-action-btn {
    height: 52px;
  }
}
</style>
