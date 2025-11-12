'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { ProjectActivity, ProjectMilestone } from '@/types';

interface SchedulingContextType {
  activities: ProjectActivity[];
  milestones: ProjectMilestone[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addActivity: (activity: ActivityPayload) => Promise<ProjectActivity | null>;
  updateActivity: (id: string, activity: ActivityUpdatePayload) => Promise<ProjectActivity | null>;
  deleteActivity: (id: string) => Promise<boolean>;
  addMilestone: (milestone: MilestonePayload) => Promise<ProjectMilestone | null>;
  updateMilestone: (id: string, milestone: MilestoneUpdatePayload) => Promise<ProjectMilestone | null>;
  deleteMilestone: (id: string) => Promise<boolean>;
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined);

type ActivityPayload = {
  siteId: string;
  siteName?: string | null;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  status: ProjectActivity['status'];
  dependencies?: string[];
  assignedTeam?: string;
  priority: ProjectActivity['priority'];
  category: ProjectActivity['category'];
  resources?: string[];
  milestones?: boolean;
};

type ActivityUpdatePayload = Partial<ActivityPayload>;

type MilestonePayload = {
  siteId: string;
  siteName?: string | null;
  name: string;
  date: string;
  description?: string;
  status?: ProjectMilestone['status'];
};

type MilestoneUpdatePayload = Partial<MilestonePayload>;

async function fetchActivities(): Promise<ProjectActivity[]> {
  const response = await fetch('/api/scheduling/activities', { cache: 'no-store' });
  const payload = (await response.json().catch(() => ({}))) as {
    activities?: ProjectActivity[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load activities.');
  }

  return payload.activities ?? [];
}

async function fetchMilestones(): Promise<ProjectMilestone[]> {
  const response = await fetch('/api/scheduling/milestones', { cache: 'no-store' });
  const payload = (await response.json().catch(() => ({}))) as {
    milestones?: ProjectMilestone[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load milestones.');
  }

  return payload.milestones ?? [];
}

export function SchedulingProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshActivities = useCallback(async () => {
    const data = await fetchActivities();
    setActivities(data);
  }, []);

  const refreshMilestones = useCallback(async () => {
    const data = await fetchMilestones();
    setMilestones(data);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([refreshActivities(), refreshMilestones()]);
    } catch (error) {
      console.error('Error loading scheduling data', error);
      setActivities([]);
      setMilestones([]);
      toast.error('Failed to load scheduling data.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshActivities, refreshMilestones]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addActivity = useCallback(async (activity: ActivityPayload): Promise<ProjectActivity | null> => {
    const response = await fetch('/api/scheduling/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      activity?: ProjectActivity;
      error?: string;
    };

    if (!response.ok || !payload.activity) {
      throw new Error(payload.error || 'Failed to create activity.');
    }

    setActivities((prev) => [payload.activity!, ...prev]);
    return payload.activity ?? null;
  }, []);

  const updateActivity = useCallback(
    async (id: string, activity: ActivityUpdatePayload): Promise<ProjectActivity | null> => {
      const response = await fetch(`/api/scheduling/activities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        activity?: ProjectActivity;
        error?: string;
      };

      if (!response.ok || !payload.activity) {
        throw new Error(payload.error || 'Failed to update activity.');
      }

      setActivities((prev) => prev.map((item) => (item.id === id ? payload.activity! : item)));
      return payload.activity ?? null;
    },
    [],
  );

  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/scheduling/activities/${id}`, { method: 'DELETE' });
    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || payload.success !== true) {
      throw new Error(payload.error || 'Failed to delete activity.');
    }

    setActivities((prev) => prev.filter((activity) => activity.id !== id));
    return true;
  }, []);

  const addMilestone = useCallback(async (milestone: MilestonePayload): Promise<ProjectMilestone | null> => {
    const response = await fetch('/api/scheduling/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestone),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      milestone?: ProjectMilestone;
      error?: string;
    };

    if (!response.ok || !payload.milestone) {
      throw new Error(payload.error || 'Failed to create milestone.');
    }

    setMilestones((prev) => [payload.milestone!, ...prev]);
    return payload.milestone ?? null;
  }, []);

  const updateMilestone = useCallback(
    async (id: string, milestone: MilestoneUpdatePayload): Promise<ProjectMilestone | null> => {
      const response = await fetch(`/api/scheduling/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestone),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        milestone?: ProjectMilestone;
        error?: string;
      };

      if (!response.ok || !payload.milestone) {
        throw new Error(payload.error || 'Failed to update milestone.');
      }

      setMilestones((prev) => prev.map((item) => (item.id === id ? payload.milestone! : item)));
      return payload.milestone ?? null;
    },
    [],
  );

  const deleteMilestone = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/scheduling/milestones/${id}`, { method: 'DELETE' });
    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || payload.success !== true) {
      throw new Error(payload.error || 'Failed to delete milestone.');
    }

    setMilestones((prev) => prev.filter((milestone) => milestone.id !== id));
    return true;
  }, []);

  const value = useMemo<SchedulingContextType>(
    () => ({
      activities,
      milestones,
      isLoading,
      refresh,
      addActivity,
      updateActivity,
      deleteActivity,
      addMilestone,
      updateMilestone,
      deleteMilestone,
    }),
    [
      activities,
      milestones,
      isLoading,
      refresh,
      addActivity,
      updateActivity,
      deleteActivity,
      addMilestone,
      updateMilestone,
      deleteMilestone,
    ],
  );

  return <SchedulingContext.Provider value={value}>{children}</SchedulingContext.Provider>;
}

export function useScheduling() {
  const context = useContext(SchedulingContext);
  if (!context) {
    throw new Error('useScheduling must be used within a SchedulingProvider');
  }
  return context;
}

