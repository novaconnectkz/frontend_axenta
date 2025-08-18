<template>
  <v-app>
    <!-- Боковая панель навигации -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      class="apple-sidebar app-sidebar"
      :class="{ 'sidebar-rail': rail }"
    >
      <!-- Заголовок боковой панели -->
      <div class="sidebar-header">
        <div class="logo" @click="toggleRail">
          <div class="logo-icon">
            <v-icon size="30" color="white">mdi-hexagon-multiple</v-icon>
          </div>
          <transition name="fade">
            <div v-show="!rail" class="logo-text">
              {{ config.appName }}
            </div>
          </transition>
        </div>
        
        <v-btn
          v-show="!rail"
          icon="mdi-menu"
          variant="text"
          size="small"
          @click="toggleRail"
        />
      </div>

      <!-- Навигационное меню -->
      <v-list class="sidebar-nav" nav>
        <v-list-item
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          :subtitle="rail ? undefined : item.subtitle"
          class="apple-nav-item nav-item"
          :class="{ 'active': $route.path === item.path }"
          exact
        >
          <template v-if="item.badge" #append>
            <v-badge
              :content="item.badge"
              color="error"
              inline
            />
          </template>
        </v-list-item>
      </v-list>

      <!-- Футер боковой панели -->
      <template #append>
        <div class="sidebar-footer">
          <!-- Информация о пользователе -->
          <v-menu location="top">
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-avatar="userAvatar"
                :title="rail ? undefined : auth.user.value?.name"
                :subtitle="rail ? undefined : auth.user.value?.email"
                class="user-info"
              >
                <template #append>
                  <v-icon v-show="!rail">mdi-chevron-up</v-icon>
                </template>
              </v-list-item>
            </template>

            <v-list>
              <v-list-item
                prepend-icon="mdi-account"
                title="Профиль"
                @click="goToProfile"
              />
              <v-list-item
                prepend-icon="mdi-cog"
                title="Настройки"
                @click="goToSettings"
              />
              <v-divider />
              <v-list-item
                prepend-icon="mdi-logout"
                title="Выйти"
                @click="handleLogout"
              />
            </v-list>
          </v-menu>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Верхняя панель -->
    <v-app-bar
      :order="-1"
      class="app-header"
      flat
      border
    >
      <!-- Кнопка меню для мобильных -->
      <v-app-bar-nav-icon
        v-if="mobile"
        @click="drawer = !drawer"
      />

      <!-- Приветствие и дата -->
      <v-app-bar-title>
        <div class="welcome-section">
          <h1 class="welcome-title">
            Добро пожаловать, {{ auth.user.value?.name || 'Пользователь' }}!
          </h1>
          <p class="welcome-date">
            {{ formatDate(new Date()) }}
          </p>
        </div>
      </v-app-bar-title>

      <v-spacer />

      <!-- Иконка настроек -->
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-cog"
            variant="text"
            @click="goToSettings"
            class="settings-btn"
          >
          </v-btn>
        </template>
        <span>Настройки</span>
      </v-tooltip>

      <!-- Переключатель темы -->
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
            @click="toggleTheme"
            class="theme-toggle-btn"
          >
            <v-icon>
              {{ isDarkTheme ? 'mdi-weather-night' : 'mdi-weather-sunny' }}
            </v-icon>
          </v-btn>
        </template>
        <span>{{ isDarkTheme ? 'Переключить на светлую тему' : 'Переключить на темную тему' }}</span>
      </v-tooltip>

      <!-- Уведомления -->
      <v-menu location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
          >
            <v-badge
              v-if="notificationsCount > 0"
              :content="notificationsCount"
              color="error"
            >
              <v-icon>mdi-bell</v-icon>
            </v-badge>
            <v-icon v-else>mdi-bell-outline</v-icon>
          </v-btn>
        </template>

        <v-card width="350">
          <v-card-title>
            Уведомления
            <v-spacer />
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
            />
          </v-card-title>
          <v-card-text>
            <div v-if="notifications.length === 0" class="text-center py-4">
              <v-icon size="48" color="grey">mdi-bell-off</v-icon>
              <p class="text-grey mt-2">Нет новых уведомлений</p>
            </div>
            <div v-else>
              <v-list lines="two">
                <v-list-item
                  v-for="notification in notifications.slice(0, 5)"
                  :key="notification.id"
                  :title="notification.title"
                  :subtitle="notification.message"
                >
                  <template #prepend>
                    <v-avatar :color="notification.type">
                      <v-icon :icon="getNotificationIcon(notification.type)" />
                    </v-avatar>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-menu>

      <!-- WebSocket статус -->
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
            :color="wsStatus.color"
          >
            <v-icon>{{ wsStatus.icon }}</v-icon>
          </v-btn>
        </template>
        <span>{{ wsStatus.text }}</span>
      </v-tooltip>
    </v-app-bar>

    <!-- Основной контент -->
    <v-main class="app-main">
      <v-container fluid class="main-content">
        <!-- Breadcrumbs -->
        <v-breadcrumbs
          v-if="breadcrumbs.length > 1"
          :items="breadcrumbs"
          class="px-0 py-2"
        >
          <template #divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>

        <!-- Слот для контента страницы -->
        <router-view v-slot="{ Component, route }">
          <transition
            name="page"
            mode="out-in"
            appear
          >
            <component
              :is="Component"
              :key="route.path"
            />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Snackbar для глобальных уведомлений -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.text }}
      
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay, useTheme } from 'vuetify';
import { useAuth } from '@/context/auth';
import { config } from '@/config/env';
// import { useWebSocket } from '@/services/websocketService'; // Отключаем до исправления auth context

