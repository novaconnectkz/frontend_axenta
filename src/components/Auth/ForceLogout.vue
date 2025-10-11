<template>
  <div class="force-logout">
    <v-btn
      :color="variant === 'danger' ? 'error' : 'warning'"
      :variant="buttonVariant"
      :size="size"
      @click="showDialog = true"
      :prepend-icon="icon"
    >
      {{ text }}
    </v-btn>

    <!-- Диалог подтверждения -->
    <v-dialog v-model="showDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="warning">mdi-alert</v-icon>
          Принудительный выход
        </v-card-title>
        
        <v-card-text>
          <p class="mb-3">
            Это действие полностью очистит все данные авторизации и перезагрузит страницу.
          </p>
          
          <v-alert type="warning" variant="tonal" class="mb-3">
            <strong>Внимание:</strong> Будут очищены данные всех типов авторизации:
            <ul class="mt-2">
              <li>Axenta Cloud токены</li>
              <li>Локальные JWT токены</li>
              <li>Демо данные</li>
              <li>Сохраненные настройки</li>
            </ul>
          </v-alert>
          
          <p class="text-body-2">
            Вы уверены, что хотите выполнить принудительный выход?
          </p>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDialog = false">
            Отмена
          </v-btn>
          <v-btn 
            color="error" 
            @click="handleForceLogout"
            :loading="isLoggingOut"
          >
            <v-icon left>mdi-logout</v-icon>
            Принудительный выход
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Снэкбар для уведомлений -->
    <v-snackbar
      v-model="showSuccess"
      color="success"
      timeout="3000"
      location="bottom"
    >
      <v-icon left>mdi-check</v-icon>
      Все данные авторизации очищены
    </v-snackbar>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { clearAllAuthData, verifyAuthCleared } from '@/utils/authClear'

export default defineComponent({
  name: 'ForceLogout',
  props: {
    text: {
      type: String,
      default: 'Принудительный выход'
    },
    variant: {
      type: String,
      default: 'warning', // 'warning' или 'danger'
      validator: (value) => ['warning', 'danger'].includes(value)
    },
    buttonVariant: {
      type: String,
      default: 'outlined'
    },
    size: {
      type: String,
      default: 'default'
    },
    icon: {
      type: String,
      default: 'mdi-logout-variant'
    }
  },
  emits: ['logout'],
  setup(props, { emit }) {
    const showDialog = ref(false)
    const isLoggingOut = ref(false)
    const showSuccess = ref(false)

    const handleForceLogout = async () => {
      isLoggingOut.value = true
      
      try {
        console.log('🚨 Force logout initiated by user')
        
        // Очищаем все данные авторизации
        clearAllAuthData()
        
        // Проверяем, что все очищено
        const isCleared = verifyAuthCleared()
        
        if (isCleared) {
          showSuccess.value = true
          emit('logout')
          
          // Небольшая задержка для показа уведомления
          setTimeout(() => {
            console.log('🔄 Redirecting to login page...')
            window.location.href = '/login'
          }, 1000)
        } else {
          console.warn('⚠️ Some data remains, forcing page reload...')
          window.location.href = '/login'
        }
        
      } catch (error) {
        console.error('Error during force logout:', error)
        // В любом случае перенаправляем на страницу входа
        window.location.href = '/login'
      } finally {
        isLoggingOut.value = false
        showDialog.value = false
      }
    }

    return {
      showDialog,
      isLoggingOut,
      showSuccess,
      handleForceLogout,
    }
  },
})
</script>

<style scoped>
.force-logout {
  display: inline-block;
}

ul {
  padding-left: 20px;
}

li {
  margin-bottom: 4px;
}
</style>
