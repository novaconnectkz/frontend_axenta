import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from './useNotifications'
import { settingsService } from '@/services/settingsService'

export interface AxentaIntegrationStatus {
  isConfigured: boolean
  isActive: boolean
  needsPassword: boolean
  lastSync?: Date
  errorMessage?: string
}

export function useAxentaIntegrationNotifications() {
  const router = useRouter()
  const { showNotification } = useNotifications()
  
  const status = ref<AxentaIntegrationStatus>({
    isConfigured: false,
    isActive: false,
    needsPassword: true
  })
  
  const isLoading = ref(false)
  const checkInterval = ref<NodeJS.Timeout | null>(null)
  
  // Проверка статуса интеграции
  const checkIntegrationStatus = async () => {
    isLoading.value = true
    try {
      const result = await settingsService.checkAxentaIntegrationStatus()
      status.value = result
      
      // Если интеграция неактивна и нужен пароль, показываем уведомление
      if (result.needsPassword && !result.isActive) {
        showAxentaPasswordNotification()
      }
    } catch (error) {
      console.error('Ошибка проверки статуса Axenta интеграции:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Показать уведомление о необходимости ввести пароль
  const showAxentaPasswordNotification = () => {
    showNotification({
      type: 'warning',
      title: 'Требуется настройка интеграции Axenta Cloud API',
      message: 'Необходимо ввести пароль для интеграции с Axenta Cloud. Данные в CRM не будут обновляться до настройки интеграции.',
      persistent: true,
      actions: [
        {
          label: 'Настроить',
          color: 'primary',
          handler: () => {
            // Переходим на страницу настроек с открытой вкладкой интеграций
            router.push({
              path: '/settings',
              query: { tab: 'integrations' }
            })
          }
        }
      ]
    })
  }
  
  // Очистка уведомлений о Axenta интеграции
  const clearAxentaNotifications = () => {
    // Здесь можно добавить логику для очистки специфичных уведомлений
    // если в будущем понадобится более детальное управление
  }
  
  // Запуск периодической проверки
  const startPeriodicCheck = (intervalMs = 60000) => { // каждую минуту по умолчанию
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
    }
    
    checkInterval.value = setInterval(() => {
      checkIntegrationStatus()
    }, intervalMs)
  }
  
  // Остановка периодической проверки
  const stopPeriodicCheck = () => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
      checkInterval.value = null
    }
  }
  
  // Инициализация при монтировании компонента
  onMounted(() => {
    checkIntegrationStatus()
    startPeriodicCheck()
  })
  
  // Очистка при размонтировании
  onUnmounted(() => {
    stopPeriodicCheck()
  })
  
  return {
    status,
    isLoading,
    checkIntegrationStatus,
    showAxentaPasswordNotification,
    clearAxentaNotifications,
    startPeriodicCheck,
    stopPeriodicCheck
  }
}
