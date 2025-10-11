import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { config } from '@/config/env'

// Константы для localStorage
const ACCESS_TOKEN_KEY = 'local_access_token'
const REFRESH_TOKEN_KEY = 'local_refresh_token'
const USER_KEY = 'local_user'

// Глобальное состояние авторизации
const accessToken = ref(localStorage.getItem(ACCESS_TOKEN_KEY))
const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY))
const user = ref(null)
const isLoading = ref(false)
const error = ref(null)

// Загружаем пользователя из localStorage при инициализации
const loadUserFromStorage = () => {
  const storedUser = localStorage.getItem(USER_KEY)
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (err) {
      console.error('Failed to parse stored user:', err)
      localStorage.removeItem(USER_KEY)
    }
  }
}

// Инициализация
loadUserFromStorage()

// Создаем axios instance для локальной авторизации
const localApiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
})

// Interceptor для автоматического добавления токена
localApiClient.interceptors.request.use(
  (config) => {
    const token = accessToken.value
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor для обработки ошибок авторизации
localApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Пробуем обновить токен
      if (refreshToken.value) {
        try {
          await refreshAccessToken()
          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${accessToken.value}`
          return localApiClient.request(originalRequest)
        } catch (refreshError) {
          // Не удалось обновить токен, выходим из системы
          logout()
          return Promise.reject(refreshError)
        }
      } else {
        // Нет refresh токена, выходим из системы
        logout()
      }
    }

    return Promise.reject(error)
  }
)

// Функция для сохранения данных в localStorage
const saveToStorage = () => {
  if (accessToken.value) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.value)
  }
  if (refreshToken.value) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.value)
  }
  if (user.value) {
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }
}

// Функция для очистки localStorage
const clearStorage = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Функция входа в систему
const login = async (username, password) => {
  isLoading.value = true
  error.value = null

  try {
    const response = await axios.post(`${config.apiBaseUrl}/local/login`, {
      username,
      password
    })

    if (response.data.status === 'success') {
      const { access_token, refresh_token, user: userData } = response.data.data
      
      accessToken.value = access_token
      refreshToken.value = refresh_token
      user.value = userData

      saveToStorage()

      console.log('✅ Local login successful:', {
        user: userData.username,
        role: userData.role,
        company_id: userData.company_id
      })

      return userData
    } else {
      throw new Error(response.data.error || 'Login failed')
    }
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message || 'Login failed'
    error.value = errorMessage
    clearStorage()
    throw new Error(errorMessage)
  } finally {
    isLoading.value = false
  }
}

// Функция выхода из системы
const logout = async () => {
  console.log('🚪 Local logout initiated...')
  
  try {
    // Отправляем запрос на сервер для отзыва refresh токена
    if (refreshToken.value) {
      await localApiClient.post('/local/logout', {
        refresh_token: refreshToken.value
      })
    }
  } catch (err) {
    console.warn('Failed to logout on server:', err)
  } finally {
    // Очищаем локальное состояние в любом случае
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    error.value = null
    
    // Очищаем localStorage
    clearStorage()
    
    // Дополнительная очистка для надежности
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('axenta_token')
    localStorage.removeItem('axenta_user')
    localStorage.removeItem('axenta_company')
    localStorage.removeItem('demo_token')
    localStorage.removeItem('demo_user')

    console.log('✅ Local logout completed')
  }
}

// Функция обновления access токена
const refreshAccessToken = async () => {
  if (!refreshToken.value) {
    throw new Error('No refresh token available')
  }

  try {
    const response = await axios.post(`${config.apiBaseUrl}/local/refresh`, {
      refresh_token: refreshToken.value
    })

    if (response.data.status === 'success') {
      accessToken.value = response.data.data.access_token
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.value)
      
      console.log('🔄 Access token refreshed')
      return accessToken.value
    } else {
      throw new Error(response.data.error || 'Token refresh failed')
    }
  } catch (err) {
    console.error('Failed to refresh token:', err)
    throw err
  }
}

// Функция получения текущего пользователя
const getCurrentUser = async () => {
  if (!accessToken.value) {
    throw new Error('No access token available')
  }

  try {
    const response = await localApiClient.get('/local/current_user')
    
    if (response.data.status === 'success') {
      user.value = response.data.data
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
      return user.value
    } else {
      throw new Error(response.data.error || 'Failed to get current user')
    }
  } catch (err) {
    console.error('Failed to get current user:', err)
    throw err
  }
}

// Функция регистрации нового пользователя (только для админов)
const registerUser = async (userData) => {
  try {
    const response = await localApiClient.post('/local/register', userData)
    
    if (response.data.status === 'success') {
      console.log('✅ User registered successfully:', response.data.data)
      return response.data.data
    } else {
      throw new Error(response.data.error || 'Registration failed')
    }
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message || 'Registration failed'
    throw new Error(errorMessage)
  }
}

// Вычисляемые свойства
const isAuthenticated = computed(() => {
  return !!(accessToken.value && user.value)
})

const userRole = computed(() => {
  return user.value?.role || null
})

const userCompanyId = computed(() => {
  return user.value?.company_id || null
})

// Функции проверки ролей
const hasRole = (role) => {
  return userRole.value === role
}

const hasAnyRole = (roles) => {
  return roles.includes(userRole.value)
}

const isAdmin = computed(() => hasRole('admin'))
const isManager = computed(() => hasRole('manager'))
const isTech = computed(() => hasRole('tech'))
const isAccountant = computed(() => hasRole('accountant'))

// Функция очистки ошибок
const clearError = () => {
  error.value = null
}

// Следим за изменениями токена для автоматической очистки пользователя
watch(accessToken, (newToken) => {
  if (!newToken) {
    user.value = null
  }
})

// Composable функция
export function useLocalAuth() {
  return {
    // Состояние
    user: computed(() => user.value),
    accessToken: computed(() => accessToken.value),
    refreshToken: computed(() => refreshToken.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isAuthenticated,
    userRole,
    userCompanyId,

    // Вычисляемые свойства для ролей
    isAdmin,
    isManager,
    isTech,
    isAccountant,

    // Методы
    login,
    logout,
    getCurrentUser,
    refreshAccessToken,
    registerUser,
    hasRole,
    hasAnyRole,
    clearError,

    // API клиент
    apiClient: localApiClient,
  }
}

// Экспортируем также для использования вне composable
export {
  localApiClient,
  isAuthenticated,
  user,
  userRole,
  userCompanyId,
}
