<template>
  <div 
    class="user-avatar" 
    :class="{ 'user-avatar--large': large, 'user-avatar--small': small }"
    :style="avatarStyle"
  >
    <span class="user-avatar__initials">{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name?: string
  username?: string
  size?: number
  large?: boolean
  small?: boolean
  backgroundColor?: string
  textColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  username: '',
  size: 40,
  large: false,
  small: false,
  backgroundColor: '#667eea',
  textColor: '#ffffff'
})

// Генерируем инициалы из имени или username
const initials = computed(() => {
  if (props.name) {
    const nameParts = props.name.trim().split(' ')
    if (nameParts.length >= 2) {
      // Берем первую букву фамилии (первое слово) и первую букву имени (второе слово)
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
    }
    return nameParts[0][0].toUpperCase()
  }
  
  if (props.username) {
    return props.username.slice(0, 2).toUpperCase()
  }
  
  return 'U'
})

// Определяем размер аватара
const avatarSize = computed(() => {
  if (props.large) return 64
  if (props.small) return 24
  return props.size
})

// Стили для аватара
const avatarStyle = computed(() => {
  const size = avatarSize.value
  return {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: props.backgroundColor,
    color: props.textColor,
    fontSize: `${size * 0.4}px`,
    lineHeight: `${size}px`
  }
})
</script>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 600;
  text-align: center;
  overflow: hidden;
  flex-shrink: 0;
  user-select: none;
}

.user-avatar__initials {
  display: block;
  width: 100%;
  height: 100%;
  line-height: inherit;
  font-size: inherit;
}

.user-avatar--large {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.user-avatar--small {
  font-weight: 500;
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .user-avatar {
    box-shadow: 0 1px 3px rgba(255, 255, 255, 0.1);
  }
}
</style>
