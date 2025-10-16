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
}

// Экспортируем экземпляр для использования по умолчанию
export const errorHandler = new ErrorHandler()

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
  app.config.errorHandler = (err: any, vm: any, info: string) => {
    console.error('Vue Error:', err, info)
    errorHandler.handleError(err, 'Vue Component')
  }

  // Настройка обработчика необработанных промисов
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    errorHandler.handleError(event.reason, 'Promise Rejection')
  })

  // Настройка обработчика глобальных ошибок JavaScript
  window.addEventListener('error', (event) => {
    console.error('Global JavaScript Error:', event.error)
    errorHandler.handleError(event.error, 'JavaScript Error')
  })
}