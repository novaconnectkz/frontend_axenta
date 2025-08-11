<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="text-center">Вход в Axenta Cloud</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="username"
                label="Логин"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Пароль"
                type="password"
                required
              ></v-text-field>
              <v-btn type="submit" color="primary" block>Войти</v-btn>
            </v-form>
            <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

const login = async () => {
  error.value = ''
  
  if (!username.value || !password.value) {
    error.value = 'Заполните все поля'
    return
  }
  
  try {
    console.log('Attempting login...')
    const response = await axios.post('http://localhost:8080/api/login', {
      username: username.value,
      password: password.value
    })
    
    console.log('Login response:', response.data)
    
    if (response.data.status === 'success') {
      // Сохраняем токен и пользователя в localStorage
      localStorage.setItem('token', response.data.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
      
      // Переходим на дашборд
      router.push('/')
    } else {
      error.value = response.data.error || 'Ошибка входа'
    }
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.response?.data?.error || 'Ошибка подключения к серверу'
  }
}
</script>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>
