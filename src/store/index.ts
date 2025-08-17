import { createPinia } from "pinia";

// Создаем экземпляр Pinia
const pinia = createPinia();

export default pinia;

// Экспортируем все stores для удобства импорта
export { useDashboardStore } from "./dashboard";
export type { DashboardStore } from "./dashboard";
export { useDeviceStore } from "./devices";
export type { Device, DeviceFilter, DeviceStats } from "./devices";
export { useUserStore } from "./user";
export type { User, UserProfile } from "./user";
