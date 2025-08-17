<template>
  <div class="not-found">
    <v-container class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-card class="pa-8 text-center" elevation="8">
            <v-icon
              size="120"
              color="warning"
              class="mb-6"
            >
              mdi-file-question-outline
            </v-icon>
            
            <h1 class="text-h2 mb-2 text-warning">
              404
            </h1>
            
            <h2 class="text-h4 mb-4">
              Страница не найдена
            </h2>
            
            <p class="text-h6 mb-6 text-medium-emphasis">
              Запрашиваемая страница не существует или была перемещена
            </p>

            <v-divider class="mb-6" />

            <div class="mb-6">
              <p class="text-body-1 mb-2">
                <strong>Что можно сделать:</strong>
              </p>
              <ul class="text-left text-body-2 text-medium-emphasis">
                <li>Проверьте правильность введенного URL</li>
                <li>Вернитесь на главную страницу</li>
                <li>Воспользуйтесь навигационным меню</li>
                <li>Обратитесь к администратору, если проблема повторяется</li>
              </ul>
            </div>

            <div class="d-flex flex-column flex-sm-row gap-4 justify-center">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-home"
                @click="goHome"
              >
                На главную
              </v-btn>
              
              <v-btn
                variant="outlined"
                size="large"
                prepend-icon="mdi-arrow-left"
                @click="goBack"
              >
                Назад
              </v-btn>
            </div>

            <v-divider class="my-6" />

            <div class="text-caption text-medium-emphasis">
              <p>
                Если вы перешли по ссылке с другого сайта, сообщите об этой ошибке
              </p>
              <p v-if="requestedPath" class="mt-2">
                Запрошенный путь: <code>{{ requestedPath }}</code>
              </p>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  name: 'NotFound',
  setup() {
    const router = useRouter();
    const route = useRoute();

    const requestedPath = computed(() => route.fullPath);

    const goHome = () => {
      router.push('/dashboard');
    };

    const goBack = () => {
      // Если есть история, идем назад
      if (window.history.length > 1) {
        router.go(-1);
      } else {
        // Иначе на главную
        goHome();
      }
    };

    return {
      requestedPath,
      goHome,
      goBack,
    };
  },
});
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.fill-height {
  height: 100vh;
}

.gap-4 {
  gap: 1rem;
}

ul {
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.25rem;
}

code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
}
</style>
