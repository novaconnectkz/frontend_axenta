<template>
  <v-app>
    <!-- Боковая панель навигации -->
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent class="apple-sidebar app-sidebar"
      :class="{ 'sidebar-rail': rail }">
      <!-- Заголовок боковой панели -->
      <div class="sidebar-header">
        <div class="logo" @click="toggleRail">
          <div class="logo-icon">
            <span class="logo-letter">А</span>
          </div>
          <transition name="fade">
            <div v-show="!rail" class="logo-text">
              CRM
            </div>
          </transition>
        </div>
      </div>

      <!-- Навигационное меню -->
      <v-list class="sidebar-nav" nav>
        <template v-for="item in navigationItems" :key="item.path">
          <v-tooltip v-if="rail" location="end" :text="item.title">
            <template #activator="{ props }">
              <div v-bind="props" class="rail-nav-button" :class="{ 'active': $route.path === item.path }"
                @click="handleRailNavClick(item.path)">
                <v-icon :icon="item.icon" size="22" class="rail-button-icon" />
              </div>
            </template>
          </v-tooltip>

          <v-list-item v-else :to="item.path === '/installations' ? undefined : item.path" :prepend-icon="item.icon"
            :title="item.title" :subtitle="item.subtitle" class="apple-nav-item nav-item"
            :class="{ 'active': $route.path === item.path }" exact @click="handleNavClick(item.path, item.title)">
            <template v-if="item.badge && item.badge > 0" #append>
              <v-badge :content="item.badge" color="error" inline />
            </template>
          </v-list-item>
        </template>
      </v-list>

      <!-- Футер боковой панели - теперь пустой -->
      <template #append>
        <div class="sidebar-footer">
          <!-- Пользователь перенесен в header -->
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Верхняя панель -->
    <v-app-bar :order="-1" class="app-header" flat border>
      <!-- Кнопка меню для мобильных -->
      <v-app-bar-nav-icon v-if="mobile" @click="drawer = !drawer" />

      <!-- Приветствие и дата -->
      <v-app-bar-title>
        <div class="welcome-section">
          <h1 class="welcome-title">
            Добро пожаловать, {{ auth.user.value?.name || 'Пользователь' }}!
          </h1>
          <div class="welcome-datetime">
            <p class="welcome-date">
              {{ formatDate(currentTime) }}
            </p>
            <p class="welcome-time">
              {{ formatTime(currentTime) }}
            </p>
          </div>
        </div>
      </v-app-bar-title>

      <v-spacer />

      <!-- Переключатель темы -->
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" @click="toggleTheme" class="theme-toggle-btn">
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
          <v-btn v-bind="props" icon variant="text">
            <v-badge v-if="notificationsCount > 0" :content="notificationsCount" color="error">
              <v-icon>mdi-bell</v-icon>
            </v-badge>
            <v-icon v-else>mdi-bell-outline</v-icon>
          </v-btn>
        </template>

        <v-card width="350">
          <v-card-title>
            Уведомления
            <v-spacer />
            <v-btn icon="mdi-close" variant="text" size="small" />
          </v-card-title>
          <v-card-text>
            <div v-if="notifications.length === 0" class="text-center py-4">
              <v-icon size="48" color="grey">mdi-bell-off</v-icon>
              <p class="text-grey mt-2">Нет новых уведомлений</p>
            </div>
            <div v-else>
              <v-list lines="two">
                <v-list-item v-for="notification in notifications.slice(0, 5)" :key="notification.id"
                  :title="notification.title" :subtitle="notification.message">
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

      <!-- WebSocket статус - временно скрыт -->
      <!-- 
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" :color="wsStatus.color">
            <v-icon>{{ wsStatus.icon }}</v-icon>
          </v-btn>
        </template>
        <span>{{ wsStatus.text }}</span>
      </v-tooltip>
      -->

      <!-- Аватар пользователя -->
      <v-menu location="bottom">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" class="user-avatar-btn">
            <v-avatar :image="userAvatar" size="32" class="user-avatar">
              <span v-if="!userAvatar" class="user-initials">
                {{ getUserInitials() }}
              </span>
            </v-avatar>
          </v-btn>
        </template>

        <v-card width="280">
          <v-card-text class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-avatar :image="userAvatar" size="48" class="me-3">
                <span v-if="!userAvatar" class="user-initials">
                  {{ getUserInitials() }}
                </span>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-medium">
                  {{ auth.user.value?.name || 'Пользователь' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ auth.user.value?.email || 'email@example.com' }}
                </div>
              </div>
            </div>

            <v-divider class="mb-3" />

            <v-list density="compact" class="pa-0">
              <v-list-item prepend-icon="mdi-account" title="Профиль" @click="goToProfile" class="profile-menu-item" />
              <v-list-item prepend-icon="mdi-cog" title="Настройки" @click="goToSettings" class="profile-menu-item" />
              <v-divider class="my-2" />
              <v-list-item prepend-icon="mdi-logout" title="Выйти" @click="handleLogout"
                class="profile-menu-item logout-item" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Основной контент -->
    <v-main class="app-main">
      <v-container fluid class="main-content">
        <!-- Breadcrumbs -->
        <v-breadcrumbs v-if="breadcrumbs.length > 1" :items="breadcrumbs" class="px-0 py-2">
          <template #divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>

        <!-- Слот для контента страницы -->
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in" appear>
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Snackbar для глобальных уведомлений -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.text }}

      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { useAuth } from '@/context/auth';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay, useTheme } from 'vuetify';
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
const currentTime = ref(new Date());
const timeInterval = ref<NodeJS.Timeout | null>(null);
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
    path: '/accounts',
    icon: 'mdi-domain',
    title: 'Учетные записи',
    subtitle: 'Управление компаниями'
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
    subtitle: 'Договоры и финансы'
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
  return currentItem?.title || route.meta?.title || 'CRM';
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
  theme.change(newTheme);
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

