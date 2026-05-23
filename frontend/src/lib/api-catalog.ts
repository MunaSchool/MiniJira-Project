export type ApiProbeKind = 'auto' | 'manual' | 'none';

export interface ApiEndpointDef {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  person: string;
  auth: boolean;
  probe: ApiProbeKind;
  managerOnly?: boolean;
}

/** All backend routes the frontend consumes (mounted under /api except /health). */
export const API_ENDPOINTS: ApiEndpointDef[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    description: 'Load balancer health check',
    person: 'Person 1',
    auth: false,
    probe: 'auto'
  },
  {
    id: 'users-me-get',
    method: 'GET',
    path: '/api/users/me',
    description: 'Current user profile',
    person: 'Person 1',
    auth: true,
    probe: 'auto'
  },
  {
    id: 'users-me-put',
    method: 'PUT',
    path: '/api/users/me',
    description: 'Update profile (name, email)',
    person: 'Person 1',
    auth: true,
    probe: 'manual'
  },
  {
    id: 'users-team',
    method: 'GET',
    path: '/api/users?teamId={teamId}',
    description: 'Users in a team (assignee dropdown)',
    person: 'Person 1',
    auth: true,
    probe: 'auto'
  },
  {
    id: 'tasks-list',
    method: 'GET',
    path: '/api/tasks',
    description: 'List tasks (role/team filtered)',
    person: 'Person 2',
    auth: true,
    probe: 'auto'
  },
  {
    id: 'tasks-create',
    method: 'POST',
    path: '/api/tasks',
    description: 'Create task',
    person: 'Person 2',
    auth: true,
    probe: 'manual',
    managerOnly: true
  },
  {
    id: 'tasks-one',
    method: 'GET',
    path: '/api/tasks/{taskId}',
    description: 'Get one task',
    person: 'Person 2',
    auth: true,
    probe: 'auto'
  },
  {
    id: 'tasks-update',
    method: 'PUT',
    path: '/api/tasks/{taskId}',
    description: 'Update task',
    person: 'Person 2',
    auth: true,
    probe: 'manual'
  },
  {
    id: 'tasks-status',
    method: 'PATCH',
    path: '/api/tasks/{taskId}/status',
    description: 'Update status (Kanban)',
    person: 'Person 2',
    auth: true,
    probe: 'manual'
  },
  {
    id: 'tasks-delete',
    method: 'DELETE',
    path: '/api/tasks/{taskId}',
    description: 'Delete task',
    person: 'Person 2',
    auth: true,
    probe: 'manual',
    managerOnly: true
  },
  {
    id: 'projects-list',
    method: 'GET',
    path: '/api/projects',
    description: 'List projects',
    person: 'Person 3',
    auth: true,
    probe: 'auto'
  },
  {
    id: 'projects-create',
    method: 'POST',
    path: '/api/projects',
    description: 'Create project',
    person: 'Person 3',
    auth: true,
    probe: 'manual',
    managerOnly: true
  },
  {
    id: 'projects-one',
    method: 'GET',
    path: '/api/projects/{projectId}',
    description: 'Get one project',
    person: 'Person 3',
    auth: true,
    probe: 'auto'
  },
  {
    id: 'projects-update',
    method: 'PUT',
    path: '/api/projects/{projectId}',
    description: 'Update project',
    person: 'Person 3',
    auth: true,
    probe: 'manual',
    managerOnly: true
  },
  {
    id: 'projects-delete',
    method: 'DELETE',
    path: '/api/projects/{projectId}',
    description: 'Delete project',
    person: 'Person 3',
    auth: true,
    probe: 'manual',
    managerOnly: true
  },
  {
    id: 'comments-list',
    method: 'GET',
    path: '/api/comments?taskId={taskId}',
    description: 'Comments for a task',
    person: 'Person 3',
    auth: true,
    probe: 'auto'
  },
  {
    id: 'comments-create',
    method: 'POST',
    path: '/api/comments',
    description: 'Add comment',
    person: 'Person 3',
    auth: true,
    probe: 'manual'
  },
  {
    id: 'uploads-presign',
    method: 'POST',
    path: '/api/uploads/presigned-url',
    description: 'S3 presigned upload URL',
    person: 'Person 4',
    auth: true,
    probe: 'manual'
  },
  {
    id: 'uploads-delete',
    method: 'DELETE',
    path: '/api/uploads/{key}',
    description: 'Delete image from S3',
    person: 'Person 4',
    auth: true,
    probe: 'manual'
  }
];

export function getPublicApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:5174 (proxy → :3000)';
  return window.location.origin;
}
