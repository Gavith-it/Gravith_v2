export interface MaterialMasterItem {
  id: string;
  name: string;
  category:
    | 'Cement'
    | 'Steel'
    | 'Concrete'
    | 'Bricks'
    | 'Sand'
    | 'Aggregate'
    | 'Timber'
    | 'Electrical'
    | 'Plumbing'
    | 'Paint'
    | 'Other';
  unit: string;
  standardRate: number;
  isActive: boolean;
  createdDate: string;
  lastUpdated: string;
  hsn: string;
  taxRate: number;
}

export const masterMaterials: MaterialMasterItem[] = [
  {
    id: '1',
    name: 'Ordinary Portland Cement (OPC 53)',
    category: 'Cement',
    unit: 'bags',
    standardRate: 425,
    isActive: true,
    createdDate: '2024-01-01',
    lastUpdated: '2024-02-20',
    hsn: '25231000',
    taxRate: 18,
  },
  {
    id: '2',
    name: 'TMT Steel Bars 12mm',
    category: 'Steel',
    unit: 'kg',
    standardRate: 65,
    isActive: true,
    createdDate: '2024-01-01',
    lastUpdated: '2024-02-18',
    hsn: '72142000',
    taxRate: 18,
  },
  {
    id: '3',
    name: 'Ready Mix Concrete M25',
    category: 'Concrete',
    unit: 'cubic meters',
    standardRate: 4500,
    isActive: true,
    createdDate: '2024-01-01',
    lastUpdated: '2024-02-15',
    hsn: '25059000',
    taxRate: 18,
  },
  {
    id: '4',
    name: 'Clay Bricks',
    category: 'Bricks',
    unit: 'pieces',
    standardRate: 8,
    isActive: true,
    createdDate: '2024-01-01',
    lastUpdated: '2024-02-10',
    hsn: '69041000',
    taxRate: 12,
  },
  {
    id: '5',
    name: 'River Sand (Fine)',
    category: 'Sand',
    unit: 'cubic meters',
    standardRate: 1200,
    isActive: true,
    createdDate: '2024-01-01',
    lastUpdated: '2024-02-08',
    hsn: '25059000',
    taxRate: 5,
  },
  {
    id: '6',
    name: 'TMT Steel Bars 16mm',
    category: 'Steel',
    unit: 'kg',
    standardRate: 67,
    isActive: true,
    createdDate: '2024-01-01',
    lastUpdated: '2024-02-15',
    hsn: '72142000',
    taxRate: 18,
  },
  {
    id: '7',
    name: 'PVC Electrical Conduit 20mm',
    category: 'Electrical',
    unit: 'meters',
    standardRate: 25,
    isActive: false,
    createdDate: '2024-01-01',
    lastUpdated: '2024-01-25',
    hsn: '39172900',
    taxRate: 18,
  },
  {
    id: '8',
    name: 'Crushed Stone Aggregate 20mm',
    category: 'Aggregate',
    unit: 'cubic meters',
    standardRate: 1800,
    isActive: true,
    createdDate: '2024-01-01',
    lastUpdated: '2024-02-12',
    hsn: '25171000',
    taxRate: 5,
  },
  {
    id: '9',
    name: 'Teak Wood Planks',
    category: 'Timber',
    unit: 'cubic feet',
    standardRate: 2500,
    isActive: true,
    createdDate: '2024-01-01',
    lastUpdated: '2024-02-08',
    hsn: '44032600',
    taxRate: 5,
  },
  {
    id: '10',
    name: 'Asian Paints Primer',
    category: 'Paint',
    unit: 'liters',
    standardRate: 180,
    isActive: true,
    createdDate: '2024-01-01',
    lastUpdated: '2024-02-05',
    hsn: '32100000',
    taxRate: 18,
  },
];

// Helper function to get active materials
export const getActiveMaterials = (): MaterialMasterItem[] => {
  return masterMaterials.filter((material) => material.isActive);
};

// Helper function to get materials by category
export const getMaterialsByCategory = (category: string): MaterialMasterItem[] => {
  return masterMaterials.filter((material) => material.category === category && material.isActive);
};

// Helper function to search materials
export const searchMaterials = (searchTerm: string): MaterialMasterItem[] => {
  const term = searchTerm.toLowerCase();
  return masterMaterials.filter(
    (material) =>
      material.isActive &&
      (material.name.toLowerCase().includes(term) ||
        material.category.toLowerCase().includes(term)),
  );
};
