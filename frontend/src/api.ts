import type { DashboardData, StudyTask, TaskState } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<DashboardData>('/study/api/dashboard'),
  createTask: (data: { name: string; course_id: number; date_deadline: string | null; priority: StudyTask['priority']; notes: string }) =>
    request<StudyTask>('/study/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: number, state: TaskState) =>
    request<StudyTask>(`/study/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ state }) }),
  deleteTask: (id: number) =>
    request<{ ok: boolean }>(`/study/api/tasks/${id}`, { method: 'DELETE' }),
};