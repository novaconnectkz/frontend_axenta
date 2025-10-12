#!/usr/bin/env node

/**
 * Тест API статистики пользователей
 * Этот скрипт тестирует эндпоинт /api/auth/users/stats
 */

const https = require('https');
const http = require('http');

// Конфигурация
const CONFIG = {
    // Локальный сервер
    local: {
        host: 'localhost',
        port: 8080,
        protocol: 'http:',
        path: '/api/auth/users/stats'
    },
    // Продакшн сервер
    production: {
        host: 'api.axenta.glonass-saratov.ru',
        port: 443,
        protocol: 'https:',
        path: '/api/auth/users/stats'
    }
};

// Функция для выполнения HTTP запроса
function makeRequest(config, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: config.host,
            port: config.port,
            path: config.path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'UsersWidget-Test/1.0'
            }
        };

        // Добавляем токен если есть
        if (token) {
            options.headers['Authorization'] = `Token ${token}`;
        }

        console.log(`🔄 Запрос к ${config.protocol}//${config.host}:${config.port}${config.path}`);
        console.log(`📋 Заголовки:`, JSON.stringify(options.headers, null, 2));

        const client = config.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data,
                        parseError: e.message
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// Функция для красивого вывода результатов
function displayResults(response, serverName) {
    console.log(`\n📊 Результаты для ${serverName}:`);
    console.log(`🔢 HTTP Status: ${response.status}`);
    
    if (response.parseError) {
        console.log(`❌ Ошибка парсинга JSON: ${response.parseError}`);
        console.log(`📄 Сырой ответ: ${response.data}`);
        return;
    }
    
    if (response.data.status === 'success') {
        console.log(`✅ Статус: ${response.data.status}`);
        const stats = response.data.data;
        
        console.log(`\n📈 Статистика пользователей:`);
        console.log(`   Всего: ${stats.total || stats.total_users || 0}`);
        console.log(`   Активные: ${stats.active || stats.active_users || 0}`);
        console.log(`   Неактивные: ${stats.inactive || stats.inactive_users || 0}`);
        console.log(`   Администраторы: ${stats.admins || 0}`);
        console.log(`   Обычные: ${stats.regular_users || 0}`);
        
        if (stats.role_stats && stats.role_stats.length > 0) {
            console.log(`\n👥 По ролям:`);
            stats.role_stats.forEach(role => {
                console.log(`   ${role.role_name}: ${role.count}`);
            });
        }
        
        if (stats.last_updated) {
            console.log(`\n🕒 Обновлено: ${new Date(stats.last_updated).toLocaleString()}`);
        }
        
    } else {
        console.log(`❌ Статус: ${response.data.status}`);
        console.log(`❌ Ошибка: ${response.data.error || 'Неизвестная ошибка'}`);
    }
}

// Основная функция тестирования
async function runTests() {
    console.log('🧪 Тестирование API статистики пользователей\n');
    
    // Тест локального сервера
    try {
        console.log('🏠 Тестирование локального сервера...');
        const localResponse = await makeRequest(CONFIG.local);
        displayResults(localResponse, 'Локальный сервер');
    } catch (error) {
        console.log(`❌ Ошибка локального сервера: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Тест продакшн сервера (без токена)
    try {
        console.log('🌐 Тестирование продакшн сервера (без токена)...');
        const prodResponse = await makeRequest(CONFIG.production);
        displayResults(prodResponse, 'Продакшн сервер (без токена)');
    } catch (error) {
        console.log(`❌ Ошибка продакшн сервера: ${error.message}`);
    }
    
    // Если есть токен в переменных окружения, тестируем с ним
    const token = process.env.AXENTA_TOKEN;
    if (token) {
        console.log('\n' + '='.repeat(60) + '\n');
        try {
            console.log('🔑 Тестирование продакшн сервера (с токеном)...');
            const prodResponseWithToken = await makeRequest(CONFIG.production, token);
            displayResults(prodResponseWithToken, 'Продакшн сервер (с токеном)');
        } catch (error) {
            console.log(`❌ Ошибка продакшн сервера с токеном: ${error.message}`);
        }
    } else {
        console.log('\n💡 Для тестирования с токеном установите переменную AXENTA_TOKEN');
        console.log('   Пример: AXENTA_TOKEN=your_token node test-users-api.js');
    }
    
    console.log('\n✅ Тестирование завершено');
}

// Запуск тестов
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { makeRequest, CONFIG };
