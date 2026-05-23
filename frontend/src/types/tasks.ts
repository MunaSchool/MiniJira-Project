export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export interface Task {
  taskId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: string;
  deadline?: string;
  assigneeId: string;
  assigneeName?: string;
  teamId: string;
  teamName?: string;
  imageKey?: string;
  imageUrl?: string | null;
  resizedImageUrl?: string | null;
  commentCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  count: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: string;
  assigneeId?: string;
  limit?: number;
}

export interface TaskCreatePayload {
  title: string;
  description?: string;
  priority?: string;
  deadline?: string;
  assigneeId: string;
  teamId: string;
  imageKey?: string;
  status?: TaskStatus;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string;
  priority?: string;
  deadline?: string;
  assigneeId?: string;
  status?: TaskStatus;
  imageKey?: string;
}
