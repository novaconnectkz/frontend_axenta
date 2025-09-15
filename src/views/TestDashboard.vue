<template>
  <div class="dashboard-container" @click="closeUserInfoOnOutsideClick">
    <!-- Боковое меню -->
    <nav class="sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo" :class="{ 'collapsed': sidebarCollapsed }">
          <div class="logo-icon">A</div>
          <span v-if="!sidebarCollapsed" class="logo-text">CRM</span>
        </div>
        <button @click="toggleSidebar" class="sidebar-toggle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="sidebar-nav">
        <div class="nav-group">
          <a href="#" class="nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" />
              <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">Главная</span>
          </a>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2" />
              <path d="M21 15l-5-5L5 21l5-5" stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">Объекты</span>
          </a>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" />
              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">Учетные записи</span>
          </a>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" />
              <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">Пользователи</span>
          </a>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">Ретрансляторы</span>
          </a>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">Корзина</span>
          </a>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                stroke="currentColor" stroke-width="2" />
              <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="currentColor" stroke-width="2" />
              <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">Склад</span>
          </a>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">Биллинг</span>
          </a>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <polygon points="10,8 16,12 10,16 10,8" stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">МонтажGPS</span>
          </a>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor"
                stroke-width="2" />
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" />
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" />
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" />
              <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" />
            </svg>
            <span v-if="!sidebarCollapsed">Отчеты</span>
          </a>
        </div>

        <div class="nav-group" v-if="!sidebarCollapsed">
          <div class="nav-group-title">Настройки</div>
          <a href="#" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 -1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke="currentColor" stroke-width="2" />
            </svg>
            <span>Настройки</span>
          </a>
        </div>
      </div>

      <div class="sidebar-footer">
        <button @click="logout" class="logout-btn" :class="{ 'collapsed': sidebarCollapsed }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
          <span v-if="!sidebarCollapsed">Выйти</span>
        </button>
      </div>
    </nav>

    <!-- Основной контент -->
    <main class="main-content" :class="{ 'expanded': sidebarCollapsed }">
      <!-- Верхняя панель -->
      <header class="top-header">
        <div class="header-left">
          <h1>Главная панель</h1>
          <p>Управление системой CRM</p>
        </div>
        <div class="header-right">
          <!-- Переключатель темы -->
          <div class="theme-switcher">
            <button @click="toggleTheme" class="apple-btn theme-btn" :title="getThemeTooltip()">
              <!-- Иконка солнца для светлой темы -->
              <svg v-if="currentTheme === 'light'" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" />
                <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" />
                <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" />
                <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" />
                <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" />
              </svg>
              <!-- Иконка луны для темной темы -->
              <svg v-else-if="currentTheme === 'dark'" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" />
              </svg>
              <!-- Иконка монитора для системной темы -->
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2" />
                <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2" />
                <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2" />
              </svg>
            </button>
          </div>

          <!-- Кнопка информации о пользователе -->
          <div class="user-info-container">
            <button @click="toggleUserInfo" class="apple-btn info-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>

            <!-- Выпадающая панель с информацией в стиле Apple -->
            <div v-if="showUserInfo" class="dropdown-overlay" @click="showUserInfo = false"></div>
            <div v-if="showUserInfo" class="apple-dropdown" @click.stop>
              <div v-if="user">
                <!-- Компактный заголовок -->
                <div class="dropdown-header-compact">
                  <div class="user-avatar-small">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" />
                      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" stroke-width="2" />
                    </svg>
                  </div>
                  <div class="user-title-compact">
                    <h3>{{ user.name }}</h3>
                    <p>@{{ user.username }}</p>
                  </div>
                </div>

                <!-- Компактная информация в сетку -->
                <div class="dropdown-content-compact">
                  <div class="info-grid">
                    <div class="info-cell">
                      <span class="info-label-compact">ID</span>
                      <span class="info-value-compact">{{ user.id }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="info-label-compact">ТИП</span>
                      <span class="info-value-compact">{{ user.accountType }}</span>
                    </div>
                  </div>

                  <div class="account-info">
                    <span class="info-label-compact">АККАУНТ</span>
                    <span class="info-value-compact account-name">{{ user.accountName }}</span>
                  </div>

                  <!-- Компактный токен -->
                  <div class="token-section-compact">
                    <div class="token-header">
                      <span class="info-label-compact">ТОКЕН</span>
                      <button @click="copyToken" class="copy-btn-compact" :class="{ 'copied': tokenCopied }">
                        <svg v-if="!tokenCopied" width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor"
                            stroke-width="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor"
                            stroke-width="2" />
                        </svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        </svg>
                      </button>
                    </div>
                    <div class="token-display-compact">
                      {{ token ? token.substring(0, 16) + '...' : 'Нет токена' }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="no-user-data">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" />
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" />
                </svg>
                <p>Данные пользователя не найдены</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Сетка виджетов -->
      <div class="widgets-grid">
        <!-- Виджет объектов -->
        <div class="widget">
          <div class="widget-icon objects">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2" />
              <path d="M21 15l-5-5L5 21l5-5" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div class="widget-content">
            <h3>Управление объектами</h3>
            <p>Создание, редактирование и управление объектами мониторинга в системе</p>
            <div class="widget-stats">
              <span class="stat-number">3,847</span>
              <span class="stat-label">активных объектов</span>
            </div>
          </div>
        </div>

        <!-- Виджет учетных записей -->
        <div class="widget">
          <div class="widget-icon accounts">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" />
              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div class="widget-content">
            <h3>Учетные записи</h3>
            <p>Управление учетными записями клиентов и организаций</p>
            <div class="widget-stats">
              <span class="stat-number">1,247</span>
              <span class="stat-label">учетных записей</span>
            </div>
          </div>
        </div>

        <!-- Виджет пользователей -->
        <div class="widget">
          <div class="widget-icon users">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" />
              <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div class="widget-content">
            <h3>Управление пользователями</h3>
            <p>Создание и управление пользователями системы мониторинга</p>
            <div class="widget-stats">
              <span class="stat-number">856</span>
              <span class="stat-label">активных пользователей</span>
            </div>
          </div>
        </div>

        <!-- Виджет ретрансляторов -->
        <div class="widget">
          <div class="widget-icon retranslators">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div class="widget-content">
            <h3>Ретрансляторы</h3>
            <p>Управление серверами ретрансляции данных и мониторинг связи</p>
            <div class="widget-stats">
              <span class="stat-number">24</span>
              <span class="stat-label">активных серверов</span>
            </div>
          </div>
        </div>

        <!-- Виджет корзины -->
        <div class="widget">
          <div class="widget-icon trash">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div class="widget-content">
            <h3>Корзина</h3>
            <p>Просмотр и восстановление удаленных объектов и данных</p>
            <div class="widget-stats">
              <span class="stat-number">127</span>
              <span class="stat-label">удаленных элементов</span>
            </div>
          </div>
        </div>

        <!-- Виджет биллинга -->
        <div class="widget">
          <div class="widget-icon billing">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div class="widget-content">
            <h3>Система биллинга</h3>
            <p>Управление платежами, тарифными планами и финансовой отчетностью</p>
            <div class="widget-stats">
              <span class="stat-number">₽ 2,847,920</span>
              <span class="stat-label">общий оборот</span>
            </div>
          </div>
        </div>

        <!-- Виджет склада -->
        <div class="widget">
          <div class="widget-icon warehouse">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                stroke="currentColor" stroke-width="2" />
              <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="currentColor" stroke-width="2" />
              <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div class="widget-content">
            <h3>Управление складом</h3>
            <p>Учет оборудования, управление запасами и логистическими операциями</p>
            <div class="widget-stats">
              <span class="stat-number">12,459</span>
              <span class="stat-label">единиц оборудования</span>
            </div>
          </div>
        </div>

        <!-- Виджет МонтажGPS -->
        <div class="widget">
          <div class="widget-icon installation">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <polygon points="10,8 16,12 10,16 10,8" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div class="widget-content">
            <h3>МонтажGPS</h3>
            <p>Планирование и контроль монтажных работ GPS-оборудования</p>
            <div class="widget-stats">
              <span class="stat-number">342</span>
              <span class="stat-label">активных заказов</span>
            </div>
          </div>
        </div>

        <!-- Виджет отчетов -->
        <div class="widget">
          <div class="widget-icon reports">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor"
                stroke-width="2" />
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" />
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" />
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" />
              <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div class="widget-content">
            <h3>Отчеты и аналитика</h3>
            <p>Генерация отчетов, статистика и аналитические данные системы</p>
            <div class="widget-stats">
              <span class="stat-number">1,573</span>
              <span class="stat-label">сгенерированных отчетов</span>
            </div>
          </div>
        </div>
      </div>
    </main>


    <!-- Подвал с временем -->
    <div
      style="position: fixed; bottom: 0; right: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); padding: 12px 16px; border-top-left-radius: 12px; box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.1); border: 1px solid rgba(0, 0, 0, 0.1); pointer-events: none;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color: #667eea;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
          <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        <div>
          <div
            style="font-size: 14px; font-weight: 600; color: #1a1a1a; line-height: 1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            {{ currentTime }}
          </div>
          <div style="font-size: 10px; color: #666; margin-top: 1px;">
            Текущее время
          </div>
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
const currentTime = ref(new Date().toLocaleString());
const showUserInfo = ref(false);
const token = ref<string | null>(null);
const tokenCopied = ref(false);
const sidebarCollapsed = ref(false);

// Тема
type Theme = 'light' | 'dark' | 'system';
const currentTheme = ref<Theme>('system');
const actualTheme = ref<'light' | 'dark'>('light');

// Функции управления темой
const initTheme = () => {
  // Загружаем сохраненную тему из localStorage
  const savedTheme = localStorage.getItem('axenta_theme') as Theme;
  if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
    currentTheme.value = savedTheme;
  }

  // Устанавливаем актуальную тему
  updateActualTheme();
  applyTheme();

  // Слушаем изменения системной темы
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (currentTheme.value === 'system') {
        updateActualTheme();
        applyTheme();
      }
    });
  }
};

