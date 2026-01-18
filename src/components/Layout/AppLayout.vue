<template>
  <v-app>
    <!-- Боковая панель навигации -->
    <v-navigation-drawer 
      v-model="drawer" 
      :rail="rail && !mobile" 
      :permanent="!mobile" 
      :temporary="mobile"
      class="apple-sidebar app-sidebar"
      :class="{ 'sidebar-rail': rail && !mobile }">
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

      <!-- Футер боковой панели - информация о системе -->
      <template #append>
        <div class="sidebar-footer">
          <!-- Системная информация -->
          <div v-if="!rail" class="system-info-card">
            <div class="system-status">
              <div class="d-flex align-center mb-2">
                <v-icon icon="mdi-circle" size="8" color="success" class="me-2" />
                <span class="status-text">Система работает нормально</span>
              </div>
              
              <div class="system-details">
                <div class="detail-item">
                  <v-icon icon="mdi-update" size="14" class="me-1" />
                  <span>{{ lastRefresh ? formatTimeAgo(lastRefresh) : 'Не обновлялось' }}</span>
                </div>
                
                <div class="detail-item">
                  <v-icon icon="mdi-domain" size="14" class="me-1" />
                  <span>{{ auth.user.value?.accountName || 'Не указана' }}</span>
                </div>
                
                <div class="detail-item">
                  <v-icon icon="mdi-information" size="14" class="me-1" />
                  <span>{{ appVersion }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Компактная версия для свернутого меню -->
          <div v-else class="system-info-rail">
            <v-tooltip location="end" text="Система работает нормально">
              <template #activator="{ props }">
                <div v-bind="props" class="rail-status-indicator">
                  <v-icon icon="mdi-circle" size="12" color="success" />
                </div>
              </template>
            </v-tooltip>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Верхняя панель -->
    <v-app-bar :order="-1" class="app-header" flat border>
      <!-- Кнопка меню для мобильных -->
      <v-app-bar-nav-icon v-if="mobile" @click="drawer = !drawer" />

      <!-- Левая часть: Хлебные крошки и заголовок страницы (для всех страниц) -->
      <v-app-bar-title class="header-title-section">
        <div class="page-navigation-section">
          <!-- Хлебные крошки -->
          <div v-if="breadcrumbs.length > 1 && !mobile" class="header-breadcrumbs">
            <template v-for="(crumb, index) in breadcrumbs" :key="index">
              <router-link
                v-if="!crumb.disabled"
                :to="crumb.to"
                class="breadcrumb-link"
              >
                {{ crumb.title }}
              </router-link>
              <span v-else class="breadcrumb-current">
                {{ crumb.title }}
              </span>
              <v-icon 
                v-if="index < breadcrumbs.length - 1" 
                class="breadcrumb-divider"
                size="16"
              >
                mdi-chevron-right
              </v-icon>
            </template>
          </div>

          <!-- Заголовок текущей страницы -->
          <div class="page-title-header">
            <v-icon 
              v-if="currentPageIcon" 
              :icon="currentPageIcon" 
              class="page-icon"
              size="20"
            />
            <h1 class="page-title-text">
              {{ currentPageTitle }}
            </h1>
          </div>
        </div>
      </v-app-bar-title>

      <v-spacer />

      <!-- Информация о пользователе и времени (справа) -->
      <div v-if="!mobile" class="header-user-info">
        <div class="user-welcome-compact">
          <span class="user-name">{{ auth.user.value?.name || 'Пользователь' }}</span>
        </div>
        <div class="datetime-compact">
          <span class="current-date">{{ formatDateCompact(currentTime) }}</span>
          <span class="current-time">{{ formatTime(currentTime) }}</span>
        </div>
      </div>

      <!-- Справка -->
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" @click="showHelpDialog = true" class="help-btn">
            <v-icon>mdi-help-circle-outline</v-icon>
          </v-btn>
        </template>
        <span>Справка и инструкции</span>
      </v-tooltip>

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
            <UserAvatar 
              :name="auth.user.value?.name" 
              :username="auth.user.value?.username"
              :size="32"
              class="user-avatar"
            />
          </v-btn>
        </template>

        <v-card width="320">
          <v-card-text class="pa-4">
            <!-- Заголовок профиля -->
            <div class="d-flex align-center mb-3">
              <UserAvatar 
                :name="auth.user.value?.name" 
                :username="auth.user.value?.username"
                :size="48"
                large
                class="me-3"
              />
              <div class="flex-grow-1">
                <div class="text-h6 font-weight-medium">
                  {{ auth.user.value?.name || 'Пользователь' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ auth.user.value?.email || 'email@example.com' }}
                </div>
                <div class="d-flex align-center mt-1">
                  <v-chip 
                    v-if="auth.user.value?.accountType"
                    :color="getAccountTypeColor(auth.user.value.accountType)" 
                    size="x-small" 
                    variant="tonal"
                    class="me-2"
                  >
                    {{ getAccountTypeLabel(auth.user.value.accountType) }}
                  </v-chip>
                  <v-chip 
                    v-if="auth.user.value?.isAdmin"
                    color="warning" 
                    size="x-small" 
                    variant="tonal"
                  >
                    Админ
                  </v-chip>
                </div>
              </div>
            </div>

            <!-- Дополнительная информация -->
            <div v-if="auth.user.value" class="user-info-section mb-3">
              <div class="text-caption text-medium-emphasis mb-2">Информация об аккаунте:</div>
              <div class="user-info-grid">
                <!-- Текущее время (для мобильных) -->
                <div v-if="mobile" class="info-item">
                  <v-icon icon="mdi-clock" size="14" class="me-1" />
                  <span class="text-caption">{{ formatDateCompact(currentTime) }} {{ formatTime(currentTime) }}</span>
                </div>
                <div class="info-item">
                  <v-icon icon="mdi-domain" size="14" class="me-1" />
                  <span class="text-caption">{{ auth.user.value.accountName || 'Не указано' }}</span>
                </div>
                <div class="info-item" v-if="auth.user.value.accountId">
                  <v-icon icon="mdi-identifier" size="14" class="me-1" />
                  <span class="text-caption">ID: {{ auth.user.value.accountId }}</span>
                </div>
                <div class="info-item" v-if="auth.user.value.lastLogin">
                  <v-icon icon="mdi-clock-outline" size="14" class="me-1" />
                  <span class="text-caption">{{ formatLastLogin(auth.user.value.lastLogin) }}</span>
                </div>
                <div class="info-item text-error" v-if="auth.user.value.accountBlockingDatetime">
                  <v-icon icon="mdi-alert" size="14" class="me-1" />
                  <span class="text-caption">Блокировка: {{ formatBlockingDate(auth.user.value.accountBlockingDatetime) }}</span>
                </div>
              </div>
            </div>

            <!-- Wialon интеграция (если подключена) -->
            <div v-if="wialonConnections.length > 0" class="wialon-info-section mb-3">
            <!-- Каждое подключение отдельно -->
              <div v-for="conn in wialonConnections" :key="conn.name" class="text-caption text-medium-emphasis mb-1">
                <v-icon :icon="conn.type === 'hosting' ? 'mdi-cloud' : 'mdi-server'" size="14" class="me-1" />
                {{ conn.type === 'hosting' ? 'WH' : 'WL' }}: 
                <strong class="text-success">{{ conn.userName || 'Подключено' }}</strong>
                <span v-if="conn.vehiclesCount > 0" class="text-medium-emphasis">
                  ({{ conn.vehiclesCount }})
                </span>
              </div>
            </div>
            
            <!-- Fallback для старой интеграции -->
            <div v-else-if="wialonIntegration.connected" class="wialon-info-section mb-3">
              <div class="text-caption text-medium-emphasis mb-2">
                <v-icon icon="mdi-satellite-variant" size="14" class="me-1" />
                Wialon Hosting: <strong class="text-success">{{ wialonIntegration.userName || 'Подключено' }}</strong>
              </div>
              <div class="user-info-grid">
                <div class="info-item" v-if="wialonIntegration.vehiclesCount > 0">
                  <v-icon icon="mdi-car" size="14" class="me-1" />
                  <span class="text-caption">{{ wialonIntegration.vehiclesCount }} объектов</span>
                </div>
                <div class="info-item" v-if="wialonIntegration.lastSync">
                  <v-icon icon="mdi-sync" size="14" class="me-1" />
                  <span class="text-caption">{{ formatTimeAgo(new Date(wialonIntegration.lastSync)) }}</span>
                </div>
              </div>
            </div>

            <v-divider class="mb-3" />

            <v-list density="compact" class="pa-0">
              <v-list-item prepend-icon="mdi-account" title="Профиль" @click="goToProfile" class="profile-menu-item" />
              <v-list-item prepend-icon="mdi-cog" title="Настройки" @click="goToSettings" class="profile-menu-item" />
              
              <!-- Условные пункты меню в зависимости от статуса пользователя -->
              <v-divider class="my-2" />
              
              <!-- Пункт "Войти в мониторинг" - отображается для всех пользователей -->
              <v-list-item 
                prepend-icon="mdi-monitor" 
                title="Войти в мониторинг" 
                @click="goToMonitoring" 
                class="profile-menu-item" 
              />
              
              <!-- Пункт "Войти в CMS" - отображается только для партнеров -->
              <v-list-item 
                v-if="isPartner"
                prepend-icon="mdi-cog-outline" 
                title="Войти в CMS" 
                @click="goToCMS" 
                class="profile-menu-item" 
              />
              
              
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

    <!-- Диалог справки -->
    <HelpDialog v-model="showHelpDialog" />
  </v-app>
</template>

<script setup lang="ts">
import { useAuth } from '@/context/auth';
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay, useTheme } from 'vuetify';
import { getVersionString } from '@/utils/buildInfo';
import UserAvatar from '@/components/Common/UserAvatar.vue';
import HelpDialog from '@/components/Common/HelpDialog.vue';
import { useAxentaIntegrationNotifications } from '@/composables/useAxentaIntegrationNotifications';
import { accountsService } from '@/services/accountsService';
import { config } from '@/config/env';
// import { useWebSocket } from '@/services/websocketService'; // Отключаем до исправления auth context

