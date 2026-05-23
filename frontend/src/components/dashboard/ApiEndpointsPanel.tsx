import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, getPublicApiBase } from '@/lib/api-catalog';
import { probeAllAuto, type ProbeResult } from '@/services/api-probe.service';
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

function StatusDot({ result }: { result?: ProbeResult }) {
  if (!result || result.status === 'idle' || result.status === 'running') {
    return <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" title="Not tested" />;
  }
  if (result.status === 'ok') {
    return <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" title={result.message} />;
  }
  if (result.status === 'skipped') {
    return <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" title={result.message} />;
  }
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" title={result.message} />;
}

export function ApiEndpointsPanel() {
  const { profile } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [running, setRunning] = useState(false);
  const runAll = useCallback(async () => {
    setRunning(true);
    const [tasksRes, projectsRes] = await Promise.all([
      getTasks().catch(() => ({ tasks: [] as { taskId: string }[] })),
      getProjects(profile?.teamId ?? undefined).catch(() => [] as { projectId: string }[])
    ]);
    const probeCtx = {
      teamId: profile?.teamId ?? null,
      taskId: tasksRes.tasks[0]?.taskId ?? null,
      projectId: projectsRes[0]?.projectId ?? null,
      isManager: profile?.role === 'Manager'
    };
    setResults(await probeAllAuto(API_ENDPOINTS, probeCtx));
    setRunning(false);
  }, [profile?.role, profile?.teamId]);

  useEffect(() => {
    if (!expanded) return;
    const timer = window.setTimeout(() => void runAll(), 400);
    return () => window.clearTimeout(timer);
  }, [expanded, runAll]);

  const okCount = Object.values(results).filter((r) => r.status === 'ok').length;
  const errCount = Object.values(results).filter((r) => r.status === 'error').length;

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Backend APIs</h2>
          <p className="text-xs text-slate-500">
            Base: {getPublicApiBase()} · Cognito JWT on protected routes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {okCount > 0 ? (
            <span className="text-xs text-emerald-700">{okCount} OK</span>
          ) : null}
          {errCount > 0 ? (
            <span className="text-xs text-red-600">{errCount} failed</span>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void runAll()} disabled={running}>
            {running ? 'Testing…' : 'Test GET APIs'}
          </Button>
          <Link to="/api" className="text-sm font-medium text-blue-600 hover:underline">
            Full API page →
          </Link>
        </div>
      </div>

      {expanded ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 w-8" />
                <th className="px-2 py-2">Method</th>
                <th className="px-2 py-2">Endpoint</th>
                <th className="px-2 py-2 hidden md:table-cell">Description</th>
                <th className="px-2 py-2 hidden lg:table-cell">Owner</th>
              </tr>
            </thead>
            <tbody>
              {API_ENDPOINTS.map((ep) => {
                const result = results[ep.id];
                return (
                  <tr key={ep.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-2">
                      <StatusDot result={result} />
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${methodColors[ep.method]}`}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-slate-800">{ep.path}</td>
                    <td className="px-2 py-2 hidden text-slate-600 md:table-cell">{ep.description}</td>
                    <td className="px-2 py-2 hidden text-slate-500 lg:table-cell">{ep.person}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
