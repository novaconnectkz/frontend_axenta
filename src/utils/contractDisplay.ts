/**
 * Единое отображаемое имя договора/клиента.
 *
 * Централизует паттерн `client_short_name || client_name`, который до C3
 * (subject-first IA) был размазан по 13+ местам (таблицы, диалоги, ссылки,
 * экспорт). Одна точка контроля — меняем алгоритм отображения здесь, а не
 * в каждом компоненте. Поведение для существующих callsite сохранено:
 * приоритет краткого имени с ОПФ, затем полное, затем fallback.
 *
 * Поиск/фильтрация и привязки формы НЕ используют эту функцию — у них
 * другой intent (матчинг по конкретным полям / редактирование).
 */
export interface ContractNameSource {
  client_short_name?: string | null;
  client_name?: string | null;
}

export function contractDisplayName(
  contract: ContractNameSource | null | undefined,
  fallback = "Не указан"
): string {
  if (!contract) return fallback;
  return contract.client_short_name || contract.client_name || fallback;
}