// Composables
const route = useRoute();
const router = useRouter();
const { mobile } = useDisplay();
const theme = useTheme();
const auth = useAuth();
const { checkIntegrationStatus } = useAxentaIntegrationNotifications();
// const { getConnectionState } = useWebSocket(); // Отключаем до исправления auth context

// Интерфейсы
interface Notification {
  id: string | number;
  title: string;
  message: string;
  type: string;
  read: boolean;
}

interface Breadcrumb {
  title: string;
  to: string;
  disabled?: boolean;
}

// Reactive data
const drawer = ref(!mobile.value);
const rail = ref(false);
const isDarkTheme = ref(theme.current.value.dark);
const notifications = ref<Notification[]>([]);
const currentTime = ref(new Date());
const timeInterval = ref<NodeJS.Timeout | null>(null);
const lastRefresh = ref(new Date());
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Wialon интеграция
interface WialonConnectionInfo {
  name: string;
  type: 'hosting' | 'local';
  userName: string;
  vehiclesCount: number;
  lastSync: string | null;
  isActive: boolean;
}

const wialonIntegration = ref({
  connected: false,
  userName: '',
  vehiclesCount: 0,
  lastSync: null as string | null,
});

const wialonConnections = ref<WialonConnectionInfo[]>([]);

// Диалог справки
const showHelpDialog = ref(false);