const updateActualTheme = () => {
  if (currentTheme.value === 'system') {
    // Определяем системную тему
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      actualTheme.value = 'dark';
    } else {
      actualTheme.value = 'light';
    }
  } else {
    actualTheme.value = currentTheme.value;
  }
};

const applyTheme = () => {
  const root = document.documentElement;
  if (actualTheme.value === 'dark') {
    root.classList.add('dark-theme');
    root.classList.remove('light-theme');
  } else {
    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
  }
};

const toggleTheme = () => {
  const themes: Theme[] = ['light', 'dark', 'system'];
  const currentIndex = themes.indexOf(currentTheme.value);
  const nextIndex = (currentIndex + 1) % themes.length;
  currentTheme.value = themes[nextIndex];

  // Сохраняем в localStorage
  localStorage.setItem('axenta_theme', currentTheme.value);

  updateActualTheme();
  applyTheme();
};

const getThemeTooltip = () => {
  const tooltips = {
    light: 'Переключить на темную тему',
    dark: 'Переключить на системную тему',
    system: 'Переключить на светлую тему'
  };
  return tooltips[currentTheme.value];
};

onMounted(() => {
  console.log('TestDashboard mounted');

  // Инициализируем тему
  initTheme();

  // Load user from localStorage
  const userData = localStorage.getItem('user');
  const tokenData = localStorage.getItem('token');

  // Загружаем токен
  token.value = tokenData;

  console.log('Token:', tokenData ? 'exists' : 'not found');
  console.log('User data:', userData ? 'exists' : 'not found');

  if (userData) {
    try {
      user.value = JSON.parse(userData);
      console.log('User loaded:', user.value);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  } else {
    console.log('No user data, redirecting to login');
    router.push('/simple-login');
  }

  // Обновляем время каждую секунду
  const timeInterval = setInterval(() => {
    currentTime.value = new Date().toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, 1000);

  // Очищаем интервал при размонтировании компонента
  onUnmounted(() => {
    clearInterval(timeInterval);
  });
});

const toggleUserInfo = () => {
  showUserInfo.value = !showUserInfo.value;
};

const closeUserInfoOnOutsideClick = (event: Event) => {
  // Закрываем панель если клик был не по кнопке info
  if (showUserInfo.value && !(event.target as Element)?.closest('.user-info-container')) {
    showUserInfo.value = false;
  }
};

const copyToken = async () => {
  if (!token.value) {
    console.warn('Нет токена для копирования');
    return;
  }

  try {
    await navigator.clipboard.writeText(token.value);
    tokenCopied.value = true;

    // Сбрасываем состояние через 2 секунды
    setTimeout(() => {
      tokenCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Ошибка копирования токена:', error);

    // Fallback для старых браузеров
    const textArea = document.createElement('textarea');
    textArea.value = token.value;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    tokenCopied.value = true;
    setTimeout(() => {
      tokenCopied.value = false;
    }, 2000);
  }
};

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('axenta_remember_password');
  localStorage.removeItem('axenta_username');
  localStorage.removeItem('axenta_password');
  router.push('/simple-login');
};
</script>

<style scoped>
/* Основной контейнер дашборда */
.dashboard-container {
  display: flex;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Боковое меню */
.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo.collapsed {
  justify-content: center;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 20px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
}

.sidebar-toggle {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 10px;
  cursor: pointer;
  padding: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-group {
  margin-bottom: 20px;
}

.nav-group-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 20px 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #666;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0;
  margin: 2px 12px;
  border-radius: 12px;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.1));
  color: #667eea;
  font-weight: 600;
}

.nav-item span {
  white-space: nowrap;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 12px;
  cursor: pointer;
  padding: 12px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #FF3B30;
  font-weight: 500;
  width: 100%;
  justify-content: center;
}

.logout-btn:hover {
  background: rgba(255, 59, 48, 0.15);
  transform: translateY(-1px);
}

.logout-btn.collapsed {
  padding: 12px;
}

/* Основной контент */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 0;
  overflow: hidden;
  min-height: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.expanded {
  margin-left: 0;
}

.top-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1001;
}

.header-left h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.header-left p {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 16px;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Переключатель темы */
.theme-switcher {
  display: flex;
  align-items: center;
}

.theme-btn {
  color: #667eea !important;
}

.theme-btn:hover {
  background: rgba(102, 126, 234, 0.1) !important;
  color: #667eea !important;
}

.user-info-container {
  position: relative;
  display: inline-block;
  z-index: 9999;
}

/* Сетка виджетов */
.widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 140px);
}

