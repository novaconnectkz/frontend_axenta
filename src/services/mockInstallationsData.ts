// Демо данные для системы планирования монтажей

import type {
  EquipmentBase,
  InstallationStats,
  InstallationWithRelations,
  InstallerStats,
  InstallerWithRelations,
  LocationBase,
  LocationStats,
  EquipmentStats,
  INSTALLATION_STATUSES,
  INSTALLATION_TYPES,
  INSTALLATION_PRIORITIES,
  INSTALLER_STATUSES,
  INSTALLER_TYPES,
  EQUIPMENT_STATUSES,
  EQUIPMENT_CONDITIONS,
} from "@/types/installations";

// Локации
export const mockLocations: LocationBase[] = [
  {
    id: 1,
    city: "Москва",
    region: "Московская область",
    country: "Россия",
    latitude: 55.7558,
    longitude: 37.6176,
    timezone: "Europe/Moscow",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    city: "Санкт-Петербург",
    region: "Ленинградская область", 
    country: "Россия",
    latitude: 59.9311,
    longitude: 30.3609,
    timezone: "Europe/Moscow",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 3,
    city: "Екатеринбург",
    region: "Свердловская область",
    country: "Россия",
    latitude: 56.8431,
    longitude: 60.6454,
    timezone: "Asia/Yekaterinburg",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 4,
    city: "Новосибирск",
    region: "Новосибирская область",
    country: "Россия",
    latitude: 55.0084,
    longitude: 82.9357,
    timezone: "Asia/Novosibirsk",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 5,
    city: "Казань",
    region: "Республика Татарстан",
    country: "Россия",
    latitude: 55.8304,
    longitude: 49.0661,
    timezone: "Europe/Moscow",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
];

// Монтажники
export const mockInstallers: InstallerWithRelations[] = [
  {
    id: 1,
    first_name: "Алексей",
    last_name: "Иванов",
    type: "staff",
    phone: "+7 (999) 123-45-67",
    email: "a.ivanov@axenta.ru",
    specialization: ["GPS трекеры", "Сигнализации", "Иммобилайзеры"],
    max_daily_installations: 4,
    working_days: [1, 2, 3, 4, 5], // пн-пт
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    location_ids: [1, 2],
    is_active: true,
    status: "available",
    hire_date: "2023-03-15",
    notes: "Опытный монтажник, специализируется на сложных установках",
    created_at: "2023-03-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    locations: [mockLocations[0], mockLocations[1]],
    current_installations_count: 2,
    total_installations_count: 156,
    rating: 4.8,
  },
  {
    id: 2,
    first_name: "Дмитрий",
    last_name: "Петров",
    type: "staff",
    phone: "+7 (999) 234-56-78",
    email: "d.petrov@axenta.ru",
    specialization: ["GPS трекеры", "Камеры", "Датчики"],
    max_daily_installations: 5,
    working_days: [1, 2, 3, 4, 5, 6], // пн-сб
    working_hours_start: "08:00",
    working_hours_end: "19:00",
    location_ids: [1, 3],
    is_active: true,
    status: "busy",
    hire_date: "2023-01-10",
    notes: "Быстро работает, хорошо знает технику",
    created_at: "2023-01-10T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    locations: [mockLocations[0], mockLocations[2]],
    current_installations_count: 5,
    total_installations_count: 203,
    rating: 4.6,
  },
  {
    id: 3,
    first_name: "Сергей",
    last_name: "Сидоров",
    type: "contractor",
    phone: "+7 (999) 345-67-89",
    email: "s.sidorov@contractor.ru",
    specialization: ["Диагностика", "Обслуживание", "GPS трекеры"],
    max_daily_installations: 3,
    working_days: [1, 2, 3, 4, 5],
    working_hours_start: "10:00",
    working_hours_end: "17:00",
    location_ids: [2, 4],
    is_active: true,
    status: "available",
    hire_date: "2023-06-01",
    notes: "Подрядчик, работает удаленно",
    created_at: "2023-06-01T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    locations: [mockLocations[1], mockLocations[3]],
    current_installations_count: 1,
    total_installations_count: 87,
    rating: 4.4,
  },
  {
    id: 4,
    first_name: "Михаил",
    last_name: "Козлов",
    type: "staff",
    phone: "+7 (999) 456-78-90",
    email: "m.kozlov@axenta.ru",
    specialization: ["Сигнализации", "Иммобилайзеры", "Камеры"],
    max_daily_installations: 4,
    working_days: [1, 2, 3, 4, 5],
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    location_ids: [3, 4, 5],
    is_active: true,
    status: "available",
    hire_date: "2023-08-20",
    notes: "Молодой специалист, быстро обучается",
    created_at: "2023-08-20T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    locations: [mockLocations[2], mockLocations[3], mockLocations[4]],
    current_installations_count: 3,
    total_installations_count: 42,
    rating: 4.2,
  },
  {
    id: 5,
    first_name: "Андрей",
    last_name: "Морозов",
    type: "partner",
    phone: "+7 (999) 567-89-01",
    email: "a.morozov@partner.ru",
    specialization: ["GPS трекеры", "Диагностика"],
    max_daily_installations: 6,
    working_days: [1, 2, 3, 4, 5, 6, 7],
    working_hours_start: "07:00",
    working_hours_end: "20:00",
    location_ids: [1, 5],
    is_active: true,
    status: "vacation",
    hire_date: "2022-11-15",
    notes: "Партнер, работает в выходные",
    created_at: "2022-11-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    locations: [mockLocations[0], mockLocations[4]],
    current_installations_count: 0,
    total_installations_count: 298,
    rating: 4.9,
  },
];

// Оборудование
export const mockEquipment: EquipmentBase[] = [
  {
    id: 1,
    type: "GPS трекер",
    model: "StarLine M17",
    brand: "StarLine",
    serial_number: "SL17001234",
    imei: "860123456789012",
    phone_number: "+7 (999) 111-22-33",
    status: "in_stock",
    condition: "new",
    qr_code: "QR001234",
    warranty_expires_at: "2025-06-15",
    purchase_date: "2024-06-15",
    purchase_price: 12500,
    notes: "Новое поколение GPS трекеров с улучшенной точностью",
    created_at: "2024-06-15T10:00:00Z",
    updated_at: "2024-06-15T10:00:00Z",
  },
  {
    id: 2,
    type: "GPS трекер",
    model: "Pandora DXL 3970",
    brand: "Pandora",
    serial_number: "PD39701567",
    imei: "860987654321098",
    phone_number: "+7 (999) 222-33-44",
    status: "reserved",
    condition: "new",
    qr_code: "QR001567",
    warranty_expires_at: "2025-08-20",
    purchase_date: "2024-08-20",
    purchase_price: 18900,
    notes: "Премиум модель с расширенным функционалом",
    created_at: "2024-08-20T10:00:00Z",
    updated_at: "2024-12-15T10:00:00Z",
  },
  {
    id: 3,
    type: "Сигнализация",
    model: "Pandora DX-90",
    brand: "Pandora",
    serial_number: "PD90002345",
    status: "installed",
    condition: "new",
    object_id: 1,
    qr_code: "QR002345",
    warranty_expires_at: "2025-04-10",
    purchase_date: "2024-04-10",
    purchase_price: 15600,
    notes: "Двухсторонняя сигнализация с автозапуском",
    created_at: "2024-04-10T10:00:00Z",
    updated_at: "2024-11-05T10:00:00Z",
  },
  {
    id: 4,
    type: "Иммобилайзер",
    model: "Mega SX-150",
    brand: "Mega",
    serial_number: "MG150003456",
    status: "in_stock",
    condition: "new",
    qr_code: "QR003456",
    warranty_expires_at: "2025-05-25",
    purchase_date: "2024-05-25",
    purchase_price: 8900,
    notes: "Надежная защита от угона",
    created_at: "2024-05-25T10:00:00Z",
    updated_at: "2024-05-25T10:00:00Z",
  },
  {
    id: 5,
    type: "Камера",
    model: "Blackvue DR900X-2CH",
    brand: "Blackvue",
    serial_number: "BV900X004567",
    status: "maintenance",
    condition: "used",
    qr_code: "QR004567",
    warranty_expires_at: "2024-12-31",
    purchase_date: "2023-12-31",
    purchase_price: 25400,
    notes: "Требует обновления прошивки",
    created_at: "2023-12-31T10:00:00Z",
    updated_at: "2024-12-01T10:00:00Z",
  },
  {
    id: 6,
    type: "GPS трекер",
    model: "StarLine M15 Eco",
    brand: "StarLine",
    serial_number: "SL15005678",
    imei: "860555666777888",
    phone_number: "+7 (999) 333-44-55",
    status: "in_stock",
    condition: "refurbished",
    qr_code: "QR005678",
    warranty_expires_at: "2025-01-20",
    purchase_date: "2024-01-20",
    purchase_price: 9800,
    notes: "Восстановленное устройство, проверено",
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-10-15T10:00:00Z",
  },
];

// Монтажи
export const mockInstallations: InstallationWithRelations[] = [
  {
    id: 1,
    type: "монтаж",
    status: "planned",
    priority: "high",
    scheduled_at: "2024-12-20T10:00:00Z",
    estimated_duration: 120,
    object_id: 1,
    installer_id: 1,
    location_id: 1,
    client_contact: "Иван Петрович (+7 999 111-11-11)",
    address: "г. Москва, ул. Тверская, д. 12, стр. 1",
    description: "Установка GPS трекера и сигнализации на Toyota Camry 2022",
    notes: "Клиент просил установку в скрытом месте",
    is_billable: true,
    cost: 8500,
    labor_cost: 3500,
    materials_cost: 5000,
    created_at: "2024-12-15T09:00:00Z",
    updated_at: "2024-12-15T09:00:00Z",
    created_by_user_id: 1,
    object: {
      id: 1,
      name: "Toyota Camry",
      type: "Легковой автомобиль",
      imei: "860123456789012",
      phone_number: "+7 (999) 111-22-33",
    },
    installer: {
      id: 1,
      first_name: "Алексей",
      last_name: "Иванов",
      phone: "+7 (999) 123-45-67",
      email: "a.ivanov@axenta.ru",
      type: "staff",
      specialization: ["GPS трекеры", "Сигнализации", "Иммобилайзеры"],
    },
    location: {
      id: 1,
      city: "Москва",
      region: "Московская область",
      country: "Россия",
    },
    equipment: [mockEquipment[0], mockEquipment[2]],
  },
  {
    id: 2,
    type: "диагностика",
    status: "in_progress",
    priority: "urgent",
    scheduled_at: "2024-12-19T14:30:00Z",
    estimated_duration: 60,
    object_id: 2,
    installer_id: 2,
    location_id: 1,
    client_contact: "Мария Сергеевна (+7 999 222-22-22)",
    address: "г. Москва, ул. Арбат, д. 25",
    description: "Диагностика неисправности GPS трекера",
    notes: "Клиент жалуется на неточные координаты",
    result: "Обнаружена проблема с антенной GPS",
    actual_duration: 45,
    is_billable: true,
    cost: 2500,
    labor_cost: 2500,
    created_at: "2024-12-19T08:00:00Z",
    updated_at: "2024-12-19T15:15:00Z",
    created_by_user_id: 1,
    object: {
      id: 2,
      name: "BMW X5",
      type: "Внедорожник",
      imei: "860987654321098",
      phone_number: "+7 (999) 222-33-44",
    },
    installer: {
      id: 2,
      first_name: "Дмитрий",
      last_name: "Петров",
      phone: "+7 (999) 234-56-78",
      email: "d.petrov@axenta.ru",
      type: "staff",
      specialization: ["GPS трекеры", "Камеры", "Датчики"],
    },
    location: {
      id: 1,
      city: "Москва",
      region: "Московская область",
      country: "Россия",
    },
  },
  {
    id: 3,
    type: "монтаж",
    status: "completed",
    priority: "normal",
    scheduled_at: "2024-12-18T11:00:00Z",
    estimated_duration: 90,
    object_id: 3,
    installer_id: 3,
    location_id: 2,
    client_contact: "Александр Викторович (+7 999 333-33-33)",
    address: "г. Санкт-Петербург, Невский пр., д. 100",
    description: "Установка иммобилайзера на Mercedes-Benz C-Class",
    notes: "Установка прошла успешно",
    result: "Иммобилайзер установлен и настроен",
    actual_duration: 85,
    is_billable: true,
    cost: 6200,
    labor_cost: 2700,
    materials_cost: 3500,
    created_at: "2024-12-16T10:00:00Z",
    updated_at: "2024-12-18T12:25:00Z",
    created_by_user_id: 2,
    object: {
      id: 3,
      name: "Mercedes-Benz C-Class",
      type: "Легковой автомобиль",
    },
    installer: {
      id: 3,
      first_name: "Сергей",
      last_name: "Сидоров",
      phone: "+7 (999) 345-67-89",
      email: "s.sidorov@contractor.ru",
      type: "contractor",
      specialization: ["Диагностика", "Обслуживание", "GPS трекеры"],
    },
    location: {
      id: 2,
      city: "Санкт-Петербург",
      region: "Ленинградская область",
      country: "Россия",
    },
    equipment: [mockEquipment[3]],
  },
  {
    id: 4,
    type: "обслуживание",
    status: "planned",
    priority: "normal",
    scheduled_at: "2024-12-21T09:30:00Z",
    estimated_duration: 45,
    object_id: 4,
    installer_id: 4,
    location_id: 3,
    client_contact: "Елена Андреевна (+7 999 444-44-44)",
    address: "г. Екатеринбург, ул. Ленина, д. 50",
    description: "Плановое обслуживание GPS трекера",
    notes: "Проверка работоспособности и обновление ПО",
    is_billable: true,
    cost: 1800,
    labor_cost: 1800,
    created_at: "2024-12-17T14:00:00Z",
    updated_at: "2024-12-17T14:00:00Z",
    created_by_user_id: 3,
    object: {
      id: 4,
      name: "Audi A6",
      type: "Легковой автомобиль",
      imei: "860555666777888",
      phone_number: "+7 (999) 333-44-55",
    },
    installer: {
      id: 4,
      first_name: "Михаил",
      last_name: "Козлов",
      phone: "+7 (999) 456-78-90",
      email: "m.kozlov@axenta.ru",
      type: "staff",
      specialization: ["Сигнализации", "Иммобилайзеры", "Камеры"],
    },
    location: {
      id: 3,
      city: "Екатеринбург",
      region: "Свердловская область",
      country: "Россия",
    },
  },
  {
    id: 5,
    type: "демонтаж",
    status: "cancelled",
    priority: "low",
    scheduled_at: "2024-12-17T16:00:00Z",
    estimated_duration: 30,
    object_id: 5,
    installer_id: 1,
    location_id: 1,
    client_contact: "Владимир Николаевич (+7 999 555-55-55)",
    address: "г. Москва, ул. Новый Арбат, д. 15",
    description: "Демонтаж старого GPS трекера",
    notes: "Клиент отменил заказ",
    is_billable: false,
    created_at: "2024-12-15T12:00:00Z",
    updated_at: "2024-12-17T10:00:00Z",
    created_by_user_id: 1,
    object: {
      id: 5,
      name: "Volkswagen Polo",
      type: "Легковой автомобиль",
    },
    installer: {
      id: 1,
      first_name: "Алексей",
      last_name: "Иванов",
      phone: "+7 (999) 123-45-67",
      email: "a.ivanov@axenta.ru",
      type: "staff",
      specialization: ["GPS трекеры", "Сигнализации", "Иммобилайзеры"],
    },
    location: {
      id: 1,
      city: "Москва",
      region: "Московская область",
      country: "Россия",
    },
  },
  {
    id: 6,
    type: "монтаж",
    status: "planned",
    priority: "high",
    scheduled_at: "2024-12-22T13:00:00Z",
    estimated_duration: 150,
    object_id: 6,
    installer_id: 2,
    location_id: 1,
    client_contact: "Дарья Олеговна (+7 999 666-66-66)",
    address: "г. Москва, ул. Садовая, д. 8, к. 2",
    description: "Установка комплексной системы безопасности",
    notes: "GPS трекер + сигнализация + камера",
    is_billable: true,
    cost: 15800,
    labor_cost: 5300,
    materials_cost: 10500,
    created_at: "2024-12-18T16:30:00Z",
    updated_at: "2024-12-18T16:30:00Z",
    created_by_user_id: 1,
    object: {
      id: 6,
      name: "Land Rover Range Rover",
      type: "Внедорожник",
    },
    installer: {
      id: 2,
      first_name: "Дмитрий",
      last_name: "Петров",
      phone: "+7 (999) 234-56-78",
      email: "d.petrov@axenta.ru",
      type: "staff",
      specialization: ["GPS трекеры", "Камеры", "Датчики"],
    },
    location: {
      id: 1,
      city: "Москва",
      region: "Московская область",
      country: "Россия",
    },
    equipment: [mockEquipment[1], mockEquipment[4]],
  },
  {
    id: 7,
    type: "диагностика",
    status: "planned",
    priority: "normal",
    scheduled_at: "2024-12-23T10:15:00Z",
    estimated_duration: 75,
    object_id: 7,
    installer_id: 3,
    location_id: 4,
    client_contact: "Роман Александрович (+7 999 777-77-77)",
    address: "г. Новосибирск, ул. Красный пр., д. 35",
    description: "Диагностика системы сигнализации",
    notes: "Проблемы с датчиками удара",
    is_billable: true,
    cost: 2800,
    labor_cost: 2800,
    created_at: "2024-12-19T11:45:00Z",
    updated_at: "2024-12-19T11:45:00Z",
    created_by_user_id: 4,
    object: {
      id: 7,
      name: "Hyundai Tucson",
      type: "Кроссовер",
    },
    installer: {
      id: 3,
      first_name: "Сергей",
      last_name: "Сидоров",
      phone: "+7 (999) 345-67-89",
      email: "s.sidorov@contractor.ru",
      type: "contractor",
      specialization: ["Диагностика", "Обслуживание", "GPS трекеры"],
    },
    location: {
      id: 4,
      city: "Новосибирск",
      region: "Новосибирская область",
      country: "Россия",
    },
  },
  {
    id: 8,
    type: "монтаж",
    status: "planned",
    priority: "normal",
    scheduled_at: "2024-12-24T14:45:00Z",
    estimated_duration: 105,
    object_id: 8,
    installer_id: 4,
    location_id: 5,
    client_contact: "Татьяна Ивановна (+7 999 888-88-88)",
    address: "г. Казань, ул. Баумана, д. 22",
    description: "Установка GPS трекера на коммерческий транспорт",
    notes: "Требуется скрытая установка",
    is_billable: true,
    cost: 7200,
    labor_cost: 2700,
    materials_cost: 4500,
    created_at: "2024-12-20T09:15:00Z",
    updated_at: "2024-12-20T09:15:00Z",
    created_by_user_id: 2,
    object: {
      id: 8,
      name: "Ford Transit",
      type: "Коммерческий транспорт",
    },
    installer: {
      id: 4,
      first_name: "Михаил",
      last_name: "Козлов",
      phone: "+7 (999) 456-78-90",
      email: "m.kozlov@axenta.ru",
      type: "staff",
      specialization: ["Сигнализации", "Иммобилайзеры", "Камеры"],
    },
    location: {
      id: 5,
      city: "Казань",
      region: "Республика Татарстан",
      country: "Россия",
    },
    equipment: [mockEquipment[5]],
  },
];

// Статистика монтажей
export const mockInstallationStats: InstallationStats = {
  total: 8,
  by_status: {
    planned: 5,
    in_progress: 1,
    completed: 1,
    cancelled: 1,
  },
  by_type: {
    монтаж: 4,
    диагностика: 2,
    демонтаж: 1,
    обслуживание: 1,
  },
  by_priority: {
    low: 1,
    normal: 4,
    high: 2,
    urgent: 1,
  },
  overdue: 0,
  today: 1,
  this_week: 6,
  this_month: 8,
  average_duration: 88,
  completion_rate: 75,
};

// Статистика монтажников
export const mockInstallerStats: InstallerStats = {
  total: 5,
  active: 4,
  by_type: {
    staff: 3,
    contractor: 1,
    partner: 1,
  },
  by_status: {
    available: 3,
    busy: 1,
    vacation: 1,
    sick: 0,
  },
  average_rating: 4.6,
  total_installations: 786,
  busiest_installer: {
    id: 5,
    name: "Андрей Морозов",
    installations_count: 298,
  },
};

// Статистика локаций
export const mockLocationStats: LocationStats = {
  total: 5,
  active: 5,
  by_region: {
    "Московская область": 1,
    "Ленинградская область": 1,
    "Свердловская область": 1,
    "Новосибирская область": 1,
    "Республика Татарстан": 1,
  },
  most_popular: {
    id: 1,
    city: "Москва",
    installations_count: 4,
  },
};

// Статистика оборудования
export const mockEquipmentStats: EquipmentStats = {
  total: 6,
  by_status: {
    in_stock: 3,
    reserved: 1,
    installed: 1,
    maintenance: 1,
  },
  by_condition: {
    new: 4,
    used: 1,
    refurbished: 1,
    damaged: 0,
  },
  low_stock: 2,
  warranty_expiring: 1,
};

// Функции для получения данных (имитация API)
export const getMockInstallations = (page = 1, per_page = 50, filters: any = {}) => {
  let filtered = [...mockInstallations];
  
  // Применяем фильтры
  if (filters.status) {
    filtered = filtered.filter(item => item.status === filters.status);
  }
  if (filters.type) {
    filtered = filtered.filter(item => item.type === filters.type);
  }
  if (filters.priority) {
    filtered = filtered.filter(item => item.priority === filters.priority);
  }
  if (filters.installer_id) {
    filtered = filtered.filter(item => item.installer_id === filters.installer_id);
  }
  if (filters.location_id) {
    filtered = filtered.filter(item => item.location_id === filters.location_id);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.description?.toLowerCase().includes(search) ||
      item.client_contact.toLowerCase().includes(search) ||
      item.address.toLowerCase().includes(search) ||
      item.object.name.toLowerCase().includes(search)
    );
  }
  
  // Пагинация
  const start = (page - 1) * per_page;
  const end = start + per_page;
  const items = filtered.slice(start, end);
  
  return {
    items,
    total: filtered.length,
    page,
    per_page,
    pages: Math.ceil(filtered.length / per_page),
  };
};

