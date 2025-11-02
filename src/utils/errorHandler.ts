import { useNotifications } from '@/composables/useNotifications'

/**
 * Универсальный обработчик ошибок для API
 */
export class ErrorHandler {
  private notifications = useNotifications()

  /**
   * Обрабатывает ошибку от API и показывает соответствующее уведомление
   */
  handleApiError(error: any, context?: string): void {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error)

    // Если это ошибка сети
    if (!error.response) {
      this.notifications.showNetworkError()
      return
    }

    const status = error.response.status
    const data = error.response.data
    const errorMessage = data?.error || data?.detail || data?.message || 'Произошла неизвестная ошибка'

    switch (status) {
      case 400:
        // Ошибка валидации
        this.notifications.showValidationError(errorMessage, data?.fields)
        break

      case 401:
        // Ошибка авторизации
        this.notifications.showAuthError(errorMessage)
        break

      case 403:
        // Недостаточно прав
        this.notifications.showPermissionError(errorMessage)
        break

      case 409:
        // Конфликт - дублирование данных
        this.notifications.showDuplicateError(errorMessage)
        break

      case 422:
        // Ошибка валидации (Unprocessable Entity)
        this.notifications.showValidationError(errorMessage, data?.fields)
        break

      case 500:
        // Внутренняя ошибка сервера
        this.notifications.showError('Ошибка сервера', errorMessage)
        break

      default:
        // Другие ошибки
        this.notifications.showError(`Ошибка ${status}`, errorMessage)
    }
  }

  /**
   * Обрабатывает ошибку дублирования пользователя
   */
  handleDuplicateUserError(error: any): void {
    const errorMessage = error?.response?.data?.error || error?.message || 'Пользователь с такими данными уже существует'
    this.notifications.showDuplicateError(errorMessage)
  }

  /**
   * Обрабатывает ошибку дублирования роли
   */
  handleDuplicateRoleError(error: any): void {
    const errorMessage = error?.response?.data?.error || error?.message || 'Роль с таким именем уже существует'
    this.notifications.showDuplicateError(errorMessage)
  }

  /**
   * Обрабатывает успешную операцию
   */
  showSuccess(title: string, message: string): void {
    this.notifications.showSuccess(title, message)
  }

  /**
   * Универсальный обработчик ошибок (для глобальных ошибок Vue и JavaScript)
   */
  handleError(error: any, context?: string): void {
    // Пропускаем null и undefined ошибки, чтобы избежать лишних уведомлений
    if (error === null || error === undefined) {
      console.warn(`Null/undefined error${context ? ` in ${context}` : ''} - пропущено`)
      return
    }

    // Извлекаем сообщение об ошибке для проверки на игнорируемые ошибки
    const errorMessageText = error?.message || error?.toString() || ''
    const ignoredErrors = [
      'ResizeObserver loop completed with undelivered notifications',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ]
    
    if (ignoredErrors.some(msg => errorMessageText.includes(msg))) {
      // Тихо игнорируем известные некритичные ошибки
      return
    }

    console.error(`Error${context ? ` in ${context}` : ''}:`, error)

    // Если это ошибка с response (API ошибка), используем handleApiError
    if (error?.response) {
      this.handleApiError(error, context)
      return
    }

    // Если это объект Error с сообщением
    if (error instanceof Error) {
      const message = error.message || 'Произошла неизвестная ошибка'
      this.notifications.showError('Ошибка', message)
      return
    }

    // Если это строка
    if (typeof error === 'string') {
      if (error.trim()) {
        this.notifications.showError('Ошибка', error)
      }
      return
    }

    // Пытаемся извлечь сообщение об ошибке
    const finalMessage = error?.message || error?.error?.message || error?.toString?.() || String(error)
    
    // Показываем уведомление только если есть реальное сообщение
    if (finalMessage && finalMessage !== 'null' && finalMessage !== 'undefined') {
      this.notifications.showError('Ошибка', finalMessage)
    }
  }
}

// Экспортируем экземпляр для использования по умолчанию
export const errorHandler = new ErrorHandler()

// Алиас для совместимости с api.ts
export const globalErrorHandler = errorHandler

// Экспортируем функцию для создания нового экземпляра
export const createErrorHandler = () => new ErrorHandler()

/**
 * Composable для использования обработчика ошибок в Vue компонентах
 */
export function useErrorHandler() {
  return errorHandler
}

/**
 * Настройка глобального обработчика ошибок для Vue приложения
 */
export function setupGlobalErrorHandler(app: any): void {
  // Настройка глобального обработчика ошибок Vue
  app.config.errorHandler = (err: any, _vm: any, info: string) => {
    console.error('Vue Error:', err, info)
    errorHandler.handleError(err, 'Vue Component')
  }

  // Настройка обработчика необработанных промисов
  window.addEventListener('unhandledrejection', (event) => {
    // Игнорируем null ошибки
    if (event.reason !== null && event.reason !== undefined) {
      console.error('Unhandled Promise Rejection:', event.reason)
      errorHandler.handleError(event.reason, 'Promise Rejection')
    }
  })

  // Настройка обработчика глобальных ошибок JavaScript
  window.addEventListener('error', (event) => {
    // Игнорируем известные некритичные ошибки
    const ignoredErrors = [
      'ResizeObserver loop completed with undelivered notifications',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ]
    
    const errorMessage = event.message || event.error?.message || ''
    const shouldIgnore = ignoredErrors.some(msg => errorMessage.includes(msg))
    
    if (shouldIgnore) {
      // Тихо игнорируем известные некритичные ошибки
      return
    }
    
    // Игнорируем null ошибки и ошибки загрузки ресурсов (favicon и т.д.)
    if (event.error !== null && event.error !== undefined) {
      console.error('Global JavaScript Error:', event.error)
      errorHandler.handleError(event.error, 'JavaScript Error')
    } else if (event.filename && !event.filename.includes('favicon') && event.message && !shouldIgnore) {
      // Логируем только если есть реальное сообщение об ошибке
      console.warn('Global JavaScript Error (null error):', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }
  })
}