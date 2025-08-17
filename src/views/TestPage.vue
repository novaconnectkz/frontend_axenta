<template>
  <div class="test-page">
    <h1>Тестовая страница</h1>
    <p>Если вы видите это сообщение, фронтенд работает!</p>
    <v-btn color="primary">Тест кнопки Vuetify</v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TestPage',
});
</script>

<style scoped>
.test-page {
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #1976d2;
  margin-bottom: 1rem;
}
</style>
