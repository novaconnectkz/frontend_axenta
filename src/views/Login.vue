<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="text-center">Вход в Axenta Cloud</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="form.username"
                label="Логин"
                :rules="usernameRules"
                required
              ></v-text-field>
              <v-text-field
                v-model="form.password"
                label="Пароль"
                type="password"
                :rules="passwordRules"
                required
              ></v-text-field>
              <v-btn type="submit" color="primary" block :disabled="!isValid">Войти</v-btn>
            </v-form>
            <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { AuthKey } from '@/context/auth';
import { computed, defineComponent, inject, ref } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'Login',
  setup() {
    const form = ref({ username: '', password: '' });
    const error = ref('');
    const auth = inject(AuthKey);
    const router = useRouter();
    
    // Fallback if auth is not available
    if (!auth) {
      console.error('Auth context not found');
      return {
        form,
        error: ref('Ошибка инициализации'),
        usernameRules: [],
        passwordRules: [],
        isValid: ref(false),
        login: () => {}
      };
    }

    const usernameRules = [
      (v: string) => !!v || 'Логин обязателен',
      (v: string) => v.length >= 3 || 'Минимум 3 символа',
      (v: string) => v.length <= 64 || 'Максимум 64 символа',
    ];

    const passwordRules = [
      (v: string) => !!v || 'Пароль обязателен',
      (v: string) => v.length >= 3 || 'Минимум 3 символа',
      (v: string) => v.length <= 64 || 'Максимум 64 символа',
    ];

    const isValid = computed(() => {
      return (
        form.value.username.length >= 3 &&
        form.value.username.length <= 64 &&
        form.value.password.length >= 3 &&
        form.value.password.length <= 64
      );
    });

    const login = async () => {
      try {
        await auth.login(form.value);
        router.push('/');
      } catch (err) {
        error.value = 'Неверный логин или пароль';
      }
    };

    return { form, error, usernameRules, passwordRules, isValid, login };
  },
});
</script>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>
