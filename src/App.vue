<script setup lang="ts">
import { useAuthProvider, provideAuth } from "@/context/auth";
import { onMounted, provide } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// Инициализируем auth provider и предоставляем его глобально
const auth = useAuthProvider();
provideAuth(auth);

// Простая отладочная информация
onMounted(() => {
  console.log('App mounted, current path:', route.path);
  console.log('Auth initialized:', !!auth);
  console.log('Is authenticated:', auth.isAuthenticated.value);
});
</script>

<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