const formatTime = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return date.toLocaleTimeString('ru-RU', options);
};

const getUserInitials = () => {
  const user = auth.user.value;
  if (!user?.name) return 'U';
  const names = user.name.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return names[0][0].toUpperCase();
};

const handleRailNavClick = (path: string) => {
  console.log('🔄 Rail navigation click:', path);
  if (path === '/installations') {
    console.log('🔄 Rail: Clicking on Installations menu item');
  }
  router.push(path).catch(err => {
    console.error('Navigation error:', err);
  });
};

const handleNavClick = (path: string, title: string) => {
  console.log('🔄 Navigation click:', { path, title, currentPath: route.path });

  // Для installations используем принудительную навигацию
  if (path === '/installations') {
    console.log('🔄 Clicking on Installations menu item');
    console.log('🔄 Force navigating to installations...');
    router.push('/installations').catch(err => {
      console.error('🚨 Navigation to installations failed:', err);
    });
    return; // Предотвращаем дальнейшую обработку
  }

  // Для других маршрутов, если нет :to атрибута, используем программную навигацию
  if (!route.path.startsWith(path)) {
    router.push(path).catch(err => {
      console.error('🚨 Navigation failed:', err);
    });
  }
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
    theme.change(savedTheme);
    isDarkTheme.value = savedTheme === 'apple-dark';
    document.body.setAttribute('data-theme', isDarkTheme.value ? 'dark' : 'light');
  } else {
    // По умолчанию используем светлую тему (убираем автоматическое определение системной темы)
    isDarkTheme.value = false;
    const defaultTheme = 'apple-light';
    theme.change(defaultTheme);
    localStorage.setItem('theme', defaultTheme);
    document.body.setAttribute('data-theme', 'light');
  }

  // Запускаем автообновление времени каждую секунду
  timeInterval.value = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);

  // Отключаем автоматическое переключение системной темы
  // Теперь тема управляется только вручную через кнопку переключения
});

