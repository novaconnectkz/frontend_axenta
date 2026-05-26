<template>
  <div class="profile-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-account-circle</v-icon>
              Профиль пользователя
              <v-spacer />
              <v-chip
                v-if="auth.user.value"
                :color="getRoleColor(auth.user.value.accountType)"
                variant="tonal"
                size="small"
              >
                {{ getRoleLabel(auth.user.value.accountType) }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <div v-if="auth.user.value">
                <v-row>
                  <!-- Левая колонка -->
                  <v-col cols="12" md="6">
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>ID пользователя</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.id }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <v-list-item-title>Логин</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.username }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <v-list-item-title>Полное имя</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.name }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="auth.user.value.email">
                        <v-list-item-title>Email</v-list-item-title>
                        <v-list-item-subtitle>
                          <a :href="`mailto:${auth.user.value.email}`" class="text-primary">
                            {{ auth.user.value.email }}
                          </a>
                        </v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <v-list-item-title>Статус</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip 
                            :color="auth.user.value.isActive ? 'success' : 'error'" 
                            size="small" 
                            variant="tonal"
                          >
                            {{ auth.user.value.isActive ? 'Активен' : 'Неактивен' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Права администратора</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip 
                            :color="auth.user.value.isAdmin ? 'warning' : 'default'" 
                            size="small" 
                            variant="tonal"
                          >
                            {{ auth.user.value.isAdmin ? 'Да' : 'Нет' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Название компании</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.accountName }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <v-list-item-title>Тип аккаунта</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip 
                            :color="getAccountTypeColor(auth.user.value.accountType)" 
                            size="small" 
                            variant="tonal"
                          >
                            {{ getAccountTypeLabel(auth.user.value.accountType) }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="auth.user.value.accountId">
                        <v-list-item-title>ID аккаунта</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.accountId }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>

                  <!-- Правая колонка -->
                  <v-col cols="12" md="6">
                    <v-list density="compact">
                      <v-list-item v-if="auth.user.value.creatorName">
                        <v-list-item-title>Создатель аккаунта</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.creatorName }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="auth.user.value.accountBlockingDatetime">
                        <v-list-item-title>Блокировка аккаунта</v-list-item-title>
                        <v-list-item-subtitle class="text-error">
                          <v-icon icon="mdi-alert" size="16" class="mr-1" />
                          {{ formatDate(auth.user.value.accountBlockingDatetime) }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="auth.user.value.language">
                        <v-list-item-title>Язык интерфейса</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip size="small" variant="tonal" color="info">
                            {{ getLanguageLabel(auth.user.value.language) }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="auth.user.value.timezone">
                        <v-list-item-title>Часовой пояс</v-list-item-title>
                        <v-list-item-subtitle>UTC{{ auth.user.value.timezone >= 0 ? '+' : '' }}{{ auth.user.value.timezone }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="auth.user.value.lastLogin">
                        <v-list-item-title>Последний вход</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(auth.user.value.lastLogin) }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="auth.company.value">
                        <v-list-item-title>ID компании в системе</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.company.value.id }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </div>

              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey">mdi-account-off</v-icon>
                <p class="text-h6 mt-2">Пользователь не авторизован</p>
                <p class="text-body-2 text-medium-emphasis">
                  Войдите в систему для просмотра профиля
                </p>
                <v-btn
                  color="primary"
                  class="mt-4"
                  @click="$router.push('/login')"
                >
                  Войти в систему
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Смена пароля (только для local-auth юзеров) -->
        <v-col cols="12" v-if="auth.user.value && auth.user.value.isAxentaUser !== true">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-lock-reset</v-icon>
              Смена пароля
            </v-card-title>
            <v-card-text>
              <v-form ref="pwdForm" @submit.prevent="submitChangePassword">
                <v-row>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="pwdState.current"
                      label="Текущий пароль"
                      :type="pwdState.showCurrent ? 'text' : 'password'"
                      :append-inner-icon="pwdState.showCurrent ? 'mdi-eye-off' : 'mdi-eye'"
                      @click:append-inner="pwdState.showCurrent = !pwdState.showCurrent"
                      :rules="[rRequired]"
                      autocomplete="current-password"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="pwdState.new1"
                      label="Новый пароль (мин. 10)"
                      :type="pwdState.showNew ? 'text' : 'password'"
                      :append-inner-icon="pwdState.showNew ? 'mdi-eye-off' : 'mdi-eye'"
                      @click:append-inner="pwdState.showNew = !pwdState.showNew"
                      :rules="[rRequired, rMin10]"
                      autocomplete="new-password"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="pwdState.new2"
                      label="Подтверждение"
                      :type="pwdState.showNew ? 'text' : 'password'"
                      :rules="[rRequired, rMatchNew]"
                      autocomplete="new-password"
                    />
                  </v-col>
                </v-row>
                <v-alert v-if="pwdMsg.text" :type="pwdMsg.kind" density="compact" class="mb-3">
                  {{ pwdMsg.text }}
                </v-alert>
                <v-btn
                  color="primary"
                  :loading="pwdState.submitting"
                  @click="submitChangePassword"
                >
                  Сменить пароль
                </v-btn>
                <v-alert type="info" variant="tonal" density="compact" class="mt-4">
                  После смены пароля все сессии (включая текущую) будут разлогинены.
                  Войдите заново с новым паролем.
                </v-alert>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@/context/auth'
import { config } from '@/config/env'

export default defineComponent({
  name: 'Profile',
  setup() {
    const router = useRouter()
    const auth = useAuth()


    const getRoleColor = (role) => {
      const colors = {
        admin: 'success',
        manager: 'primary',
        tech: 'warning',
        accountant: 'info',
        demo: 'purple',
        user: 'grey',
        partner: 'deep-purple',
        premium: 'amber'
      }
      return colors[role] || 'grey'
    }

    const getRoleLabel = (role) => {
      const labels = {
        admin: 'Администратор',
        manager: 'Менеджер',
        tech: 'Техник',
        accountant: 'Бухгалтер',
        demo: 'Демо',
        user: 'Пользователь',
        partner: 'Партнер',
        premium: 'Премиум'
      }
      return labels[role] || role
    }

    const getAccountTypeColor = (type) => {
      const colors = {
        partner: 'deep-purple',
        client: 'blue-grey',
        premium: 'amber',
        basic: 'blue',
        trial: 'orange',
        demo: 'purple',
        free: 'grey'
      }
      return colors[type] || 'primary'
    }

    const getAccountTypeLabel = (type) => {
      const labels = {
        partner: 'Партнерский',
        client: 'Клиентский',
        premium: 'Премиум',
        basic: 'Базовый',
        trial: 'Пробный',
        demo: 'Демо',
        free: 'Бесплатный'
      }
      return labels[type] || type
    }

    const getLanguageLabel = (lang) => {
      const languages = {
        ru: 'Русский',
        en: 'English',
        de: 'Deutsch',
        fr: 'Français',
        es: 'Español'
      }
      return languages[lang] || lang
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'Не указано'
      
      try {
        const date = new Date(dateString)
        return date.toLocaleString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return dateString
      }
    }

    // === Смена пароля (local-auth) ===
    const pwdForm = ref(null)
    const pwdState = reactive({
      current: '', new1: '', new2: '',
      showCurrent: false, showNew: false, submitting: false,
    })
    const pwdMsg = reactive({ text: '', kind: 'info' })

    const rRequired = (v) => !!v || 'Обязательное поле'
    const rMin10 = (v) => (v && v.length >= 10) || 'Минимум 10 символов'
    const rMatchNew = (v) => v === pwdState.new1 || 'Пароли не совпадают'

    const submitChangePassword = async () => {
      pwdMsg.text = ''
      const { valid } = (await pwdForm.value?.validate()) || { valid: true }
      if (valid === false) return
      if (pwdState.new1 !== pwdState.new2) {
        pwdMsg.text = 'Пароли не совпадают'; pwdMsg.kind = 'error'; return
      }
      pwdState.submitting = true
      try {
        const token = localStorage.getItem('axenta_token') || ''
        await axios.post(
          `${config.apiBaseUrl}/local/change-password`,
          { current_password: pwdState.current, new_password: pwdState.new1 },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        )
        pwdMsg.text = 'Пароль изменён. Выполняется выход через 3 секунды...'
        pwdMsg.kind = 'success'
        setTimeout(async () => {
          try { await auth.logout() } catch {}
          router.replace('/login')
        }, 3000)
      } catch (err) {
        pwdMsg.text = err?.response?.data?.error || 'Ошибка смены пароля'
        pwdMsg.kind = 'error'
      } finally {
        pwdState.submitting = false
      }
    }

    // Проверяем авторизацию при монтировании
    onMounted(() => {
      if (!auth.isAuthenticated.value) {
        router.push('/login')
      }
    })

    return {
      auth,
      getRoleColor,
      getRoleLabel,
      getAccountTypeColor,
      getAccountTypeLabel,
      getLanguageLabel,
      formatDate,
      // change-password
      pwdForm,
      pwdState,
      pwdMsg,
      rRequired,
      rMin10,
      rMatchNew,
      submitChangePassword,
    }
  },
})
</script>

<style scoped>
.profile-page {
  padding: 20px 0;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
