// import { useWebSocket } from "@/services/websocketService"; // Отключаем до исправления auth context
import { onMounted, onUnmounted, ref, watch } from "vue";

export interface WidgetUpdateHandler {
  (data: any): void;
}

export interface RealTimeWidgetOptions {
  widgetId: string;
  updateChannels: string[];
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function useRealTimeWidget(options: RealTimeWidgetOptions) {
  // const { websocketService } = useWebSocket(); // Отключаем до исправления auth context
  const isConnected = ref(false);
  const lastUpdate = ref<Date | null>(null);
  const updateHandlers = new Map<string, WidgetUpdateHandler>();

  let refreshTimer: NodeJS.Timeout | null = null;

  // Регистрация обработчика обновлений для конкретного канала
  const onUpdate = (channel: string, handler: WidgetUpdateHandler) => {
    updateHandlers.set(channel, handler);
  };

  // Удаление обработчика обновлений
  const offUpdate = (channel: string) => {
    updateHandlers.delete(channel);
  };

  // Обработка входящих WebSocket сообщений
  const handleWebSocketMessage = (message: any) => {
    const handler = updateHandlers.get(message.type);
    if (handler) {
      handler(message.data);
      lastUpdate.value = new Date();
    }
  };

  // Запуск автоматического обновления
  const startAutoRefresh = (callback: () => void) => {
    if (options.refreshInterval && options.refreshInterval > 0) {
      refreshTimer = setInterval(callback, options.refreshInterval * 1000);
    }
  };

  // Остановка автоматического обновления
  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  // Принудительное обновление
  const forceUpdate = (callback: () => void) => {
    callback();
    lastUpdate.value = new Date();
  };

  // Подписка на каналы WebSocket - временно отключено
  const subscribeToChannels = () => {
    console.log('WebSocket subscriptions temporarily disabled');
    // if (websocketService.isConnected()) {
    //   options.updateChannels.forEach((channel) => {
    //     websocketService.send({
    //       type: "subscribe",
    //       channel: channel,
    //       widget_id: options.widgetId,
    //     });
    //   });
    // }
  };

  // Отписка от каналов WebSocket - временно отключено
  const unsubscribeFromChannels = () => {
    console.log('WebSocket unsubscriptions temporarily disabled');
    // if (websocketService.isConnected()) {
    //   options.updateChannels.forEach((channel) => {
    //     websocketService.send({
    //       type: "unsubscribe",
    //       channel: channel,
    //       widget_id: options.widgetId,
    //     });
    //   });
    // }
  };

  // Отслеживание состояния WebSocket соединения - временно отключено
  // watch(
  //   () => websocketService.getConnectionState(),
  //   (state) => {
  //     isConnected.value = state === "connected";
  //     if (isConnected.value) {
  //       subscribeToChannels();
  //     }
  //   },
  //   { immediate: true }
  // );

  onMounted(() => {
    // WebSocket подключение временно отключено
    console.log('Real-time widget mounted, WebSocket temporarily disabled');
    // if (!websocketService.isConnected()) {
    //   websocketService.connect();
    // } else {
    //   subscribeToChannels();
    // }
  });

  onUnmounted(() => {
    // Отписываемся от каналов - временно отключено
    // unsubscribeFromChannels();

    // Останавливаем автообновление
    stopAutoRefresh();

    // Очищаем обработчики
    updateHandlers.clear();
  });

  return {
    isConnected,
    lastUpdate,
    onUpdate,
    offUpdate,
    startAutoRefresh,
    stopAutoRefresh,
    forceUpdate,
    handleWebSocketMessage,
  };
}

// Специализированные composables для разных типов виджетов

export function useObjectsWidget(
  widgetId: string,
  refreshInterval: number = 300
) {
  return useRealTimeWidget({
    widgetId,
    updateChannels: [
      "object_update",
      "object_created",
      "object_deleted",
      "object_status_changed",
    ],
    refreshInterval,
    autoRefresh: true,
  });
}

export function useUsersWidget(
  widgetId: string,
  refreshInterval: number = 300
) {
  return useRealTimeWidget({
    widgetId,
    updateChannels: [
      "user_update",
      "user_created",
      "user_deleted",
      "user_status_changed",
    ],
    refreshInterval,
    autoRefresh: true,
  });
}

export function useBillingWidget(
  widgetId: string,
  refreshInterval: number = 600
) {
  return useRealTimeWidget({
    widgetId,
    updateChannels: [
      "billing_update",
      "invoice_generated",
      "payment_received",
      "invoice_status_changed",
    ],
    refreshInterval,
    autoRefresh: true,
  });
}

export function useInstallationsWidget(
  widgetId: string,
  refreshInterval: number = 300
) {
  return useRealTimeWidget({
    widgetId,
    updateChannels: [
      "installation_update",
      "installation_scheduled",
      "installation_status_changed",
      "installation_completed",
    ],
    refreshInterval,
    autoRefresh: true,
  });
}

export function useWarehouseWidget(
  widgetId: string,
  refreshInterval: number = 600
) {
  return useRealTimeWidget({
    widgetId,
    updateChannels: [
      "warehouse_update",
      "equipment_added",
      "equipment_removed",
      "stock_alert",
      "equipment_status_changed",
    ],
    refreshInterval,
    autoRefresh: true,
  });
}

export function useActivityWidget(
  widgetId: string,
  refreshInterval: number = 120
) {
  return useRealTimeWidget({
    widgetId,
    updateChannels: ["activity_update", "new_activity"],
    refreshInterval,
    autoRefresh: true,
  });
}

export function useNotificationsWidget(
  widgetId: string,
  refreshInterval: number = 60
) {
  return useRealTimeWidget({
    widgetId,
    updateChannels: ["notification_update", "new_notification"],
    refreshInterval,
    autoRefresh: true,
  });
}

// Utility функции для работы с real-time данными

export function createWidgetUpdateBuffer<T>(maxSize: number = 100) {
  const buffer = ref<T[]>([]);

  const add = (item: T) => {
    buffer.value.unshift(item);
    if (buffer.value.length > maxSize) {
      buffer.value = buffer.value.slice(0, maxSize);
    }
  };

  const addMany = (items: T[]) => {
    buffer.value.unshift(...items);
    if (buffer.value.length > maxSize) {
      buffer.value = buffer.value.slice(0, maxSize);
    }
  };

  const clear = () => {
    buffer.value = [];
  };

  const remove = (predicate: (item: T) => boolean) => {
    buffer.value = buffer.value.filter((item) => !predicate(item));
  };

  const update = (predicate: (item: T) => boolean, updater: (item: T) => T) => {
    buffer.value = buffer.value.map((item) =>
      predicate(item) ? updater(item) : item
    );
  };

  return {
    buffer,
    add,
    addMany,
    clear,
    remove,
    update,
  };
}

// Debounce функция для оптимизации обновлений
export function createUpdateDebouncer(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout | null = null;
  const pendingUpdates = ref<any[]>([]);

  const debounce = (update: any, callback: (updates: any[]) => void) => {
    pendingUpdates.value.push(update);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback([...pendingUpdates.value]);
      pendingUpdates.value = [];
      timeoutId = null;
    }, delay);
  };

  const flush = (callback: (updates: any[]) => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (pendingUpdates.value.length > 0) {
      callback([...pendingUpdates.value]);
      pendingUpdates.value = [];
    }
  };

  return {
    debounce,
    flush,
    pendingUpdates,
  };
}