onUnmounted(() => {
  // Очищаем интервал при размонтировании компонента
  if (timeInterval.value) {
    clearInterval(timeInterval.value);
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

/* Настройки ширины для свернутого состояния */
.app-sidebar.sidebar-rail {
  width: 72px !important;
}

.app-sidebar.sidebar-rail .v-navigation-drawer__content {
  overflow-x: hidden;
}

.app-sidebar.sidebar-rail .v-list {
  padding: 20px 0 !important;
}

.app-sidebar.sidebar-rail .v-list-item {
  padding: 0 !important;
  margin: 4px 8px !important;
  border-radius: 12px !important;
  min-height: 48px !important;
  width: calc(100% - 16px) !important;
}

.app-sidebar.sidebar-rail .rail-item {
  width: 56px !important;
  height: 48px !important;
  margin: 4px auto !important;
  position: relative !important;
}

/* Индикатор активного состояния в свернутом меню */
.app-sidebar.sidebar-rail .rail-item.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--apple-blue);
  border-radius: 0 2px 2px 0;
  opacity: 1;
}

[data-theme="dark"] .app-sidebar.sidebar-rail .rail-item.active::before {
  background: var(--apple-blue-light);
}

/* Дополнительные улучшения для свернутого меню */
.rail-item {
  position: relative;
  overflow: visible !important;
}

/* Стили для иконок в rail режиме */
.rail-nav-icon {
  color: #6D6D7D !important;
  opacity: 1 !important;
  font-size: 22px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: inline-flex !important;
  visibility: visible !important;
  z-index: 10 !important;
  width: 22px !important;
  height: 22px !important;
  min-width: 22px !important;
  min-height: 22px !important;
  flex-shrink: 0 !important;
  position: relative !important;
}

/* Hover состояние для rail иконок */
.rail-item:hover .rail-nav-icon {
  color: #007AFF !important;
  transform: scale(1.1) !important;
}

/* Активное состояние для rail иконок */
.rail-item.active .rail-nav-icon {
  color: #007AFF !important;
  font-weight: 600 !important;
}

/* Темная тема для rail иконок */
[data-theme="dark"] .rail-nav-icon {
  color: #EBEBF5CC !important;
}

[data-theme="dark"] .rail-item:hover .rail-icon-container {
  background: rgba(77, 166, 255, 0.15) !important;
}

[data-theme="dark"] .rail-item:hover .rail-nav-icon {
  color: #4DA6FF !important;
}

[data-theme="dark"] .rail-item.active .rail-icon-container {
  background: rgba(77, 166, 255, 0.2) !important;
}

[data-theme="dark"] .rail-item.active .rail-nav-icon {
  color: #4DA6FF !important;
}

/* Пульсация для активной иконки */
.rail-item.active .rail-nav-icon,
.rail-nav-button.active .rail-button-icon {
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

/* Улучшенный tooltip */
.v-tooltip .v-overlay__content {
  background: rgba(0, 0, 0, 0.9) !important;
  color: white !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  padding: 6px 10px !important;
  border-radius: 6px !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

[data-theme="dark"] .v-tooltip .v-overlay__content {
  background: rgba(255, 255, 255, 0.9) !important;
  color: black !important;
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

.logo-letter {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
}

/* Настройки навигации для свернутого состояния */
.sidebar-rail .sidebar-nav {
  padding: 20px 0;
}

.sidebar-rail .sidebar-header {
  padding: 20px 12px;
  display: flex;
  justify-content: center;
}

.nav-item {
  margin: 2px 12px;
  border-radius: 12px !important;
  transition: all 0.3s ease;
  color: var(--apple-text-secondary) !important;
}

/* Стили для свернутого состояния */
.rail-item {
  margin: 4px 8px !important;
  min-height: 48px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 12px !important;
  position: relative !important;
}

.rail-item .v-list-item__prepend {
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
}

/* Убеждаемся что все иконки видны в rail режиме */
.app-sidebar.sidebar-rail .v-list-item .v-icon {
  color: #6D6D7D !important;
  font-size: 22px !important;
  opacity: 1 !important;
  display: inline-flex !important;
  visibility: visible !important;
  z-index: 10 !important;
}

.app-sidebar.sidebar-rail .v-list-item__prepend {
  opacity: 1 !important;
  visibility: visible !important;
  display: flex !important;
}

.app-sidebar.sidebar-rail .v-list-item__prepend .v-icon {
  opacity: 1 !important;
  visibility: visible !important;
  display: inline-flex !important;
}

/* Hover состояния для rail режима */
.app-sidebar.sidebar-rail .v-list-item:hover .v-icon {
  color: #007AFF !important;
  transform: scale(1.1) !important;
}

.app-sidebar.sidebar-rail .v-list-item.active .v-icon {
  color: #007AFF !important;
  font-weight: 600 !important;
}

/* Темная тема для rail режима */
[data-theme="dark"] .app-sidebar.sidebar-rail .v-list-item .v-icon {
  color: #EBEBF5CC !important;
}

[data-theme="dark"] .app-sidebar.sidebar-rail .v-list-item:hover .v-icon {
  color: #4DA6FF !important;
}

[data-theme="dark"] .app-sidebar.sidebar-rail .v-list-item.active .v-icon {
  color: #4DA6FF !important;
}

/* Дополнительное принуждение для отображения иконок */
.v-navigation-drawer.sidebar-rail .v-list .v-list-item .v-list-item__prepend .v-icon {
  opacity: 1 !important;
  visibility: visible !important;
  display: inline-flex !important;
  color: #6D6D7D !important;
  font-size: 22px !important;
  width: 22px !important;
  height: 22px !important;
  min-width: 22px !important;
  min-height: 22px !important;
}

/* Принуждение для всех иконок в rail режиме */
.app-sidebar.sidebar-rail .rail-item .v-icon,
.app-sidebar.sidebar-rail .rail-item i {
  opacity: 1 !important;
  visibility: visible !important;
  display: inline-flex !important;
  color: #6D6D7D !important;
  font-size: 22px !important;
}

/* Стили для rail элементов (очищены от debug стилей) */

/* Wrapper для иконок */
.rail-icon-wrapper {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 40px !important;
  height: 40px !important;
  position: relative !important;
}

/* Fallback текст */
.rail-fallback-text {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 22px !important;
  height: 22px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #6D6D7D !important;
  background: rgba(0, 122, 255, 0.1) !important;
  border-radius: 4px !important;
}

/* Новые стили для rail навигационных кнопок */
.rail-nav-button {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 56px !important;
  height: 48px !important;
  margin: 4px auto !important;
  border-radius: 12px !important;
  cursor: pointer !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: transparent !important;
  position: relative !important;
}

.rail-button-icon {
  color: #6D6D7D !important;
  opacity: 1 !important;
  font-size: 22px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: inline-flex !important;
  visibility: visible !important;
}

/* Hover для rail кнопок */
.rail-nav-button:hover {
  background: rgba(0, 122, 255, 0.12) !important;
  transform: scale(1.05) !important;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2) !important;
}

.rail-nav-button:hover .rail-button-icon {
  color: #007AFF !important;
  transform: scale(1.1) !important;
}

/* Активное состояние для rail кнопок */
.rail-nav-button.active {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.18), rgba(0, 122, 255, 0.08)) !important;
  box-shadow: 0 2px 12px rgba(0, 122, 255, 0.25) !important;
}

.rail-nav-button.active .rail-button-icon {
  color: #007AFF !important;
  animation: iconPulse 2s ease-in-out infinite;
}

/* Индикатор активного состояния */
.rail-nav-button.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: #007AFF;
  border-radius: 0 2px 2px 0;
  opacity: 1;
}

