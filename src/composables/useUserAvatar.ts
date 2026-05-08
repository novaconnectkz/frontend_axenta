import type { UserWithRelations } from '@/types/users';

const ROLE_ICON_MAP: Record<string, string> = {
  'Партнер': 'mdi-handshake-outline',
  'Партнёр': 'mdi-handshake-outline',
  'Клиент': 'mdi-account-group-outline',
  'Администратор': 'mdi-shield-account-outline',
  'Менеджер': 'mdi-account-tie-outline',
  'Техник': 'mdi-hard-hat',
  'Бухгалтер': 'mdi-calculator-variant-outline',
  'Пользователь': 'mdi-account-outline',
};

const isActiveStrict = (val: unknown): boolean => {
  if (val === undefined || val === null) return true;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return !['false', '0', 'no', 'off', ''].includes(val.toLowerCase());
  return true;
};

export function useUserAvatar() {
  const getUserInitials = (user: UserWithRelations): string => {
    const f = user.first_name?.charAt(0) || '';
    const l = user.last_name?.charAt(0) || '';
    return (f + l).toUpperCase() || user.username.charAt(0).toUpperCase();
  };

  const getUserAvatarColor = (user: UserWithRelations): string => {
    return isActiveStrict(user.is_active) ? 'primary' : 'error';
  };

  const getRoleIcon = (roleName: string): string => {
    return ROLE_ICON_MAP[roleName] || 'mdi-account-outline';
  };

  const getSourceColor = (source: string | null | undefined): string => {
    if (!source) return 'grey';
    if (source === 'axenta') return 'primary';
    const lower = source.toLowerCase();
    if (lower.startsWith('wh(') || lower.startsWith('wh ')) return 'orange';
    if (lower.startsWith('wl(') || lower.startsWith('wl ')) return 'cyan';
    if (lower.startsWith('skif(') || lower === 'skif') return 'purple';
    return 'grey';
  };

  const getSourceIcon = (source: string | null | undefined): string => {
    if (!source) return 'mdi-satellite-uplink';
    if (source === 'axenta') return 'mdi-server-network-outline';
    const lower = source.toLowerCase();
    if (lower.startsWith('wh(') || lower.startsWith('wh ')) return 'mdi-cloud-outline';
    if (lower.startsWith('wl(') || lower.startsWith('wl ')) return 'mdi-server-outline';
    if (lower.startsWith('skif(') || lower === 'skif') return 'mdi-radar';
    return 'mdi-satellite-uplink';
  };

  const getSourceLabel = (source: string | null | undefined): string => {
    if (!source) return '—';
    if (source === 'axenta') return 'Axenta';
    const lower = source.toLowerCase();
    // SKIF(<company>) → "SKIF" — компания и так отображается в колонке "Создатель"
    if (lower.startsWith('skif(') || lower === 'skif') return 'SKIF';
    return source;
  };

  const getRowProps = (item: UserWithRelations) => {
    const active = isActiveStrict(item.is_active);
    return {
      class: active ? '' : 'inactive-user',
      style: active ? {} : {
        backgroundColor: 'rgba(244, 67, 54, 0.08) !important',
        borderLeft: '4px solid #f44336 !important',
      },
    };
  };

  return {
    getUserInitials,
    getUserAvatarColor,
    getRoleIcon,
    getSourceColor,
    getSourceIcon,
    getSourceLabel,
    getRowProps,
    isActiveStrict,
  };
}
