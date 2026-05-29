// Роль текущего пользователя для биллинг-гейтов берём из реального источника
// приложения — axenta_user в localStorage (его заполняет context/auth.ts).
// useLocalAuth на главном app пуст (там auth через axenta_token), поэтому
// гейтить по нему нельзя. Все FE-гейты декоративны — реальная защита на BE.

function currentRole(): string {
  try {
    const u = JSON.parse(localStorage.getItem('axenta_user') || '{}')
    return (u.role || u.accountType || '') as string
  } catch {
    return ''
  }
}

// canManageBilling — может ли пользователь видеть админ-элементы биллинга
// (настройки, назначение/фильтр менеджера). admin/superadmin — да; manager/tech/user — нет;
// неизвестная роль (нет данных) — да (fail-open, BE-guard защищает).
export function canManageBilling(): boolean {
  const role = currentRole()
  if (role === 'manager' || role === 'tech' || role === 'user') return false
  return true
}