// Навигационные элементы
const navigationItems = computed(() => [
  {
    path: '/dashboard',
    icon: 'mdi-view-dashboard',
    title: 'Главная',
    subtitle: 'Обзор системы'
  },
  {
    path: '/accounts',
    icon: 'mdi-domain',
    title: 'Учетные записи',
    subtitle: 'Управление компаниями'
  },
  {
    path: '/users',
    icon: 'mdi-account-group',
    title: 'Пользователи',
    subtitle: 'Управление пользователями'
  },
  {
    path: '/objects',
    icon: 'mdi-office-building',
    title: 'Объекты',
    subtitle: 'Управление объектами',
    badge: 0 // Можно добавить счетчик
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

const breadcrumbs = computed((): Breadcrumb[] => {
  const paths = route.path.split('/').filter(Boolean);
  const crumbs: Breadcrumb[] = [{ title: 'Главная', to: '/dashboard' }];

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

// Неиспользуемые переменные удалены (userAvatar, wsStatus) - используется компонент UserAvatar

const appVersion = computed(() => {
  return getVersionString();
});

// Определяем, является ли пользователь партнером
const isPartner = computed(() => {
  const accountType = auth.user.value?.accountType;
  
  // Список типов, которые считаются партнерами
  const partnerTypes = ['partner', 'admin', 'manager'];
  
  // Проверяем, что пользователь является партнером
  const isPartnerUser = partnerTypes.includes(accountType?.toLowerCase() || '');
  
  // Если accountType не определен или пустой, считаем клиентом
  if (!accountType || accountType.trim() === '') {
    return false;
  }
  
  return isPartnerUser;
});

// Methods
const toggleRail = () => {
  rail.value = !rail.value;
  // Сохраняем состояние rail mode в localStorage
  localStorage.setItem('sidebar-rail', rail.value.toString());
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

const goToMonitoring = () => {
  // Переход к системе мониторинга (внешняя ссылка)
  window.open('https://axenta.glonass-saratov.ru', '_blank');
};

const goToCMS = async () => {
  try {
    // Получаем ID текущего пользователя
    const userId = auth.user.value?.id;
    
    if (!userId) {
      showSnackbar('Не удалось определить ID пользователя', 'error');
      return;
    }

    console.log('🔗 Вход в CMS для текущего пользователя:', userId);
    
    // Используем метод loginAs из accountsService
    const result = await accountsService.loginAs(Number(userId), 'cms');
    
    console.log('✅ Получен URL для входа в CMS:', result.redirectUrl);
    
    // Открываем новую вкладку с URL для входа
    window.open(result.redirectUrl, '_blank');
    
  } catch (error: any) {
    console.error('❌ Ошибка входа в CMS:', error);
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Неизвестная ошибка';
    showSnackbar(`Ошибка входа в CMS: ${errorMessage}`, 'error');
  }
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

// formatDate удалена - не используется
const formatDateCompact = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
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

const formatTimeAgo = (date: Date) => {
  const now = currentTime.value;
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} сек. назад`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} мин. назад`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ч. назад`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} дн. назад`;
  }
};

// getUserInitials функция удалена - теперь используется компонент UserAvatar

const getAccountTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    partner: 'deep-purple',
    client: 'blue-grey',
    premium: 'amber',
    basic: 'blue',
    trial: 'orange',
    demo: 'purple',
    free: 'grey'
  };
  return colors[type] || 'primary';
};

const getAccountTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    partner: 'Партнерский',
    client: 'Клиентский',
    premium: 'Премиум',
    basic: 'Базовый',
    trial: 'Пробный',
    demo: 'Демо',
    free: 'Бесплатный'
  };
  return labels[type] || type;
};

const formatLastLogin = (dateString: string) => {
  if (!dateString) return 'Не указано';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Только что';
    } else if (diffInHours < 24) {
      return `${diffInHours} ч. назад`;
    } else if (diffInHours < 48) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      });
    }
  } catch (error) {
    return 'Неизвестно';
  }
};

