import { ref, type Ref } from 'vue';
import type { ObjectWithRelations } from '@/types/objects';

interface UseObjectsSelectionContext {
  objects: Ref<ObjectWithRelations[]>;
}

export function useObjectsSelection(ctx: UseObjectsSelectionContext) {
  const selectedObjects = ref<number[]>([]);
  const selectAll = ref(false);

  const updateSelectAllState = () => {
    if (selectedObjects.value.length === 0) {
      selectAll.value = false;
    } else if (selectedObjects.value.length === ctx.objects.value.length) {
      selectAll.value = true;
    } else {
      selectAll.value = false;
    }
  };

  const toggleObjectSelection = (objectId: number) => {
    const index = selectedObjects.value.indexOf(objectId);
    if (index > -1) {
      selectedObjects.value.splice(index, 1);
    } else {
      selectedObjects.value.push(objectId);
    }
    updateSelectAllState();
  };

  const toggleSelectAll = () => {
    if (selectAll.value) {
      selectedObjects.value = ctx.objects.value.map(obj => obj.id);
    } else {
      selectedObjects.value = [];
    }
  };

  return {
    selectedObjects,
    selectAll,
    toggleObjectSelection,
    toggleSelectAll,
    updateSelectAllState,
  };
}
