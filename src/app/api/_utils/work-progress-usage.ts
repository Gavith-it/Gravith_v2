export type PurchaseUsageContextRow = {
  id: string;
  material_id: string | null;
  quantity: number | string | null;
};

export type WorkProgressUsageRow = {
  purchase_id: string | null;
  material_id: string | null;
  quantity: number | string | null;
};

const toNonNegativeNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, parsed);
};

/**
 * Builds a map of purchaseId -> total quantity consumed based on work progress usage rows.
 * If a work progress row doesn't have a purchase_id (legacy data), the consumption is allocated
 * to purchases of the same material_id in the order they were fetched, without exceeding the
 * recorded quantity of each purchase.
 */
export function buildPurchaseUsageMap(
  purchaseRows: PurchaseUsageContextRow[],
  usageRows: WorkProgressUsageRow[] | null | undefined,
): Map<string, number> {
  const purchaseUsageMap = new Map<string, number>();
  const purchaseCapacityMap = new Map<string, number>();
  const materialPurchaseMap = new Map<string, string[]>();

  purchaseRows.forEach((row) => {
    const purchaseId = row.id;
    const materialId = row.material_id ?? undefined;
    const capacity = toNonNegativeNumber(row.quantity);

    purchaseCapacityMap.set(purchaseId, capacity);

    if (materialId) {
      const queue = materialPurchaseMap.get(materialId) ?? [];
      queue.push(purchaseId);
      materialPurchaseMap.set(materialId, queue);
    }
  });

  const allocateToPurchase = (purchaseId: string, quantity: number) => {
    if (quantity <= 0) return;
    purchaseUsageMap.set(purchaseId, (purchaseUsageMap.get(purchaseId) ?? 0) + quantity);
    const available = purchaseCapacityMap.get(purchaseId) ?? 0;
    purchaseCapacityMap.set(purchaseId, Math.max(0, available - quantity));
  };

  (usageRows ?? []).forEach((row) => {
    const usageQuantity = toNonNegativeNumber(row.quantity);
    if (usageQuantity <= 0) {
      return;
    }

    const directPurchaseId = row.purchase_id ?? undefined;
    if (directPurchaseId && purchaseCapacityMap.has(directPurchaseId)) {
      allocateToPurchase(directPurchaseId, usageQuantity);
      return;
    }

    const materialId = row.material_id ?? undefined;
    if (!materialId) {
      return;
    }

    const purchaseQueue = materialPurchaseMap.get(materialId);
    if (!purchaseQueue || purchaseQueue.length === 0) {
      return;
    }

    let remaining = usageQuantity;
    for (const candidateId of purchaseQueue) {
      if (remaining <= 0) break;
      const available = purchaseCapacityMap.get(candidateId) ?? 0;
      if (available <= 0) continue;

      const allocated = Math.min(available, remaining);
      allocateToPurchase(candidateId, allocated);
      remaining -= allocated;
    }
  });

  return purchaseUsageMap;
}

