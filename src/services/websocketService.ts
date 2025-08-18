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
  private auth = useAuth();
  private dashboardStore = useDashboardStore();

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
    const token = this.auth.token.value;
    const companyId = this.auth.company.value?.id;

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
    if (this.dashboardStore.stats) {
      Object.assign(this.dashboardStore.stats, data);
    }
  }

  private handleActivityUpdate(data: any): void {
    // Добавляем новую активность в начало списка
    if (Array.isArray(data)) {
      this.dashboardStore.recentActivity.unshift(...data);
      // Ограничиваем количество элементов
      if (this.dashboardStore.recentActivity.length > 50) {
        this.dashboardStore.recentActivity =
          this.dashboardStore.recentActivity.slice(0, 50);
      }
    } else {
      this.dashboardStore.recentActivity.unshift(data);
      if (this.dashboardStore.recentActivity.length > 50) {
        this.dashboardStore.recentActivity.pop();
      }
    }
  }

  private handleNotificationUpdate(data: any): void {
    // Добавляем новое уведомление
    if (Array.isArray(data)) {
      this.dashboardStore.notifications.unshift(...data);
    } else {
      this.dashboardStore.notifications.unshift(data);
    }

    // Ограничиваем количество уведомлений
    if (this.dashboardStore.notifications.length > 20) {
      this.dashboardStore.notifications =
        this.dashboardStore.notifications.slice(0, 20);
    }
  }

  private handleObjectUpdate(data: any): void {
    // Обновляем статистику объектов
    if (this.dashboardStore.stats?.objects) {
      this.dashboardStore.loadStats(); // Перезагружаем статистику
    }
  }

  private handleUserUpdate(data: any): void {
    // Обновляем статистику пользователей
    if (this.dashboardStore.stats?.users) {
      this.dashboardStore.loadStats(); // Перезагружаем статистику
    }
  }

  private handleBillingUpdate(data: any): void {
    // Обновляем статистику биллинга
    if (this.dashboardStore.stats?.billing) {
      this.dashboardStore.loadStats(); // Перезагружаем статистику
    }
  }

  private handleInstallationUpdate(data: any): void {
    // Обновляем статистику монтажей
    if (this.dashboardStore.stats?.installations) {
      this.dashboardStore.loadStats(); // Перезагружаем статистику
    }
  }

  private handleWarehouseUpdate(data: any): void {
    // Обновляем статистику склада
    if (this.dashboardStore.stats?.warehouse) {
      this.dashboardStore.loadStats(); // Перезагружаем статистику
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
