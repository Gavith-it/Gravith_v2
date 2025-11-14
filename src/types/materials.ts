import type { MaterialMaster } from '@/types/entities';

export type MaterialMasterInput = {
  name: MaterialMaster['name'];
  category: MaterialMaster['category'];
  unit: MaterialMaster['unit'];
  siteId?: MaterialMaster['siteId'];
  quantity: MaterialMaster['quantity'];
  consumedQuantity: MaterialMaster['consumedQuantity'];
  standardRate: MaterialMaster['standardRate'];
  isActive: MaterialMaster['isActive'];
  hsn: MaterialMaster['hsn'];
  taxRate: MaterialMaster['taxRate'];
};

