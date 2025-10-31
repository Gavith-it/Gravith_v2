import { useState, useCallback } from 'react';

export interface UseDialogStateOptions<T> {
  initialEditingItem?: T | null;
  onClose?: (item: T | null) => void;
  onOpen?: (item: T | null) => void;
}

export interface UseDialogStateReturn<T> {
  // State
  isDialogOpen: boolean;
  editingItem: T | null;

  // Actions
  openDialog: (item?: T | null) => void;
  closeDialog: () => void;
  setEditingItem: (item: T | null) => void;
  toggleDialog: (item?: T | null) => void;

  // Computed
  isEditing: boolean;
  isCreating: boolean;
}

export function useDialogState<T = unknown>(
  options: UseDialogStateOptions<T> = {},
): UseDialogStateReturn<T> {
  const opts = {
    initialEditingItem: null as T | null,
    ...options,
  };

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<T | null>(opts.initialEditingItem);

  // Open dialog with optional item to edit
  const openDialog = useCallback(
    (item: T | null = null) => {
      setEditingItem(item);
      setIsDialogOpen(true);
      options.onOpen?.(item);
    },
    [options],
  );

  // Close dialog and optionally call onClose callback
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    // Keep editingItem until dialog is closed to prevent flicker
    setTimeout(() => {
      setEditingItem(null);
    }, 150); // Small delay to allow for dialog close animation
    options.onClose?.(editingItem);
  }, [options, editingItem]);

  // Set editing item without opening dialog
  const handleSetEditingItem = useCallback((item: T | null) => {
    setEditingItem(item);
  }, []);

  // Toggle dialog state
  const toggleDialog = useCallback(
    (item: T | null = null) => {
      if (isDialogOpen) {
        closeDialog();
      } else {
        openDialog(item);
      }
    },
    [isDialogOpen, openDialog, closeDialog],
  );

  // Computed values
  const isEditing = editingItem !== null;
  const isCreating = isDialogOpen && editingItem === null;

  return {
    // State
    isDialogOpen,
    editingItem,

    // Actions
    openDialog,
    closeDialog,
    setEditingItem: handleSetEditingItem,
    toggleDialog,

    // Computed
    isEditing,
    isCreating,
  };
}
