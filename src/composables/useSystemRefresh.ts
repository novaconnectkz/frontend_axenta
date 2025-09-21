import { inject } from 'vue';

// Типы для системного обновления
export type UpdateLastRefreshFunction = () => void;

// Composable для использования функции обновления системы
export function useSystemRefresh() {
  const updateLastRefresh = inject<UpdateLastRefreshFunction>('updateLastRefresh');
  
  if (!updateLastRefresh) {
    console.warn('useSystemRefresh: updateLastRefresh не найден в provide. Убедитесь, что AppLayout предоставляет эту функцию.');
    // Возвращаем заглушку, чтобы не ломать код
    return () => {
      console.log('⚠️ updateLastRefresh заглушка вызвана');
    };
  }
  
  return updateLastRefresh;
}
