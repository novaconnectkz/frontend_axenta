import { ref, reactive } from 'vue'

export interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  timeout?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
    color?: string
  }>
}

// Глобальное состояние уведомлений
const notifications = ref<NotificationItem[]>([])
const snackbar = reactive({
  show: false,
  type: 'info' as NotificationItem['type'],
  title: '',
  message: '',
  timeout: 5000,
  actions: [] as NotificationItem['actions']
})

let notificationId = 0

export function useNotifications() {
  const generateId = () => `notification_${++notificationId}_${Date.now()}`

  const showNotification = (notification: Omit<NotificationItem, 'id'>) => {
    const item: NotificationItem = {
      id: generateId(),
      timeout: 5000,
      ...notification
    }

    notifications.value.unshift(item)

    // Автоматически удаляем уведомление через timeout (если не persistent)
    if (!item.persistent && item.timeout && item.timeout > 0) {
      setTimeout(() => {
        removeNotification(item.id)
      }, item.timeout)
    }

    return item.id
  }

  const showSnackbar = (
    title: string,
    message?: string,
    type: NotificationItem['type'] = 'info',
    timeout = 5000,
    actions?: NotificationItem['actions']
  ) => {
    snackbar.show = false // Сначала скрываем текущий snackbar
    
    setTimeout(() => {
      snackbar.type = type
      snackbar.title = title
      snackbar.message = message || ''
      snackbar.timeout = timeout
      snackbar.actions = actions || []
      snackbar.show = true
    }, 100)
  }

  const hideSnackbar = () => {
    snackbar.show = false
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  // Удобные методы для разных типов уведомлений
  const showSuccess = (title: string, message?: string, timeout = 3000) => {
    return showSnackbar(title, message, 'success', timeout)
  }

  const showError = (title: string, message?: string, timeout = 7000) => {
    return showSnackbar(title, message, 'error', timeout)
  }

  const showWarning = (title: string, message?: string, timeout = 5000) => {
    return showSnackbar(title, message, 'warning', timeout)
  }

  const showInfo = (title: string, message?: string, timeout = 4000) => {
    return showSnackbar(title, message, 'info', timeout)
  }

  // Специальные методы для обработки HTTP ошибок
  const showAuthError = (message?: string) => {
    return showError(
      'Ошибка авторизации',
      message || 'Необходимо войти в систему заново',
      0, // Не скрывать автоматически
      [
        {
          label: 'Войти',
          action: () => {
            window.location.href = '/login'
          },
          color: 'primary'
        }
      ]
    )
  }

  const showNetworkError = (message?: string) => {
    return showError(
      'Ошибка подключения',
      message || 'Проверьте интернет-соединение и повторите попытку',
      10000
    )
  }

  const showValidationError = (message?: string, fields?: Record<string, string[]>) => {
    let errorMessage = message || 'Проверьте правильность заполнения полей'
    
    if (fields) {
      const fieldErrors = Object.entries(fields)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('; ')
      errorMessage += `. Ошибки: ${fieldErrors}`
    }

    return showError('Ошибка валидации', errorMessage, 8000)
  }

  const showPermissionError = (message?: string) => {
    return showError(
      'Недостаточно прав',
      message || 'У вас недостаточно прав для выполнения этого действия',
      6000
    )
  }

  return {
    // Состояние
    notifications: notifications.value,
    snackbar,

    // Основные методы
    showNotification,
    showSnackbar,
    hideSnackbar,
    removeNotification,
    clearAllNotifications,

    // Удобные методы
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Специализированные методы
    showAuthError,
    showNetworkError,
    showValidationError,
    showPermissionError
  }
}
