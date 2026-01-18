// Сервис для работы с Wialon Remote API
// Документация: https://help.wialon.com/ru/api/user-guide

// === ТИПЫ ДАННЫХ ===

// Ответ при авторизации через токен
export interface WialonLoginResponse {
    eid: string; // ID сессии
    au: string; // Имя пользователя
    host: string; // Хост
    tm: number; // Текущее время (UTC)
    gis_sid?: string; // ID сессии GIS
    user?: WialonUser; // Информация о пользователе
    classes?: Record<string, number>; // Доступные классы объектов
    wsdk_version?: string; // Версия SDK
}

// Пользователь Wialon
export interface WialonUser {
    nm: string; // Имя
    cls: number; // ID класса
    id: number; // ID пользователя
    prp?: Record<string, string>; // Пользовательские свойства
    fl?: number; // Флаги
    uacl?: number; // Права доступа
}

// Объект мониторинга (транспортное средство)
export interface WialonUnit {
    id: number; // ID объекта
    nm: string; // Имя
    cls: number; // ID класса (avl_unit)
    mu: number; // Система измерения
    uacl: number; // Права доступа
    pos?: WialonPosition; // Последнее местоположение
    lmsg?: WialonMessage; // Последнее сообщение
    sens?: Record<string, WialonSensor>; // Датчики
    si?: Record<string, WialonMaintenanceInterval>; // Интервалы ТО
    prms?: Record<string, WialonParameter>; // Параметры сообщений
    uid?: string; // Уникальный ID (IMEI)
    hw?: number; // Тип оборудования
    ph?: string; // Телефон
}

// Местоположение
export interface WialonPosition {
    t: number; // Время (UTC)
    y: number; // Широта
    x: number; // Долгота
    z?: number; // Высота
    s: number; // Скорость
    c: number; // Курс
    sc?: number; // Количество спутников
}

// Сообщение с данными
export interface WialonMessage {
    t: number; // Время (UTC)
    f: number; // Флаги
    tp: string; // Тип сообщения
    pos?: WialonPosition; // Местоположение
    i?: number; // Входные данные
    o?: number; // Выходные данные
    p?: Record<string, number | string>; // Параметры
}

// Датчик
export interface WialonSensor {
    id: number; // ID
    n: string; // Имя
    t: string; // Тип
    d?: string; // Описание
    m?: string; // Единица измерения
    p: string; // Параметр
    f?: number; // Флаги
    c?: string; // Конфигурация
    vt?: number; // Тип валидации
    tbl?: Array<{ x: number; a: number; b: number }>; // Таблица расчета
}

// Интервал техобслуживания
export interface WialonMaintenanceInterval {
    id: number; // ID
    n: string; // Имя
    t?: string; // Описание
    im: number; // Интервал пробега
    it: number; // Интервал дней
    ie: number; // Интервал моточасов
    pm: number; // Последнее ТО по пробегу
    pt: number; // Последнее ТО по дням (UTC)
    pe: number; // Последнее ТО по моточасам
    c: number; // Количество выполненных ТО
}

// Параметр сообщения
export interface WialonParameter {
    v: number | string; // Значение
    ct: number; // Время последнего изменения
    at: number; // Время последнего сообщения
}

// Результат поиска объектов
export interface WialonSearchResult {
    searchSpec: {
        itemsType: string;
        propName: string;
        propValueMask: string;
        sortType: string;
        propType?: string;
        or_logic?: boolean;
    };
    dataFlags: number;
    totalItemsCount: number;
    indexFrom: number;
    indexTo: number;
    items: WialonUnit[];
}

// Водитель
export interface WialonDriver {
    id: number;
    n: string; // Имя
    c: string; // Код
    ds?: string; // Описание
    p?: string; // Телефон
    bu?: number; // Назначенный объект
    bt?: number; // Время назначения
}

