import type { MaterialMaster } from '@/types/entities';

export type MaterialMasterInput = {
  name: MaterialMaster['name'];
  category: MaterialMaster['category'];
  unit: MaterialMaster['unit'];
  siteId?: MaterialMaster['siteId'];
  standardRate: MaterialMaster['standardRate'];
  isActive: MaterialMaster['isActive'];
  hsn: MaterialMaster['hsn'];
  taxRateId: string; // Tax rate code/ID from masters (e.g., 'GST18', 'GST12')
  openingBalance?: MaterialMaster['openingBalance'];
  siteAllocations?: MaterialMaster['siteAllocations'];
};