/* Темная тема для rail кнопок */
[data-theme="dark"] .rail-button-icon {
  color: #EBEBF5CC !important;
}

[data-theme="dark"] .rail-nav-button:hover {
  background: rgba(77, 166, 255, 0.15) !important;
  box-shadow: 0 2px 8px rgba(77, 166, 255, 0.25) !important;
}

[data-theme="dark"] .rail-nav-button:hover .rail-button-icon {
  color: #4DA6FF !important;
}

[data-theme="dark"] .rail-nav-button.active {
  background: linear-gradient(135deg, rgba(77, 166, 255, 0.22), rgba(77, 166, 255, 0.12)) !important;
  box-shadow: 0 2px 12px rgba(77, 166, 255, 0.3) !important;
}

[data-theme="dark"] .rail-nav-button.active .rail-button-icon {
  color: #4DA6FF !important;
}

[data-theme="dark"] .rail-nav-button.active::before {
  background: #4DA6FF;
}

/* Основные стили для rail элементов */
.rail-item:hover {
  background: rgba(0, 122, 255, 0.08) !important;
  transform: scale(1.02) !important;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15) !important;
}

.rail-item.active {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.12), rgba(0, 122, 255, 0.06)) !important;
  box-shadow: 0 2px 12px rgba(0, 122, 255, 0.2) !important;
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
  gap: 4px;
}

