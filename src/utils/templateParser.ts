import type { 
  TemplateBase, 
  ObjectTemplate, 
  UserTemplate, 
  NotificationTemplate,
  ReportTemplate,
  TemplateType 
} from '@/types/settings';
import { TEMPLATE_SYSTEMS, type TemplateSystem } from '@/types/settings';

/**
 * Форматы файлов шаблонов для разных систем
 */
export const TEMPLATE_FILE_FORMATS: Record<TemplateSystem, string[]> = {
  [TEMPLATE_SYSTEMS.AXENTA]: ['application/json', 'text/json', 'text/plain', '.json', '.txt'],
  [TEMPLATE_SYSTEMS.BITRIX24]: ['application/json', 'text/json', 'text/plain', '.json', '.txt'],
  [TEMPLATE_SYSTEMS.ONEC]: ['application/json', 'text/json', 'text/plain', '.json', '.txt'],
} as const;

/**
 * Интерфейс для импортированного шаблона из файла
 */
export interface ImportedTemplate {
  template: TemplateBase | ObjectTemplate | UserTemplate | NotificationTemplate | ReportTemplate;
  errors: string[];
  warnings: string[];
}

/**
 * Парсит JSON файл и возвращает объект
 * Поддерживает как обычный JSON, так и URL-encoded JSON
 */
export async function parseJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        let text = event.target?.result as string;
        
        // Проверяем, является ли содержимое URL-encoded
        // Если начинается с % или содержит много % символов, декодируем
        if (text.trim().startsWith('%') || (text.match(/%/g) || []).length > text.length * 0.1) {
          try {
            text = decodeURIComponent(text);
          } catch (decodeError) {
            // Если декодирование не удалось, пробуем парсить как есть
            console.warn('Не удалось декодировать URL-encoded данные, пробуем парсить как обычный JSON');
          }
        }
        
        const parsed = JSON.parse(text);
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Ошибка парсинга JSON: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Валидирует структуру шаблона объекта
 */
function validateObjectTemplate(data: any): { valid: boolean; errors: string[]; template?: ObjectTemplate } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Отсутствует или неверное поле "name"');
  }
  
  if (!data.type || data.type !== 'object') {
    errors.push('Тип шаблона должен быть "object"');
  }
  
  if (!data.system || typeof data.system !== 'string') {
    errors.push('Отсутствует или неверное поле "system"');
  }
  
  if (!Array.isArray(data.fields)) {
    errors.push('Поле "fields" должно быть массивом');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Создаем валидный шаблон
  const template: ObjectTemplate = {
    id: data.id || `temp-${Date.now()}`,
    type: 'object',
    system: data.system,
    name: data.name,
    description: data.description || '',
    category: data.category,
    is_system: data.is_system || false,
    is_active: data.is_active !== undefined ? data.is_active : true,
    usage_count: data.usage_count || 0,
    created_at: data.created_at ? new Date(data.created_at) : new Date(),
    updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
    fields: data.fields || [],
    default_values: data.default_values || {},
  };
  
  return { valid: true, errors: [], template };
}

/**
 * Валидирует структуру шаблона пользователя
 */
function validateUserTemplate(data: any): { valid: boolean; errors: string[]; template?: UserTemplate } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Отсутствует или неверное поле "name"');
  }
  
  if (!data.type || data.type !== 'user') {
    errors.push('Тип шаблона должен быть "user"');
  }
  
  if (!data.system || typeof data.system !== 'string') {
    errors.push('Отсутствует или неверное поле "system"');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  const template: UserTemplate = {
    id: data.id || `temp-${Date.now()}`,
    type: 'user',
    system: data.system,
    name: data.name,
    description: data.description || '',
    category: data.category,
    is_system: data.is_system || false,
    is_active: data.is_active !== undefined ? data.is_active : true,
    usage_count: data.usage_count || 0,
    created_at: data.created_at ? new Date(data.created_at) : new Date(),
    updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
    role_id: data.role_id || '',
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    default_settings: data.default_settings || {},
  };
  
  return { valid: true, errors: [], template };
}

/**
 * Валидирует структуру шаблона отчета
 * Поддерживает как стандартную структуру, так и структуру Axenta с content и settings
 */
