/**
 * Единое отображаемое имя договора/клиента.
 *
 * Централизует имя субъекта договора. Источник истины (C4a, subject-first):
 *   - partner-договор → partner_name (+ short_name из partner_requisites jsonb)
 *   - client-договор  → связанный counterparty (short_name ‖ name)
 *   - fallback        → денорм client_short_name ‖ client_name (живёт до C4b)
 *
 * Одна точка контроля — меняем алгоритм здесь, а не в каждом компоненте.
 * До C4b BE держит client_* в синхроне (dual-write), поэтому fallback
 * корректен даже если counterparty не попал в ответ (пропущен Preload).
 *
 * Поиск/фильтрация и привязки формы НЕ используют эту функцию — у них
 * другой intent (матчинг по конкретным полям / редактирование).
 */
export interface CounterpartyNameSource {
  name?: string | null;
  short_name?: string | null;
}

export interface ContractNameSource {
  contract_type?: string | null;
  client_short_name?: string | null;
  client_name?: string | null;
  partner_name?: string | null;
  partner_requisites?: string | null; // jsonb-строка (short_name/email/...)
  counterparty?: CounterpartyNameSource | null;
}

/** Достаёт поле из partner_requisites (jsonb-строка). "" если нет/невалид. */
function partnerRequisite(contract: ContractNameSource, key: string): string {
  const raw = contract.partner_requisites;
  if (!raw || raw === "{}") return "";
  try {
    const obj = JSON.parse(raw);
    const v = obj?.[key];
    return typeof v === "string" ? v.trim() : "";
  } catch {
    return "";
  }
}

export function contractDisplayName(
  contract: ContractNameSource | null | undefined,
  fallback = "Не указан"
): string {
  if (!contract) return fallback;

  if (contract.contract_type === "partner") {
    return (
      partnerRequisite(contract, "short_name") ||
      contract.partner_name ||
      contract.client_short_name || // fallback до C4b
      contract.client_name ||
      fallback
    );
  }

  const cp = contract.counterparty;
  return (
    cp?.short_name ||
    cp?.name ||
    contract.client_short_name || // fallback до C4b
    contract.client_name ||
    fallback
  );
}
