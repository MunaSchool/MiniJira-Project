import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, getPublicApiBase } from '@/lib/api-catalog';
import { probeAllAuto, probeEndpoint, type ProbeContext, type ProbeResult } from '@/services/api-probe.service';
import { useAuth } from '@/context/AuthContext';
import { getTasks } from '@/services/tasks.service';
import { getProjects } from '@/services/projects.service';
import { Button } from '@/components/ui/button';

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-amber-100 text-amber-800',
  PATCH: 'bg-violet-100 text-violet-800',
  DELETE: 'bg-red-100 text-red-800'
};

function statusLabel(result?: ProbeResult) {
  if (!result || result.status === 'idle') return '—';
  if (result.status === 'running') return '…';
  if (result.status === 'ok') return `OK ${result.statusCode ?? ''}`.trim();
  if (result.status === 'skipped') return 'Skipped';
  return `Error ${result.statusCode ?? ''}`.trim();
}

async function buildProbeContext(
  teamId: string | null | undefined,
  isManager: boolean
): Promise<ProbeContext> {
  const base: ProbeContext = {
    teamId: teamId ?? null,
    taskId: null,
    projectId: null,
    isManager
  };
  try {
    const [tasksRes, projectsRes] = await Promise.all([
      getTasks(),
      getProjects(teamId ?? undefined)
    ]);
    base.taskId = tasksRes.tasks[0]?.taskId ?? null;
    base.projectId = projectsRes[0]?.projectId ?? null;
  } catch {
    /* partial */
  }
  return base;
}

export default function ApiPage() {
  const { profile } = useAuth();
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [running, setRunning] = useState(false);
  const [ctx, setCtx] = useState<ProbeContext>({});

  const runAuto = useCallback(async () => {
    setRunning(true);
    const freshCtx = await buildProbeContext(profile?.teamId, profile?.role === 'Manager');
    setCtx(freshCtx);
    setResults(await probeAllAuto(API_ENDPOINTS, freshCtx));
    setRunning(false);
  }, [profile?.teamId, profile?.role]);

  useEffect(() => {
    void runAuto();
  }, [runAuto]);

  const probeOne = async (id: string) => {
    const ep = API_ENDPOINTS.find((e) => e.id === id);
    if (!ep) return;
    setResults((prev) => ({ ...prev, [id]: { status: 'running', message: '…' } }));
    const result = await probeEndpoint(ep, ctx);
    setResults((prev) => ({ ...prev, [id]: result }));
  };

  const summary = useMemo(() => {
    const values = Object.values(results);
    return {
      ok: values.filter((r) => r.status === 'ok').length,
      err: values.filter((r) => r.status === 'error').length,
      skipped: values.filter((r) => r.status === 'skipped').length
    };
  }, [results]);

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-blue-700">Mini Jira AWS</p>
            <h1 className="text-2xl font-semibold text-slate-900">API reference &amp; live tests</h1>
            <p className="mt-1 text-sm text-slate-600">
              Base URL: <span className="font-mono text-slate-800">{getPublicApiBase()}</span>
            </p>
          </div>
          <Link to="/home" className="text-sm font-medium text-blue-600 hover:underline">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Button onClick={() => void runAuto()} disabled={running}>
            {running ? 'Running GET probes…' : 'Test all safe (GET) endpoints'}
          </Button>
          <span className="text-sm text-slate-600">
            {summary.ok} OK · {summary.err} failed · {summary.skipped} skipped
          </span>
          {profile ? (
            <span className="text-sm text-slate-600">
              Signed in: {profile.email} ({profile.role})
            </span>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Method</th>
                <th className="px-2 py-3">Endpoint</th>
                <th className="px-2 py-3">Description</th>
                <th className="px-2 py-3">Team</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {API_ENDPOINTS.map((ep) => {
                const result = results[ep.id];
                return (
                  <tr key={ep.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${methodColors[ep.method]}`}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-2 py-3 font-mono text-xs">{ep.path}</td>
                    <td className="px-2 py-3 text-slate-600">{ep.description}</td>
                    <td className="px-2 py-3 text-slate-500">{ep.person}</td>
                    <td className="px-2 py-3">
                      <span
                        className={
                          result?.status === 'ok'
                            ? 'text-emerald-700'
                            : result?.status === 'error'
                              ? 'text-red-600'
                              : 'text-slate-500'
                        }
                      >
                        {statusLabel(result)}
                      </span>
                      {result?.message && result.status !== 'running' ? (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500" title={result.message}>
                          {result.message}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3">
                      {ep.probe !== 'none' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={result?.status === 'running'}
                          onClick={() => void probeOne(ep.id)}
                        >
                          Test
                        </Button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="font-medium text-slate-800">Auth (Cognito Hosted UI)</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Local callback: http://localhost:5174/callback</li>
            <li>Production callback: https://dv69sewi064tv.cloudfront.net/callback</li>
            <li>Local sign-out: http://localhost:5174/</li>
            <li>Production sign-out: https://dv69sewi064tv.cloudfront.net/login</li>
          </ul>
          <p className="mt-3">
            Production API: set <code className="text-xs">VITE_API_BASE_URL=https://dv69sewi064tv.cloudfront.net</code>{' '}
            in <code className="text-xs">frontend/.env</code> (paths already include <code className="text-xs">/api/...</code>).
          </p>
        </div>
      </main>
    </div>
  );
}
