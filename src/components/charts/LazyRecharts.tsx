'use client';

// Re-export Recharts components directly
// The lazy loading will happen at the component level (reports.tsx)
// This avoids TypeScript issues with dynamic imports of individual components
export {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from 'recharts';

