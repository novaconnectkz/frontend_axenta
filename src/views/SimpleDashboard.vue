<template>
  <div class="dashboard-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo-section">
          <div class="logo-icon">
            <span class="logo-letter">А</span>
          </div>
          <h2 v-show="!sidebarCollapsed" class="logo-text">CRM</h2>
        </div>
        <button class="sidebar-toggle" @click="toggleSidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <p v-show="!sidebarCollapsed" class="nav-title">Основное</p>
          <ul class="nav-list">
            <li class="nav-item active">
              <a href="#" class="nav-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span v-show="!sidebarCollapsed">Дашборд</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
                  <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span v-show="!sidebarCollapsed">Устройства</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span v-show="!sidebarCollapsed">Склад</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21L12 19L16 21Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span v-show="!sidebarCollapsed">Заказы</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span v-show="!sidebarCollapsed">Клиенты</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="nav-section">
          <p v-show="!sidebarCollapsed" class="nav-title">Аналитика</p>
          <ul class="nav-list">
            <li class="nav-item">
              <a href="#" class="nav-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span v-show="!sidebarCollapsed">Отчеты</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M9 9L12 6L16 10L20 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span v-show="!sidebarCollapsed">Статистика</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar">
            <span>{{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}</span>
          </div>
          <div v-show="!sidebarCollapsed" class="user-info">
            <p class="user-name">{{ user?.name || 'Пользователь' }}</p>
            <p class="user-role">{{ user?.accountType || 'user' }}</p>
          </div>
        </div>
        <button class="logout-btn" @click="logout" :title="sidebarCollapsed ? 'Выйти' : ''">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
          <span v-show="!sidebarCollapsed">Выйти</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">Дашборд</h1>
            <p class="page-subtitle">Обзор системы управления</p>
          </div>
          <div class="header-right">
            <div class="header-stats">
              <!-- Убираем время из заголовка -->
            </div>
          </div>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="dashboard-content">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon devices">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
                  <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">1,247</h3>
                <p class="stat-description">Активных устройств</p>
                <span class="stat-change positive">+12% за месяц</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon orders">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21L12 19L16 21Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">89</h3>
                <p class="stat-description">Активных заказов</p>
                <span class="stat-change positive">+5% за неделю</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon revenue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <path
                    d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">₽2,847K</h3>
                <p class="stat-description">Доход за месяц</p>
                <span class="stat-change positive">+18% за месяц</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-content">
              <div class="stat-icon clients">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
              <div class="stat-info">
                <h3 class="stat-number">456</h3>
                <p class="stat-description">Активных клиентов</p>
                <span class="stat-change negative">-2% за месяц</span>
              </div>
            </div>
          </div>
        </div>

        <!-- User Information Card -->
        <div class="info-section">
          <div class="info-card user-card">
            <div class="card-header">
              <h2 class="card-title">Информация о пользователе</h2>
              <div class="card-actions">
                <button class="action-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path
                      d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="card-content" v-if="user">
              <div class="user-details">
                <div class="detail-row">
                  <span class="detail-label">Имя пользователя:</span>
                  <span class="detail-value">{{ user.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Логин:</span>
                  <span class="detail-value">{{ user.username }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ID пользователя:</span>
                  <span class="detail-value">{{ user.id }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Аккаунт:</span>
                  <span class="detail-value">{{ user.accountName }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Тип аккаунта:</span>
                  <span class="detail-value account-type">{{ user.accountType }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Создатель:</span>
                  <span class="detail-value">{{ user.creatorName }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Последний вход:</span>
                  <span class="detail-value">{{ formatDate(user.lastLogin) }}</span>
                </div>
              </div>
            </div>
            <div class="card-content" v-else>
              <p class="no-user-message">Данные пользователя недоступны</p>
            </div>
          </div>

          <!-- Recent Activity Card -->
          <div class="info-card activity-card">
            <div class="card-header">
              <h2 class="card-title">Последняя активность</h2>
              <div class="card-actions">
                <button class="action-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polyline points="23,4 23,10 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                    <polyline points="1,20 1,14 7,14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                    <path
                      d="M20.49 9C19.9828 7.56678 19.1209 6.28825 17.9845 5.27455C16.8482 4.26084 15.4745 3.54698 13.9917 3.19479C12.5089 2.8426 10.9652 2.86338 9.49234 3.25542C8.01952 3.64746 6.66843 4.39594 5.55691 5.4364C4.44539 6.47686 3.60523 7.7695 3.10991 9.20033C2.61459 10.6312 2.47368 12.1624 2.69836 13.6544C2.92305 15.1463 3.50678 16.5496 4.39816 17.7537C5.28954 18.9578 6.45982 19.9242 7.81 20.57"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="card-content">
              <div class="activity-list">
                <div class="activity-item">
                  <div class="activity-icon login">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      <polyline points="10,17 15,12 10,7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                      <line x1="21" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div class="activity-details">
                    <p class="activity-text">Успешная авторизация</p>
                    <span class="activity-time">{{ currentTime }}</span>
                  </div>
                </div>
                <div class="activity-item">
                  <div class="activity-icon dashboard">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                      <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                      <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                      <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div class="activity-details">
                    <p class="activity-text">Открыт дашборд</p>
                    <span class="activity-time">{{ currentTime }}</span>
                  </div>
                </div>
                <div class="activity-item">
                  <div class="activity-icon data">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div class="activity-details">
                    <p class="activity-text">Загружены данные пользователя</p>
                    <span class="activity-time">{{ currentTime }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Подвал с временем в стиле Apple -->
    <div class="time-footer">
      <div class="time-container">
        <div class="time-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
            <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
        <div class="time-info">
          <div class="time-value">{{ currentTime }}</div>
          <div class="time-label">Текущее время</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

interface User {
  accountBlockingDatetime: string;
  accountName: string;
  accountType: string;
  creatorName: string;
  id: string;
  lastLogin: string;
  name: string;
  username: string;
}

const user = ref<User | null>(null);
const router = useRouter();
const sidebarCollapsed = ref(false);
const currentTime = ref('');

onMounted(() => {
  // Load user from localStorage
  const userData = localStorage.getItem('user');
  if (userData) {
    user.value = JSON.parse(userData);
  } else {
    // If no user data, redirect to login
    router.push('/login');
  }

  // Устанавливаем начальное время
  updateCurrentTime();

  // Обновляем время каждую секунду
  const timeInterval = setInterval(() => {
    updateCurrentTime();
  }, 1000);

  // Очищаем интервал при размонтировании компонента
  onUnmounted(() => {
    clearInterval(timeInterval);
  });
});

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Очищаем также сохраненные данные авторизации
  localStorage.removeItem('axenta_remember_password');
  localStorage.removeItem('axenta_username');
  localStorage.removeItem('axenta_password');
  router.push('/login');
};

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const updateCurrentTime = () => {
  currentTime.value = new Date().toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Неизвестно';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};
</script>

<style scoped>
/* Основные стили контейнера */
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Боковая панель */
.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  z-index: 100;
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.logo-letter {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  white-space: nowrap;
  transition: opacity 0.3s ease;
}

.sidebar-toggle {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #667eea;
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 40px;
  height: 40px;
}

.sidebar-toggle:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  color: #667eea;
}

.sidebar-toggle:active {
  transform: translateY(0);
  transition: transform 0.1s;
}

/* Навигация */
.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 30px;
}

.nav-title {
  padding: 0 20px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin: 2px 12px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #666;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.nav-item.active .nav-link {
  background: #667eea;
  color: white;
}

/* Футер сайдбара */
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.user-info {
  min-width: 0;
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: #666;
  margin: 0;
  text-transform: capitalize;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 59, 48, 0.2);
  color: #FF3B30;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 59, 48, 0.2);
  border-color: #FF3B30;
}

.logout-btn:active {
  transform: translateY(0);
  transition: transform 0.1s;
}

/* Основной контент */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Верхний заголовок */
.top-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 30px;
  position: sticky;
  top: 0;
  z-index: 90;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: right;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
}

/* Контент дашборда */
.dashboard-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* Сетка статистики */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.stat-card-content {
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-icon.devices {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-icon.orders {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.stat-icon.clients {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px 0;
  line-height: 1;
  white-space: nowrap;
  word-break: keep-all;
}

.stat-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.stat-change {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.stat-change.positive {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.stat-change.negative {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

/* Информационные карточки */
.info-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 24px 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #666;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
  color: #667eea;
}

.card-content {
  padding: 24px;
}

/* Детали пользователя */
.user-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 600;
  text-align: right;
}

.detail-value.account-type {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-user-message {
  text-align: center;
  color: #666;
  font-style: italic;
}

/* Активность */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.activity-icon.login {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.activity-icon.dashboard {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.activity-icon.data {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.activity-details {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: #1a1a1a;
  margin: 0 0 4px 0;
  font-weight: 500;
}

.activity-time {
  font-size: 12px;
  color: #666;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .info-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: fixed;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
  }

  .sidebar.sidebar-show {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  .dashboard-content {
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .top-header {
    padding: 15px 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .stat-card-content {
    padding: 20px;
  }

  .stat-number {
    font-size: 24px;
  }

  .card-content {
    padding: 20px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .detail-value {
    text-align: left;
  }
}

/* Анимации */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card,
.info-card {
  animation: fadeInUp 0.6s ease-out;
}

.stat-card:nth-child(1) {
  animation-delay: 0.1s;
}

.stat-card:nth-child(2) {
  animation-delay: 0.2s;
}

.stat-card:nth-child(3) {
  animation-delay: 0.3s;
}

.stat-card:nth-child(4) {
  animation-delay: 0.4s;
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .dashboard-container {
    background: #1a1a1a;
  }

  .sidebar,
  .top-header,
  .stat-card,
  .info-card {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .page-title,
  .card-title,
  .stat-number,
  .detail-value,
  .activity-text,
  .user-name {
    color: #fff;
  }

  .page-subtitle,
  .detail-label,
  .activity-time,
  .user-role,
  .nav-link,
  .stat-description {
    color: #ccc;
  }

  .nav-link:hover,
  .action-btn:hover {
    background: rgba(102, 126, 234, 0.2);
  }

  .activity-item {
    background: rgba(255, 255, 255, 0.05);
  }
}

/* Подвал с временем */
.time-footer {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 200;
  pointer-events: none;
}

.time-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 20px 30px;
  border-top-left-radius: 20px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: none;
  border-right: none;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.time-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.15);
}

.time-icon {
  color: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.time-info {
  display: flex;
  flex-direction: column;
}

.time-value {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: -0.5px;
}

.time-label {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Адаптивность для подвала */
@media (max-width: 768px) {
  .time-container {
    padding: 15px 20px;
    border-top-left-radius: 15px;
  }

  .time-value {
    font-size: 16px;
  }

  .time-label {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .time-container {
    padding: 12px 16px;
    border-top-left-radius: 12px;
  }

  .time-value {
    font-size: 14px;
  }

  .time-icon svg {
    width: 20px;
    height: 20px;
  }
}

/* Темная тема для подвала */
@media (prefers-color-scheme: dark) {
  .time-container {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .time-value {
    color: #fff;
  }

  .time-label {
    color: #ccc;
  }
}

/* Дополнительная адаптивность для длинных чисел */
@media (max-width: 1400px) {
  .stat-number {
    font-size: 24px;
  }
}

@media (max-width: 1200px) {
  .stat-number {
    font-size: 22px;
  }
}

@media (max-width: 900px) {
  .stat-number {
    font-size: 20px;
  }
}

@media (max-width: 600px) {
  .stat-number {
    font-size: 18px;
  }
}
</style>