// Геозона
export interface WialonGeofence {
    id: number;
    n: string; // Имя
    d?: string; // Описание
    t: number; // Тип: 1-линия, 2-полигон, 3-круг
    f: number; // Флаги
    b: {
        min_x: number;
        min_y: number;
        max_x: number;
        max_y: number;
        cen_x: number;
        cen_y: number;
    };
}

// Ресурс (для водителей, геозон и т.д.)
export interface WialonResource {
    id: number;
    nm: string;
    cls: number;
    drvrs?: Record<string, WialonDriver>;
    zl?: Record<string, WialonGeofence>;
}

// Ошибка Wialon API
export interface WialonError {
    error: number;
    reason?: string;
}

// Коды ошибок Wialon
export const WIALON_ERROR_CODES: Record<number, string> = {
    0: "Успешный запрос",
    1: "Неверная авторизация сессии",
    2: "Неверное имя сервиса",
    3: "Неверный результат",
    4: "Неверные входные параметры",
    5: "Ошибка выполнения запроса",
    6: "Неизвестная ошибка",
    7: "Отсутствуют права доступа / Запрет на выполнение запроса",
    8: "Неправильный DNS",
    9: "Превышен лимит выгрузки сообщений",
    10: "Заблокировано вследствие большого количества неудачных попыток входа",
    11: "Превышено количество одновременных запросов",
    14: "Биллинговое ограничение",
    1003: "Превышен лимит запросов",
    1004: "IP-адрес временно заблокирован",
};

// === КОНСТАНТЫ ===

// Базовые URL дата-центров Wialon Hosting
export const WIALON_DATA_CENTERS = {
    com: "https://hst-api.wialon.com",
    us: "https://hst-api.wialon.us",
    eu: "https://hst-api.wialon.eu",
    org: "https://hst-api.wialon.org",
    alt: "https://hst-api.regwialon.com",
} as const;

// Флаги объектов для search_items
export const WIALON_UNIT_FLAGS = {
    BASIC: 1, // Основные свойства
    CUSTOM_PROPS: 2, // Пользовательские свойства
    BILLING_INFO: 4, // Информация о биллинге
    CUSTOM_FIELDS: 8, // Произвольные поля
    IMAGE: 16, // Изображение
    MESSAGES: 32, // Сообщения
    GUID: 64, // GUID
    ADMIN_FIELDS: 128, // Административные поля
    ADVANCED: 256, // Расширенные свойства
    COMMANDS: 512, // Доступные команды
    LAST_MESSAGE: 1024, // Последнее сообщение и местоположение
    DRIVER_CODE: 2048, // Код водителя
    SENSORS: 4096, // Датчики
    COUNTERS: 8192, // Счетчики
    ROUTES: 16384, // Маршруты
    MAINTENANCE: 32768, // Техобслуживание
    LOGS: 65536, // Журналы
    TRIP_DETECTOR: 131072, // Детектор поездок
    FILTER_SETTINGS: 262144, // Фильтрация сообщений
    ALL_COMMANDS: 524288, // Все команды
    MESSAGE_PARAMS: 1048576, // Параметры сообщений
    CONNECTION: 2097152, // Состояние подключения
    POSITION: 4194304, // Местоположение
    PROFILE: 8388608, // Характеристики
    TASKS: 16777216, // Задачи
} as const;

// Флаги ресурсов
export const WIALON_RESOURCE_FLAGS = {
    BASIC: 1, // Основные свойства
    DRIVERS: 256, // Водители
    JOBS: 512, // Задания
    NOTIFICATIONS: 1024, // Уведомления
    POI: 2048, // POI
    GEOFENCES: 4096, // Геозоны
    REPORTS: 8192, // Шаблоны отчетов
    DRIVER_GROUPS: 32768, // Группы водителей
    TRAILERS: 65536, // Прицепы
} as const;

// === СЕРВИС ===

export class WialonApiService {
    private baseUrl: string;
    private sessionId: string | null = null;
    private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

