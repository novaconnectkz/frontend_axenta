// Скрипт для проверки ошибок в консоли браузера
// Запустить в консоли браузера на странице пользователей

console.log('🔍 Начинаем проверку ошибок в консоли...');

// Перехватываем все ошибки
const originalError = console.error;
const originalWarn = console.warn;
const errors = [];
const warnings = [];

console.error = function(...args) {
    errors.push({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: args.join(' '),
        stack: new Error().stack
    });
    originalError.apply(console, args);
};

console.warn = function(...args) {
    warnings.push({
        timestamp: new Date().toISOString(),
        type: 'warning',
        message: args.join(' ')
    });
    originalWarn.apply(console, args);
};

// Проверяем наличие ошибок в компоненте Users
setTimeout(() => {
    console.log('📊 Результаты проверки ошибок:');
    console.log(`❌ Ошибки: ${errors.length}`);
    console.log(`⚠️ Предупреждения: ${warnings.length}`);
    
    if (errors.length > 0) {
        console.log('❌ Найденные ошибки:');
        errors.forEach((error, index) => {
            console.log(`${index + 1}. [${error.timestamp}] ${error.message}`);
        });
    }
    
    if (warnings.length > 0) {
        console.log('⚠️ Найденные предупреждения:');
        warnings.forEach((warning, index) => {
            console.log(`${index + 1}. [${warning.timestamp}] ${warning.message}`);
        });
    }
    
    // Проверяем специфические проблемы с фильтрами
    console.log('🔍 Проверка специфических проблем:');
    
    // Проверяем наличие элементов фильтров
    const searchInput = document.querySelector('input[placeholder*="Поиск по имени"]');
    const roleSelect = document.querySelector('select, .v-select');
    const statusSelect = document.querySelectorAll('select, .v-select')[1];
    const clearButton = document.querySelector('[data-testid="clear-filters"]');
    
    console.log(`🔍 Поле поиска: ${searchInput ? '✅ Найдено' : '❌ Не найдено'}`);
    console.log(`🎭 Селект роли: ${roleSelect ? '✅ Найдено' : '❌ Не найдено'}`);
    console.log(`✅ Селект статуса: ${statusSelect ? '✅ Найдено' : '❌ Не найдено'}`);
    console.log(`🗑️ Кнопка очистки: ${clearButton ? '✅ Найдена' : '❌ Не найдена'}`);
    
    // Проверяем Vue приложение
    if (typeof window !== 'undefined' && window.Vue) {
        console.log('✅ Vue.js загружен');
    } else {
        console.log('❌ Vue.js не найден');
    }
    
    // Проверяем состояние localStorage
    const token = localStorage.getItem('axenta_token');
    const company = localStorage.getItem('axenta_company');
    console.log(`🔐 Токен авторизации: ${token ? '✅ Найден' : '❌ Не найден'}`);
    console.log(`🏢 Данные компании: ${company ? '✅ Найдены' : '❌ Не найдены'}`);
    
    console.log('✅ Проверка завершена');
}, 5000);

console.log('⏱️ Проверка будет завершена через 5 секунд...');
