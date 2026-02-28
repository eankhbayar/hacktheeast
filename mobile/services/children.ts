import api from './api';
import type { ChildProfile, Schedule } from '@/types/children';

export interface CreateChildRequest {
  name: string;
  ageGroup: string;
  learningFocus: string[];
  interests: string[];
  avatarUrl?: string;
}

export interface UpdateChildRequest {
  name?: string;
  ageGroup?: string;
  learningFocus?: string[];
  interests?: string[];
  avatarUrl?: string;
  isActive?: boolean;
}

export interface CreateScheduleRequest {
  intervalMinutes: number;
  activeDays: string[];
  activeStartTime: string;
  activeEndTime: string;
}

export interface UpdateScheduleRequest {
  intervalMinutes?: number;
  activeDays?: string[];
  activeStartTime?: string;
  activeEndTime?: string;
  isEnabled?: boolean;
}

export async function fetchChildren(): Promise<ChildProfile[]> {
  const response = await api.get<ChildProfile[]>('/children');
  return response.data;
}

export async function getChild(childId: string): Promise<ChildProfile> {
  const response = await api.get<ChildProfile>(`/children/${childId}`);
  return response.data;
}

export async function createChild(data: CreateChildRequest): Promise<ChildProfile> {
  const response = await api.post<ChildProfile>('/children', data);
  return response.data;
}

export async function updateChild(
  childId: string,
  data: UpdateChildRequest
): Promise<ChildProfile> {
  const response = await api.put<ChildProfile>(`/children/${childId}`, data);
  return response.data;
}

export async function deleteChild(childId: string): Promise<void> {
  await api.delete(`/children/${childId}`);
}

export async function getSchedule(childId: string): Promise<Schedule> {
  const response = await api.get<Schedule>(`/children/${childId}/schedule`);
  return response.data;
}

export async function createSchedule(
  childId: string,
  data: CreateScheduleRequest
): Promise<Schedule> {
  const response = await api.post<Schedule>(
    `/children/${childId}/schedule`,
    data
  );
  return response.data;
}

export async function updateSchedule(
  childId: string,
  data: UpdateScheduleRequest
): Promise<Schedule> {
  const response = await api.put<Schedule>(
    `/children/${childId}/schedule`,
    data
  );
  return response.data;
}

export async function deleteSchedule(childId: string): Promise<void> {
  await api.delete(`/children/${childId}/schedule`);
}
