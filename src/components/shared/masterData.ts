export interface UOMItem {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orgId?: string; // For future tenant scoping
}

export interface MaterialCategoryItem {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orgId?: string; // For future tenant scoping
}

export interface MaterialSubCategoryItem {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orgId?: string; // For future tenant scoping
}

export interface TaxRateItem {
  id: string;
  code: string;
  name: string;
  rate: number; // Percentage value (e.g., 18 for 18%)
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orgId?: string; // For future tenant scoping
}

export const mockUOMs: UOMItem[] = [
  {
    id: '1',
    code: 'KG',
    name: 'Kilogram',
    description: 'Unit of mass measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'MT',
    name: 'Metric Ton',
    description: 'Unit of mass measurement (1000 kg)',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    code: 'MTR',
    name: 'Meter',
    description: 'Unit of length measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    code: 'CFT',
    name: 'Cubic Feet',
    description: 'Unit of volume measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    code: 'CUM',
    name: 'Cubic Meter',
    description: 'Unit of volume measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    code: 'LTR',
    name: 'Liter',
    description: 'Unit of liquid volume measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    code: 'BAG',
    name: 'Bag',
    description: 'Unit for packaged materials',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '8',
    code: 'PCS',
    name: 'Pieces',
    description: 'Unit for countable items',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '9',
    code: 'SQM',
    name: 'Square Meter',
    description: 'Unit of area measurement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '10',
    code: 'SQFT',
    name: 'Square Feet',
    description: 'Unit of area measurement',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
];

export const mockCategories: MaterialCategoryItem[] = [
  {
    id: '1',
    code: 'CEMENT',
    name: 'Cement',
    description: 'Portland cement and cement products',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'STEEL',
    name: 'Steel',
    description: 'Steel bars, rods, and structural steel',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    code: 'CONCRETE',
    name: 'Concrete',
    description: 'Ready-mix concrete and concrete products',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    code: 'BRICKS',
    name: 'Bricks',
    description: 'Clay bricks, fly ash bricks, and blocks',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    code: 'SAND',
    name: 'Sand',
    description: 'Fine and coarse sand for construction',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    code: 'AGGREGATE',
    name: 'Aggregate',
    description: 'Stone aggregates of various sizes',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    code: 'TIMBER',
    name: 'Timber',
    description: 'Wood and timber products',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '8',
    code: 'ELECTRICAL',
    name: 'Electrical',
    description: 'Electrical wires, cables, and fittings',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '9',
    code: 'PLUMBING',
    name: 'Plumbing',
    description: 'Pipes, fittings, and plumbing fixtures',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '10',
    code: 'PAINT',
    name: 'Paint',
    description: 'Paints, primers, and coating materials',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const mockSubCategories: MaterialSubCategoryItem[] = [
  {
    id: '1',
    code: 'OPC',
    name: 'OPC Cement',
    categoryId: '1',
    description: 'Ordinary Portland Cement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'PPC',
    name: 'PPC Cement',
    categoryId: '1',
    description: 'Portland Pozzolana Cement',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    code: 'TMT',
    name: 'TMT Bars',
    categoryId: '2',
    description: 'Thermo-Mechanically Treated Steel Bars',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    code: 'STRUCT',
    name: 'Structural Steel',
    categoryId: '2',
    description: 'I-beams, channels, and angles',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    code: 'RMC',
    name: 'Ready Mix Concrete',
    categoryId: '3',
    description: 'Ready-mixed concrete of various grades',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    code: 'BLOCKS',
    name: 'Concrete Blocks',
    categoryId: '3',
    description: 'Precast concrete blocks',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    code: 'CLAY',
    name: 'Clay Bricks',
    categoryId: '4',
    description: 'Traditional fired clay bricks',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '8',
    code: 'FLYASH',
    name: 'Fly Ash Bricks',
    categoryId: '4',
    description: 'Eco-friendly fly ash bricks',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '9',
    code: 'RIVER',
    name: 'River Sand',
    categoryId: '5',
    description: 'Natural river sand',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '10',
    code: 'MSAND',
    name: 'M-Sand',
    categoryId: '5',
    description: 'Manufactured sand',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '11',
    code: 'AGG20',
    name: '20mm Aggregate',
    categoryId: '6',
    description: '20mm crushed stone aggregate',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '12',
    code: 'AGG40',
    name: '40mm Aggregate',
    categoryId: '6',
    description: '40mm crushed stone aggregate',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '13',
    code: 'WIRE',
    name: 'Electrical Wires',
    categoryId: '8',
    description: 'PVC insulated copper wires',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '14',
    code: 'CONDUIT',
    name: 'Conduits',
    categoryId: '8',
    description: 'PVC and metal conduits',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '15',
    code: 'EMULSION',
    name: 'Emulsion Paint',
    categoryId: '10',
    description: 'Water-based emulsion paints',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Helper functions
export const getActiveUOMs = (): UOMItem[] => {
  return mockUOMs.filter((uom) => uom.isActive);
};

export const getActiveCategories = (): MaterialCategoryItem[] => {
  return mockCategories.filter((category) => category.isActive);
};

export const getActiveSubCategories = (): MaterialSubCategoryItem[] => {
  return mockSubCategories.filter((subCategory) => subCategory.isActive);
};

export const getSubCategoriesByCategory = (categoryId: string): MaterialSubCategoryItem[] => {
  return mockSubCategories.filter(
    (subCategory) => subCategory.categoryId === categoryId && subCategory.isActive,
  );
};

export const mockTaxRates: TaxRateItem[] = [
  {
    id: '1',
    code: 'GST18',
    name: 'GST 18%',
    rate: 18,
    description: 'Goods and Services Tax at 18% for construction materials',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'GST12',
    name: 'GST 12%',
    rate: 12,
    description: 'Goods and Services Tax at 12% for selected materials',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    code: 'GST5',
    name: 'GST 5%',
    rate: 5,
    description: 'Goods and Services Tax at 5% for basic materials',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    code: 'GST28',
    name: 'GST 28%',
    rate: 28,
    description: 'Goods and Services Tax at 28% for luxury items',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    code: 'GST0',
    name: 'GST Exempt',
    rate: 0,
    description: 'Tax-exempt items',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    code: 'CGST9',
    name: 'CGST 9%',
    rate: 9,
    description: 'Central GST at 9%',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    code: 'SGST9',
    name: 'SGST 9%',
    rate: 9,
    description: 'State GST at 9%',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '8',
    code: 'IGST18',
    name: 'IGST 18%',
    rate: 18,
    description: 'Integrated GST at 18% for interstate transactions',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '9',
    code: 'TDS2',
    name: 'TDS 2%',
    rate: 2,
    description: 'Tax Deducted at Source at 2%',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '10',
    code: 'VAT14',
    name: 'VAT 14%',
    rate: 14,
    description: 'Value Added Tax at 14% (legacy)',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
];

export const getActiveTaxRates = (): TaxRateItem[] => {
  return mockTaxRates.filter((taxRate) => taxRate.isActive);
};
