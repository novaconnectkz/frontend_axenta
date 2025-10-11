#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки API учетных записей на продакшене
 */

const https = require('https');
const http = require('http');

// Конфигурация для тестирования
const config = {
  // Production URLs
  production: {
    backend: 'https://api.axenta.glonass-saratov.ru',
    accounts: 'https://api.axenta.glonass-saratov.ru/api/accounts'
  },
  // Test token (замените на реальный)
  testToken: 'your-test-token-here',
  testCompanyId: 'your-company-id-here'
};

/**
 * Выполняет HTTP запрос
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Axenta-Test-Client/1.0',
        ...options.headers
      },
      timeout: 30000,
      ...options
    };

    console.log(`🔄 Making ${requestOptions.method} request to: ${url}`);
    console.log(`📋 Headers:`, JSON.stringify(requestOptions.headers, null, 2));

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Response status: ${res.statusCode}`);
        console.log(`📊 Response headers:`, JSON.stringify(res.headers, null, 2));
        
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
            raw: true
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request error:`, error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error(`⏰ Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Тестирует доступность backend сервера
 */
async function testBackendHealth() {
  console.log('\n🏥 Testing backend health...');
  
  try {
    const response = await makeRequest(`${config.production.backend}/health`);
    console.log(`✅ Backend health check:`, response.data);
    return true;
  } catch (error) {
    console.error(`❌ Backend health check failed:`, error.message);
    return false;
  }
}

/**
 * Тестирует API учетных записей без авторизации
 */
async function testAccountsApiNoAuth() {
  console.log('\n🔐 Testing accounts API without auth...');
  
  try {
    const response = await makeRequest(config.production.accounts);
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.status === 401) {
      console.log(`✅ Expected 401 - authentication required`);
      return true;
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
      console.log(`📄 Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Accounts API test failed:`, error.message);
    return false;
  }
}

/**
 * Тестирует API учетных записей с авторизацией
 */
async function testAccountsApiWithAuth() {
  console.log('\n🔑 Testing accounts API with auth...');
  
  if (!config.testToken || config.testToken === 'your-test-token-here') {
    console.log(`⚠️ No test token provided, skipping auth test`);
    console.log(`💡 To test with auth, update testToken in this script`);
    return false;
  }
  
  try {
    const response = await makeRequest(config.production.accounts, {
      headers: {
        'Authorization': `Token ${config.testToken}`,
        'X-Tenant-ID': config.testCompanyId
      }
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`✅ Success! Accounts API working`);
      console.log(`📄 Response data:`, JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log(`❌ Failed with status: ${response.status}`);
      console.log(`📄 Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Accounts API auth test failed:`, error.message);
    return false;
  }
}

/**
 * Тестирует CORS заголовки
 */
async function testCORS() {
  console.log('\n🌐 Testing CORS headers...');
  
  try {
    const response = await makeRequest(config.production.accounts, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://axenta.glonass-saratov.ru',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,x-tenant-id'
      }
    });
    
    console.log(`📊 CORS preflight status: ${response.status}`);
    console.log(`🔧 CORS headers:`, {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
    });
    
    return response.status === 200 || response.status === 204;
  } catch (error) {
    console.error(`❌ CORS test failed:`, error.message);
    return false;
  }
}

/**
 * Основная функция тестирования
 */
async function runTests() {
  console.log('🚀 Starting Axenta Accounts API tests...');
  console.log(`🎯 Target: ${config.production.backend}`);
  console.log(`📡 Accounts endpoint: ${config.production.accounts}`);
  
  const results = {
    backendHealth: await testBackendHealth(),
    accountsNoAuth: await testAccountsApiNoAuth(),
    accountsWithAuth: await testAccountsApiWithAuth(),
    cors: await testCORS()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('- Check if backend server is running');
    console.log('- Verify API endpoints are registered correctly');
    console.log('- Check CORS configuration');
    console.log('- Verify authentication tokens');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Запускаем тесты
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