const formatBlockingDate = (dateString: string) => {
  if (!dateString) return 'Не указано';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

const updateLastRefresh = () => {
  lastRefresh.value = new Date();
  console.log('🔄 System data refreshed at:', lastRefresh.value.toLocaleTimeString());
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

// Provide функцию обновления для использования в дочерних компонентах
provide('updateLastRefresh', updateLastRefresh);

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

  // Восстанавливаем состояние rail mode из localStorage
  const savedRailState = localStorage.getItem('sidebar-rail');
  if (savedRailState !== null) {
    rail.value = savedRailState === 'true';
  }

  // Запускаем автообновление времени каждую секунду
  timeInterval.value = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);

  // Проверяем статус Axenta интеграции
  checkIntegrationStatus();

  // Загружаем статус Wialon интеграции
  loadWialonIntegration();

  // Отключаем автоматическое переключение системной темы
  // Теперь тема управляется только вручную через кнопку переключения
});

// Функция загрузки Wialon интеграции
const loadWialonIntegration = async () => {
  try {
    const API_BASE_URL = config.backendUrl;
    
    // Загружаем все подключения из новой таблицы wialon_connections
    console.log('🔄 Загрузка Wialon подключений...');
    const connectionsResponse = await fetch(`${API_BASE_URL}/api/wialon/connections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('axenta_token') || ''}`,
      },
    });
    
    console.log('📡 Wialon connections response status:', connectionsResponse.status);
    
    if (connectionsResponse.ok) {
      const response = await connectionsResponse.json();
      console.log('📦 Wialon connections data:', response);
      
      // API возвращает {data: {connections: [...], total: 2}, success: true}
      const connectionsData = response.data?.connections || response.data || response;
      const connections = Array.isArray(connectionsData) ? connectionsData : [];
      console.log('📦 Wialon connections array:', connections);
      
      if (Array.isArray(connections) && connections.length > 0) {
        // Преобразуем подключения в формат для отображения
        wialonConnections.value = connections
          .filter((c: any) => c.is_active)
          .map((c: any) => ({
            name: c.name,
            type: c.connection_type as 'hosting' | 'local',
            userName: c.user_name || '',
            vehiclesCount: c.units_count || 0,
            lastSync: c.last_sync_at || null,
            isActive: c.is_active,
          }));
        
        console.log('✅ Wialon connections loaded:', wialonConnections.value);
        
        // Устанавливаем флаг connected если есть хотя бы одно активное подключение
        if (wialonConnections.value.length > 0) {
          wialonIntegration.value.connected = true;
          // Суммируем количество объектов со всех подключений
          wialonIntegration.value.vehiclesCount = wialonConnections.value.reduce(
            (sum, c) => sum + c.vehiclesCount, 0
          );
        }
        return;
      }
    }
    
    // Если нет подключений в новой таблице, пробуем старый API
    const response = await fetch(`${API_BASE_URL}/api/wialon/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('axenta_token') || ''}`,
      },
    });
    
    if (response.ok) {
      const config = await response.json();
      if (config && config.enabled && config.token) {
        wialonIntegration.value = {
          connected: true,
          userName: config.user_name || 'Подключено',
          vehiclesCount: config.vehicles_count || 0,
          lastSync: config.last_sync_at || null,
        };
      }
    }
  } catch (error) {
    // Если интеграция не найдена - игнорируем
    console.debug('Wialon integration not configured');
  }
};

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

