import { ref, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import getObjectsService from '@/services/objectsService';
import type { ObjectForm, ObjectWithRelations, ScheduleDeleteForm } from '@/types/objects';
import { emitCrossSection } from '@/utils/crossSectionBus';

interface UseObjectsCRUDContext {
  objects: Ref<ObjectWithRelations[]>;
  selectedObjects: Ref<number[]>;
  selectAll: Ref<boolean>;
  loadObjects: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadCompanies: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  showSnackbar: (text: string, color?: string, timeout?: number) => void;
  showSuccessNotification: (title: string, message: string, details?: string, showTimer?: boolean) => void;
  selectedTemplate: Ref<number | null>;
}

const objectsService = getObjectsService();

const emptyObjectForm = (): ObjectForm => ({
  name: '',
  type: '' as any,
  description: '',
  accountName: '',
  creatorName: '',
  deviceTypeName: '',
  phoneNumbers: [],
  uniqueId: '',
  is_active: true,
  latitude: undefined,
  longitude: undefined,
  address: '',
  imei: '',
  phone_number: '',
  serial_number: '',
  company_id: 0,
  contract_id: 0,
  template_id: undefined,
  location_id: 0,
  settings: '{}',
  tags: [],
  notes: '',
  external_id: '',
});

export function useObjectsCRUD(ctx: UseObjectsCRUDContext) {
  const route = useRoute();
  const router = useRouter();

  const saving = ref(false);
  const scheduling = ref(false);

  const objectDialog = ref({
    show: false,
    isEdit: false,
    object: null as ObjectWithRelations | null,
  });

  const objectForm = ref<ObjectForm>(emptyObjectForm());
  const formErrors = ref<Record<string, string>>({});
  const objectFormRef = ref();

  const scheduleDeleteDialog = ref({
    show: false,
    object: null as ObjectWithRelations | null,
  });
  const scheduleDeleteForm = ref<ScheduleDeleteForm>({
    scheduled_delete_at: '',
  });
  const scheduleDeleteErrors = ref<Record<string, string>>({});

  const viewDialog = ref({
    show: false,
    object: null as ObjectWithRelations | null,
  });

  const createTemplateDialog = ref({
    show: false,
    object: null as ObjectWithRelations | null,
  });
  const createTemplateForm = ref({
    name: '',
    description: '',
    category: '',
    icon: '',
    color: '',
  });
  const createTemplateErrors = ref<Record<string, string>>({});

  const resetObjectForm = () => {
    objectForm.value = emptyObjectForm();
  };

  const fillObjectForm = (object: ObjectWithRelations) => {
    objectForm.value = {
      name: object.name,
      type: object.type,
      description: object.description,
      accountName: object.accountName || '',
      creatorName: object.creatorName || '',
      deviceTypeName: object.deviceTypeName || '',
      phoneNumbers: object.phoneNumbers || [],
      uniqueId: object.uniqueId || object.external_id || '',
      is_active: object.is_active,
      latitude: object.latitude,
      longitude: object.longitude,
      address: object.address,
      imei: object.imei,
      phone_number: object.phone_number,
      serial_number: object.serial_number,
      company_id: object.company_id,
      contract_id: object.contract_id,
      template_id: object.template_id,
      location_id: object.location_id,
      settings: object.settings,
      tags: object.tags,
      notes: object.notes,
      external_id: object.external_id,
    };
  };

  const openCreateDialog = () => {
    objectDialog.value = { show: true, isEdit: false, object: null };
    resetObjectForm();
    ctx.loadCompanies();
    ctx.loadTemplates();
  };

  const editObject = (object: ObjectWithRelations) => {
    objectDialog.value = { show: true, isEdit: true, object };
    fillObjectForm(object);
  };

  const closeObjectDialog = () => {
    objectDialog.value.show = false;
    resetObjectForm();
    formErrors.value = {};
    ctx.selectedTemplate.value = null;
    if (route.query.action === 'create') {
      router.replace({ path: route.path });
    }
  };

  const saveObject = async () => {
    try {
      formErrors.value = {};

      if (!objectForm.value.name.trim()) {
        formErrors.value.name = 'Название объекта обязательно';
        return;
      }
      if (!objectForm.value.type) {
        formErrors.value.type = 'Тип объекта обязателен';
        return;
      }
      if (!objectForm.value.contract_id) {
        formErrors.value.contract_id = 'Договор обязателен';
        return;
      }

      saving.value = true;

      const response = objectDialog.value.isEdit
        ? await objectsService.updateObject(objectDialog.value.object!.id, objectForm.value)
        : await objectsService.createObject(objectForm.value);

      if (response.status === 'success') {
        if (objectDialog.value.isEdit) {
          ctx.showSnackbar('Объект успешно обновлен', 'success');
        } else {
          ctx.showSuccessNotification(
            'Объект успешно создан',
            'Новый объект мониторинга добавлен в систему',
            `Создан объект: ${objectForm.value.name}`,
            true,
          );
        }
        closeObjectDialog();
        await ctx.loadObjects();
        await ctx.loadStats();
        emitCrossSection('objects:mutated', {
          action: objectDialog.value.isEdit ? 'update' : 'create',
        });
      } else {
        ctx.showSnackbar(response.error || 'Ошибка сохранения объекта', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка сохранения объекта:', error);
      ctx.showSnackbar('Ошибка сохранения объекта', 'error');
    } finally {
      saving.value = false;
    }
  };

  const viewObject = (object: ObjectWithRelations) => {
    viewDialog.value = { show: true, object };
  };

  const closeViewDialog = () => {
    viewDialog.value.show = false;
    viewDialog.value.object = null;
  };

  const editObjectFromView = () => {
    if (viewDialog.value.object) {
      const object = viewDialog.value.object;
      closeViewDialog();
      editObject(object);
    }
  };

  const deleteObject = async (object: ObjectWithRelations) => {
    if (!confirm(`Вы уверены, что хотите удалить объект "${object.name}"?`)) return;

    try {
      const response = await objectsService.deleteObject(object.id);
      if (response.status === 'success') {
        ctx.showSnackbar('Объект успешно удален', 'success');
        await ctx.loadObjects();
        await ctx.loadStats();
        emitCrossSection('objects:mutated', { action: 'delete', id: object.id });
      } else {
        ctx.showSnackbar(response.error || 'Ошибка удаления объекта', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка удаления объекта:', error);
      ctx.showSnackbar('Ошибка удаления объекта', 'error');
    }
  };

  const deleteObjectFromView = () => {
    if (viewDialog.value.object) {
      const object = viewDialog.value.object;
      closeViewDialog();
      deleteObject(object);
    }
  };

  const scheduleDelete = (object: ObjectWithRelations) => {
    scheduleDeleteDialog.value = { show: true, object };
    scheduleDeleteForm.value.scheduled_delete_at = '';
  };

  const closeScheduleDeleteDialog = () => {
    scheduleDeleteDialog.value.show = false;
    scheduleDeleteDialog.value.object = null;
    scheduleDeleteForm.value.scheduled_delete_at = '';
    scheduleDeleteErrors.value = {};
  };

  const confirmScheduleDelete = async () => {
    try {
      scheduleDeleteErrors.value = {};
      if (!scheduleDeleteForm.value.scheduled_delete_at) {
        scheduleDeleteErrors.value.scheduled_delete_at = 'Дата удаления обязательна';
        return;
      }

      scheduling.value = true;
      const response = await objectsService.scheduleObjectDelete(
        scheduleDeleteDialog.value.object!.id,
        scheduleDeleteForm.value,
      );

      if (response.status === 'success') {
        ctx.showSnackbar('Плановое удаление запланировано', 'success');
        closeScheduleDeleteDialog();
        await ctx.loadObjects();
        await ctx.loadStats();
      } else {
        ctx.showSnackbar(response.error || 'Ошибка планирования удаления', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка планирования удаления:', error);
      ctx.showSnackbar('Ошибка планирования удаления', 'error');
    } finally {
      scheduling.value = false;
    }
  };

  const cancelScheduledDelete = async (object: ObjectWithRelations) => {
    if (!confirm(`Отменить плановое удаление объекта "${object.name}"?`)) return;

    try {
      const response = await objectsService.cancelScheduledDelete(object.id);
      if (response.status === 'success') {
        ctx.showSnackbar('Плановое удаление отменено', 'success');
        await ctx.loadObjects();
        await ctx.loadStats();
      } else {
        ctx.showSnackbar(response.error || 'Ошибка отмены планового удаления', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка отмены планового удаления:', error);
      ctx.showSnackbar('Ошибка отмены планового удаления', 'error');
    }
  };

  const createTemplateFromObject = (object: ObjectWithRelations) => {
    createTemplateDialog.value = { show: true, object };
    createTemplateForm.value = {
      name: `Шаблон на основе "${object.name}"`,
      description: `Шаблон создан на основе объекта "${object.name}"`,
      category: object.type || 'Стандартные',
      icon: 'mdi-card-account-details-outline',
      color: '#1976D2',
    };
    createTemplateErrors.value = {};
  };

  const closeCreateTemplateDialog = () => {
    createTemplateDialog.value.show = false;
    createTemplateDialog.value.object = null;
    createTemplateForm.value = {
      name: '',
      description: '',
      category: '',
      icon: '',
      color: '',
    };
    createTemplateErrors.value = {};
  };

  const confirmCreateTemplate = async () => {
    try {
      createTemplateErrors.value = {};
      if (!createTemplateForm.value.name.trim()) {
        createTemplateErrors.value.name = 'Название шаблона обязательно';
        return;
      }
      if (!createTemplateForm.value.category.trim()) {
        createTemplateErrors.value.category = 'Категория шаблона обязательна';
        return;
      }

      saving.value = true;
      const response = await objectsService.createTemplateFromObject(
        createTemplateDialog.value.object!.id,
        createTemplateForm.value,
      );

      if (response.status === 'success') {
        ctx.showSnackbar('Шаблон успешно создан на основе объекта', 'success');
        closeCreateTemplateDialog();
      } else {
        ctx.showSnackbar(response.error || 'Ошибка создания шаблона', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка создания шаблона:', error);
      ctx.showSnackbar('Ошибка создания шаблона', 'error');
    } finally {
      saving.value = false;
    }
  };

  const restoreObject = async (object: ObjectWithRelations) => {
    if (!confirm(`Восстановить объект "${object.name}"?`)) return;

    try {
      const response = await objectsService.restoreObject(object.id);
      if (response.status === 'success') {
        ctx.showSnackbar('Объект успешно восстановлен', 'success');
        await ctx.loadObjects();
        await ctx.loadStats();
      } else {
        ctx.showSnackbar(response.error || 'Ошибка восстановления объекта', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка восстановления объекта:', error);
      ctx.showSnackbar('Ошибка восстановления объекта', 'error');
    }
  };

  const permanentDeleteObject = async (object: ObjectWithRelations) => {
    if (!confirm(`ВНИМАНИЕ! Объект "${object.name}" будет удален навсегда. Это действие нельзя отменить. Продолжить?`)) return;

    try {
      const response = await objectsService.permanentDeleteObject(object.id);
      if (response.status === 'success') {
        ctx.showSnackbar('Объект окончательно удален', 'success');
        await ctx.loadObjects();
        await ctx.loadStats();
      } else {
        ctx.showSnackbar(response.error || 'Ошибка окончательного удаления', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка окончательного удаления:', error);
      ctx.showSnackbar('Ошибка окончательного удаления', 'error');
    }
  };

  const toggleObjectActivity = async (object: ObjectWithRelations, isActive: boolean) => {
    try {
      const response = await objectsService.updateObject(object.id, { is_active: isActive });
      if (response.status === 'success') {
        const index = ctx.objects.value.findIndex(obj => obj.id === object.id);
        if (index !== -1) {
          ctx.objects.value[index].is_active = isActive;
        }
        ctx.showSnackbar(
          `Объект "${object.name}" ${isActive ? 'активирован' : 'деактивирован'}`,
          'success',
        );
      } else {
        ctx.showSnackbar(response.error || 'Ошибка изменения активности объекта', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка изменения активности объекта:', error);
      ctx.showSnackbar('Ошибка изменения активности объекта', 'error');
    }
  };

  const toggleAllObjectsActivity = async (isActive: boolean) => {
    if (ctx.selectedObjects.value.length === 0) {
      ctx.showSnackbar('Выберите объекты для изменения активности', 'warning');
      return;
    }

    if (!confirm(`${isActive ? 'Активировать' : 'Деактивировать'} выбранные объекты (${ctx.selectedObjects.value.length} шт.)?`)) {
      return;
    }

    try {
      const promises = ctx.selectedObjects.value.map(objectId =>
        objectsService.updateObject(objectId, { is_active: isActive }),
      );
      await Promise.all(promises);

      ctx.objects.value.forEach(obj => {
        if (ctx.selectedObjects.value.includes(obj.id)) {
          obj.is_active = isActive;
        }
      });

      ctx.showSnackbar(
        `${ctx.selectedObjects.value.length} объект(ов) ${isActive ? 'активированы' : 'деактивированы'}`,
        'success',
      );

      ctx.selectedObjects.value = [];
      ctx.selectAll.value = false;
    } catch (error: any) {
      console.error('Ошибка массового изменения активности:', error);
      ctx.showSnackbar('Ошибка массового изменения активности объектов', 'error');
    }
  };

  const addPhoneNumber = () => {
    objectForm.value.phoneNumbers?.push('');
  };

  const removePhoneNumber = (index: number) => {
    objectForm.value.phoneNumbers?.splice(index, 1);
  };

  const forceCloseAllDialogs = () => {
    objectDialog.value.show = false;
    scheduleDeleteDialog.value.show = false;
    viewDialog.value.show = false;
  };

  return {
    saving,
    scheduling,
    objectDialog,
    objectForm,
    objectFormRef,
    formErrors,
    scheduleDeleteDialog,
    scheduleDeleteForm,
    scheduleDeleteErrors,
    viewDialog,
    createTemplateDialog,
    createTemplateForm,
    createTemplateErrors,
    openCreateDialog,
    editObject,
    closeObjectDialog,
    resetObjectForm,
    fillObjectForm,
    saveObject,
    viewObject,
    closeViewDialog,
    editObjectFromView,
    deleteObjectFromView,
    deleteObject,
    scheduleDelete,
    closeScheduleDeleteDialog,
    confirmScheduleDelete,
    cancelScheduledDelete,
    createTemplateFromObject,
    closeCreateTemplateDialog,
    confirmCreateTemplate,
    restoreObject,
    permanentDeleteObject,
    toggleObjectActivity,
    toggleAllObjectsActivity,
    addPhoneNumber,
    removePhoneNumber,
    forceCloseAllDialogs,
  };
}