    constructor(dataCenter: keyof typeof WIALON_DATA_CENTERS = "com") {
        this.baseUrl = WIALON_DATA_CENTERS[dataCenter];
    }

    /**
     * Устанавливает базовый URL по дата-центру
     */
    setDataCenter(dataCenter: keyof typeof WIALON_DATA_CENTERS): void {
        this.baseUrl = WIALON_DATA_CENTERS[dataCenter];
    }

    /**
     * Выполняет запрос к Wialon API
     */
    private async request<T>(
        service: string,
        params: Record<string, unknown>
    ): Promise<T> {
        const url = `${this.baseUrl}/wialon/ajax.html`;

        const formData = new URLSearchParams();
        if (this.sessionId) {
            formData.append("sid", this.sessionId);
        }
        formData.append("svc", service);
        formData.append("params", JSON.stringify(params));

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        // Проверяем на ошибку Wialon
        if (data && typeof data === "object" && "error" in data) {
            const errorData = data as WialonError;
            const errorMessage =
                WIALON_ERROR_CODES[errorData.error] || `Неизвестная ошибка: ${errorData.error}`;
            throw new Error(`Wialon API Error: ${errorMessage}`);
        }

        return data as T;
    }

    /**
     * Авторизация через токен
     * Документация: token/login
     */
    async login(token: string, flags: number = 1): Promise<WialonLoginResponse> {
        const response = await this.request<WialonLoginResponse>("token/login", {
            token,
            fl: flags,
        });

        this.sessionId = response.eid;

        // Запускаем keep-alive для поддержания сессии
        this.startKeepAlive();

        return response;
    }

    /**
     * Завершение сессии
     */
    async logout(): Promise<void> {
        if (this.sessionId) {
            try {
                await this.request("core/logout", {});
            } catch {
                // Игнорируем ошибки при выходе
            }
            this.sessionId = null;
            this.stopKeepAlive();
        }
    }

    /**
     * Запуск keep-alive для поддержания сессии
     * Сессия истекает через 5 минут без активности
     */
    private startKeepAlive(): void {
        this.stopKeepAlive();
        // Отправляем avl_evts каждые 2 минуты
        this.keepAliveInterval = setInterval(() => {
            this.sendKeepAlive();
        }, 120000);
    }

    /**
     * Остановка keep-alive
     */
    private stopKeepAlive(): void {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }

    /**
     * Отправка keep-alive запроса
     */
    private async sendKeepAlive(): Promise<void> {
        try {
            await this.request("avl_evts", {});
        } catch {
            // Игнорируем ошибки keep-alive
        }
    }

    /**
     * Поиск объектов (транспортных средств)
     * Документация: core/search_items
     */
    async searchUnits(
        flags: number = WIALON_UNIT_FLAGS.BASIC | WIALON_UNIT_FLAGS.LAST_MESSAGE
    ): Promise<WialonSearchResult> {
        return this.request<WialonSearchResult>("core/search_items", {
            spec: {
                itemsType: "avl_unit",
                propName: "sys_name",
                propValueMask: "*",
                sortType: "sys_name",
            },
            force: 1,
            flags,
            from: 0,
            to: 0,
        });
    }

    /**
     * Поиск объектов с датчиками и ТО
     */
    async searchUnitsWithDetails(): Promise<WialonSearchResult> {
        const flags =
            WIALON_UNIT_FLAGS.BASIC |
            WIALON_UNIT_FLAGS.LAST_MESSAGE |
            WIALON_UNIT_FLAGS.SENSORS |
            WIALON_UNIT_FLAGS.MAINTENANCE |
            WIALON_UNIT_FLAGS.ADVANCED;

        return this.searchUnits(flags);
    }

