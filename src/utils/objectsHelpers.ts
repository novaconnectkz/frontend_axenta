import type { ObjectStatus, ObjectType } from '@/types/objects';

// Палитра цветов для wialon-подключений (циклическая по connection_id).
// axenta использует свой синий через color="primary".
export const CONNECTION_PALETTE = [
  'orange', 'purple', 'teal', 'pink', 'indigo', 'cyan',
  'amber', 'lime', 'deep-orange', 'green', 'blue-grey', 'red',
];

export function getConnectionColor(connectionId?: number | string | null): string {
  if (connectionId === undefined || connectionId === null) return 'grey';
  const id = typeof connectionId === 'string' ? parseInt(connectionId, 10) || 0 : connectionId;
  return CONNECTION_PALETTE[Math.abs(id) % CONNECTION_PALETTE.length];
}

export function getStatusText(status: ObjectStatus): string {
  const map = {
    active: 'Активный',
    inactive: 'Неактивный',
    maintenance: 'Обслуживание',
    scheduled_delete: 'К удалению',
  };
  return (map as any)[status] || status;
}

export function getStatusColor(status: ObjectStatus): string {
  const map = {
    active: 'success',
    inactive: 'warning',
    maintenance: 'info',
    scheduled_delete: 'error',
  };
  return (map as any)[status] || 'default';
}

export function getTypeText(type: ObjectType): string {
  const map = {
    vehicle: 'Транспорт',
    equipment: 'Оборудование',
    asset: 'Актив',
    building: 'Здание',
    container: 'Контейнер',
  };
  return (map as any)[type] || type;
}

export function getTypeIcon(type: ObjectType): string {
  const map = {
    vehicle: 'mdi-car',
    equipment: 'mdi-tools',
    asset: 'mdi-package-variant',
    building: 'mdi-office-building',
    container: 'mdi-package',
  };
  return (map as any)[type] || 'mdi-help-circle';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getSnackbarIcon(color: string): string {
  const map = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
  };
  return (map as any)[color] || 'mdi-information';
}
