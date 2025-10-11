<template>
  <div class="clear-auth-page">
    <v-container class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-card class="pa-4" elevation="8">
            <v-card-title class="text-center mb-4">
              <v-icon class="mr-2" color="warning" size="large">mdi-alert-circle</v-icon>
              <h2>Очистка авторизации</h2>
            </v-card-title>
            
            <v-card-text class="text-center">
              <p class="text-h6 mb-4">
                Эта страница поможет вам полностью очистить все данные авторизации
              </p>
              
              <v-alert type="info" variant="tonal" class="mb-4">
                <strong>Будут очищены:</strong>
                <ul class="text-left mt-2">
                  <li>Токены Axenta Cloud</li>
                  <li>Локальные JWT токены</li>
                  <li>Данные пользователей</li>
                  <li>Информация о компаниях</li>
                  <li>Демо данные</li>
                </ul>
              </v-alert>

              <div class="d-flex flex-column gap-3">
                <v-btn
                  color="warning"
                  size="large"
                  @click="clearAndGoToLogin"
                  :loading="clearing"
                >
                  <v-icon left>mdi-broom</v-icon>
                  Очистить и перейти к входу
                </v-btn>
                
                <v-btn
                  color="error"
                  variant="outlined"
                  @click="clearAndReload"
                  :loading="clearing"
                >
                  <v-icon left>mdi-refresh</v-icon>
                  Очистить и перезагрузить страницу
                </v-btn>
                
                <v-divider class="my-2" />
                
                <v-btn
                  color="primary"
                  variant="text"
                  @click="$router.push('/login')"
                >
                  <v-icon left>mdi-arrow-left</v-icon>
                  Вернуться к входу
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- Отладочная информация -->
          <v-card class="mt-4 pa-3" variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2">mdi-information</v-icon>
              Текущее состояние localStorage
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Axenta токен</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip 
                      :color="storageState.axentaToken ? 'success' : 'grey'" 
                      size="small" 
                      variant="tonal"
                    >
                      {{ storageState.axentaToken ? 'Есть' : 'Нет' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>Локальный токен</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip 
                      :color="storageState.localToken ? 'success' : 'grey'" 
                      size="small" 
                      variant="tonal"
                    >
                      {{ storageState.localToken ? 'Есть' : 'Нет' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-title>Данные пользователя</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip 
                      :color="storageState.userData ? 'success' : 'grey'" 
                      size="small" 
                      variant="tonal"
                    >
                      {{ storageState.userData ? 'Есть' : 'Нет' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              
              <v-btn
                color="info"
                variant="text"
                size="small"
                @click="updateStorageState"
                class="mt-2"
              >
                <v-icon left>mdi-refresh</v-icon>
                Обновить состояние
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { clearAllAuthData, verifyAuthCleared } from '@/utils/authClear'
import ForceLogout from '@/components/Auth/ForceLogout.vue'

export default defineComponent({
  name: 'ClearAuth',
  components: {
    ForceLogout
  },
  setup() {
    const router = useRouter()
    const clearing = ref(false)
    const storageState = ref({
      axentaToken: false,
      localToken: false,
      userData: false
    })

    const updateStorageState = () => {
      storageState.value = {
        axentaToken: !!(localStorage.getItem('axenta_token') || localStorage.getItem('token')),
        localToken: !!localStorage.getItem('local_access_token'),
        userData: !!(localStorage.getItem('axenta_user') || localStorage.getItem('local_user') || localStorage.getItem('user'))
      }
    }

    const clearAndGoToLogin = async () => {
      clearing.value = true
      
      try {
        console.log('🧹 Clearing auth data and going to login...')
        clearAllAuthData()
        
        setTimeout(() => {
          router.push('/login')
        }, 500)
        
      } catch (error) {
        console.error('Error clearing auth:', error)
      } finally {
        clearing.value = false
      }
    }

    const clearAndReload = async () => {
      clearing.value = true
      
      try {
        console.log('🧹 Clearing auth data and reloading...')
        clearAllAuthData()
        
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
        
      } catch (error) {
        console.error('Error clearing auth:', error)
        window.location.href = '/login'
      }
    }

    onMounted(() => {
      updateStorageState()
    })

    return {
      clearing,
      storageState,
      updateStorageState,
      clearAndGoToLogin,
      clearAndReload,
    }
  },
})
</script>

<style scoped>
.clear-auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
}

.fill-height {
  height: 100vh;
}

.v-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.gap-3 {
  gap: 12px;
}

ul {
  padding-left: 20px;
}

li {
  margin-bottom: 4px;
}
</style>
