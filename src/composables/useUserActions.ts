import { useRouter } from 'vue-router';
import accountsService from '@/services/accountsService';
import settingsService from '@/services/settingsService';
import usersService from '@/services/usersService';
import type { UserWithRelations } from '@/types/users';

type Notify = (text: string, color?: 'success' | 'error' | 'info' | 'warning') => void;

export function useUserActions(notify: Notify) {
  const router = useRouter();

  const isWialonUser = (user: UserWithRelations & { source?: string }) => {
    const source = (user.source || '').toLowerCase();
    return source.startsWith('wh') || source.startsWith('wl');
  };

  const openCreate = () => {
    router.push('/users/create');
  };

  const deleteUser = async (user: UserWithRelations): Promise<boolean> => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.username}"?`)) {
      return false;
    }
    try {
      const response = await usersService.deleteUser(user.id);
      if (response.status === 'success') {
        notify('Пользователь успешно удалён', 'success');
        return true;
      }
      notify(response.error || 'Ошибка удаления пользователя', 'error');
      return false;
    } catch (e: any) {
      notify('Ошибка удаления пользователя', 'error');
      return false;
    }
  };

  const toggleActivity = async (user: UserWithRelations, isActive: boolean): Promise<boolean> => {
    try {
      await usersService.toggleUserStatus(user.id, isActive);
      user.is_active = isActive;
      notify(`Пользователь "${user.username}" ${isActive ? 'активирован' : 'деактивирован'}`, 'success');
      return true;
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : 'Неизвестная ошибка';
      notify(`Ошибка изменения статуса: ${msg}`, 'error');
      return false;
    }
  };

  const loginToTarget = async (
    user: UserWithRelations & { source?: string; connection_id?: number },
    target: 'monitoring' | 'cms'
  ) => {
    try {
      if (!user.id) {
        notify(`У пользователя "${user.username}" не указан ID`, 'error');
        return;
      }

      if (isWialonUser(user)) {
        const connId = user.connection_id;
        if (!connId) {
          notify(`У пользователя "${user.username}" не указан ID подключения Wialon`, 'error');
          return;
        }
        const result = target === 'monitoring'
          ? await settingsService.loginToWialonMonitoring(connId, user.username, undefined, user.id)
          : await settingsService.loginToWialonCms(connId, user.username, undefined, user.id);

        if (!result.success) {
          notify(`Ошибка входа: ${result.message}`, 'error');
          return;
        }
        window.open(result.redirectUrl, '_blank');
      } else {
        const result = await accountsService.loginAs(user.id, target);
        window.open(result.redirectUrl, '_blank');
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.response?.data?.message || e.message || 'Неизвестная ошибка';
      notify(`Ошибка входа: ${msg}`, 'error');
    }
  };

  return {
    openCreate,
    deleteUser,
    toggleActivity,
    loginToMonitoring: (u: UserWithRelations & { source?: string; connection_id?: number }) => loginToTarget(u, 'monitoring'),
    loginToCMS: (u: UserWithRelations & { source?: string; connection_id?: number }) => loginToTarget(u, 'cms'),
    isWialonUser,
  };
}
