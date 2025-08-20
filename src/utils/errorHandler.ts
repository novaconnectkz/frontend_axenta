import type { App } from "vue";

export interface ErrorInfo {
  type: "auth" | "network" | "validation" | "permission" | "unknown";
  message: string;
  code?: string | number;
  details?: any;
  timestamp: Date;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string | number,
    public details?: any
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number, public response?: any) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
  }
}

export class PermissionError extends Error {
  constructor(
    message: string,
    public requiredPermission?: string,
    public userPermissions?: string[]
  ) {
    super(message);
    this.name = "PermissionError";
  }
}

/**
 * Глобальный обработчик ошибок
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorInfo[] = [];
  private maxQueueSize = 10;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Обрабатывает ошибку и определяет её тип
   */
  handleError(error: any): ErrorInfo {
    const errorInfo = this.classifyError(error);
    this.logError(errorInfo);
    this.addToQueue(errorInfo);

    // Выполняем специфичные действия в зависимости от типа ошибки
    this.executeErrorActions(errorInfo);

    return errorInfo;
  }

  /**
   * Классифицирует ошибку по типу
   */
  private classifyError(error: any): ErrorInfo {
    const timestamp = new Date();

    // Ошибки аутентификации
    if (error instanceof AuthError) {
      return {
        type: "auth",
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp,
      };
    }

    // Сетевые ошибки
    if (error instanceof NetworkError) {
      return {
        type: "network",
        message: error.message,
        code: error.status,
        details: error.response,
        timestamp,
      };
    }

    // Ошибки валидации
    if (error instanceof ValidationError) {
      return {
        type: "validation",
        message: error.message,
        details: error.fields,
        timestamp,
      };
    }

    // Ошибки прав доступа
    if (error instanceof PermissionError) {
      return {
        type: "permission",
        message: error.message,
        details: {
          required: error.requiredPermission,
          user: error.userPermissions,
        },
        timestamp,
      };
    }

    // Axios ошибки
    if (error.response) {
      const status = error.response.status;
      let type: ErrorInfo["type"] = "network";
      let message = error.response.data?.error || error.message;

      if (status === 401) {
        type = "auth";
        message = "Сессия истекла. Необходимо войти в систему заново.";
      } else if (status === 403) {
        type = "permission";
        message = "Недостаточно прав для выполнения операции.";
      } else if (status === 422) {
        type = "validation";
        message = "Ошибка валидации данных.";
      }

      return {
        type,
        message,
        code: status,
        details: error.response.data,
        timestamp,
      };
    }

    // Ошибки сети
    if (error.request) {
      return {
        type: "network",
        message: "Ошибка подключения к серверу. Проверьте интернет-соединение.",
        details: error.request,
        timestamp,
      };
    }

    // Общие ошибки
    return {
      type: "unknown",
      message: error.message || "Произошла неизвестная ошибка",
      details: error,
      timestamp,
    };
  }

  /**
   * Выполняет действия в зависимости от типа ошибки
   */
  private executeErrorActions(errorInfo: ErrorInfo) {
    switch (errorInfo.type) {
      case "auth":
        this.handleAuthError(errorInfo);
        break;
      case "network":
        this.handleNetworkError(errorInfo);
        break;
      case "permission":
        this.handlePermissionError(errorInfo);
        break;
    }
  }

  /**
   * Обрабатывает ошибки аутентификации
   */
  private handleAuthError(errorInfo: ErrorInfo) {
    try {
      // Динамический импорт для избежания циклических зависимостей
      import("@/context/auth")
        .then(({ useAuth }) => {
          const auth = useAuth();

          // Если токен истек или недействителен
          if (errorInfo.code === 401 || errorInfo.code === "TOKEN_EXPIRED") {
            auth.logout();
            // Перенаправление на страницу входа произойдет автоматически через роутер
          }
        })
        .catch((err) => {
          console.warn("Cannot access auth context in error handler:", err);
        });
    } catch (err) {
      console.warn("Cannot access auth context in error handler:", err);
    }
  }

  /**
   * Обрабатывает сетевые ошибки
   */
  private handleNetworkError(errorInfo: ErrorInfo) {
    // Можно добавить логику для повторных попыток
    console.warn("Network error detected:", errorInfo);
  }

  /**
   * Обрабатывает ошибки прав доступа
   */
  private handlePermissionError(errorInfo: ErrorInfo) {
    console.warn("Permission error detected:", errorInfo);
    // Можно добавить логику для уведомления администратора
  }

  /**
   * Логирует ошибку
   */
  private logError(errorInfo: ErrorInfo) {
    const logLevel = this.getLogLevel(errorInfo.type);
    const logMessage = `[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`;

    switch (logLevel) {
      case "error":
        console.error(logMessage, errorInfo);
        break;
      case "warn":
        console.warn(logMessage, errorInfo);
        break;
      default:
        console.log(logMessage, errorInfo);
    }
  }

  /**
   * Определяет уровень логирования для типа ошибки
   */
  private getLogLevel(type: ErrorInfo["type"]): "error" | "warn" | "info" {
    switch (type) {
      case "auth":
      case "permission":
      case "unknown":
        return "error";
      case "network":
      case "validation":
        return "warn";
      default:
        return "info";
    }
  }

  /**
   * Добавляет ошибку в очередь
   */
  private addToQueue(errorInfo: ErrorInfo) {
    this.errorQueue.unshift(errorInfo);

    // Ограничиваем размер очереди
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(0, this.maxQueueSize);
    }
  }

  /**
   * Возвращает последние ошибки
   */
  getRecentErrors(limit = 5): ErrorInfo[] {
    return this.errorQueue.slice(0, limit);
  }

  /**
   * Очищает очередь ошибок
   */
  clearErrors() {
    this.errorQueue = [];
  }

  /**
   * Создает пользовательское сообщение об ошибке
   */
  getUserMessage(errorInfo: ErrorInfo): string {
    switch (errorInfo.type) {
      case "auth":
        return "Ошибка аутентификации. Пожалуйста, войдите в систему заново.";
      case "network":
        return "Проблемы с подключением к серверу. Проверьте интернет-соединение.";
      case "validation":
        return "Введены некорректные данные. Проверьте правильность заполнения полей.";
      case "permission":
        return "У вас недостаточно прав для выполнения этого действия.";
      default:
        return "Произошла ошибка. Попробуйте еще раз или обратитесь к администратору.";
    }
  }
}

