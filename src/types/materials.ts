import type { MaterialMaster } from '@/types/entities';

export type MaterialMasterInput = {
  name: MaterialMaster['name'];
  category: MaterialMaster['category'];
  unit: MaterialMaster['unit'];
  standardRate: MaterialMaster['standardRate'];
  isActive: MaterialMaster['isActive'];
  hsn: MaterialMaster['hsn'];
  taxRate: MaterialMaster['taxRate'];
};

