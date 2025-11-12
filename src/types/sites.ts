export type SiteStatus = 'Active' | 'Stopped' | 'Completed' | 'Canceled';

export interface Site {
  id: string;
  name: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  status: SiteStatus;
  budget: number;
  spent: number;
  progress: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SiteInput = {
  name: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  status: SiteStatus;
  budget: number;
  description?: string;
};

