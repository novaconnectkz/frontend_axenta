<template>
  <div class="access-denied">
    <v-container class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-card class="pa-8 text-center" elevation="8">
            <v-icon
              size="120"
              color="error"
              class="mb-6"
            >
              mdi-lock-alert
            </v-icon>
            
            <h1 class="text-h3 mb-4 text-error">
              Доступ запрещен
            </h1>
            
            <p class="text-h6 mb-6 text-medium-emphasis">
              У вас недостаточно прав для доступа к этой странице
            </p>

            <v-divider class="mb-6" />

            <div class="mb-6">
              <p class="text-body-1 mb-2">
                <strong>Возможные причины:</strong>
              </p>
              <ul class="text-left text-body-2 text-medium-emphasis">
                <li>У вашей роли нет необходимых прав доступа</li>
                <li>Страница требует административных привилегий</li>
                <li>Ваши права доступа были изменены</li>
                <li>Произошла ошибка в системе авторизации</li>
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
              <p class="mb-2">
                Если вы считаете, что это ошибка, обратитесь к администратору системы
              </p>
              <p v-if="userInfo">
                Пользователь: <strong>{{ userInfo.name || userInfo.username }}</strong> 
                ({{ userInfo.accountType }})
              </p>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { useAuth } from '@/context/auth';
import { computed, defineComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  name: 'AccessDenied',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const auth = useAuth();

    const userInfo = computed(() => auth.user.value);

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
      userInfo,
      goHome,
      goBack,
    };
  },
});
</script>

<style scoped>
.access-denied {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
</style>
