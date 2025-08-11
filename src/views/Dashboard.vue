<template>
  <v-container>
    <v-card>
      <v-card-title>Дашборд {{ auth.user.value?.name || 'Гость' }}</v-card-title>
      <v-card-text>
        <p>Имя аккаунта: {{ auth.user.value?.accountName }}</p>
        <p>Тип аккаунта: {{ auth.user.value?.accountType }}</p>
        <p>Создатель: {{ auth.user.value?.creatorName }}</p>
        <p>ID: {{ auth.user.value?.id }}</p>
        <p>Последний вход: {{ auth.user.value?.lastLogin }}</p>
        <p>Логин: {{ auth.user.value?.username }}</p>
        <v-btn color="primary" @click="handleLogout">Выйти</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { type AuthContext, AuthKey } from '@/context/auth';
import { defineComponent, inject } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'Dashboard',
  setup() {
    const auth = inject<AuthContext>(AuthKey)!;
    const router = useRouter();

    const handleLogout = () => {
      auth.logout();
      router.push('/login');
    };

    return { auth, handleLogout };
  },
});
</script>

<style scoped>
/* Стили */
</style>