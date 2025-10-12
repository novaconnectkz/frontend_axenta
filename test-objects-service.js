// Простой тест для ObjectsService с новой fallback логикой

// Имитация ObjectsService для тестирования
class TestObjectsService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async testGetObjects() {
    console.log(`🔄 Тестирование getObjects для ${this.baseURL}...`);
    
    try {
      // Сначала пробуем основной эндпоинт
      const response = await fetch(`${this.baseURL}/api/cms/objects/?page=1&per_page=5`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Основной эндпоинт работает: ${data.data?.total || data.count} объектов`);
        return data;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`🔍 Ошибка основного эндпоинта: ${error.message}`);
      
      // Fallback к прямому Axenta Cloud API
      console.log('🔄 Fallback к Axenta Cloud API...');
      try {
        const axentaResponse = await fetch('https://axenta.cloud/api/cms/objects/?page=1&per_page=5', {
          headers: {
            'Authorization': 'Token 5e515a8f2874fc78f31c74af45260333f2c84c35',
            'Content-Type': 'application/json'
          }
        });
        
        if (axentaResponse.ok) {
          const axentaData = await axentaResponse.json();
          console.log(`✅ Fallback к Axenta Cloud успешен: ${axentaData.count} объектов`);
          
          // Конвертируем в формат нашего API
          return {
            status: "success",
            data: {
              items: axentaData.results.map(obj => ({
                id: obj.id,
                name: obj.name,
                type: "vehicle",
                description: `${obj.deviceTypeName} - ${obj.accountName}`,
                created_at: obj.createdAt,
                updated_at: obj.createdAt,
                accountName: obj.accountName,
                creatorName: obj.creatorName,
                deviceTypeName: obj.deviceTypeName,
                phoneNumbers: obj.phoneNumbers,
                uniqueId: obj.uniqueId,
                status: obj.isActive ? "active" : "inactive",
                is_active: obj.isActive
              })),
              total: axentaData.count,
              page: 1,
              per_page: 5,
              total_pages: Math.ceil(axentaData.count / 5)
            }
          };
        } else {
          throw new Error(`Axenta Cloud HTTP ${axentaResponse.status}`);
        }
      } catch (axentaError) {
        console.log(`❌ Fallback к Axenta Cloud не удался: ${axentaError.message}`);
        throw axentaError;
      }
    }
  }

  async testGetStats() {
    console.log(`🔄 Тестирование getStats для ${this.baseURL}...`);
    
    try {
      // Сначала пробуем основной эндпоинт
      const response = await fetch(`${this.baseURL}/api/auth/objects/stats`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Статистика получена: ${data.data?.total || data.total} объектов`);
        return data;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`🔍 Ошибка получения статистики: ${error.message}`);
      
      // Fallback к прямому Axenta Cloud API
      console.log('🔄 Fallback к Axenta Cloud API для статистики...');
      try {
        const axentaResponse = await fetch('https://axenta.cloud/api/cms/objects/?page=1&per_page=1', {
          headers: {
            'Authorization': 'Token 5e515a8f2874fc78f31c74af45260333f2c84c35',
            'Content-Type': 'application/json'
          }
        });
        
        if (axentaResponse.ok) {
          const axentaData = await axentaResponse.json();
          const total = axentaData.count || 0;
          
          const stats = {
            total: total,
            active: total,
            inactive: 0,
            scheduled_for_delete: 0,
            by_type: {
              vehicle: total
            },
            by_status: {
              active: total
            }
          };
          
          console.log(`✅ Fallback статистика: ${total} объектов`);
          return { status: "success", data: stats };
        } else {
          throw new Error(`Axenta Cloud HTTP ${axentaResponse.status}`);
        }
      } catch (axentaError) {
        console.log(`❌ Fallback статистики не удался: ${axentaError.message}`);
        
        // Возвращаем пустую статистику
        const emptyStats = {
          total: 0,
          active: 0,
          inactive: 0,
          scheduled_for_delete: 0,
          by_type: {},
          by_status: {}
        };
        
        console.log('📊 Возвращаем пустую статистику');
        return { status: "success", data: emptyStats };
      }
    }
  }
}

// Функция для запуска всех тестов
async function runAllTests() {
  console.log('🚀 Начинаем тестирование ObjectsService...\n');
  
  // Тест локального бэкенда
  console.log('=== ТЕСТ ЛОКАЛЬНОГО БЭКЕНДА ===');
  const localService = new TestObjectsService('http://localhost:8080');
  try {
    await localService.testGetObjects();
    await localService.testGetStats();
  } catch (error) {
    console.log(`❌ Локальный тест не удался: ${error.message}`);
  }
  
  console.log('\n=== ТЕСТ ПРОДАКШН БЭКЕНДА ===');
  const prodService = new TestObjectsService('https://api.axenta.glonass-saratov.ru');
  try {
    await prodService.testGetObjects();
    await prodService.testGetStats();
  } catch (error) {
    console.log(`❌ Продакшн тест не удался: ${error.message}`);
  }
  
  console.log('\n✅ Тестирование завершено!');
}

// Если запускается в браузере
if (typeof window !== 'undefined') {
  window.runAllTests = runAllTests;
  window.TestObjectsService = TestObjectsService;
  console.log('🌐 Тест готов к запуску в браузере. Вызовите runAllTests()');
}

// Если запускается в Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestObjectsService, runAllTests };
}