/**
 * Глобальный обработчик ошибок для Vue приложения
 */
export function setupGlobalErrorHandler(app: App) {
  const errorHandler = ErrorHandler.getInstance();

  // Обработчик ошибок Vue
  app.config.errorHandler = (err, instance, info) => {
    console.error("Vue error:", err, info);
    errorHandler.handleError(err);
  };

  // Обработчик необработанных промисов
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    errorHandler.handleError(event.reason);
    event.preventDefault();
  });

  // Обработчик общих ошибок JavaScript
  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
    errorHandler.handleError(event.error);
  });
}

// Экспортируем singleton
export const globalErrorHandler = ErrorHandler.getInstance();

/**
 * Composable для работы с обработкой ошибок
 */
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();

  const handleError = (error: any, fallbackMessage?: string) => {
    const errorInfo = errorHandler.handleError(error);

    // Здесь можно добавить логику для показа уведомлений пользователю
    // Например, через Vuetify snackbar или toast
    console.error(fallbackMessage || errorInfo.message, errorInfo);

    return errorInfo;
  };

  const getUserMessage = (errorInfo: ErrorInfo): string => {
    return errorHandler.getUserMessage(errorInfo);
  };

  const getRecentErrors = (limit = 5): ErrorInfo[] => {
    return errorHandler.getRecentErrors(limit);
  };

  const clearErrors = () => {
    errorHandler.clearErrors();
  };

  return {
    handleError,
    getUserMessage,
    getRecentErrors,
    clearErrors,
  };
}
