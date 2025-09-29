<template>
  <div class="snap-guides-overlay" v-if="showGuides">
    <!-- Сетка -->
    <div 
      v-if="gridSettings.showGrid && gridSettings.enabled"
      class="grid-background"
      :style="gridStyle"
    ></div>

    <!-- Направляющие линии -->
    <div class="snap-lines">
      <!-- Вертикальные направляющие -->
      <div
        v-for="(line, index) in verticalGuides"
        :key="`v-${index}`"
        class="snap-line vertical"
        :style="{
          left: `${line.position}px`,
          height: `${containerHeight}px`,
          backgroundColor: getLineColor(line.type)
        }"
      >
        <div class="snap-indicator" :style="{ top: `${line.indicatorY || 0}px` }">
          <v-icon size="12" :color="getLineColor(line.type)">mdi-drag-vertical</v-icon>
        </div>
      </div>

      <!-- Горизонтальные направляющие -->
      <div
        v-for="(line, index) in horizontalGuides"
        :key="`h-${index}`"
        class="snap-line horizontal"
        :style="{
          top: `${line.position}px`,
          width: `${containerWidth}px`,
          backgroundColor: getLineColor(line.type)
        }"
      >
        <div class="snap-indicator" :style="{ left: `${line.indicatorX || 0}px` }">
          <v-icon size="12" :color="getLineColor(line.type)">mdi-drag-horizontal</v-icon>
        </div>
      </div>
    </div>

    <!-- Информация о привязке -->
    <div 
      v-if="snapInfo && snapInfo.snapped"
      class="snap-info"
      :style="{
        left: `${snapInfo.x}px`,
        top: `${snapInfo.y}px`
      }"
    >
      <v-chip
        size="small"
        color="primary"
        variant="elevated"
      >
        <v-icon start size="12">mdi-magnet</v-icon>
        Привязка: {{ snapInfo.type }}
      </v-chip>
    </div>
  </div>
</template>

<script lang="ts">
import type { GridSettings, SnapPoint } from '@/types/dashboard';
import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import { generateGridCSS } from '@/utils/snapToGrid';

interface SnapLine {
  position: number;
  type: 'grid' | 'widget' | 'center';
  widgetId?: string;
  indicatorX?: number;
  indicatorY?: number;
}

interface SnapInfo {
  snapped: boolean;
  type: string;
  x: number;
  y: number;
}

export default defineComponent({
  name: 'SnapGuides',
  props: {
    showGuides: {
      type: Boolean,
      default: false
    },
    gridSettings: {
      type: Object as PropType<GridSettings>,
      required: true
    },
    snapPoints: {
      type: Array as PropType<SnapPoint[]>,
      default: () => []
    },
    containerWidth: {
      type: Number,
      default: 1200
    },
    containerHeight: {
      type: Number,
      default: 800
    },
    activeSnapPoints: {
      type: Array as PropType<SnapPoint[]>,
      default: () => []
    },
    snapInfo: {
      type: Object as PropType<SnapInfo>,
      default: null
    }
  },
  setup(props) {
    const gridStyle = computed(() => {
      if (!props.gridSettings.showGrid || !props.gridSettings.enabled) {
        return {};
      }

      const gridCSS = generateGridCSS(
        props.gridSettings.size,
        props.containerWidth,
        props.containerHeight,
        0.15
      );

      return {
        width: `${props.containerWidth}px`,
        height: `${props.containerHeight}px`,
        ...Object.fromEntries(
          gridCSS.split(';')
            .filter(rule => rule.trim())
            .map(rule => {
              const [property, value] = rule.split(':').map(s => s.trim());
              return [
                property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),
                value
              ];
            })
        )
      };
    });

    const verticalGuides = computed(() => {
      const guides: SnapLine[] = [];

      props.activeSnapPoints
        .filter(point => point.direction === 'vertical')
        .forEach(point => {
          guides.push({
            position: point.x,
            type: point.type as 'grid' | 'widget' | 'center',
            widgetId: point.widgetId,
            indicatorY: point.y
          });
        });

      return guides;
    });

    const horizontalGuides = computed(() => {
      const guides: SnapLine[] = [];

      props.activeSnapPoints
        .filter(point => point.direction === 'horizontal')
        .forEach(point => {
          guides.push({
            position: point.y,
            type: point.type as 'grid' | 'widget' | 'center',
            widgetId: point.widgetId,
            indicatorX: point.x
          });
        });

      return guides;
    });

    const getLineColor = (type: string): string => {
      const colors = {
        grid: 'rgba(var(--v-theme-primary), 0.6)',
        widget: 'rgba(var(--v-theme-success), 0.8)',
        center: 'rgba(var(--v-theme-warning), 0.8)'
      };
      return colors[type as keyof typeof colors] || colors.grid;
    };

    return {
      gridStyle,
      verticalGuides,
      horizontalGuides,
      getLineColor
    };
  }
});
</script>

<style scoped>
.snap-guides-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.3;
}

.snap-lines {
  position: relative;
  width: 100%;
  height: 100%;
}

.snap-line {
  position: absolute;
  pointer-events: none;
  z-index: 1001;
  transition: opacity 0.2s ease;
}

.snap-line.vertical {
  width: 2px;
  top: 0;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.snap-line.horizontal {
  height: 2px;
  left: 0;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.snap-indicator {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.snap-info {
  position: absolute;
  z-index: 1002;
  transform: translate(-50%, -100%);
  margin-top: -10px;
  animation: snapInfoFadeIn 0.2s ease;
}

@keyframes snapInfoFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .snap-line.vertical,
  .snap-line.horizontal {
    width: 3px;
    height: 3px;
  }

  .snap-indicator {
    width: 24px;
    height: 24px;
  }

  .grid-background {
    opacity: 0.2;
  }
}

@media (max-width: 480px) {
  .snap-line.vertical,
  .snap-line.horizontal {
    width: 4px;
    height: 4px;
  }

  .snap-indicator {
    width: 28px;
    height: 28px;
  }

  .grid-background {
    opacity: 0.15;
  }
}
</style>
