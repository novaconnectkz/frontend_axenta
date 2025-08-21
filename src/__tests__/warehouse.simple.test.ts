import { describe, it, expect, beforeEach } from 'vitest';
import { warehouseService } from '@/services/warehouseService';
import { 
  mockEquipmentCategories, 
  mockEquipment, 
  mockWarehouseOperations,
  mockStockAlerts,
  mockWarehouseStats 
} from '@/services/mockWarehouseData';

describe('Warehouse Service', () => {
  beforeEach(() => {
    // Убеждаемся, что используем mock данные
    warehouseService.setUseMockData(true);
  });

  describe('Equipment Management', () => {
    it('should get equipment list', async () => {
      const response = await warehouseService.getEquipment();
      
      expect(response).toBeDefined();
      expect(response.data).toBeInstanceOf(Array);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.total).toBeGreaterThan(0);
    });

    it('should filter equipment by status', async () => {
      const response = await warehouseService.getEquipment({ status: 'in_stock' });
      
      expect(response.data.every(eq => eq.status === 'in_stock')).toBe(true);
    });

    it('should search equipment by serial number', async () => {
      const response = await warehouseService.getEquipment({ search: 'GT06N001' });
      
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data[0].serial_number).toBe('GT06N001');
    });

    it('should get equipment by ID', async () => {
      const equipment = await warehouseService.getEquipmentById(1);
      
      expect(equipment).toBeDefined();
      expect(equipment.id).toBe(1);
      expect(equipment.model).toBe('GT06N');
    });

    it('should search equipment by QR code', async () => {
      const equipment = await warehouseService.searchByQRCode('EQ-1-GT06N001');
      
      expect(equipment).toBeDefined();
      expect(equipment.qr_code).toBe('EQ-1-GT06N001');
    });
  });

  describe('Equipment Categories', () => {
    it('should get equipment categories', async () => {
      const categories = await warehouseService.getEquipmentCategories();
      
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('code');
    });

    it('should filter active categories only', async () => {
      const categories = await warehouseService.getEquipmentCategories(true);
      
      expect(categories.every(cat => cat.is_active)).toBe(true);
    });

    it('should create new category', async () => {
      const newCategory = {
        name: 'Тестовая категория',
        description: 'Описание тестовой категории',
        code: 'TEST',
        min_stock_level: 5,
        is_active: true,
      };

      const created = await warehouseService.createEquipmentCategory(newCategory);
      
      expect(created).toBeDefined();
      expect(created.name).toBe(newCategory.name);
      expect(created.code).toBe(newCategory.code);
    });
  });

  describe('Warehouse Operations', () => {
    it('should get warehouse operations', async () => {
      const response = await warehouseService.getWarehouseOperations();
      
      expect(response).toBeDefined();
      expect(response.data).toBeInstanceOf(Array);
      expect(response.pagination).toBeDefined();
    });

    it('should filter operations by type', async () => {
      const response = await warehouseService.getWarehouseOperations({ type: 'receive' });
      
      expect(response.data.every(op => op.type === 'receive')).toBe(true);
    });

    it('should create warehouse operation', async () => {
      const operation = {
        type: 'receive' as const,
        description: 'Тестовое поступление',
        equipment_id: 1,
        to_location: 'A1-01',
        user_id: 1,
      };

      const created = await warehouseService.createWarehouseOperation(operation);
      
      expect(created).toBeDefined();
      expect(created.type).toBe('receive');
      expect(created.description).toBe('Тестовое поступление');
    });
  });

  describe('Stock Alerts', () => {
    it('should get stock alerts', async () => {
      const response = await warehouseService.getStockAlerts();
      
      expect(response).toBeDefined();
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should filter active alerts only', async () => {
      const response = await warehouseService.getStockAlerts({ status: 'active' });
      
      expect(response.data.every(alert => alert.status === 'active')).toBe(true);
    });

    it('should acknowledge alert', async () => {
      const alert = await warehouseService.acknowledgeStockAlert(1);
      
      expect(alert).toBeDefined();
      expect(alert.status).toBe('acknowledged');
      expect(alert.read_at).toBeDefined();
    });

    it('should resolve alert', async () => {
      const alert = await warehouseService.resolveStockAlert(1);
      
      expect(alert).toBeDefined();
      expect(alert.status).toBe('resolved');
      expect(alert.resolved_at).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should get warehouse statistics', async () => {
      const stats = await warehouseService.getWarehouseStats();
      
      expect(stats).toBeDefined();
      expect(stats.total_equipment).toBeGreaterThan(0);
      expect(stats.available_equipment).toBeGreaterThan(0);
      expect(stats.by_category).toBeDefined();
      expect(stats.operations_by_type).toBeDefined();
    });

    it('should get equipment statistics', async () => {
      const stats = await warehouseService.getEquipmentStats();
      
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.by_type).toBeDefined();
      expect(stats.by_manufacturer).toBeDefined();
    });

    it('should get low stock equipment', async () => {
      const lowStock = await warehouseService.getLowStockEquipment(10);
      
      expect(lowStock).toBeInstanceOf(Array);
      // Проверяем, что все элементы действительно имеют низкий остаток
      expect(lowStock.every(item => item.in_stock < item.threshold)).toBe(true);
    });
  });

  describe('Equipment Operations', () => {
    it('should install equipment', async () => {
      const equipment = await warehouseService.installEquipment(1, { object_id: 15 });
      
      expect(equipment).toBeDefined();
      expect(equipment.status).toBe('installed');
      expect(equipment.object_id).toBe(15);
    });

    it('should uninstall equipment', async () => {
      const equipment = await warehouseService.uninstallEquipment(3);
      
      expect(equipment).toBeDefined();
      expect(equipment.status).toBe('in_stock');
      expect(equipment.object_id).toBeNull();
    });

    it('should transfer equipment', async () => {
      const transferData = {
        equipment_id: 1,
        from_location: 'A1-01',
        to_location: 'B2-03',
        user_id: 1,
        notes: 'Тестовое перемещение',
      };

      const operation = await warehouseService.transferEquipment(transferData);
      
      expect(operation).toBeDefined();
      expect(operation.type).toBe('transfer');
      expect(operation.from_location).toBe('A1-01');
      expect(operation.to_location).toBe('B2-03');
    });
  });
});

