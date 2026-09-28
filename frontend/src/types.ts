export type TaskState = 'todo' | 'in_progress' | 'done';
export type Priority = '0' | '1' | '2';

export interface Course {
  id: number;
  name: string;
  subject: string;
}

export interface StudyTask {
  id: number;
  name: string;
  course_id: number;
  course: string;
  date_deadline: string | null;
  priority: Priority;
  state: TaskState;
  notes: string;
}

export interface StudySession {
  id: number;
  name: string;
  course: string;
  date_start: string;
  duration: number;
}

export interface DashboardData {
  tasks: StudyTask[];
  courses: Course[];
  sessions: StudySession[];
}