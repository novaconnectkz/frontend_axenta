<template>
  <div class="apple-fab-container">
    <!-- Оверлей при открытом меню -->
    <Transition name="fab-overlay">
      <div v-if="isOpen" class="fab-overlay" @click="closeMenu" />
    </Transition>

    <!-- Элементы меню -->
    <Transition name="fab-menu">
      <div v-if="isOpen" class="fab-menu">
        <div v-for="(item, index) in items" :key="item.id || index" class="fab-menu-item"
          :style="{ '--delay': `${index * 50}ms` }" @click="handleItemClick(item)">
          <span class="fab-menu-label">{{ item.label }}</span>
          <div class="fab-menu-button" :class="[item.color ? `fab-color-${item.color}` : '']">
            <v-icon :icon="item.icon" size="20" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Основная кнопка FAB -->
    <button class="apple-fab-button" :class="{ 'fab-open': isOpen }" @click="toggleMenu">
      <v-icon :icon="isOpen ? 'mdi-close' : icon" :size="24" class="fab-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Интерфейс для элементов меню
interface FABMenuItem {
  id?: string
  label: string
  icon: string
  color?: 'primary' | 'success' | 'warning' | 'error'
  action?: () => void
}

interface Props {
  icon?: string
  items?: FABMenuItem[]
  position?: 'bottom-right' | 'bottom-left'
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'mdi-plus',
  items: () => [],
  position: 'bottom-right'
})

const emit = defineEmits<{
  itemClick: [item: FABMenuItem]
}>()

// Состояние открытия меню
const isOpen = ref(false)

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const handleItemClick = (item: FABMenuItem) => {
  if (item.action) {
    item.action()
  }
  emit('itemClick', item)
  closeMenu()
}
</script>

<style scoped>
.apple-fab-container {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* Основная кнопка FAB */
.apple-fab-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(0, 122, 255, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 10;
}

.apple-fab-button:hover {
  transform: scale(1.05);
  box-shadow:
    0 8px 24px rgba(0, 122, 255, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.2);
}

.apple-fab-button:active {
  transform: scale(0.95);
}

.apple-fab-button.fab-open {
  background: linear-gradient(135deg, #3C3C3E 0%, #2C2C2E 100%);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.2);
}

.fab-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-open .fab-icon {
  transform: rotate(180deg);
}

/* Меню FAB */
.fab-menu {
  position: absolute;
  bottom: 72px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 8px;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fab-item-appear 0.3s ease forwards;
  animation-delay: var(--delay);
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

@keyframes fab-item-appear {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fab-menu-label {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  color: #1C1C1E;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fab-menu-item:hover .fab-menu-label {
  background: #fff;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateX(-4px);
}

.fab-menu-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 3px 8px rgba(0, 122, 255, 0.35),
    0 1px 3px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.fab-menu-item:hover .fab-menu-button {
  transform: scale(1.1);
  box-shadow:
    0 6px 16px rgba(0, 122, 255, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.2);
}

/* Цветовые варианты кнопок меню */
.fab-color-success {
  background: linear-gradient(135deg, #34C759 0%, #248A3D 100%);
  box-shadow:
    0 3px 8px rgba(52, 199, 89, 0.35),
    0 1px 3px rgba(0, 0, 0, 0.15);
}

.fab-menu-item:hover .fab-color-success {
  box-shadow:
    0 6px 16px rgba(52, 199, 89, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.2);
}

.fab-color-warning {
  background: linear-gradient(135deg, #FF9500 0%, #CC7700 100%);
  box-shadow:
    0 3px 8px rgba(255, 149, 0, 0.35),
    0 1px 3px rgba(0, 0, 0, 0.15);
}

.fab-menu-item:hover .fab-color-warning {
  box-shadow:
    0 6px 16px rgba(255, 149, 0, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.2);
}

.fab-color-error {
  background: linear-gradient(135deg, #FF3B30 0%, #D70015 100%);
  box-shadow:
    0 3px 8px rgba(255, 59, 48, 0.35),
    0 1px 3px rgba(0, 0, 0, 0.15);
}

.fab-menu-item:hover .fab-color-error {
  box-shadow:
    0 6px 16px rgba(255, 59, 48, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.2);
}

/* Оверлей */
.fab-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: -1;
}

/* Анимации перехода */
.fab-overlay-enter-active,
.fab-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.fab-overlay-enter-from,
.fab-overlay-leave-to {
  opacity: 0;
}

.fab-menu-enter-active,
.fab-menu-leave-active {
  transition: all 0.3s ease;
}

.fab-menu-enter-from,
.fab-menu-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

/* Темная тема */
[data-theme="dark"] .fab-menu-label {
  background: rgba(44, 44, 46, 0.95);
  color: #FFFFFF;
}

[data-theme="dark"] .fab-menu-item:hover .fab-menu-label {
  background: rgba(58, 58, 60, 0.98);
}

[data-theme="dark"] .fab-overlay {
  background: rgba(0, 0, 0, 0.4);
}

/* Адаптивность */
@media (max-width: 600px) {
  .apple-fab-container {
    bottom: 24px;
    right: 24px;
  }

  .apple-fab-button {
    width: 52px;
    height: 52px;
  }

  .fab-menu-button {
    width: 40px;
    height: 40px;
  }

  .fab-menu-label {
    padding: 6px 12px;
    font-size: 13px;
  }
}

/* Мобильные устройства с touch */
@media (hover: none) and (pointer: coarse) {
  .apple-fab-button:hover {
    transform: none;
  }

  .apple-fab-button:active {
    transform: scale(0.95);
  }
}
</style>