function validateReportTemplate(data: any): { valid: boolean; errors: string[]; template?: ReportTemplate } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Отсутствует или неверное поле "name"');
  }
  
  // Для шаблонов Axenta type может быть "object", но это на самом деле отчет
  // Проверяем наличие content или явный type === 'report'
  const isReportType = data.type === 'report' || (data.type === 'object' && Array.isArray(data.content));
  
  if (!isReportType && data.type !== 'report') {
    // Если это не отчет и не объект с content, но мы ожидаем отчет - это ошибка
    // Но если type === 'object' и есть content, это может быть отчет Axenta
    if (data.type !== 'object' || !Array.isArray(data.content)) {
      errors.push('Тип шаблона должен быть "report" или "object" с полем "content" для отчетов Axenta');
    }
  }
  
  if (!data.system || typeof data.system !== 'string') {
    errors.push('Отсутствует или неверное поле "system"');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Создаем шаблон, сохраняя всю структуру (content, settings и т.д.)
  const template: ReportTemplate = {
    id: data.id || `temp-${Date.now()}`,
    type: 'report', // Всегда сохраняем как report
    system: data.system,
    name: data.name,
    description: data.description || '',
    category: data.category,
    is_system: data.is_system || false,
    is_active: data.is_active !== undefined ? data.is_active : true,
    usage_count: data.usage_count || 0,
    created_at: data.created_at ? new Date(data.created_at) : new Date(),
    updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
  };
  
  // Сохраняем специфичные поля для отчетов Axenta
  if (Array.isArray(data.content)) {
    template.content = data.content;
  }
  
  if (data.settings) {
    template.settings = data.settings;
  }
  
  // Сохраняем стандартные поля отчетов, если они есть
  if (data.sql_query) {
    template.sql_query = data.sql_query;
  }
  
  if (data.parameters) {
    template.parameters = data.parameters;
  }
  
  if (data.headers) {
    template.headers = data.headers;
  }
  
  if (data.formatting) {
    template.formatting = data.formatting;
  }
  
  return { valid: true, errors: [], template };
}

/**
 * Импортирует шаблон из файла
 */
export async function importTemplateFromFile(
  file: File,
  expectedType: TemplateType,
  expectedSystem: TemplateSystem
): Promise<ImportedTemplate> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Проверяем формат файла
  const allowedFormats = TEMPLATE_FILE_FORMATS[expectedSystem];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidFormat = allowedFormats.some(format => 
    file.type === format || fileExtension === format
  );
  
  if (!isValidFormat) {
    errors.push(`Неподдерживаемый формат файла. Для системы ${expectedSystem} ожидается JSON файл (.json или .txt).`);
    return { template: null as any, errors, warnings };
  }
  
  // Парсим файл
  let parsedData: any;
  try {
    parsedData = await parseJsonFile(file);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Ошибка парсинга файла');
    return { template: null as any, errors, warnings };
  }
  
  // Проверяем тип шаблона
  // Для отчетов Axenta type может быть "object", но это на самом деле отчет с content
  const isReportWithContent = expectedType === 'report' && parsedData.type === 'object' && Array.isArray(parsedData.content);
  
  if (parsedData.type !== expectedType && !isReportWithContent) {
    errors.push(`Тип шаблона в файле (${parsedData.type}) не соответствует ожидаемому (${expectedType})`);
  } else if (isReportWithContent) {
    // Это отчет Axenta в формате object с content - это нормально
    warnings.push('Шаблон имеет тип "object", но содержит структуру отчета. Будет сохранен как отчет.');
  }
  
  // Проверяем систему
  if (parsedData.system && parsedData.system !== expectedSystem) {
    warnings.push(`Система в файле (${parsedData.system}) отличается от выбранной (${expectedSystem}). Будет использована система из файла.`);
  } else if (!parsedData.system) {
    // Если система не указана, используем выбранную
    parsedData.system = expectedSystem;
  }
  
  // Валидируем структуру в зависимости от типа
  let validationResult: { valid: boolean; errors: string[]; template?: any };
  
  switch (expectedType) {
    case 'object':
      validationResult = validateObjectTemplate(parsedData);
      break;
    case 'user':
      validationResult = validateUserTemplate(parsedData);
      break;
    case 'report':
      validationResult = validateReportTemplate(parsedData);
      break;
    default:
      errors.push(`Неподдерживаемый тип шаблона: ${expectedType}`);
      return { template: null as any, errors, warnings };
  }
  
  if (!validationResult.valid) {
    errors.push(...validationResult.errors);
    return { template: null as any, errors, warnings };
  }
  
  return {
    template: validationResult.template!,
    errors,
    warnings,
  };
}

/**
 * Проверяет, поддерживается ли формат файла для системы
 */
export function isFileFormatSupported(file: File, system: TemplateSystem): boolean {
  const allowedFormats = TEMPLATE_FILE_FORMATS[system];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return allowedFormats.some(format => 
    file.type === format || fileExtension === format
  );
}

