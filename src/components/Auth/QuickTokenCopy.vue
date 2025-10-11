<template>
  <div class="quick-token-copy">
    <v-tooltip location="top">
      <template #activator="{ props: tooltipProps }">
        <v-btn
          v-bind="tooltipProps"
          :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
          :color="copied ? 'success' : 'primary'"
          :loading="copying"
          variant="tonal"
          size="small"
          @click="copyToken"
          :disabled="!token"
        />
      </template>
      <span>{{ copied ? 'Токен скопирован!' : 'Копировать токен' }}</span>
    </v-tooltip>

    <!-- Снэкбар для уведомлений -->
    <v-snackbar
      v-model="showSuccess"
      color="success"
      timeout="2000"
      location="bottom right"
    >
      <v-icon left>mdi-check</v-icon>
      Токен скопирован в буфер обмена!
    </v-snackbar>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'QuickTokenCopy',
  props: {
    token: {
      type: String,
      required: true
    }
  },
  emits: ['copied'],
  setup(props, { emit }) {
    const copying = ref(false)
    const copied = ref(false)
    const showSuccess = ref(false)

    const copyToken = async () => {
      if (!props.token || copying.value) return
      
      copying.value = true
      try {
        await navigator.clipboard.writeText(props.token)
        copied.value = true
        showSuccess.value = true
        emit('copied', props.token)
        
        // Сбрасываем состояние "скопировано" через 2 секунды
        setTimeout(() => {
          copied.value = false
        }, 2000)
        
      } catch (error) {
        console.error('Failed to copy token:', error)
        
        // Fallback для старых браузеров
        try {
          const textArea = document.createElement('textarea')
          textArea.value = props.token
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          
          copied.value = true
          showSuccess.value = true
          emit('copied', props.token)
          
          setTimeout(() => {
            copied.value = false
          }, 2000)
          
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError)
        }
      } finally {
        copying.value = false
      }
    }

    return {
      copying,
      copied,
      showSuccess,
      copyToken,
    }
  },
})
</script>

<style scoped>
.quick-token-copy {
  display: inline-block;
}
</style>