.widget {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  min-height: 160px;
  display: flex;
  flex-direction: column;
}

.widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.widget:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.widget:hover::before {
  opacity: 1;
}

.widget-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
}

.widget-icon.objects {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.widget-icon.accounts {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.widget-icon.users {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.widget-icon.retranslators {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.widget-icon.trash {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.widget-icon.billing {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #666;
}

.widget-icon.warehouse {
  background: linear-gradient(135deg, #fd746c 0%, #ff9068 100%);
  color: white;
}

.widget-icon.installation {
  background: linear-gradient(135deg, #85d8ce 0%, #085078 100%);
  color: white;
}

.widget-icon.reports {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #666;
}

.widget-content h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.widget-content p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.widget-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
  white-space: nowrap;
  word-break: keep-all;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Адаптивность */
/* Адаптивность для больших экранов */
@media (min-width: 1400px) {
  .widgets-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
    max-height: calc(100vh - 120px);
  }
}

@media (max-width: 1400px) and (min-width: 1200px) {
  .widgets-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 18px;
    max-height: calc(100vh - 130px);
  }
}

@media (max-width: 1200px) and (min-width: 900px) {
  .widgets-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    padding: 16px;
    max-height: calc(100vh - 140px);
  }

  .widget {
    padding: 18px;
    min-height: 150px;
  }

  .widget-content h3 {
    font-size: 18px;
  }

  .widget-content p {
    font-size: 13px;
  }
}

@media (max-width: 900px) and (min-width: 769px) {
  .widgets-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 14px;
    padding: 14px;
    max-height: calc(100vh - 150px);
  }

  .widget {
    padding: 16px;
    min-height: 140px;
  }

  .widget-content h3 {
    font-size: 16px;
  }

  .widget-content p {
    font-size: 12px;
    line-height: 1.4;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 1000;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    border-right: none;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .sidebar.show {
    transform: translateY(0);
  }

  .main-content {
    margin-left: 0;
    padding-bottom: 60px;
  }

  .top-header {
    padding: 12px 16px;
  }

  .header-left h1 {
    font-size: 20px;
  }

  .widgets-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
    padding: 12px;
    max-height: calc(100vh - 160px);
  }

  .widget {
    padding: 16px;
    min-height: 130px;
  }

  .widget-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
  }

  .widget-content h3 {
    font-size: 16px;
  }

  .widget-content p {
    font-size: 12px;
    line-height: 1.3;
  }

  .stat-number {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .widgets-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 10px;
    max-height: calc(100vh - 180px);
  }

  .widget {
    padding: 14px;
    min-height: 120px;
  }

  .widget-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 10px;
  }

  .widget-content h3 {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .widget-content p {
    font-size: 11px;
    line-height: 1.3;
    margin-bottom: 10px;
  }

  .stat-number {
    font-size: 16px;
  }

  .stat-label {
    font-size: 10px;
  }

  .top-header {
    padding: 10px 14px;
  }

  .header-left h1 {
    font-size: 18px;
  }
}

/* Адаптивность по высоте экрана */
@media (max-height: 700px) {
  .widgets-grid {
    gap: 12px;
    padding: 12px;
  }

  .widget {
    min-height: 140px;
    padding: 16px;
  }

  .widget-content h3 {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .widget-content p {
    font-size: 12px;
    margin-bottom: 8px;
  }
}

@media (max-height: 600px) {
  .top-header {
    padding: 12px 20px;
  }

  .widgets-grid {
    gap: 10px;
    padding: 10px;
    max-height: calc(100vh - 100px);
  }

  .widget {
    min-height: 120px;
    padding: 14px;
  }

  .widget-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 10px;
  }

  .widget-content h3 {
    font-size: 15px;
    margin-bottom: 6px;
  }

  .widget-content p {
    font-size: 11px;
    margin-bottom: 6px;
    line-height: 1.3;
  }
}

/* Очень маленькие экраны */
@media (max-width: 360px) {
  .widgets-grid {
    padding: 8px;
    gap: 8px;
    max-height: calc(100vh - 200px);
  }

  .widget {
    padding: 12px;
    min-height: 110px;
  }

  .widget-icon {
    width: 36px;
    height: 36px;
    margin-bottom: 8px;
  }

  .widget-content h3 {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .widget-content p {
    font-size: 10px;
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .stat-number {
    font-size: 14px;
  }

  .stat-label {
    font-size: 9px;
  }
}

/* Темная тема через класс */
.dark-theme .dashboard-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

.dark-theme .sidebar,
.dark-theme .top-header,
.dark-theme .widget {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .logo-text,
.dark-theme .header-left h1,
.dark-theme .widget-content h3,
.dark-theme .stat-number {
  color: #fff;
}

.dark-theme .header-left p,
.dark-theme .widget-content p,
.dark-theme .stat-label,
.dark-theme .nav-item {
  color: #ccc;
}

.dark-theme .nav-group-title {
  color: #999;
}

.dark-theme .nav-item:hover {
  background: rgba(102, 126, 234, 0.15);
  color: #88a3ff;
}

.dark-theme .nav-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.15));
  color: #88a3ff;
}

.dark-theme .sidebar-toggle:hover {
  background: rgba(102, 126, 234, 0.2);
}

.dark-theme .logout-btn:hover {
  background: rgba(255, 59, 48, 0.2);
}

.dark-theme .theme-btn {
  color: #88a3ff !important;
}

.dark-theme .theme-btn:hover {
  background: rgba(136, 163, 255, 0.1) !important;
}

/* Светлая тема (по умолчанию) */
.light-theme .dashboard-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Темная тема для панели пользователя */
.dark-theme .apple-dropdown {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .dropdown-header-compact {
  background: linear-gradient(135deg, rgba(136, 163, 255, 0.2), rgba(118, 75, 162, 0.2));
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .user-title-compact h3 {
  color: #fff;
}

.dark-theme .user-title-compact p {
  color: #ccc;
}

.dark-theme .info-cell,
.dark-theme .account-info,
.dark-theme .token-section-compact {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .info-label-compact {
  color: #ccc;
}

.dark-theme .info-value-compact {
  color: #fff;
}

.dark-theme .token-display-compact {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

/* Остальные стили светлой темы уже определены выше */

.apple-btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.apple-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
  border-radius: inherit;
  pointer-events: none;
}

.apple-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

.apple-btn:active {
  transform: translateY(0);
  transition: transform 0.1s;
}

.info-btn {
  color: #007AFF;
}

.info-btn:hover {
  background: rgba(0, 122, 255, 0.1);
}

.logout-btn {
  color: #FF3B30;
}

.logout-btn:hover {
  background: rgba(255, 59, 48, 0.1);
}

/* Overlay для выпадающего меню */
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 99998;
  cursor: default;
}

/* Выпадающая панель в стиле Apple */
.apple-dropdown {
  position: fixed;
  top: 74px;
  right: 20px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  width: 300px;
  max-height: 400px;
  z-index: 99999;
  overflow: hidden;
  animation: dropdownAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dropdownAppear {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Компактный заголовок */
.dropdown-header-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(102, 126, 234, 0.1));
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.user-avatar-small {
  width: 36px;
  height: 36px;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007AFF;
  flex-shrink: 0;
}

.user-title-compact h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.user-title-compact p {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.dropdown-content-compact {
  padding: 12px 16px 16px;
}

/* Сетка для информации */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
}

.info-label-compact {
  font-size: 10px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
}

  .info-value-compact {
    font-size: 13px;
    color: #1a1a1a;
    font-weight: 600;
    line-height: 1.2;
    word-break: break-word;
    white-space: nowrap;
  }

.account-name {
  font-size: 12px !important;
}

/* Компактная секция токена */
.token-section-compact {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 8px;
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.copy-btn-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 6px;
  padding: 4px;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 24px;
  height: 24px;
}

.copy-btn-compact:hover {
  background: rgba(0, 122, 255, 0.15);
  transform: translateY(-1px);
}

.copy-btn-compact.copied {
  background: rgba(52, 199, 89, 0.1);
  border-color: rgba(52, 199, 89, 0.2);
  color: #34C759;
}

  .token-display-compact {
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 6px;
    padding: 6px 8px;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    font-size: 11px;
    color: #666;
    word-break: break-word;
    overflow-wrap: break-word;
    line-height: 1.3;
  }

/* Старые стили удалены - используем компактные версии */

/* Состояние без данных */
.no-user-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  text-align: center;
  color: #FF3B30;
}

.no-user-data svg {
  margin-bottom: 12px;
  opacity: 0.8;
}

.no-user-data p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

/* Адаптивность */
@media (max-width: 768px) {
  .top-controls {
    top: 15px;
    right: 15px;
    gap: 8px;
  }

  .apple-btn {
    width: 40px;
    height: 40px;
  }

  .apple-dropdown {
    min-width: 280px;
    top: 50px;
  }

  .dropdown-header {
    padding: 16px;
  }

  .user-title h3 {
    font-size: 16px;
  }

  .dropdown-content {
    padding: 12px 16px 16px;
  }
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .apple-btn {
    background: rgba(30, 30, 30, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .apple-dropdown {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .dropdown-header-compact {
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.2), rgba(102, 126, 234, 0.2));
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .user-title-compact h3 {
    color: #fff;
  }

  .user-title-compact p {
    color: #ccc;
  }

  .info-cell,
  .account-info,
  .token-section-compact {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .info-label-compact {
    color: #ccc;
  }

  .info-value-compact {
    color: #fff;
  }

  .token-display-compact {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: #ccc;
  }

  /* Старые стили для темной темы удалены */
}

/* Дополнительная адаптивность для длинных чисел */
@media (max-width: 1400px) {
  .stat-number {
    font-size: 22px;
  }
}

@media (max-width: 1200px) {
  .stat-number {
    font-size: 20px;
  }
}

@media (max-width: 900px) {
  .stat-number {
    font-size: 18px;
  }
}

@media (max-width: 600px) {
  .stat-number {
    font-size: 16px;
  }
}
</style>
