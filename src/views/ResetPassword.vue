<!--
  Страница сброса пароля. Открывается по ссылке из email:
  https://acrm.su/reset-password/<token>

  BE: POST /api/auth/reset-password-by-token { token, new_password }.
  Успех → редирект на /login.
-->
<template>
  <div class="rp-page">
    <div class="rp-card">
      <div class="rp-logo">
        <div class="rp-logo-icon">A</div>
        <div class="rp-logo-text">ACRM <span>Hub</span></div>
      </div>
      <h2 class="rp-title">Установка нового пароля</h2>
      <p v-if="!done" class="rp-sub">
        Введите новый пароль для учётной записи. После сохранения все активные сессии будут разлогинены.
      </p>

      <div v-if="done" class="rp-success">
        <div class="rp-success-icon">✓</div>
        <h3>Пароль изменён</h3>
        <p>Через 3 секунды будет выполнен переход на страницу входа.</p>
      </div>

      <form v-else @submit.prevent="submit" class="rp-form">
        <label class="rp-label">
          Новый пароль (минимум 10 символов)
          <input
            v-model="newPwd"
            type="password"
            class="rp-input"
            :disabled="submitting"
            autocomplete="new-password"
            required
          />
        </label>
        <label class="rp-label">
          Подтверждение
          <input
            v-model="confirmPwd"
            type="password"
            class="rp-input"
            :disabled="submitting"
            autocomplete="new-password"
            required
          />
        </label>

        <div v-if="error" class="rp-err">{{ error }}</div>

        <button type="submit" class="rp-btn" :disabled="!canSubmit || submitting">
          <span v-if="!submitting">Сохранить пароль</span>
          <span v-else>Сохранение...</span>
        </button>

        <div class="rp-foot">
          <router-link to="/login">← Вернуться ко входу</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { config } from '@/config/env'

const route = useRoute()
const router = useRouter()

const token = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const error = ref('')
const submitting = ref(false)
const done = ref(false)

const canSubmit = computed(
  () => !!newPwd.value && newPwd.value.length >= 10 && newPwd.value === confirmPwd.value
)

onMounted(() => {
  const t = String(route.params.token || '').trim()
  if (!t) {
    error.value = 'Токен не указан в ссылке'
    return
  }
  token.value = t
})

async function submit() {
  error.value = ''
  if (newPwd.value.length < 10) {
    error.value = 'Пароль минимум 10 символов'
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    error.value = 'Пароли не совпадают'
    return
  }
  submitting.value = true
  try {
    await axios.post(
      `${config.apiBaseUrl}/auth/reset-password-by-token`,
      { token: token.value, new_password: newPwd.value },
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    )
    done.value = true
    setTimeout(() => router.replace('/login'), 3000)
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Не удалось сбросить пароль'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.rp-page {
  min-height: 100vh;
  background: #0c0e12;
  color: #e6e8ec;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.rp-card {
  background: #15181f;
  border-radius: 18px;
  padding: 36px 32px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 16px 60px rgba(0, 0, 0, .5);
}
.rp-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;
}
.rp-logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  background: linear-gradient(135deg, #1f6feb, #4f46e5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
}
.rp-logo-text { font-size: 20px; font-weight: 600; }
.rp-logo-text span { color: #6b7280; }
.rp-title { font-size: 22px; font-weight: 600; margin: 0 0 6px; }
.rp-sub { color: #9aa0ac; font-size: 14px; line-height: 1.5; margin: 0 0 22px; }

.rp-form { display: flex; flex-direction: column; gap: 14px; }
.rp-label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #9aa0ac; }
.rp-input {
  background: #1f232b;
  color: #e6e8ec;
  border: 1px solid #2a2e36;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}
.rp-input:focus { outline: none; border-color: #1f6feb; }
.rp-err { color: #f87171; font-size: 13px; }
.rp-btn {
  background: #1f6feb;
  color: white;
  border: 0;
  border-radius: 8px;
  padding: 11px 16px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 4px;
}
.rp-btn:hover:not(:disabled) { background: #2a7cf5; }
.rp-btn:disabled { opacity: .55; cursor: not-allowed; }
.rp-foot { text-align: center; margin-top: 14px; }
.rp-foot a { color: #9aa0ac; text-decoration: none; font-size: 13px; }
.rp-foot a:hover { color: #1f6feb; }

.rp-success { text-align: center; padding: 20px 0; }
.rp-success-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(34, 197, 94, .15); color: #22c55e;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 32px; margin-bottom: 16px;
}
.rp-success h3 { font-size: 20px; margin: 0 0 6px; color: #22c55e; }
.rp-success p { color: #9aa0ac; font-size: 14px; }
</style>
