<template>
  <teleport to="body">
    <transition name="success-notification" appear>
      <div v-if="show" class="success-notification-overlay">
        <div class="success-notification-card">
          <!-- Анимированная иконка -->
          <div class="success-icon-container">
            <div class="success-icon-background">
              <v-icon :icon="icon" size="48" class="success-icon" />
            </div>
            <div class="success-checkmark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M20 6L9 17L4 12" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                  class="checkmark-path"
                />
              </svg>
            </div>
          </div>

          <!-- Текст сообщения -->
          <div class="success-content">
            <h3 class="success-title">{{ title }}</h3>
            <p class="success-message">{{ message }}</p>
            
            <!-- Детали операции -->
            <div v-if="details" class="success-details">
              <div class="detail-item">
                <v-icon icon="mdi-check-circle" size="16" class="detail-icon" />
                <span>{{ details }}</span>
              </div>
            </div>
          </div>

          <!-- Прогресс-бар автозакрытия -->
          <div class="auto-close-progress">
            <div 
              class="progress-bar" 
              :style="{ animationDuration: `${duration}ms` }"
            ></div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface Props {
  show: boolean
  title: string
  message: string
  details?: string
  icon?: string
  duration?: number
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'mdi-check-circle',
  duration: 3000
})

const emit = defineEmits<Emits>()

let autoCloseTimer: NodeJS.Timeout | null = null

const startAutoClose = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
  }
  
  autoCloseTimer = setTimeout(() => {
    emit('close')
  }, props.duration)
}

const stopAutoClose = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

onMounted(() => {
  if (props.show) {
    startAutoClose()
  }
})

onUnmounted(() => {
  stopAutoClose()
})

// Перезапускаем таймер при изменении show
import { watch } from 'vue'
watch(() => props.show, (newValue) => {
  if (newValue) {
    startAutoClose()
  } else {
    stopAutoClose()
  }
})
</script>

<style scoped>
.success-notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.success-notification-card {
  background: white;
  border-radius: 20px;
  padding: 32px 24px 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 8px 25px rgba(0, 0, 0, 0.08);
  max-width: 400px;
  width: 90vw;
  text-align: center;
  position: relative;
  pointer-events: auto;
  overflow: hidden;
}

/* Анимированная иконка */
.success-icon-container {
  position: relative;
  display: inline-flex;
  margin-bottom: 24px;
}

.success-icon-background {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: iconPulse 0.6s ease-out;
}

.success-icon {
  color: white;
  animation: iconScale 0.4s ease-out 0.2s both;
}

.success-checkmark {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 32px;
  height: 32px;
  background: #2196F3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: checkmarkSlide 0.5s ease-out 0.4s both;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.checkmark-path {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: checkmarkDraw 0.3s ease-out 0.6s both;
}

/* Контент */
.success-content {
  margin-bottom: 20px;
}

.success-title {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 8px 0;
  animation: fadeInUp 0.4s ease-out 0.3s both;
}

.success-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.5;
  animation: fadeInUp 0.4s ease-out 0.4s both;
}

.success-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: fadeInUp 0.4s ease-out 0.5s both;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #4CAF50;
  font-weight: 500;
}

.detail-icon {
  color: #4CAF50;
}

/* Прогресс-бар автозакрытия */
.auto-close-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50 0%, #2196F3 100%);
  transform: translateX(-100%);
  animation: progressSlide linear;
}

/* Анимации */
@keyframes iconPulse {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes iconScale {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes checkmarkSlide {
  0% {
    transform: translate(20px, -20px) scale(0);
    opacity: 0;
  }
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
}

@keyframes checkmarkDraw {
  0% {
    stroke-dashoffset: 20;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes fadeInUp {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes progressSlide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0%);
  }
}

/* Переходы компонента */
.success-notification-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-notification-leave-active {
  transition: all 0.3s ease-in;
}

.success-notification-enter-from {
  transform: scale(0.5) translateY(50px);
  opacity: 0;
}

.success-notification-leave-to {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}

/* Темная тема */
[data-theme="dark"] .success-notification-card {
  background: #2d2d2d;
  color: #fff;
}

[data-theme="dark"] .success-title {
  color: #fff;
}

[data-theme="dark"] .success-message {
  color: #ccc;
}

[data-theme="dark"] .auto-close-progress {
  background: rgba(255, 255, 255, 0.1);
}

/* Мобильная адаптация */
@media (max-width: 600px) {
  .success-notification-card {
    padding: 24px 20px 20px;
    border-radius: 16px;
  }
  
  .success-icon-background {
    width: 64px;
    height: 64px;
  }
  
  .success-icon {
    font-size: 32px;
  }
  
  .success-checkmark {
    width: 24px;
    height: 24px;
    top: -2px;
    right: -2px;
  }
  
  .success-title {
    font-size: 18px;
  }
  
  .success-message {
    font-size: 14px;
  }
}
</style>
