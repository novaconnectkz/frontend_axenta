import { config } from "@/config/env";
import { useAuth } from "@/context/auth";
import { useDashboardStore } from "@/store/dashboard";

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface DashboardUpdateMessage {
  type: "dashboard_update";
  data: {
    stats?: any;
    activity?: any[];
    notifications?: any[];
  };
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isConnecting = false;
  private auth: any = null;
  private dashboardStore: any = null;

  // Ленивая инициализация auth и store
  private getAuth() {
    if (!this.auth) {
      try {
        this.auth = useAuth();
      } catch (error) {
        console.warn('Auth context not available in WebSocket service:', error);
        return null;
      }
    }
    return this.auth;
  }

  private getDashboardStore() {
    if (!this.dashboardStore) {
      try {
        this.dashboardStore = useDashboardStore();
      } catch (error) {
        console.warn('Dashboard store not available in WebSocket service:', error);
        return null;
      }
    }
    return this.dashboardStore;
  }

  connect(): void {
    if (this.socket || this.isConnecting) return;

    try {
      this.isConnecting = true;
      const wsUrl = this.buildWebSocketUrl();
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.onOpen.bind(this);
      this.socket.onmessage = this.onMessage.bind(this);
      this.socket.onclose = this.onClose.bind(this);
      this.socket.onerror = this.onError.bind(this);
    } catch (error) {
      console.error("Ошибка создания WebSocket соединения:", error);
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, "Disconnect requested");
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  private buildWebSocketUrl(): string {
    const baseUrl = config.wsBaseUrl;
    const auth = this.getAuth();
    const token = auth?.token?.value;
    const companyId = auth?.company?.value?.id;

    let url = `${baseUrl}/ws`;
    const params = new URLSearchParams();

    if (token) {
      params.append("token", token);
    }

    if (companyId) {
      params.append("tenant_id", companyId);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return url;
  }

  private onOpen(): void {
    console.log("WebSocket соединение установлено");
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Подписываемся на обновления Dashboard
    this.subscribe("dashboard_updates");
    this.subscribe("notifications");
    this.subscribe("activity_updates");
  }

  private onMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.handleMessage(message);
    } catch (error) {
      console.error("Ошибка парсинга WebSocket сообщения:", error);
    }
  }

  private onClose(event: CloseEvent): void {
    console.log("WebSocket соединение закрыто:", event.code, event.reason);
    this.socket = null;
    this.isConnecting = false;

    // Автоматическое переподключение
    if (
      event.code !== 1000 &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.scheduleReconnect();
    }
  }

  private onError(error: Event): void {
    console.error("WebSocket ошибка:", error);
    this.isConnecting = false;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay =
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts} через ${delay}ms`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case "dashboard_stats_update":
        this.handleDashboardStatsUpdate(message.data);
        break;

      case "activity_update":
        this.handleActivityUpdate(message.data);
        break;

      case "notification_update":
        this.handleNotificationUpdate(message.data);
        break;

      case "object_update":
        this.handleObjectUpdate(message.data);
        break;

      case "user_update":
        this.handleUserUpdate(message.data);
        break;

      case "billing_update":
        this.handleBillingUpdate(message.data);
        break;

      case "installation_update":
        this.handleInstallationUpdate(message.data);
        break;

      case "warehouse_update":
        this.handleWarehouseUpdate(message.data);
        break;

      default:
        console.log("Неизвестный тип WebSocket сообщения:", message.type);
    }
  }

  private handleDashboardStatsUpdate(data: any): void {
    // Обновляем статистику в store
    const store = this.getDashboardStore();
    if (store?.stats) {
      Object.assign(store.stats, data);
    }
  }

  private handleActivityUpdate(data: any): void {
    // Добавляем новую активность в начало списка
    const store = this.getDashboardStore();
    if (!store) return;

    if (Array.isArray(data)) {
      store.recentActivity.unshift(...data);
      // Ограничиваем количество элементов
      if (store.recentActivity.length > 50) {
        store.recentActivity = store.recentActivity.slice(0, 50);
      }
    } else {
      store.recentActivity.unshift(data);
      if (store.recentActivity.length > 50) {
        store.recentActivity.pop();
      }
    }
  }

  private handleNotificationUpdate(data: any): void {
    // Добавляем новое уведомление
    const store = this.getDashboardStore();
    if (!store) return;

    if (Array.isArray(data)) {
      store.notifications.unshift(...data);
    } else {
      store.notifications.unshift(data);
    }

    // Ограничиваем количество уведомлений
    if (store.notifications.length > 20) {
      store.notifications = store.notifications.slice(0, 20);
    }
  }

  private handleObjectUpdate(data: any): void {
    // Обновляем статистику объектов
    const store = this.getDashboardStore();
    if (store?.stats?.objects) {
      store.loadStats(); // Перезагружаем статистику
    }
  }

  private handleUserUpdate(data: any): void {
    // Обновляем статистику пользователей
    const store = this.getDashboardStore();
    if (store?.stats?.users) {
      store.loadStats(); // Перезагружаем статистику
    }
  }

  private handleBillingUpdate(data: any): void {
    // Обновляем статистику биллинга
    const store = this.getDashboardStore();
    if (store?.stats?.billing) {
      store.loadStats(); // Перезагружаем статистику
    }
  }

  private handleInstallationUpdate(data: any): void {
    // Обновляем статистику монтажей
    const store = this.getDashboardStore();
    if (store?.stats?.installations) {
      store.loadStats(); // Перезагружаем статистику
    }
  }

  private handleWarehouseUpdate(data: any): void {
    // Обновляем статистику склада
    const store = this.getDashboardStore();
    if (store?.stats?.warehouse) {
      store.loadStats(); // Перезагружаем статистику
    }
  }

  private subscribe(channel: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: "subscribe",
        channel: channel,
        timestamp: new Date().toISOString(),
      };

      this.socket.send(JSON.stringify(message));
      console.log(`Подписка на канал: ${channel}`);
    }
  }

  private unsubscribe(channel: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: "unsubscribe",
        channel: channel,
        timestamp: new Date().toISOString(),
      };

      this.socket.send(JSON.stringify(message));
      console.log(`Отписка от канала: ${channel}`);
    }
  }

  send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          ...message,
          timestamp: new Date().toISOString(),
        })
      );
    } else {
      console.warn("WebSocket не подключен, сообщение не отправлено");
    }
  }

  getConnectionState(): string {
    if (!this.socket) return "disconnected";

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "closed";
      default:
        return "unknown";
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Создаем singleton instance
export const websocketService = new WebSocketService();

// Автоматически подключаемся при аутентификации
export function initWebSocket() {
  try {
    const auth = useAuth();

    // Подключаемся когда пользователь аутентифицирован
    if (auth.isAuthenticated.value) {
      websocketService.connect();
    }

    // Отслеживаем изменения аутентификации
    watch(
      () => auth.isAuthenticated.value,
      (isAuthenticated) => {
        if (isAuthenticated) {
          websocketService.connect();
        } else {
          websocketService.disconnect();
        }
      }
    );
  } catch (error) {
    console.warn('Cannot initialize WebSocket: Auth context not available', error);
    // WebSocket будет инициализирован позже, когда auth context станет доступен
  }
}

// Для использования в компонентах Vue
import { watch } from "vue";

export function useWebSocket() {
  return {
    websocketService,
    connect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect(),
    send: (message: any) => websocketService.send(message),
    isConnected: () => websocketService.isConnected(),
    getConnectionState: () => websocketService.getConnectionState(),
  };
}
