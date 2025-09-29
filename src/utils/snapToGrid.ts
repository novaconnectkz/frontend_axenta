import type { Widget, WidgetBounds, SnapPoint, SnapResult, GridSettings } from '@/types/dashboard';
import { getWidgetBounds } from './widgetCollision';

/**
 * Утилиты для snap-to-grid функциональности
 */

/**
 * Настройки сетки по умолчанию
 */
export const DEFAULT_GRID_SETTINGS: GridSettings = {
  enabled: true,
  size: 20,
  snapThreshold: 10,
  showGrid: true,
  snapToWidgets: true,
  snapToGrid: true
};

/**
 * Округляет значение до ближайшего значения сетки
 */
export function snapToGridValue(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Генерирует точки привязки для сетки
 */
export function generateGridSnapPoints(
  containerWidth: number,
  containerHeight: number,
  gridSize: number
): SnapPoint[] {
  const points: SnapPoint[] = [];

  // Вертикальные линии сетки
  for (let x = 0; x <= containerWidth; x += gridSize) {
    points.push({
      x,
      y: 0,
      type: 'grid',
      direction: 'vertical'
    });
  }

  // Горизонтальные линии сетки
  for (let y = 0; y <= containerHeight; y += gridSize) {
    points.push({
      x: 0,
      y,
      type: 'grid',
      direction: 'horizontal'
    });
  }

  return points;
}

/**
 * Генерирует точки привязки для виджетов
 */
export function generateWidgetSnapPoints(
  widgets: Widget[],
  excludeWidgetId: string
): SnapPoint[] {
  const points: SnapPoint[] = [];

  widgets
    .filter(w => w.id !== excludeWidgetId && w.visible)
    .forEach(widget => {
      const bounds = getWidgetBounds(widget);

      // Края виджета
      points.push(
        // Левый край
        { x: bounds.x, y: bounds.y, type: 'edge', widgetId: widget.id, direction: 'vertical' },
        // Правый край
        { x: bounds.x + bounds.width, y: bounds.y, type: 'edge', widgetId: widget.id, direction: 'vertical' },
        // Верхний край
        { x: bounds.x, y: bounds.y, type: 'edge', widgetId: widget.id, direction: 'horizontal' },
        // Нижний край
        { x: bounds.x, y: bounds.y + bounds.height, type: 'edge', widgetId: widget.id, direction: 'horizontal' }
      );

      // Центры виджета
      points.push(
        // Центр по горизонтали
        { 
          x: bounds.x + bounds.width / 2, 
          y: bounds.y + bounds.height / 2, 
          type: 'center', 
          widgetId: widget.id, 
          direction: 'vertical' 
        },
        // Центр по вертикали
        { 
          x: bounds.x + bounds.width / 2, 
          y: bounds.y + bounds.height / 2, 
          type: 'center', 
          widgetId: widget.id, 
          direction: 'horizontal' 
        }
      );
    });

  return points;
}

/**
 * Находит ближайшие точки привязки
 */
export function findNearestSnapPoints(
  targetBounds: WidgetBounds,
  snapPoints: SnapPoint[],
  threshold: number
): SnapPoint[] {
  const nearestPoints: SnapPoint[] = [];

  // Точки для проверки на целевом виджете
  const targetPoints = [
    { x: targetBounds.x, y: targetBounds.y }, // Левый верхний угол
    { x: targetBounds.x + targetBounds.width, y: targetBounds.y }, // Правый верхний угол
    { x: targetBounds.x, y: targetBounds.y + targetBounds.height }, // Левый нижний угол
    { x: targetBounds.x + targetBounds.width, y: targetBounds.y + targetBounds.height }, // Правый нижний угол
    { x: targetBounds.x + targetBounds.width / 2, y: targetBounds.y + targetBounds.height / 2 } // Центр
  ];

  snapPoints.forEach(snapPoint => {
    targetPoints.forEach(targetPoint => {
      const distance = snapPoint.direction === 'vertical' 
        ? Math.abs(targetPoint.x - snapPoint.x)
        : Math.abs(targetPoint.y - snapPoint.y);

      if (distance <= threshold) {
        nearestPoints.push(snapPoint);
      }
    });
  });

  // Убираем дубликаты и сортируем по расстоянию
  return nearestPoints
    .filter((point, index, self) => 
      index === self.findIndex(p => p.x === point.x && p.y === point.y && p.direction === point.direction)
    )
    .sort((a, b) => {
      const distanceA = Math.min(
        Math.abs(targetBounds.x - a.x),
        Math.abs(targetBounds.y - a.y)
      );
      const distanceB = Math.min(
        Math.abs(targetBounds.x - b.x),
        Math.abs(targetBounds.y - b.y)
      );
      return distanceA - distanceB;
    });
}

/**
 * Применяет snap-to-grid к границам виджета
 */
export function applySnapToGrid(
  targetBounds: WidgetBounds,
  allWidgets: Widget[],
  excludeWidgetId: string,
  gridSettings: GridSettings,
  containerWidth: number = 1200,
  containerHeight: number = 800
): SnapResult {
  if (!gridSettings.enabled) {
    return {
      snapped: false,
      snapPoints: [],
      adjustedBounds: targetBounds
    };
  }

  let adjustedBounds = { ...targetBounds };
  const activeSnapPoints: SnapPoint[] = [];

  // Генерируем точки привязки
  let snapPoints: SnapPoint[] = [];

  if (gridSettings.snapToGrid) {
    snapPoints.push(...generateGridSnapPoints(containerWidth, containerHeight, gridSettings.size));
  }

  if (gridSettings.snapToWidgets) {
    snapPoints.push(...generateWidgetSnapPoints(allWidgets, excludeWidgetId));
  }

  // Находим ближайшие точки привязки
  const nearestPoints = findNearestSnapPoints(targetBounds, snapPoints, gridSettings.snapThreshold);

  if (nearestPoints.length > 0) {
    // Применяем привязку по горизонтали
    const horizontalSnap = nearestPoints.find(p => p.direction === 'horizontal');
    if (horizontalSnap) {
      adjustedBounds.y = horizontalSnap.y;
      activeSnapPoints.push(horizontalSnap);
    }

    // Применяем привязку по вертикали
    const verticalSnap = nearestPoints.find(p => p.direction === 'vertical');
    if (verticalSnap) {
      adjustedBounds.x = verticalSnap.x;
      activeSnapPoints.push(verticalSnap);
    }
  }

  return {
    snapped: activeSnapPoints.length > 0,
    snapPoints: activeSnapPoints,
    adjustedBounds
  };
}

/**
 * Применяет snap-to-grid при изменении размера
 */
export function applySnapToGridResize(
  targetBounds: WidgetBounds,
  resizeDirection: string,
  allWidgets: Widget[],
  excludeWidgetId: string,
  gridSettings: GridSettings,
  containerWidth: number = 1200,
  containerHeight: number = 800
): SnapResult {
  if (!gridSettings.enabled) {
    return {
      snapped: false,
      snapPoints: [],
      adjustedBounds: targetBounds
    };
  }

  let adjustedBounds = { ...targetBounds };
  const activeSnapPoints: SnapPoint[] = [];

  // Генерируем точки привязки
  let snapPoints: SnapPoint[] = [];

  if (gridSettings.snapToGrid) {
    snapPoints.push(...generateGridSnapPoints(containerWidth, containerHeight, gridSettings.size));
  }

  if (gridSettings.snapToWidgets) {
    snapPoints.push(...generateWidgetSnapPoints(allWidgets, excludeWidgetId));
  }

  // В зависимости от направления изменения размера, привязываем соответствующие края
  if (resizeDirection.includes('e')) {
    // Правый край
    const rightEdge = targetBounds.x + targetBounds.width;
    const verticalSnaps = snapPoints.filter(p => p.direction === 'vertical');
    const nearestVertical = verticalSnaps.find(p => Math.abs(p.x - rightEdge) <= gridSettings.snapThreshold);
    
    if (nearestVertical) {
      adjustedBounds.width = nearestVertical.x - adjustedBounds.x;
      activeSnapPoints.push(nearestVertical);
    }
  }

  if (resizeDirection.includes('w')) {
    // Левый край
    const nearestVertical = snapPoints
      .filter(p => p.direction === 'vertical')
      .find(p => Math.abs(p.x - targetBounds.x) <= gridSettings.snapThreshold);
    
    if (nearestVertical) {
      const oldRight = adjustedBounds.x + adjustedBounds.width;
      adjustedBounds.x = nearestVertical.x;
      adjustedBounds.width = oldRight - nearestVertical.x;
      activeSnapPoints.push(nearestVertical);
    }
  }

  if (resizeDirection.includes('s')) {
    // Нижний край
    const bottomEdge = targetBounds.y + targetBounds.height;
    const horizontalSnaps = snapPoints.filter(p => p.direction === 'horizontal');
    const nearestHorizontal = horizontalSnaps.find(p => Math.abs(p.y - bottomEdge) <= gridSettings.snapThreshold);
    
    if (nearestHorizontal) {
      adjustedBounds.height = nearestHorizontal.y - adjustedBounds.y;
      activeSnapPoints.push(nearestHorizontal);
    }
  }

  if (resizeDirection.includes('n')) {
    // Верхний край
    const nearestHorizontal = snapPoints
      .filter(p => p.direction === 'horizontal')
      .find(p => Math.abs(p.y - targetBounds.y) <= gridSettings.snapThreshold);
    
    if (nearestHorizontal) {
      const oldBottom = adjustedBounds.y + adjustedBounds.height;
      adjustedBounds.y = nearestHorizontal.y;
      adjustedBounds.height = oldBottom - nearestHorizontal.y;
      activeSnapPoints.push(nearestHorizontal);
    }
  }

  return {
    snapped: activeSnapPoints.length > 0,
    snapPoints: activeSnapPoints,
    adjustedBounds
  };
}

/**
 * Создает CSS для отображения сетки
 */
export function generateGridCSS(
  gridSize: number,
  containerWidth: number,
  containerHeight: number,
  opacity: number = 0.1
): string {
  const gridPattern = `
    background-image: 
      linear-gradient(to right, rgba(var(--v-theme-primary), ${opacity}) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(var(--v-theme-primary), ${opacity}) 1px, transparent 1px);
    background-size: ${gridSize}px ${gridSize}px;
  `;
  
  return gridPattern;
}
