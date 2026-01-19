/**
 * Сервис кэширования Wialon аккаунтов через IndexedDB
 * Использует Dexie.js для простого API
 */

import Dexie, { type Table } from 'dexie';

// Интерфейс для кэшированного аккаунта Wialon
export interface CachedWialonAccount {
    id: number;
    connectionId: number;
    name: string;
    type: string;
    isActive: boolean;
    objectsTotal: number;
    objectsActive: number;
    objectsDeactivated?: number;
    source?: string;
    sourceLabel?: string;
    createdAt?: string;
    dealerRights?: boolean;
    hierarchy?: string;
    billingAccountId?: number;
    _cachedAt: number; // Timestamp кэширования
}

// Интерфейс для кэшированной статистики
export interface CachedWialonStats {
    connectionId: number;
    stats: Record<number, { objectsTotal: number; objectsActive: number; objectsDeactivated?: number }>;
    totalObjects: number;
    _cachedAt: number;
}

// Интерфейс для метаданных кэша
export interface CacheMetadata {
    key: string;
    value: any;
}

// Класс базы данных Dexie
class AxentaCacheDB extends Dexie {
    wialonAccounts!: Table<CachedWialonAccount, number>;
    wialonStats!: Table<CachedWialonStats, number>;
    metadata!: Table<CacheMetadata, string>;

    constructor() {
        super('AxentaCache');

        this.version(1).stores({
            wialonAccounts: 'id, connectionId, name, _cachedAt',
            wialonStats: 'connectionId, _cachedAt',
            metadata: 'key'
        });
    }
}

// Singleton экземпляр базы данных
const db = new AxentaCacheDB();

// TTL кэша в миллисекундах (5 минут)
const CACHE_TTL = 5 * 60 * 1000;

class WialonCacheService {
    private static instance: WialonCacheService;

    static getInstance(): WialonCacheService {
        if (!WialonCacheService.instance) {
            WialonCacheService.instance = new WialonCacheService();
        }
        return WialonCacheService.instance;
    }

    /**
     * Получить аккаунты из кэша
     * @param connectionId опционально — фильтр по подключению
     */
    async getAccounts(connectionId?: number): Promise<CachedWialonAccount[]> {
        try {
            let accounts: CachedWialonAccount[];

            if (connectionId !== undefined) {
                accounts = await db.wialonAccounts.where('connectionId').equals(connectionId).toArray();
            } else {
                accounts = await db.wialonAccounts.toArray();
            }

            console.log(`📦 WialonCache: получено ${accounts.length} аккаунтов из кэша`);
            return accounts;
        } catch (error) {
            console.error('❌ WialonCache: ошибка получения аккаунтов', error);
            return [];
        }
    }

    /**
     * Сохранить аккаунты в кэш
     */
    async setAccounts(accounts: CachedWialonAccount[]): Promise<void> {
        try {
            const now = Date.now();
            const accountsWithTimestamp = accounts.map(acc => ({
                ...acc,
                _cachedAt: now
            }));

            // Используем bulkPut для upsert
            await db.wialonAccounts.bulkPut(accountsWithTimestamp);

            // Сохраняем время последнего обновления
            await this.setMetadata('lastAccountsUpdate', now);

            console.log(`💾 WialonCache: сохранено ${accounts.length} аккаунтов в кэш`);
        } catch (error) {
            console.error('❌ WialonCache: ошибка сохранения аккаунтов', error);
        }
    }

    /**
     * Получить статистику из кэша
     */
    async getStats(connectionId: number): Promise<CachedWialonStats | null> {
        try {
            const stats = await db.wialonStats.get(connectionId);
            if (stats) {
                console.log(`📦 WialonCache: получена статистика для подключения ${connectionId}`);
            }
            return stats || null;
        } catch (error) {
            console.error('❌ WialonCache: ошибка получения статистики', error);
            return null;
        }
    }

    /**
     * Сохранить статистику в кэш
     */
    async setStats(connectionId: number, stats: Record<number, { objectsTotal: number; objectsActive: number; objectsDeactivated?: number }>, totalObjects: number): Promise<void> {
        try {
            await db.wialonStats.put({
                connectionId,
                stats,
                totalObjects,
                _cachedAt: Date.now()
            });
            console.log(`💾 WialonCache: сохранена статистика для подключения ${connectionId}`);
        } catch (error) {
            console.error('❌ WialonCache: ошибка сохранения статистики', error);
        }
    }

    /**
     * Получить возраст кэша в секундах
     */
    async getCacheAge(): Promise<number> {
        try {
            const lastUpdate = await this.getMetadata('lastAccountsUpdate');
            if (!lastUpdate) return Infinity;
            return Math.floor((Date.now() - lastUpdate) / 1000);
        } catch {
            return Infinity;
        }
    }

    /**
     * Проверить свежесть кэша
     */
    async isCacheFresh(): Promise<boolean> {
        const age = await this.getCacheAge();
        return age * 1000 < CACHE_TTL;
    }

    /**
     * Очистить весь кэш
     */
    async clearCache(): Promise<void> {
        try {
            await db.wialonAccounts.clear();
            await db.wialonStats.clear();
            await db.metadata.clear();
            console.log('🗑️ WialonCache: кэш очищен');
        } catch (error) {
            console.error('❌ WialonCache: ошибка очистки кэша', error);
        }
    }

    /**
     * Очистить кэш для конкретного подключения
     */
    async clearConnectionCache(connectionId: number): Promise<void> {
        try {
            await db.wialonAccounts.where('connectionId').equals(connectionId).delete();
            await db.wialonStats.delete(connectionId);
            console.log(`🗑️ WialonCache: кэш подключения ${connectionId} очищен`);
        } catch (error) {
            console.error('❌ WialonCache: ошибка очистки кэша подключения', error);
        }
    }

    /**
     * Получить метаданные
     */
    private async getMetadata(key: string): Promise<any> {
        try {
            const item = await db.metadata.get(key);
            return item?.value;
        } catch {
            return null;
        }
    }

    /**
     * Сохранить метаданные
     */
    private async setMetadata(key: string, value: any): Promise<void> {
        try {
            await db.metadata.put({ key, value });
        } catch {
            // Игнорируем ошибки метаданных
        }
    }

    /**
     * Получить количество кэшированных аккаунтов
     */
    async getAccountsCount(): Promise<number> {
        try {
            return await db.wialonAccounts.count();
        } catch {
            return 0;
        }
    }
}

// Экспортируем singleton
export const wialonCacheService = WialonCacheService.getInstance();
export default wialonCacheService;
