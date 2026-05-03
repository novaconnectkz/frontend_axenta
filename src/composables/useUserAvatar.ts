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
    const s = source.toLowerCase();
    if (s === 'axenta') return 'primary';
    if (s.startsWith('wh')) return 'orange';
    if (s.startsWith('wl')) return 'blue';
    return 'orange';
  };

  const getSourceIcon = (source: string | null | undefined): string => {
    if (!source) return 'mdi-help-circle-outline';
    const s = source.toLowerCase();
    if (s === 'axenta') return 'mdi-server';
    if (s.startsWith('wh')) return 'mdi-cloud-outline';
    if (s.startsWith('wl')) return 'mdi-server-network';
    return 'mdi-satellite-variant';
  };

  const getSourceLabel = (source: string | null | undefined): string => {
    if (!source) return '—';
    const s = source.toLowerCase();
    if (s === 'axenta') return 'Axenta';
    if (s.startsWith('wh')) return source.toUpperCase();
    if (s.startsWith('wl')) return source.toUpperCase();
    return 'Wialon';
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
