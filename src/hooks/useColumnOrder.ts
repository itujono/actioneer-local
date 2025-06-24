import { useState, useEffect, useCallback } from "react";

export interface ColumnConfig {
  id: string;
  label: string;
  key: string;
  sortable?: boolean;
  fixed?: boolean; // For columns that shouldn't be moved (like actions)
}

interface UseColumnOrderProps {
  defaultColumns: ColumnConfig[];
  storageKey: string; // For localStorage persistence
}

export function useColumnOrder({
  defaultColumns,
  storageKey,
}: UseColumnOrderProps) {
  const [columnOrder, setColumnOrder] =
    useState<ColumnConfig[]>(defaultColumns);

  // Load saved column order from localStorage on mount and when defaultColumns change
  useEffect(() => {
    // Only update if defaultColumns actually has content (not empty array)
    if (defaultColumns.length === 0) {
      return;
    }

    try {
      const savedOrder = localStorage.getItem(storageKey);
      if (savedOrder) {
        const parsedOrder: string[] = JSON.parse(savedOrder);

        // Reconstruct column configs in the saved order
        const orderedColumns: ColumnConfig[] = [];
        const columnMap = new Map(defaultColumns.map((col) => [col.id, col]));

        // Add columns in saved order
        parsedOrder.forEach((columnId) => {
          const column = columnMap.get(columnId);
          if (column) {
            orderedColumns.push(column);
            columnMap.delete(columnId);
          }
        });

        // Add any new columns that weren't in the saved order (like new custom fields)
        columnMap.forEach((column) => {
          orderedColumns.push(column);
        });

        setColumnOrder(orderedColumns);
      } else {
        // No saved order, use default columns
        setColumnOrder(defaultColumns);
      }
    } catch (error) {
      console.warn("Failed to load column order from localStorage:", error);
      setColumnOrder(defaultColumns);
    }
  }, [defaultColumns, storageKey]);

  // Save column order to localStorage
  const saveColumnOrder = useCallback(
    (newOrder: ColumnConfig[]) => {
      try {
        const orderIds = newOrder.map((col) => col.id);
        localStorage.setItem(storageKey, JSON.stringify(orderIds));
        setColumnOrder(newOrder);
      } catch (error) {
        console.warn("Failed to save column order to localStorage:", error);
      }
    },
    [storageKey]
  );

  // Handle drag end event
  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;

      setColumnOrder((columns) => {
        const oldIndex = columns.findIndex((col) => col.id === activeId);
        const newIndex = columns.findIndex((col) => col.id === overId);

        if (oldIndex === -1 || newIndex === -1) return columns;

        // Don't allow moving fixed columns or moving columns to fixed positions
        const activeColumn = columns[oldIndex];
        const overColumn = columns[newIndex];

        if (activeColumn.fixed || overColumn.fixed) {
          return columns;
        }

        const newColumns = [...columns];

        // Remove the active column and insert it at the new position
        const [movedColumn] = newColumns.splice(oldIndex, 1);
        newColumns.splice(newIndex, 0, movedColumn);

        // Save to localStorage
        try {
          const orderIds = newColumns.map((col) => col.id);
          localStorage.setItem(storageKey, JSON.stringify(orderIds));
        } catch (error) {
          console.warn("Failed to save column order:", error);
        }

        return newColumns;
      });
    },
    [storageKey]
  );

  // Reset to default order
  const resetColumnOrder = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setColumnOrder(defaultColumns);
    } catch (error) {
      console.warn("Failed to reset column order:", error);
    }
  }, [defaultColumns, storageKey]);

  return {
    columnOrder,
    handleDragEnd,
    resetColumnOrder,
    saveColumnOrder,
  };
}