// Composables
const route = useRoute();
const router = useRouter();
const { mobile } = useDisplay();
const theme = useTheme();
const auth = useAuth();
// const { getConnectionState } = useWebSocket(); // Отключаем до исправления auth context

// Reactive data
const drawer = ref(!mobile.value);
const rail = ref(false);
const isDarkTheme = ref(theme.current.value.dark);
const notifications = ref([]);
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Навигационные элементы
const navigationItems = computed(() => [
  {
    path: '/dashboard',
    icon: 'mdi-view-dashboard',
    title: 'Дашборд',
    subtitle: 'Обзор системы'
  },
  {
    path: '/objects',
    icon: 'mdi-office-building',
    title: 'Объекты',
    subtitle: 'Управление объектами',
    badge: 0 // Можно добавить счетчик
  },
  {
    path: '/users',
    icon: 'mdi-account-group',
    title: 'Пользователи',
    subtitle: 'Управление пользователями'
  },
  {
    path: '/installations',
    icon: 'mdi-tools',
    title: 'Монтажи',
    subtitle: 'Планирование монтажей'
  },
  {
    path: '/warehouse',
    icon: 'mdi-warehouse',
    title: 'Склад',
    subtitle: 'Управление оборудованием'
  },
  {
    path: '/billing',
    icon: 'mdi-currency-usd',
    title: 'Биллинг',
    subtitle: 'Финансовый учет'
  },
  {
    path: '/reports',
    icon: 'mdi-chart-line',
    title: 'Отчеты',
    subtitle: 'Аналитика и отчеты'
  },
  {
    path: '/settings',
    icon: 'mdi-cog',
    title: 'Настройки',
    subtitle: 'Конфигурация системы'
  }
]);

// Computed properties
const currentPageTitle = computed(() => {
  const currentItem = navigationItems.value.find(item => item.path === route.path);
  return currentItem?.title || route.meta?.title || 'Axenta CRM';
});

const currentPageIcon = computed(() => {
  const currentItem = navigationItems.value.find(item => item.path === route.path);
  return currentItem?.icon;
});

const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean);
  const crumbs = [{ title: 'Главная', to: '/dashboard' }];
  
  let currentPath = '';
  for (const path of paths) {
    currentPath += `/${path}`;
    const item = navigationItems.value.find(item => item.path === currentPath);
    if (item) {
      crumbs.push({
        title: item.title,
        to: currentPath,
        disabled: currentPath === route.path
      });
    }
  }
  
  return crumbs;
});

const notificationsCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

const userAvatar = computed(() => {
  const user = auth.user.value;
  if (user?.avatar) return user.avatar;
  
  // Генерируем аватар по первым буквам имени
  const name = user?.name || 'U';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff`;
});

const wsStatus = computed(() => {
  // Временно отключаем WebSocket статус до исправления auth context
  return { icon: 'mdi-wifi-off', color: 'grey', text: 'Отключено' };
  
  /* Будет восстановлено после исправления:
  const status = getConnectionState();
  switch (status) {
    case 'connected':
      return { icon: 'mdi-wifi', color: 'success', text: 'Подключено' };
    case 'connecting':
      return { icon: 'mdi-wifi-sync', color: 'warning', text: 'Подключение...' };
    case 'disconnected':
      return { icon: 'mdi-wifi-off', color: 'error', text: 'Отключено' };
    default:
      return { icon: 'mdi-wifi-alert', color: 'grey', text: 'Неизвестно' };
  }
  */
});

// Methods
const toggleRail = () => {
  rail.value = !rail.value;
};

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  const newTheme = isDarkTheme.value ? 'apple-dark' : 'apple-light';
  theme.global.name.value = newTheme;
  localStorage.setItem('theme', newTheme);
  
  // Отмечаем что пользователь вручную переключил тему
  localStorage.setItem('user-theme-preference', 'manual');
  
  // Добавляем data-theme атрибут к body для CSS переменных
  document.body.setAttribute('data-theme', isDarkTheme.value ? 'dark' : 'light');
  
  // Добавляем небольшую вибрацию на мобильных (если поддерживается)
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
};

const goToProfile = () => {
  router.push('/profile');
};

const goToSettings = () => {
  router.push('/settings');
};

const handleLogout = async () => {
  try {
    await auth.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
    showSnackbar('Ошибка при выходе из системы', 'error');
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success': return 'mdi-check-circle';
    case 'error': return 'mdi-alert-circle';
    case 'warning': return 'mdi-alert';
    case 'info': 
    default: return 'mdi-information';
  }
};

const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const formatDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  return date.toLocaleDateString('ru-RU', options);
};

// Watchers
watch(mobile, (newValue) => {
  drawer.value = !newValue;
  rail.value = newValue;
});

// Lifecycle
onMounted(() => {
  // Восстанавливаем тему из localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    theme.global.name.value = savedTheme;
    isDarkTheme.value = savedTheme === 'apple-dark';
    document.body.setAttribute('data-theme', isDarkTheme.value ? 'dark' : 'light');
  } else {
    // Определяем тему по системным настройкам
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkTheme.value = prefersDark;
    const defaultTheme = prefersDark ? 'apple-dark' : 'apple-light';
    theme.global.name.value = defaultTheme;
    localStorage.setItem('theme', defaultTheme);
    document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
  
  // Слушаем изменения системной темы
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    // Только если пользователь не установил тему вручную
    const userTheme = localStorage.getItem('user-theme-preference');
    if (!userTheme) {
      isDarkTheme.value = e.matches;
      const newTheme = e.matches ? 'apple-dark' : 'apple-light';
      theme.global.name.value = newTheme;
      localStorage.setItem('theme', newTheme);
      document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  };
  
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else {
    // Fallback для старых браузеров
    mediaQuery.addListener(handleSystemThemeChange);
  }
});
</script>

<style scoped>
.app-sidebar {
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.02);
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
}

.nav-item {
  margin: 2px 12px;
  border-radius: 12px !important;
  transition: all 0.3s ease;
  color: var(--apple-text-secondary) !important;
}

.nav-item:hover {
  transform: translateX(4px);
  background: rgba(0, 122, 255, 0.1) !important;
  color: var(--apple-blue) !important;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.15), rgba(0, 122, 255, 0.05)) !important;
  color: var(--apple-blue) !important;
  font-weight: 600 !important;
}

/* Улучшенная читаемость текста */
.nav-item .v-list-item-title {
  color: inherit !important;
  font-weight: inherit !important;
}

.nav-item .v-list-item-subtitle {
  color: var(--apple-text-tertiary) !important;
  font-size: 12px !important;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
}

/* Стили для theme-switcher удалены - теперь в header */

.user-info {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.user-info:hover {
  background: rgba(var(--v-theme-primary), 0.1);
}

.app-header {
  backdrop-filter: blur(10px);
  background: rgba(var(--v-theme-surface), 0.9) !important;
}

/* Секция приветствия в header */
.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.welcome-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  line-height: 1.2;
  color: var(--apple-text-primary);
  margin: 0;
}

.welcome-date {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1;
  color: var(--apple-text-tertiary);
  margin: 0;
  text-transform: capitalize;
}

/* Темная тема для приветствия */
[data-theme="dark"] .welcome-title {
  color: var(--apple-text-primary-dark);
}

[data-theme="dark"] .welcome-date {
  color: var(--apple-text-tertiary-dark);
}

/* Кнопка настроек */
.settings-btn {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  margin-right: 8px;
}

.settings-btn:hover {
  background: rgba(0, 122, 255, 0.1) !important;
  color: var(--apple-blue);
  transform: scale(1.05);
}

.theme-toggle-btn {
  margin-right: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
}

.theme-toggle-btn:hover {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  transform: scale(1.1);
}

.theme-toggle-btn:active {
  transform: scale(0.95);
}

.theme-toggle-btn .v-icon {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Анимация смены иконки */
.theme-toggle-btn:hover .v-icon {
  transform: rotate(20deg);
}

/* Apple-style glow эффект */
.theme-toggle-btn {
  position: relative;
  overflow: hidden;
}

.theme-toggle-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(var(--v-theme-primary-rgb), 0.2) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  pointer-events: none;
}

.theme-toggle-btn:hover::before {
  width: 40px;
  height: 40px;
}

.page-title {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.app-main {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-surface), 1) 0%, 
    rgba(var(--v-theme-background), 1) 100%);
}

.main-content {
  max-width: none;
  padding: 20px;
}

.sidebar-rail .logo-text {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Responsive adjustments */
/* Темная тема - улучшенная читаемость */
[data-theme="dark"] .app-sidebar {
  background: rgba(28, 28, 30, 0.8) !important;
  border-right-color: rgba(84, 84, 136, 0.16);
}

[data-theme="dark"] .nav-item {
  color: var(--apple-text-secondary-dark) !important;
}

[data-theme="dark"] .nav-item:hover {
  background: rgba(77, 166, 255, 0.15) !important;
  color: var(--apple-blue-light) !important;
}

[data-theme="dark"] .nav-item.active {
  background: linear-gradient(135deg, rgba(77, 166, 255, 0.2), rgba(77, 166, 255, 0.1)) !important;
  color: var(--apple-blue-light) !important;
}

[data-theme="dark"] .nav-item .v-list-item-subtitle {
  color: var(--apple-text-tertiary-dark) !important;
}

[data-theme="dark"] .logo-text {
  color: var(--apple-text-primary-dark) !important;
}

/* Mobile адаптация для приветствия */
@media (max-width: 960px) {
  .welcome-title {
    font-size: 1.1rem !important;
  }
  
  .welcome-date {
    font-size: 0.75rem;
  }
  
  .settings-btn {
    margin-right: 4px;
  }
  
  .theme-toggle-btn {
    margin-right: 4px;
  }
}

@media (max-width: 600px) {
  .welcome-title {
    font-size: 1rem !important;
  }
  
  .welcome-date {
    display: none; /* Скрываем дату на очень маленьких экранах */
  }
}

@media (max-width: 960px) {
  .sidebar-header {
    padding: 16px;
  }
  
  .main-content {
    padding: 16px;
  }
}
</style>