.welcome-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  line-height: 1.2;
  color: var(--apple-text-primary);
  margin: 0;
}

.welcome-datetime {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

.welcome-time {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1;
  color: var(--apple-text-tertiary);
  margin: 0;
}

/* Темная тема для приветствия */
[data-theme="dark"] .welcome-title {
  color: var(--apple-text-primary-dark);
}

[data-theme="dark"] .welcome-date {
  color: var(--apple-text-tertiary-dark);
}

[data-theme="dark"] .welcome-time {
  color: var(--apple-text-tertiary-dark);
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
  background: var(--bg-secondary);
  min-height: 100vh;
  /* ИСПРАВЛЕНО: Обеспечиваем правильную прокрутку */
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  width: 100%;
}

/* Исправляем проблемы с фоном в темной теме */
[data-theme="dark"] .app-main {
  background: var(--apple-bg-secondary-dark);
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

/* Темная тема для свернутого состояния */
[data-theme="dark"] .rail-item:hover {
  background: rgba(77, 166, 255, 0.12) !important;
  box-shadow: 0 2px 8px rgba(77, 166, 255, 0.2) !important;
  transform: scale(1.02) !important;
}

[data-theme="dark"] .rail-item.active {
  background: linear-gradient(135deg, rgba(77, 166, 255, 0.18), rgba(77, 166, 255, 0.08)) !important;
  box-shadow: 0 2px 12px rgba(77, 166, 255, 0.25) !important;
}

/* Аватар пользователя в header */
.user-avatar-btn {
  margin-left: 8px;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
}

.user-avatar-btn:hover {
  background: rgba(0, 122, 255, 0.1) !important;
  transform: scale(1.05);
}

.user-avatar {
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
  transition: all 0.15s ease;
}

.user-avatar-btn:hover .user-avatar {
  border-color: var(--apple-blue);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.user-initials {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
}

/* Выпадающее меню профиля */
.profile-menu-item {
  border-radius: 8px;
  margin: 2px 0;
  transition: all 0.15s ease;
}

.profile-menu-item:hover {
  background: rgba(0, 122, 255, 0.1) !important;
  color: var(--apple-blue);
}

.logout-item:hover {
  background: rgba(255, 59, 48, 0.1) !important;
  color: var(--apple-red);
}

/* Темная тема для аватара */
[data-theme="dark"] .user-avatar-btn:hover {
  background: rgba(77, 166, 255, 0.15) !important;
}

[data-theme="dark"] .user-avatar-btn:hover .user-avatar {
  border-color: var(--apple-blue-light);
  box-shadow: 0 2px 8px rgba(77, 166, 255, 0.4);
}

[data-theme="dark"] .profile-menu-item:hover {
  background: rgba(77, 166, 255, 0.15) !important;
  color: var(--apple-blue-light);
}

[data-theme="dark"] .logout-item:hover {
  background: rgba(255, 105, 97, 0.15) !important;
  color: var(--apple-red-light);
}

/* Mobile адаптация для приветствия */
@media (max-width: 960px) {
  .welcome-title {
    font-size: 1.1rem !important;
  }

  .welcome-datetime {
    gap: 8px;
  }

  .welcome-date {
    font-size: 0.75rem;
  }

  .welcome-time {
    font-size: 0.75rem;
    padding: 3px 6px;
  }

  .theme-toggle-btn {
    margin-right: 4px;
  }

  .user-avatar-btn {
    margin-left: 4px;
  }

  .user-avatar {
    width: 28px !important;
    height: 28px !important;
  }
}

@media (max-width: 600px) {
  .welcome-title {
    font-size: 1rem !important;
  }

  .welcome-datetime {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .welcome-date {
    font-size: 0.7rem;
  }

  .welcome-time {
    font-size: 0.7rem;
    padding: 2px 5px;
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