describe('Mock Data Validation', () => {
  it('should have valid equipment categories', () => {
    expect(mockEquipmentCategories).toBeInstanceOf(Array);
    expect(mockEquipmentCategories.length).toBeGreaterThan(0);
    
    mockEquipmentCategories.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('code');
      expect(category).toHaveProperty('min_stock_level');
      expect(category.min_stock_level).toBeGreaterThan(0);
    });
  });

  it('should have valid equipment data', () => {
    expect(mockEquipment).toBeInstanceOf(Array);
    expect(mockEquipment.length).toBeGreaterThan(0);
    
    mockEquipment.forEach(equipment => {
      expect(equipment).toHaveProperty('id');
      expect(equipment).toHaveProperty('serial_number');
      expect(equipment).toHaveProperty('model');
      expect(equipment).toHaveProperty('brand');
      expect(equipment).toHaveProperty('status');
      expect(equipment).toHaveProperty('condition');
      expect(equipment.serial_number).toBeTruthy();
    });
  });

  it('should have valid warehouse operations', () => {
    expect(mockWarehouseOperations).toBeInstanceOf(Array);
    expect(mockWarehouseOperations.length).toBeGreaterThan(0);
    
    mockWarehouseOperations.forEach(operation => {
      expect(operation).toHaveProperty('id');
      expect(operation).toHaveProperty('type');
      expect(operation).toHaveProperty('equipment_id');
      expect(operation).toHaveProperty('status');
      expect(['receive', 'issue', 'transfer', 'inventory', 'maintenance', 'disposal']).toContain(operation.type);
    });
  });

  it('should have valid stock alerts', () => {
    expect(mockStockAlerts).toBeInstanceOf(Array);
    expect(mockStockAlerts.length).toBeGreaterThan(0);
    
    mockStockAlerts.forEach(alert => {
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('status');
      expect(['low_stock', 'expired_warranty', 'maintenance_due', 'equipment_movement']).toContain(alert.type);
      expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
    });
  });

  it('should have valid warehouse statistics', () => {
    expect(mockWarehouseStats).toBeDefined();
    expect(mockWarehouseStats.total_equipment).toBeGreaterThan(0);
    expect(mockWarehouseStats.by_category).toBeDefined();
    expect(mockWarehouseStats.operations_by_type).toBeDefined();
    expect(mockWarehouseStats.alerts_by_severity).toBeDefined();
  });
});
