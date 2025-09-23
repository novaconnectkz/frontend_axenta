<template>
  <v-dialog
    v-model="show"
    max-width="400"
    persistent
    :scrim="false"
    transition="dialog-bottom-transition"
    location="center"
  >
    <v-card class="success-notification-card" elevation="8" rounded="xl">
      <v-card-text class="text-center pa-8">
        <!-- Иконка с анимацией -->
        <div class="icon-container mb-4">
          <div class="success-icon-bg">
            <div class="success-icon-check">
              <v-icon icon="mdi-check" size="32" color="white" />
            </div>
          </div>
        </div>
        
        <!-- Заголовок -->
        <h2 class="notification-title mb-3">
          {{ title }}
        </h2>
        
        <!-- Описание -->
        <p class="notification-text mb-4">
          {{ message }}
        </p>
        
        <!-- Детали (если есть) -->
        <div v-if="details" class="notification-details mb-4">
          <v-icon icon="mdi-check-circle" size="16" color="success" class="mr-2" />
          <span class="details-text">{{ details }}</span>
        </div>
        
        <!-- Кнопки -->
        <div class="notification-actions">
          <v-btn
            v-if="showTimer"
            variant="outlined"
            prepend-icon="mdi-timer"
            @click="startTimer"
            class="mr-3"
          >
            Запустить таймер
          </v-btn>
          <v-btn
            variant="text"
            @click="close"
          >
            Закрыть
          </v-btn>
        </div>
        
        <!-- Прогресс бар таймера -->
        <v-progress-linear
          v-if="timerActive"
          :model-value="timerProgress"
          color="success"
          height="4"
          rounded
          class="mt-4"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue: boolean;
  title: string;
  message: string;
  details?: string;
  showTimer?: boolean;
  autoClose?: boolean;
  timeout?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showTimer: false,
  autoClose: true,
  timeout: 5000,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'timer-complete': [];
}>();

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const timerActive = ref(false);
const timerProgress = ref(0);
let timerInterval: NodeJS.Timeout | null = null;

const startTimer = () => {
  timerActive.value = true;
  timerProgress.value = 0;
  
  const duration = props.timeout;
  const step = 100 / (duration / 100);
  
  timerInterval = setInterval(() => {
    timerProgress.value += step;
    
    if (timerProgress.value >= 100) {
      completeTimer();
    }
  }, 100);
};

const completeTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  timerActive.value = false;
  timerProgress.value = 100;
  
  emit('timer-complete');
  
  if (props.autoClose) {
    setTimeout(() => {
      close();
    }, 500);
  }
};

const close = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  timerActive.value = false;
  timerProgress.value = 0;
  show.value = false;
};

// Автозапуск таймера при открытии (если включен)
watch(show, (newValue) => {
  if (newValue && props.autoClose && !props.showTimer) {
    setTimeout(() => {
      startTimer();
    }, 1000);
  }
});
</script>

<style scoped>
.success-notification-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.icon-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.success-icon-bg {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
  animation: iconPulse 2s ease-in-out infinite;
}

.success-icon-check {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: checkBounce 0.6s ease-out;
}

.notification-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  line-height: 1.3;
}

.notification-text {
  font-size: 1rem;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.notification-details {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76, 175, 80, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.details-text {
  font-size: 0.875rem;
  color: #4CAF50;
  font-weight: 500;
}

.notification-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 25px rgba(76, 175, 80, 0.4);
  }
}

@keyframes checkBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Темная тема */
[data-theme="dark"] .success-notification-card {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .notification-title {
  color: #ffffff;
}

[data-theme="dark"] .notification-text {
  color: #cccccc;
}
</style>