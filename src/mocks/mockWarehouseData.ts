import type {
  EquipmentBase,
  EquipmentCategory,
  WarehouseOperation,
  StockAlert,
} from "@/types/warehouse";
import type { WarehouseStats } from "@/types/dashboard";

// Mock категории оборудования
export const mockEquipmentCategories: EquipmentCategory[] = [
  {
    id: 1,
    name: "GPS-трекеры",
    description: "GPS трекеры для мониторинга транспорта и объектов",
    code: "GPS",
    min_stock_level: 15,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "IP-камеры",
    description: "IP камеры видеонаблюдения различных типов",
    code: "CAM",
    min_stock_level: 10,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 3,
    name: "Датчики",
    description: "Датчики движения, температуры, влажности",
    code: "SENS",
    min_stock_level: 20,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 4,
    name: "Кабели",
    description: "Кабели питания, сетевые кабели",
    code: "CBL",
    min_stock_level: 50,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 5,
    name: "Коммутаторы",
    description: "Сетевые коммутаторы и маршрутизаторы",
    code: "NET",
    min_stock_level: 5,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
];

// Mock оборудование
export const mockEquipment: EquipmentBase[] = [
  {
    id: 1,
    type: "GPS-tracker",
    model: "GT06N",
    brand: "Concox",
    serial_number: "GT06N001",
    imei: "123456789012345",
    phone_number: "+79001234567",
    mac_address: "",
    qr_code: "EQ-1-GT06N001",
    status: "in_stock",
    condition: "new",
    object_id: null,
    category_id: 1,
    warehouse_location: "A1-01",
    purchase_price: "2500.00",
    purchase_date: "2024-01-15T00:00:00Z",
    warranty_until: "2025-01-15T00:00:00Z",
    specifications: '{"voltage": "12V", "power": "5W", "gps_accuracy": "2.5m"}',
    notes: "Новое оборудование, готово к установке",
    last_maintenance_at: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    category: mockEquipmentCategories[0],
  },
  {
    id: 2,
    type: "IP-camera",
    model: "DS-2CD2043G2-I",
    brand: "Hikvision",
    serial_number: "HIK2043001",
    imei: "",
    phone_number: "",
    mac_address: "00:1A:2B:3C:4D:5E",
    qr_code: "EQ-2-HIK2043001",
    status: "in_stock",
    condition: "new",
    object_id: null,
    category_id: 2,
    warehouse_location: "B2-03",
    purchase_price: "8500.00",
    purchase_date: "2024-02-01T00:00:00Z",
    warranty_until: "2026-02-01T00:00:00Z",
    specifications: '{"resolution": "4MP", "lens": "2.8mm", "night_vision": "30m"}',
    notes: "4MP IP камера с ИК подсветкой",
    last_maintenance_at: null,
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-01T10:00:00Z",
    category: mockEquipmentCategories[1],
  },
  {
    id: 3,
    type: "GPS-tracker",
    model: "Teltonika FMB920",
    brand: "Teltonika",
    serial_number: "FMB920001",
    imei: "123456789012346",
    phone_number: "+79001234568",
    mac_address: "",
    qr_code: "EQ-3-FMB920001",
    status: "installed",
    condition: "new",
    object_id: 15,
    category_id: 1,
    warehouse_location: "",
    purchase_price: "4200.00",
    purchase_date: "2024-01-20T00:00:00Z",
    warranty_until: "2026-01-20T00:00:00Z",
    specifications: '{"voltage": "9-30V", "power": "8W", "gps_accuracy": "1.5m", "accelerometer": true}',
    notes: "Установлен на объекте ТЦ Галерея",
    last_maintenance_at: null,
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-03-15T14:30:00Z",
    category: mockEquipmentCategories[0],
  },
  {
    id: 4,
    type: "Sensor",
    model: "PIR-Motion-01",
    brand: "Generic",
    serial_number: "PIR001",
    imei: "",
    phone_number: "",
    mac_address: "",
    qr_code: "EQ-4-PIR001",
    status: "in_stock",
    condition: "new",
    object_id: null,
    category_id: 3,
    warehouse_location: "C1-05",
    purchase_price: "850.00",
    purchase_date: "2024-02-10T00:00:00Z",
    warranty_until: "2025-02-10T00:00:00Z",
    specifications: '{"detection_range": "8m", "detection_angle": "110°", "power": "3V"}',
    notes: "Датчик движения для помещений",
    last_maintenance_at: null,
    created_at: "2024-02-10T10:00:00Z",
    updated_at: "2024-02-10T10:00:00Z",
    category: mockEquipmentCategories[2],
  },
  {
    id: 5,
    type: "Cable",
    model: "UTP Cat6",
    brand: "CommScope",
    serial_number: "CAT6-305M-001",
    imei: "",
    phone_number: "",
    mac_address: "",
    qr_code: "EQ-5-CAT6001",
    status: "in_stock",
    condition: "new",
    object_id: null,
    category_id: 4,
    warehouse_location: "D3-01",
    purchase_price: "12500.00",
    purchase_date: "2024-01-25T00:00:00Z",
    warranty_until: "2029-01-25T00:00:00Z",
    specifications: '{"length": "305m", "category": "Cat6", "bandwidth": "250MHz"}',
    notes: "Бухта кабеля UTP Cat6 305 метров",
    last_maintenance_at: null,
    created_at: "2024-01-25T10:00:00Z",
    updated_at: "2024-01-25T10:00:00Z",
    category: mockEquipmentCategories[3],
  },
  {
    id: 6,
    type: "Switch",
    model: "TL-SG1008D",
    brand: "TP-Link",
    serial_number: "TPSG1008001",
    imei: "",
    phone_number: "",
    mac_address: "00:1A:2B:3C:4D:5F",
    qr_code: "EQ-6-TPSG1008001",
    status: "reserved",
    condition: "new",
    object_id: null,
    category_id: 5,
    warehouse_location: "E1-02",
    purchase_price: "1200.00",
    purchase_date: "2024-02-05T00:00:00Z",
    warranty_until: "2027-02-05T00:00:00Z",
    specifications: '{"ports": "8x10/100/1000Mbps", "power": "4.8W", "type": "unmanaged"}',
    notes: "Зарезервирован для монтажа на объекте Офис Центр",
    last_maintenance_at: null,
    created_at: "2024-02-05T10:00:00Z",
    updated_at: "2024-03-10T09:15:00Z",
    category: mockEquipmentCategories[4],
  },
  {
    id: 7,
    type: "GPS-tracker",
    model: "GT06N",
    brand: "Concox",
    serial_number: "GT06N002",
    imei: "123456789012347",
    phone_number: "+79001234569",
    mac_address: "",
    qr_code: "EQ-7-GT06N002",
    status: "maintenance",
    condition: "used",
    object_id: null,
    category_id: 1,
    warehouse_location: "A1-02",
    purchase_price: "2500.00",
    purchase_date: "2024-01-10T00:00:00Z",
    warranty_until: "2025-01-10T00:00:00Z",
    specifications: '{"voltage": "12V", "power": "5W", "gps_accuracy": "2.5m"}',
    notes: "Требует замены антенны GPS",
    last_maintenance_at: "2024-03-01T00:00:00Z",
    created_at: "2024-01-10T10:00:00Z",
    updated_at: "2024-03-01T10:00:00Z",
    category: mockEquipmentCategories[0],
  },
  {
    id: 8,
    type: "IP-camera",
    model: "DS-2CD2043G2-I",
    brand: "Hikvision",
    serial_number: "HIK2043002",
    imei: "",
    phone_number: "",
    mac_address: "00:1A:2B:3C:4D:60",
    qr_code: "EQ-8-HIK2043002",
    status: "broken",
    condition: "damaged",
    object_id: null,
    category_id: 2,
    warehouse_location: "F1-01",
    purchase_price: "8500.00",
    purchase_date: "2024-01-30T00:00:00Z",
    warranty_until: "2026-01-30T00:00:00Z",
    specifications: '{"resolution": "4MP", "lens": "2.8mm", "night_vision": "30m"}',
    notes: "Повреждена при транспортировке, требует ремонта",
    last_maintenance_at: null,
    created_at: "2024-01-30T10:00:00Z",
    updated_at: "2024-03-05T16:20:00Z",
    category: mockEquipmentCategories[1],
  },
  {
    id: 9,
    type: "Sensor",
    model: "DHT22",
    brand: "Aosong",
    serial_number: "DHT22001",
    imei: "",
    phone_number: "",
    mac_address: "",
    qr_code: "EQ-9-DHT22001",
    status: "in_stock",
    condition: "new",
    object_id: null,
    category_id: 3,
    warehouse_location: "C1-06",
    purchase_price: "450.00",
    purchase_date: "2024-02-15T00:00:00Z",
    warranty_until: "2025-02-15T00:00:00Z",
    specifications: '{"type": "temperature_humidity", "range_temp": "-40°C to 80°C", "range_humidity": "0-100%"}',
    notes: "Датчик температуры и влажности",
    last_maintenance_at: null,
    created_at: "2024-02-15T10:00:00Z",
    updated_at: "2024-02-15T10:00:00Z",
    category: mockEquipmentCategories[2],
  },
  {
    id: 10,
    type: "GPS-tracker",
    model: "Teltonika FMB920",
    brand: "Teltonika",
    serial_number: "FMB920002",
    imei: "123456789012348",
    phone_number: "+79001234570",
    mac_address: "",
    qr_code: "EQ-10-FMB920002",
    status: "in_stock",
    condition: "refurbished",
    object_id: null,
    category_id: 1,
    warehouse_location: "A1-03",
    purchase_price: "4200.00",
    purchase_date: "2024-01-05T00:00:00Z",
    warranty_until: "2025-01-05T00:00:00Z",
    specifications: '{"voltage": "9-30V", "power": "8W", "gps_accuracy": "1.5m", "accelerometer": true}',
    notes: "Восстановленное после ремонта",
    last_maintenance_at: "2024-02-20T00:00:00Z",
    created_at: "2024-01-05T10:00:00Z",
    updated_at: "2024-02-20T10:00:00Z",
    category: mockEquipmentCategories[0],
  },
];

// Mock складские операции
export const mockWarehouseOperations: WarehouseOperation[] = [
  {
    id: 1,
    type: "receive",
    description: "Поступление нового оборудования от поставщика",
    status: "completed",
    equipment_id: 1,
    quantity: 1,
    from_location: "Поставщик",
    to_location: "A1-01",
    user_id: 1,
    document_number: "DOC-2024-001",
    notes: "Проверено, соответствует спецификации",
    installation_id: null,
    company_id: 1,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    equipment: mockEquipment[0],
    user: {
      id: 1,
      username: "admin",
      first_name: "Иван",
      last_name: "Петров",
      email: "admin@company.com",
    },
  },
  {
    id: 2,
    type: "issue",
    description: "Выдача оборудования для монтажа",
    status: "completed",
    equipment_id: 3,
    quantity: 1,
    from_location: "A1-03",
    to_location: "Объект ТЦ Галерея",
    user_id: 2,
    document_number: "ISS-2024-001",
    notes: "Выдано для установки на объекте",
    installation_id: 5,
    company_id: 1,
    created_at: "2024-03-15T14:30:00Z",
    updated_at: "2024-03-15T14:30:00Z",
    equipment: mockEquipment[2],
    user: {
      id: 2,
      username: "installer1",
      first_name: "Сергей",
      last_name: "Монтажников",
      email: "installer1@company.com",
    },
  },
  {
    id: 3,
    type: "transfer",
    description: "Перемещение оборудования между полками",
    status: "completed",
    equipment_id: 6,
    quantity: 1,
    from_location: "E2-01",
    to_location: "E1-02",
    user_id: 3,
    document_number: "TRN-2024-001",
    notes: "Перемещение для удобства доступа",
    installation_id: null,
    company_id: 1,
    created_at: "2024-03-10T09:15:00Z",
    updated_at: "2024-03-10T09:15:00Z",
    equipment: mockEquipment[5],
    user: {
      id: 3,
      username: "warehouse1",
      first_name: "Мария",
      last_name: "Складская",
      email: "warehouse1@company.com",
    },
  },
  {
    id: 4,
    type: "maintenance",
    description: "Плановое обслуживание GPS трекера",
    status: "completed",
    equipment_id: 7,
    quantity: 1,
    from_location: "A1-02",
    to_location: "Мастерская",
    user_id: 4,
    document_number: "MNT-2024-001",
    notes: "Замена антенны GPS, проверка функциональности",
    installation_id: null,
    company_id: 1,
    created_at: "2024-03-01T10:00:00Z",
    updated_at: "2024-03-01T15:00:00Z",
    equipment: mockEquipment[6],
    user: {
      id: 4,
      username: "tech1",
      first_name: "Алексей",
      last_name: "Техников",
      email: "tech1@company.com",
    },
  },
  {
    id: 5,
    type: "inventory",
    description: "Инвентаризация склада - зона A",
    status: "completed",
    equipment_id: 1,
    quantity: 1,
    from_location: "",
    to_location: "A1-01",
    user_id: 3,
    document_number: "INV-2024-001",
    notes: "Подтверждено местоположение и состояние",
    installation_id: null,
    company_id: 1,
    created_at: "2024-03-20T08:00:00Z",
    updated_at: "2024-03-20T08:00:00Z",
    equipment: mockEquipment[0],
    user: {
      id: 3,
      username: "warehouse1",
      first_name: "Мария",
      last_name: "Складская",
      email: "warehouse1@company.com",
    },
  },
];

// Mock уведомления о складе
export const mockStockAlerts: StockAlert[] = [
  {
    id: 1,
    type: "low_stock",
    title: "Низкий остаток IP-камер",
    description: "На складе осталось только 3 IP-камеры модели DS-2CD2043G2-I",
    severity: "high",
    equipment_id: null,
    equipment_category_id: 2,
    status: "active",
    read_at: null,
    resolved_at: null,
    assigned_user_id: 3,
    metadata: '{"current_stock": 3, "min_level": 10, "category": "IP-камеры"}',
    company_id: 1,
    created_at: "2024-03-20T10:00:00Z",
    updated_at: "2024-03-20T10:00:00Z",
    equipment_category: mockEquipmentCategories[1],
    assigned_user: {
      id: 3,
      username: "warehouse1",
      first_name: "Мария",
      last_name: "Складская",
      email: "warehouse1@company.com",
    },
  },
  {
    id: 2,
    type: "expired_warranty",
    title: "Истекла гарантия на оборудование",
    description: "У GPS трекера GT06N002 истекла гарантия",
    severity: "medium",
    equipment_id: 7,
    equipment_category_id: null,
    status: "acknowledged",
    read_at: "2024-03-18T09:00:00Z",
    resolved_at: null,
    assigned_user_id: 4,
    metadata: '{"warranty_expired_days": 5}',
    company_id: 1,
    created_at: "2024-03-15T00:00:00Z",
    updated_at: "2024-03-18T09:00:00Z",
    equipment: mockEquipment[6],
    assigned_user: {
      id: 4,
      username: "tech1",
      first_name: "Алексей",
      last_name: "Техников",
      email: "tech1@company.com",
    },
  },
  {
    id: 3,
    type: "maintenance_due",
    title: "Требуется обслуживание",
    description: "IP-камера HIK2043002 требует планового обслуживания",
    severity: "low",
    equipment_id: 8,
    equipment_category_id: null,
    status: "active",
    read_at: null,
    resolved_at: null,
    assigned_user_id: 4,
    metadata: '{"last_maintenance": null, "recommended_interval": "6 months"}',
    company_id: 1,
    created_at: "2024-03-22T08:00:00Z",
    updated_at: "2024-03-22T08:00:00Z",
    equipment: mockEquipment[7],
    assigned_user: {
      id: 4,
      username: "tech1",
      first_name: "Алексей",
      last_name: "Техников",
      email: "tech1@company.com",
    },
  },
  {
    id: 4,
    type: "low_stock",
    title: "Критически низкий остаток кабелей",
    description: "На складе осталось только 2 бухты кабеля UTP Cat6",
    severity: "critical",
    equipment_id: null,
    equipment_category_id: 4,
    status: "active",
    read_at: null,
    resolved_at: null,
    assigned_user_id: 3,
    metadata: '{"current_stock": 2, "min_level": 50, "category": "Кабели"}',
    company_id: 1,
    created_at: "2024-03-22T12:00:00Z",
    updated_at: "2024-03-22T12:00:00Z",
    equipment_category: mockEquipmentCategories[3],
    assigned_user: {
      id: 3,
      username: "warehouse1",
      first_name: "Мария",
      last_name: "Складская",
      email: "warehouse1@company.com",
    },
  },
];

// Mock статистика склада
export const mockWarehouseStats: WarehouseStats = {
  total_equipment: 1247,
  available_equipment: 856,
  installed_equipment: 312,
  reserved_equipment: 79,
  maintenance_equipment: 15,
  broken_equipment: 8,
  low_stock_alerts: 4,
  categories_count: 15,
  recent_operations: 23,
  by_category: {
    "GPS-трекеры": 450,
    "IP-камеры": 320,
    "Датчики": 180,
    "Кабели": 150,
    "Коммутаторы": 85,
    "Блоки питания": 62,
  },
  operations_by_type: {
    receive: 8,
    issue: 12,
    transfer: 3,
    maintenance: 2,
    inventory: 1,
  },
  alerts_by_severity: {
    critical: 1,
    high: 1,
    medium: 1,
    low: 1,
  },
};

// Mock данные для графиков склада
export const mockWarehouseChartData = {
  "equipment-by-status": {
    labels: ["В наличии", "Установлено", "Зарезервировано", "На обслуживании", "Сломано"],
    datasets: [
      {
        label: "Количество",
        data: [856, 312, 79, 15, 8],
        backgroundColor: [
          "rgba(76, 175, 80, 0.8)",
          "rgba(33, 150, 243, 0.8)",
          "rgba(255, 193, 7, 0.8)",
          "rgba(156, 39, 176, 0.8)",
          "rgba(244, 67, 54, 0.8)",
        ],
        borderColor: [
          "rgba(76, 175, 80, 1)",
          "rgba(33, 150, 243, 1)",
          "rgba(255, 193, 7, 1)",
          "rgba(156, 39, 176, 1)",
          "rgba(244, 67, 54, 1)",
        ],
        borderWidth: 1,
      },
    ],
  },
  "operations-monthly": {
    labels: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"],
    datasets: [
      {
        label: "Поступления",
        data: [45, 52, 38, 41, 48, 35],
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        borderColor: "rgba(76, 175, 80, 1)",
        borderWidth: 2,
      },
      {
        label: "Выдачи",
        data: [32, 28, 41, 35, 39, 42],
        backgroundColor: "rgba(33, 150, 243, 0.2)",
        borderColor: "rgba(33, 150, 243, 1)",
        borderWidth: 2,
      },
    ],
  },
};

// Функция для получения mock данных оборудования с фильтрацией
export const getMockEquipment = (filters: any = {}) => {
  let filteredEquipment = [...mockEquipment];

  if (filters.type) {
    filteredEquipment = filteredEquipment.filter(eq => eq.type === filters.type);
  }

  if (filters.status) {
    filteredEquipment = filteredEquipment.filter(eq => eq.status === filters.status);
  }

  if (filters.condition) {
    filteredEquipment = filteredEquipment.filter(eq => eq.condition === filters.condition);
  }

  if (filters.category_id) {
    filteredEquipment = filteredEquipment.filter(eq => eq.category_id === filters.category_id);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredEquipment = filteredEquipment.filter(eq => 
      eq.serial_number.toLowerCase().includes(searchLower) ||
      eq.model.toLowerCase().includes(searchLower) ||
      eq.brand.toLowerCase().includes(searchLower) ||
      eq.imei.toLowerCase().includes(searchLower) ||
      eq.phone_number.includes(searchLower) ||
      eq.qr_code.toLowerCase().includes(searchLower)
    );
  }

  if (filters.available === "true") {
    filteredEquipment = filteredEquipment.filter(eq => 
      eq.status === "in_stock" && eq.condition !== "broken" && eq.condition !== "damaged"
    );
  }

  return filteredEquipment;
};

// Функция для получения mock операций с фильтрацией
export const getMockWarehouseOperations = (filters: any = {}) => {
  let filteredOperations = [...mockWarehouseOperations];

  if (filters.type) {
    filteredOperations = filteredOperations.filter(op => op.type === filters.type);
  }

  if (filters.status) {
    filteredOperations = filteredOperations.filter(op => op.status === filters.status);
  }

  if (filters.equipment_id) {
    filteredOperations = filteredOperations.filter(op => op.equipment_id === filters.equipment_id);
  }

  if (filters.date_from) {
    filteredOperations = filteredOperations.filter(op => 
      new Date(op.created_at) >= new Date(filters.date_from)
    );
  }

  if (filters.date_to) {
    filteredOperations = filteredOperations.filter(op => 
      new Date(op.created_at) <= new Date(filters.date_to)
    );
  }

  return filteredOperations;
};

// Функция для получения mock уведомлений с фильтрацией
export const getMockStockAlerts = (filters: any = {}) => {
  let filteredAlerts = [...mockStockAlerts];

  if (filters.type) {
    filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
  }

  if (filters.status) {
    filteredAlerts = filteredAlerts.filter(alert => alert.status === filters.status);
  }

  if (filters.severity) {
    filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
  }

  if (filters.include_resolved !== "true") {
    filteredAlerts = filteredAlerts.filter(alert => alert.status === "active");
  }

  return filteredAlerts;
};

// Функция для симуляции задержки
export const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
