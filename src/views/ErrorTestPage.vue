<template>
  <div class="error-test-page pa-6">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-6">Тестирование обработки ошибок</h1>
          <p class="text-body-1 mb-6">
            Эта страница предназначена для тестирования различных типов ошибок и их обработки.
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title>HTTP Ошибки</v-card-title>
            <v-card-text>
              <v-btn
                @click="testError(401)"
                color="warning"
                class="ma-1"
                :loading="loading"
              >
                401 Unauthorized
              </v-btn>
              
              <v-btn
                @click="testError(403)"
                color="error"
                class="ma-1"
                :loading="loading"
              >
                403 Forbidden
              </v-btn>
              
              <v-btn
                @click="testError(404)"
                color="info"
                class="ma-1"
                :loading="loading"
              >
                404 Not Found
              </v-btn>
              
              <v-btn
                @click="testError(500)"
                color="error"
                class="ma-1"
                :loading="loading"
              >
                500 Server Error
              </v-btn>
              
              <v-btn
                @click="testNetworkError()"
                color="warning"
                class="ma-1"
                :loading="loading"
              >
                Network Error
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title>Кастомные ошибки</v-card-title>
            <v-card-text>
              <v-btn
                @click="testAuthError()"
                color="warning"
                class="ma-1"
                :loading="loading"
              >
                Auth Error
              </v-btn>
              
              <v-btn
                @click="testValidationError()"
                color="info"
                class="ma-1"
                :loading="loading"
              >
                Validation Error
              </v-btn>
              
              <v-btn
                @click="testPermissionError()"
                color="error"
                class="ma-1"
                :loading="loading"
              >
                Permission Error
              </v-btn>
              
              <v-btn
                @click="testUnknownError()"
                color="grey"
                class="ma-1"
                :loading="loading"
              >
                Unknown Error
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>Уведомления</v-card-title>
            <v-card-text>
              <v-btn
                @click="showSuccessNotification()"
                color="success"
                class="ma-1"
              >
                Success
              </v-btn>
              
              <v-btn
                @click="showInfoNotification()"
                color="info"
                class="ma-1"
              >
                Info
              </v-btn>
              
              <v-btn
                @click="showWarningNotification()"
                color="warning"
                class="ma-1"
              >
                Warning
              </v-btn>
              
              <v-btn
                @click="showErrorNotification()"
                color="error"
                class="ma-1"
              >
                Error
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>Тест продакшен API</v-card-title>
            <v-card-text>
              <p class="mb-4">
                Тестирование реального API эндпоинта, который вызывал проблемы:
              </p>
              
              <v-btn
                @click="testProductionAPI()"
                color="primary"
                class="ma-1"
                :loading="loadingProd"
              >
                Тест /api/auth/roles
              </v-btn>
              
              <v-btn
                @click="testProductionLogin()"
                color="secondary"
                class="ma-1"
                :loading="loadingProd"
              >
                Тест /api/auth/login
              </v-btn>
              
              <div v-if="apiResult" class="mt-4">
                <v-alert
                  :type="apiResult.success ? 'success' : 'error'"
                  class="mb-2"
                >
                  <strong>Результат:</strong> {{ apiResult.message }}
                </v-alert>
                
                <v-expansion-panels v-if="apiResult.details">
                  <v-expansion-panel>
                    <v-expansion-panel-title>Детали ответа</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <pre>{{ JSON.stringify(apiResult.details, null, 2) }}</pre>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import { useErrorHandler, AuthError, ValidationError, PermissionError, NetworkError } from '@/utils/errorHandler'
import axios from 'axios'
import { ref } from 'vue'

const notifications = useNotifications()
const errorHandler = useErrorHandler()

const loading = ref(false)
const loadingProd = ref(false)
const apiResult = ref<{
  success: boolean
  message: string
  details?: any
} | null>(null)

// Тестирование HTTP ошибок
const testError = async (status: number) => {
  loading.value = true
  try {
    // Создаем искусственную ошибку
    const error = {
      response: {
        status,
        data: {
          error: `Test ${status} error`,
          message: `This is a test ${status} error`
        }
      },
      message: `HTTP ${status} Error`
    }
    
    errorHandler.handleError(error)
  } catch (err) {
    console.error('Error in test:', err)
  } finally {
    loading.value = false
  }
}

const testNetworkError = () => {
  loading.value = true
  try {
    const error = {
      request: {},
      message: 'Network Error - No response from server'
    }
    
    errorHandler.handleError(error)
  } finally {
    loading.value = false
  }
}

// Тестирование кастомных ошибок
const testAuthError = () => {
  const error = new AuthError('Token expired', 'TOKEN_EXPIRED')
  errorHandler.handleError(error)
}

const testValidationError = () => {
  const error = new ValidationError('Validation failed', {
    email: ['Email is required', 'Email format is invalid'],
    password: ['Password is too short']
  })
  errorHandler.handleError(error)
}

const testPermissionError = () => {
  const error = new PermissionError(
    'Access denied', 
    'admin.users.delete', 
    ['user.read', 'user.write']
  )
  errorHandler.handleError(error)
}

const testUnknownError = () => {
  const error = new Error('Something went wrong')
  errorHandler.handleError(error)
}

// Тестирование уведомлений
const showSuccessNotification = () => {
  notifications.showSuccess('Операция выполнена', 'Данные успешно сохранены')
}

const showInfoNotification = () => {
  notifications.showInfo('Информация', 'Это информационное сообщение')
}

const showWarningNotification = () => {
  notifications.showWarning('Предупреждение', 'Проверьте введенные данные')
}

const showErrorNotification = () => {
  notifications.showError('Ошибка', 'Что-то пошло не так')
}

// Тестирование продакшен API
const testProductionAPI = async () => {
  loadingProd.value = true
  apiResult.value = null
  
  try {
    const response = await axios.get(
      'https://api.axenta.glonass-saratov.ru/api/auth/roles?page=1&limit=100&active_only=true'
    )
    
    apiResult.value = {
      success: true,
      message: `Успешно! Статус: ${response.status}`,
      details: {
        status: response.status,
        data: response.data,
        headers: response.headers
      }
    }
  } catch (error: any) {
    apiResult.value = {
      success: false,
      message: `Ошибка: ${error.response?.status || 'Network'} - ${error.response?.data?.error || error.message}`,
      details: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      }
    }
    
    // Ошибка будет обработана автоматически через interceptor
  } finally {
    loadingProd.value = false
  }
}

const testProductionLogin = async () => {
  loadingProd.value = true
  apiResult.value = null
  
  try {
    const response = await axios.post(
      'https://api.axenta.glonass-saratov.ru/api/auth/login',
      {
        username: 'test',
        password: 'test'
      }
    )
    
    apiResult.value = {
      success: true,
      message: `Успешно! Статус: ${response.status}`,
      details: response.data
    }
  } catch (error: any) {
    apiResult.value = {
      success: false,
      message: `Ошибка: ${error.response?.status || 'Network'} - ${error.response?.data?.error || error.message}`,
      details: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      }
    }
  } finally {
    loadingProd.value = false
  }
}
</script>

<style scoped>
.error-test-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

pre {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}
</style>