/* Системная информация в боковом меню */
.system-info-card {
  background: rgba(0, 122, 255, 0.05);
  border: 1px solid rgba(0, 122, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
}

.system-status {
  font-size: 0.75rem;
  line-height: 1.4;
}

.status-text {
  font-weight: 500;
  color: var(--apple-text-primary);
  font-size: 0.75rem;
}

.system-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  color: var(--apple-text-secondary);
  font-size: 0.7rem;
  font-weight: 400;
}

.detail-item span {
  font-size: 0.7rem;
  line-height: 1.2;
  word-break: break-word;
}

/* Компактная версия для rail режима */
.system-info-rail {
  display: flex;
  justify-content: center;
  padding: 8px;
}

.rail-status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 122, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.rail-status-indicator:hover {
  background: rgba(0, 122, 255, 0.2);
  transform: scale(1.1);
}

/* Темная тема для системной информации */
[data-theme="dark"] .system-info-card {
  background: rgba(77, 166, 255, 0.08);
  border-color: rgba(77, 166, 255, 0.15);
}

[data-theme="dark"] .status-text {
  color: var(--apple-text-primary-dark);
}

[data-theme="dark"] .detail-item {
  color: var(--apple-text-secondary-dark);
}

[data-theme="dark"] .rail-status-indicator {
  background: rgba(77, 166, 255, 0.15);
}

[data-theme="dark"] .rail-status-indicator:hover {
  background: rgba(77, 166, 255, 0.25);
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

/* Секция заголовка в header */
.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0; /* Позволяет сжиматься */
  flex: 1;
}

/* Секция приветствия в header */
.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Секция навигации страницы */
.page-navigation-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

/* Хлебные крошки в header */
.header-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.breadcrumb-link {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--apple-text-secondary);
  text-decoration: none;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.breadcrumb-link:hover {
  color: var(--apple-blue);
  background-color: rgba(0, 122, 255, 0.08);
  transform: scale(1.02);
}

.breadcrumb-current {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--apple-blue);
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(0, 122, 255, 0.1);
  white-space: nowrap;
}

.breadcrumb-divider {
  color: var(--apple-text-tertiary);
  opacity: 0.6;
  margin: 0 2px;
}