    /**
     * Поиск ресурсов (для водителей, геозон)
     */
    async searchResources(
        flags: number = WIALON_RESOURCE_FLAGS.BASIC
    ): Promise<WialonSearchResult> {
        return this.request<WialonSearchResult>("core/search_items", {
            spec: {
                itemsType: "avl_resource",
                propName: "sys_name",
                propValueMask: "*",
                sortType: "sys_name",
            },
            force: 1,
            flags,
            from: 0,
            to: 0,
        });
    }

    /**
     * Получение водителей из ресурсов
     */
    async getDrivers(): Promise<WialonDriver[]> {
        const flags = WIALON_RESOURCE_FLAGS.BASIC | WIALON_RESOURCE_FLAGS.DRIVERS;
        const result = await this.searchResources(flags);

        const drivers: WialonDriver[] = [];
        for (const resource of result.items as unknown as WialonResource[]) {
            if (resource.drvrs) {
                drivers.push(...Object.values(resource.drvrs));
            }
        }
        return drivers;
    }

    /**
     * Получение геозон из ресурсов
     */
    async getGeofences(): Promise<WialonGeofence[]> {
        const flags = WIALON_RESOURCE_FLAGS.BASIC | WIALON_RESOURCE_FLAGS.GEOFENCES;
        const result = await this.searchResources(flags);

        const geofences: WialonGeofence[] = [];
        for (const resource of result.items as unknown as WialonResource[]) {
            if (resource.zl) {
                geofences.push(...Object.values(resource.zl));
            }
        }
        return geofences;
    }

    /**
     * Тест соединения с Wialon
     */
    async testConnection(
        token: string,
        dataCenter: keyof typeof WIALON_DATA_CENTERS = "com"
    ): Promise<{ success: boolean; message: string; user?: string; responseTime?: number }> {
        const startTime = Date.now();
        const originalUrl = this.baseUrl;

        try {
            this.setDataCenter(dataCenter);

            // Проверяем длину токена
            if (!token || token.length !== 72) {
                return {
                    success: false,
                    message: "Неверный формат токена. Токен должен состоять из 72 символов.",
                };
            }

            // Пытаемся авторизоваться
            const response = await this.login(token, 3); // Флаг 3 = общая информация + информация о пользователе

            const responseTime = Date.now() - startTime;

            // Сразу выходим после теста
            await this.logout();

            return {
                success: true,
                message: `Подключение успешно. Пользователь: ${response.au}`,
                user: response.au,
                responseTime,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Неизвестная ошибка подключения",
            };
        } finally {
            this.baseUrl = originalUrl;
        }
    }

    /**
     * Получение ID текущей сессии
     */
    getSessionId(): string | null {
        return this.sessionId;
    }

    /**
     * Проверка активности сессии
     */
    isLoggedIn(): boolean {
        return this.sessionId !== null;
    }
}

// === Типы для статистики подключений ===

/** Краткая информация о подключении */
export interface WialonConnectionSummary {
    id: number;
    name: string;
    connection_type: 'hosting' | 'local';
    host: string;
    is_active: boolean;
    units_count: number;
    last_sync_at: string | null;
    has_error: boolean;
    user_name: string;
    short_label: string; // WH(ACRM) или WL(Профмонитор)
}

/** Статистика подключений */
export interface WialonConnectionStats {
    total: number;
    active: number;
    inactive: number;
    with_errors: number;
    total_units: number;
    connections: WialonConnectionSummary[];
}

/** Получение статистики подключений Wialon */
export async function getWialonConnectionStats(): Promise<WialonConnectionStats | null> {
    try {
        const API_BASE = 'http://localhost:8080';
        const response = await fetch(`${API_BASE}/api/wialon/connections/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('axenta_token') || ''}`,
            },
        });

        if (!response.ok) {
            console.error('Ошибка получения статистики Wialon:', response.status);
            return null;
        }

        const result = await response.json();
        return result.data as WialonConnectionStats;
    } catch (error) {
        console.error('Ошибка получения статистики Wialon:', error);
        return null;
    }
}

// Экспорт singleton экземпляра
export const wialonApi = new WialonApiService();
