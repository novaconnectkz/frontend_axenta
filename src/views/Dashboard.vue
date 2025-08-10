<template>
  <v-container>
    <v-card>
      <v-card-title>Дашборд {{ auth.user?.name || 'Гость' }}</v-card-title>
      <v-card-text>
        <v-data-table :items="objects" :headers="headers">
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title>Объекты</v-toolbar-title>
            </v-toolbar>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { AuthContext } from '../../context/auth';
import axios from 'axios';
import { defineComponent, inject, ref } from 'vue';

export default defineComponent({
  name: 'Dashboard',
  setup() {
    const auth = inject<AuthContext>('auth')!;
    const objects = ref([]);
    const headers = [
      { title: 'Название', key: 'name' },
      { title: 'IMEI', key: 'imei' },
      { title: 'Широта', key: 'latitude' },
      { title: 'Долгота', key: 'longitude' },
    ];

    const fetchObjects = async () => {
      const response = await axios.get('http://localhost:8080/api/objects');
      objects.value = response.data.data;
    };

    fetchObjects();
    return { auth, objects, headers };
  },
});
</script>

<style scoped>
/* Стили */
</style>