/* Заголовок страницы в header */
.page-title-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.page-icon {
  color: var(--apple-blue);
  flex-shrink: 0;
}

.page-title-text {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  line-height: 1.2;
  color: var(--apple-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* Темная тема для навигации */
[data-theme="dark"] .breadcrumb-link {
  color: var(--apple-text-secondary-dark);
}

[data-theme="dark"] .breadcrumb-link:hover {
  color: var(--apple-blue-light);
  background-color: rgba(77, 166, 255, 0.12);
}

[data-theme="dark"] .breadcrumb-current {
  color: var(--apple-blue-light);
  background-color: rgba(77, 166, 255, 0.15);
}

[data-theme="dark"] .breadcrumb-divider {
  color: var(--apple-text-tertiary-dark);
}

[data-theme="dark"] .page-icon {
  color: var(--apple-blue-light);
}

[data-theme="dark"] .page-title-text {
  color: var(--apple-text-primary-dark);
}

/* Компактная информация о пользователе в header */
.header-user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-right: 16px;
  min-width: 0;
}

.user-welcome-compact {
  display: flex;
  align-items: center;
}

.user-name {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--apple-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.datetime-compact {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-date {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--apple-text-secondary);
  white-space: nowrap;
}

.current-time {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--apple-blue);
  background-color: rgba(0, 122, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

/* Темная тема для компактной информации */
[data-theme="dark"] .user-name {
  color: var(--apple-text-primary-dark);
}

[data-theme="dark"] .current-date {
  color: var(--apple-text-secondary-dark);
}

[data-theme="dark"] .current-time {
  color: var(--apple-blue-light);
  background-color: rgba(77, 166, 255, 0.12);
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
  font-weight: 700;
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

/* Стили для информации о пользователе в меню */
.user-info-section {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
  padding: 12px;
}

.user-info-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.8;
  transition: opacity 0.15s ease;
}

.info-item:hover {
  opacity: 1;
}

.info-item .v-icon {
  opacity: 0.7;
}

/* Темная тема для информации о пользователе */
[data-theme="dark"] .user-info-section {
  background: rgba(255, 255, 255, 0.05);
}

/* Mobile адаптация для приветствия */
.mobile-welcome {
  text-align: left;
}

.mobile-welcome .welcome-title {
  font-size: 1rem !important;
  font-weight: 600 !important;
  margin: 0;
  line-height: 1.2;
}

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

  /* Адаптивные стили для навигации в header */
  .page-title-text {
    font-size: 1rem !important;
  }

  .header-breadcrumbs {
    display: none; /* Скрываем хлебные крошки на планшетах */
  }

  .page-navigation-section {
    gap: 2px;
  }

  /* Адаптивные стили для информации о пользователе */
  .header-user-info {
    margin-right: 8px;
  }

  .user-name {
    font-size: 0.8rem;
    max-width: 120px;
  }

  .current-date,
  .current-time {
    font-size: 0.7rem;
  }

  .datetime-compact {
    gap: 6px;
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

  /* Мобильные стили для навигации */
  .page-title-text {
    font-size: 0.9rem !important;
  }

  .page-icon {
    display: none; /* Скрываем иконку на очень маленьких экранах */
  }

  .header-title-section {
    gap: 1px;
  }

  /* Мобильная версия информации о пользователе */
  .header-user-info {
    display: none; /* Скрываем на мобильных, так как есть аватар */
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

/* iPhone 14 Pro Max specific fixes */
@media (max-width: 430px) and (max-height: 932px) {
  .app-header {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
  
  .mobile-welcome .welcome-title {
    font-size: 0.9rem !important;
  }
  
  .theme-toggle-btn,
  .user-avatar-btn {
    width: 36px !important;
    height: 36px !important;
  }
  
  .user-avatar {
    width: 24px !important;
    height: 24px !important;
  }
  
  .main-content {
    padding: 8px !important;
  }
  
  /* Ensure sidebar is properly hidden on mobile */
  .v-navigation-drawer--temporary {
    z-index: 2000 !important;
  }
}

/* Стили для иконки помощи */
.help-btn {
  transition: all 0.2s ease;
}

.help-btn:hover {
  transform: scale(1.1);
}

.help-btn .v-icon {
  color: rgb(var(--v-theme-primary));
}
</style>
