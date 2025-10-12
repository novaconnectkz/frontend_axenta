<template>
  <!-- Snackbar для уведомлений -->
  <v-snackbar
    v-model="notifications.snackbar.show"
    :color="getSnackbarColor(notifications.snackbar.type)"
    :timeout="notifications.snackbar.timeout"
    location="top right"
    class="global-snackbar"
    :class="`snackbar-${notifications.snackbar.type}`"
  >
    <div class="d-flex align-center">
      <v-icon 
        :icon="getSnackbarIcon(notifications.snackbar.type)" 
        class="me-2"
        size="20"
      />
      <div class="flex-grow-1">
        <div class="font-weight-medium">{{ notifications.snackbar.title }}</div>
        <div 
          v-if="notifications.snackbar.message" 
          class="text-caption mt-1 opacity-90"
        >
          {{ notifications.snackbar.message }}
        </div>
      </div>
    </div>

    <template #actions>
      <!-- Кастомные действия -->
      <template v-if="notifications.snackbar.actions && notifications.snackbar.actions.length > 0">
        <v-btn
          v-for="action in notifications.snackbar.actions"
          :key="action.label"
          :color="action.color || 'white'"
          variant="text"
          size="small"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </v-btn>
      </template>
      
      <!-- Кнопка закрытия -->
      <v-btn
        color="white"
        variant="text"
        size="small"
        icon="mdi-close"
        @click="notifications.hideSnackbar()"
      />
    </template>
  </v-snackbar>

  <!-- Список уведомлений (для будущего использования) -->
  <v-menu
    v-if="showNotificationsList && notifications.notifications.length > 0"
    v-model="notificationsMenu"
    :close-on-content-click="false"
    location="bottom end"
    offset="8"
    max-width="400"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        variant="text"
        class="notifications-trigger"
      >
        <v-badge
          :content="notifications.notifications.length"
          :model-value="notifications.notifications.length > 0"
          color="error"
        >
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card max-width="400" class="notifications-list">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Уведомления</span>
        <v-btn
          icon="mdi-close-circle-outline"
          variant="text"
          size="small"
          @click="notifications.clearAllNotifications()"
        />
      </v-card-title>

      <v-divider />

      <v-list class="py-0" max-height="300" style="overflow-y: auto;">
        <v-list-item
          v-for="notification in notifications.notifications"
          :key="notification.id"
          class="notification-item"
          :class="`notification-${notification.type}`"
        >
          <template #prepend>
            <v-icon 
              :icon="getSnackbarIcon(notification.type)"
              :color="getSnackbarColor(notification.type)"
              size="20"
            />
          </template>

          <v-list-item-title class="font-weight-medium">
            {{ notification.title }}
          </v-list-item-title>
          
          <v-list-item-subtitle v-if="notification.message">
            {{ notification.message }}
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              icon="mdi-close"
              variant="text"
              size="x-small"
              @click="notifications.removeNotification(notification.id)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import type { NotificationItem } from '@/composables/useNotifications'
import { ref } from 'vue'

interface Props {
  showNotificationsList?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showNotificationsList: false
})

const notifications = useNotifications()
const notificationsMenu = ref(false)

const getSnackbarColor = (type: NotificationItem['type']) => {
  switch (type) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
    default:
      return 'info'
  }
}

const getSnackbarIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'success':
      return 'mdi-check-circle'
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'info':
    default:
      return 'mdi-information'
  }
}

const handleAction = (action: NonNullable<NotificationItem['actions']>[0]) => {
  action.action()
  notifications.hideSnackbar()
}
</script>

<style scoped>
.global-snackbar {
  z-index: 9999;
}

.snackbar-success {
  --v-theme-surface: rgb(var(--v-theme-success));
}

.snackbar-error {
  --v-theme-surface: rgb(var(--v-theme-error));
}

.snackbar-warning {
  --v-theme-surface: rgb(var(--v-theme-warning));
}

.snackbar-info {
  --v-theme-surface: rgb(var(--v-theme-info));
}

.notifications-list {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.notification-item {
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.notification-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.notification-success {
  border-left-color: rgb(var(--v-theme-success));
}

.notification-error {
  border-left-color: rgb(var(--v-theme-error));
}

.notification-warning {
  border-left-color: rgb(var(--v-theme-warning));
}

.notification-info {
  border-left-color: rgb(var(--v-theme-info));
}

.notifications-trigger {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
}
</style>
