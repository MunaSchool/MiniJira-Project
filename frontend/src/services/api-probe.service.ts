import axios from 'axios';
import { api } from './api';
import { checkHealth } from './health.service';
import { getProfile } from './user.service';
import { getUsersByTeam } from './users.service';
import { getTasks, getTask } from './tasks.service';
import { getProjects, getProject } from './projects.service';
import { getComments } from './comments.service';
import type { ApiEndpointDef } from '@/lib/api-catalog';

export type ProbeStatus = 'idle' | 'running' | 'ok' | 'error' | 'skipped';

export interface ProbeResult {
  status: ProbeStatus;
  statusCode?: number;
  message: string;
  durationMs?: number;
}

export interface ProbeContext {
  teamId?: string | null;
  taskId?: string | null;
  projectId?: string | null;
  isManager?: boolean;
}

function ok(message: string, statusCode?: number, durationMs?: number): ProbeResult {
  return { status: 'ok', statusCode, message, durationMs };
}

function fail(message: string, statusCode?: number, durationMs?: number): ProbeResult {
  return { status: 'error', statusCode, message, durationMs };
}

function skipped(message: string): ProbeResult {
  return { status: 'skipped', message };
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const start = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - start) };
}

export async function probeEndpoint(
  endpoint: ApiEndpointDef,
  ctx: ProbeContext
): Promise<ProbeResult> {
  if (endpoint.probe === 'none') {
    return skipped('No probe');
  }

  if (endpoint.managerOnly && !ctx.isManager) {
    return skipped('Manager role required');
  }

  try {
    switch (endpoint.id) {
      case 'health': {
        const { value, ms } = await timed(() => checkHealth());
        return ok(`${value.status}`, 200, ms);
      }
      case 'users-me-get': {
        const { value, ms } = await timed(() => getProfile());
        return ok(`${value.email} (${value.role})`, 200, ms);
      }
      case 'users-me-put':
        return skipped('Use Settings to update profile');
      case 'users-team': {
        if (!ctx.teamId) return skipped('No teamId on profile');
        const { value, ms } = await timed(() => getUsersByTeam(ctx.teamId!));
        return ok(`${value.length} user(s)`, 200, ms);
      }
      case 'tasks-list': {
        const { value, ms } = await timed(() => getTasks());
        const count = value.tasks?.length ?? 0;
        return ok(`${count} task(s)`, 200, ms);
      }
      case 'tasks-one': {
        if (!ctx.taskId) return skipped('No tasks to sample');
        const { value, ms } = await timed(() => getTask(ctx.taskId!));
        return ok(value.title || value.taskId, 200, ms);
      }
      case 'tasks-create':
      case 'tasks-update':
      case 'tasks-status':
      case 'tasks-delete':
        return skipped('Use Kanban board for task writes');
      case 'projects-list': {
        const { value, ms } = await timed(() => getProjects(ctx.teamId ?? undefined));
        return ok(`${value.length} project(s)`, 200, ms);
      }
      case 'projects-one': {
        if (!ctx.projectId) return skipped('No projects to sample');
        const { value, ms } = await timed(() => getProject(ctx.projectId!));
        return ok(value.name || value.projectId, 200, ms);
      }
      case 'projects-create':
      case 'projects-update':
      case 'projects-delete':
        return skipped('Use Projects page for project writes');
      case 'comments-list': {
        if (!ctx.taskId) return skipped('No tasks to sample');
        const { value, ms } = await timed(() => getComments(ctx.taskId!));
        return ok(`${value.length} comment(s)`, 200, ms);
      }
      case 'comments-create':
        return skipped('Add comments on a task card');
      case 'uploads-presign': {
        const { ms } = await timed(async () => {
          await api.post('/api/uploads/presigned-url', {
            fileName: 'probe.png',
            contentType: 'image/png'
          });
        });
        return ok('Presigned URL issued', 200, ms);
      }
      case 'uploads-delete':
        return skipped('Destructive — not auto-tested');
      default:
        return skipped('Unknown endpoint');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const code = error.response?.status;
      const msg =
        (error.response?.data as { error?: string })?.error ||
        error.message ||
        'Request failed';
      return fail(msg, code);
    }
    return fail(error instanceof Error ? error.message : 'Request failed');
  }
}

export async function probeAllAuto(
  endpoints: ApiEndpointDef[],
  ctx: ProbeContext
): Promise<Record<string, ProbeResult>> {
  const auto = endpoints.filter((e) => e.probe === 'auto');
  const results: Record<string, ProbeResult> = {};

  for (const endpoint of auto) {
    results[endpoint.id] = { status: 'running', message: '…' };
  }

  for (const endpoint of auto) {
    results[endpoint.id] = await probeEndpoint(endpoint, ctx);
  }

  return results;
}
