/**
 * Тестовый скрипт для проверки API запроса к /api/cms/accounts/
 */

const axios = require('axios');

async function testAccountsAPI() {
  try {
    console.log('🔍 Тестирование API запроса к /api/cms/accounts/');
    
    // Получаем токен из localStorage (симуляция)
    const token = process.env.AXENTA_TOKEN || 'your-token-here';
    const companyId = process.env.AXENTA_COMPANY_ID || 'your-company-id';
    
    console.log('📋 Параметры запроса:');
    console.log('- URL: https://axenta.cloud/api/cms/accounts/');
    console.log('- Token:', token ? `EXISTS (${token.substring(0, 10)}...)` : 'MISSING');
    console.log('- Company ID:', companyId || 'MISSING');
    
    const config = {
      method: 'GET',
      url: 'https://axenta.cloud/api/cms/accounts/',
      params: {
        page: 1,
        per_page: 50,
        ordering: 'name'
      },
      headers: {
        'Authorization': `Token ${token}`,
        'X-Tenant-ID': companyId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    };
    
    console.log('\n📡 Отправляем запрос...');
    const response = await axios(config);
    
    console.log('\n✅ Успешный ответ:');
    console.log('- Status:', response.status);
    console.log('- Count:', response.data.count);
    console.log('- Results length:', response.data.results?.length);
    console.log('- Next:', response.data.next);
    console.log('- Previous:', response.data.previous);
    
    if (response.data.results && response.data.results.length > 0) {
      console.log('\n📊 Первая запись:');
      const firstAccount = response.data.results[0];
      console.log(JSON.stringify(firstAccount, null, 2));
    }
    
    return response.data;
    
  } catch (error) {
    console.error('\n❌ Ошибка API запроса:');
    console.error('- Status:', error.response?.status);
    console.error('- Status Text:', error.response?.statusText);
    console.error('- Data:', error.response?.data);
    console.error('- Message:', error.message);
    
    if (error.response?.status === 401) {
      console.error('\n🔐 Ошибка авторизации - проверьте токен и права доступа');
    }
    
    throw error;
  }
}

// Запускаем тест если скрипт вызван напрямую
if (require.main === module) {
  testAccountsAPI()
    .then(data => {
      console.log('\n🎉 Тест завершен успешно!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Тест завершился с ошибкой');
      process.exit(1);
    });
}

module.exports = { testAccountsAPI };
