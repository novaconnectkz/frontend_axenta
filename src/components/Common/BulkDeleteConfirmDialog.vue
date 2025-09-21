<template>
  <v-dialog v-model="show" max-width="600" persistent>
    <v-card>
      <v-card-title class="text-h5 text-error">
        <v-icon icon="mdi-alert" class="mr-2" />
        Подтверждение удаления
      </v-card-title>
      
      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          <div class="alert-content">
            <div class="alert-title">Внимание! Это действие необратимо</div>
            <div class="alert-text">
              Вы собираетесь удалить {{ items.length }} {{ itemType }}. 
              Все связанные данные также будут удалены.
            </div>
          </div>
        </v-alert>

        <div class="items-list mb-4">
          <div class="list-title">Будут удалены:</div>
          <div class="items-container">
            <v-chip 
              v-for="item in items.slice(0, 5)" 
              :key="item.id"
              size="small"
              class="ma-1"
              color="error"
              variant="outlined"
            >
              {{ item.name }}
            </v-chip>
            <v-chip 
              v-if="items.length > 5"
              size="small"
              class="ma-1"
              color="error"
              variant="text"
            >
              и еще {{ items.length - 5 }}...
            </v-chip>
          </div>
        </div>

        <div class="confirmation-section">
          <div class="confirmation-text mb-3">
            Для подтверждения введите <strong>{{ confirmationText }}</strong>:
          </div>
          <v-text-field
            v-model="userInput"
            :label="`Введите '${confirmationText}'`"
            variant="outlined"
            density="comfortable"
            :error="hasError"
            :error-messages="errorMessage"
            @input="validateInput"
            @keyup.enter="confirmDelete"
          />
        </div>

        <div class="countdown-section" v-if="countdown > 0">
          <div class="countdown-text">
            Кнопка "Удалить" будет доступна через {{ countdown }} сек.
          </div>
          <v-progress-linear 
            :model-value="(5 - countdown) * 20" 
            color="error"
            height="4"
            class="mt-2"
          />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="cancel" :disabled="loading">
          Отмена
        </v-btn>
        <v-btn 
          color="error" 
          variant="elevated"
          :disabled="!canDelete || loading || countdown > 0"
          :loading="loading"
          @click="confirmDelete"
        >
          <v-icon icon="mdi-delete" class="mr-2" />
          Удалить {{ items.length }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface DeleteItem {
  id: number | string
  name: string
}

interface Props {
  modelValue: boolean
  items: DeleteItem[]
  itemType: string
  confirmationText?: string
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmationText: 'УДАЛИТЬ',
  loading: false
})

const emit = defineEmits<Emits>()

// Reactive data
const userInput = ref('')
const hasError = ref(false)
const errorMessage = ref('')
const countdown = ref(5)
let countdownInterval: NodeJS.Timeout | null = null

// Computed
const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canDelete = computed(() => {
  return userInput.value.trim() === props.confirmationText && !hasError.value
})

// Methods
const validateInput = () => {
  const input = userInput.value.trim()
  if (input && input !== props.confirmationText) {
    hasError.value = true
    errorMessage.value = `Введите точно "${props.confirmationText}"`
  } else {
    hasError.value = false
    errorMessage.value = ''
  }
}

const startCountdown = () => {
  countdown.value = 5
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownInterval!)
      countdownInterval = null
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  countdown.value = 0
}

const confirmDelete = () => {
  if (canDelete.value && countdown.value === 0) {
    emit('confirm')
  }
}

const cancel = () => {
  stopCountdown()
  emit('cancel')
  resetForm()
}

const resetForm = () => {
  userInput.value = ''
  hasError.value = false
  errorMessage.value = ''
}

// Watchers
watch(show, (newValue) => {
  if (newValue) {
    resetForm()
    startCountdown()
  } else {
    stopCountdown()
    resetForm()
  }
})

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.alert-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-title {
  font-weight: 600;
  font-size: 1rem;
}

.alert-text {
  font-size: 0.875rem;
  line-height: 1.4;
}

.items-list {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 16px;
}

.list-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.items-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.confirmation-section {
  border: 1px solid rgba(var(--v-theme-error), 0.3);
  border-radius: 8px;
  padding: 16px;
  background: rgba(var(--v-theme-error), 0.05);
}

.confirmation-text {
  font-weight: 500;
  color: rgb(var(--v-theme-error));
}

.countdown-section {
  text-align: center;
  padding: 16px;
  background: rgba(var(--v-theme-warning), 0.05);
  border-radius: 8px;
  margin-top: 16px;
}

.countdown-text {
  font-weight: 500;
  color: rgb(var(--v-theme-warning));
}

@media (max-width: 600px) {
  .items-container {
    max-height: 120px;
    overflow-y: auto;
  }
}
</style>