export const getMockInstallers = (page = 1, per_page = 50, filters: any = {}) => {
  let filtered = [...mockInstallers];
  
  // Применяем фильтры
  if (filters.type) {
    filtered = filtered.filter(item => item.type === filters.type);
  }
  if (filters.status) {
    filtered = filtered.filter(item => item.status === filters.status);
  }
  if (filters.specialization) {
    filtered = filtered.filter(item => 
      item.specialization.some(spec => 
        spec.toLowerCase().includes(filters.specialization.toLowerCase())
      )
    );
  }
  if (filters.location_id) {
    filtered = filtered.filter(item => item.location_ids.includes(filters.location_id));
  }
  if (filters.is_active !== undefined) {
    filtered = filtered.filter(item => item.is_active === filters.is_active);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      `${item.first_name} ${item.last_name}`.toLowerCase().includes(search) ||
      item.phone.includes(search) ||
      item.email.toLowerCase().includes(search)
    );
  }
  
  // Пагинация
  const start = (page - 1) * per_page;
  const end = start + per_page;
  const items = filtered.slice(start, end);
  
  return {
    items,
    total: filtered.length,
    page,
    per_page,
    pages: Math.ceil(filtered.length / per_page),
  };
};

export const getMockEquipment = (page = 1, per_page = 50, filters: any = {}) => {
  let filtered = [...mockEquipment];
  
  // Применяем фильтры
  if (filters.type) {
    filtered = filtered.filter(item => item.type === filters.type);
  }
  if (filters.status) {
    filtered = filtered.filter(item => item.status === filters.status);
  }
  if (filters.condition) {
    filtered = filtered.filter(item => item.condition === filters.condition);
  }
  if (filters.object_id) {
    filtered = filtered.filter(item => item.object_id === filters.object_id);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.model.toLowerCase().includes(search) ||
      item.brand.toLowerCase().includes(search) ||
      item.serial_number.toLowerCase().includes(search) ||
      item.type.toLowerCase().includes(search)
    );
  }
  
  // Пагинация
  const start = (page - 1) * per_page;
  const end = start + per_page;
  const items = filtered.slice(start, end);
  
  return {
    items,
    total: filtered.length,
    page,
    per_page,
    pages: Math.ceil(filtered.length / per_page),
  };
};

export const getMockLocations = (page = 1, per_page = 50, filters: any = {}) => {
  let filtered = [...mockLocations];
  
  // Применяем фильтры
  if (filters.region) {
    filtered = filtered.filter(item => item.region === filters.region);
  }
  if (filters.country) {
    filtered = filtered.filter(item => item.country === filters.country);
  }
  if (filters.is_active !== undefined) {
    filtered = filtered.filter(item => item.is_active === filters.is_active);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.city.toLowerCase().includes(search) ||
      item.region.toLowerCase().includes(search) ||
      item.country.toLowerCase().includes(search)
    );
  }
  
  // Пагинация
  const start = (page - 1) * per_page;
  const end = start + per_page;
  const items = filtered.slice(start, end);
  
  return {
    items,
    total: filtered.length,
    page,
    per_page,
    pages: Math.ceil(filtered.length / per_page),
  };
};
