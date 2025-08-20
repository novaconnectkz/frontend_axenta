<template>
  <div class="objects-page">
    <h1>Тестовая страница объектов</h1>
    <p>Если вы видите эту страницу, значит роутинг работает!</p>
    <v-btn @click="testClick">Тестовая кнопка</v-btn>
  </div>
</template>

<script setup lang="ts">
const testClick = () => {
  alert('Компонент работает!');
};
</script>

<style scoped>
.objects-page {
  padding: 20px;
}
</style>
