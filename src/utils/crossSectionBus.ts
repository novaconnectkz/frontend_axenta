/**
 * Cross-section event bus для инвалидации кэша между разделами.
 *
 * Раньше: создал объект в Objects → Accounts/Dashboard счётчики не обновлялись
 * до F5, потому что каждый раздел держит свой localStorage/Dexie cache.
 *
 * Теперь: после mutation раздел emit'ит событие, остальные слушают и
 * инвалидируют свой кэш.
 *
 * События (расширяем по мере подключения новых разделов):
 *   - accounts:mutated — создание/обновление/удаление учётной записи
 *   - users:mutated    — создание/обновление/удаление пользователя
 *   - objects:mutated  — создание/обновление/удаление объекта
 *
 * Payload содержит { action, source } для опциональной фильтрации
 * подписчиков (например Dashboard может игнорить локальные мутации
 * если знает что snapshot всё равно обновится через invalidator на бэке).
 *
 * Шина не персистится — события только в текущей вкладке. Cross-tab
 * (BroadcastChannel) можно добавить второй итерацией.
 */

export type CrossSectionEvent =
  | "accounts:mutated"
  | "users:mutated"
  | "objects:mutated";

export type CrossSectionAction = "create" | "update" | "delete";

export interface CrossSectionPayload {
  action: CrossSectionAction;
  source?: "axenta" | "wialon-hosting" | "wialon-local" | "local";
  /** Идентификатор изменённой сущности (опционально) */
  id?: number | string;
}

type Listener = (payload: CrossSectionPayload) => void;

const listeners: Map<CrossSectionEvent, Set<Listener>> = new Map();

export function emitCrossSection(
  event: CrossSectionEvent,
  payload: CrossSectionPayload,
): void {
  const set = listeners.get(event);
  if (!set || set.size === 0) return;
  for (const fn of set) {
    try {
      fn(payload);
    } catch (e) {
      console.error(`crossSectionBus: listener for ${event} threw`, e);
    }
  }
}

export function onCrossSection(
  event: CrossSectionEvent,
  listener: Listener,
): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(listener);
  return () => set!.delete(listener);
}
