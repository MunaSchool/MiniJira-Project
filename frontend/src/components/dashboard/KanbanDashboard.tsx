import type { Task, TaskStatus } from '@/types/tasks';
import { TaskBoardCard } from './TaskBoardCard';
import type { TeamOption } from '@/lib/teams';

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];

interface KanbanDashboardProps {
  tasks: Task[];
  isManager: boolean;
  teams: TeamOption[];
  assigneeNames: Record<string, string>;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function KanbanDashboard({
  tasks,
  isManager,
  teams,
  assigneeNames,
  onTaskUpdated,
  onTaskDeleted
}: KanbanDashboardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => (t.status || 'To Do') === status);
        return (
          <section key={status} className="min-h-[280px] rounded-lg bg-slate-100/80 p-3">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              {status} ({columnTasks.length})
            </h2>
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <TaskBoardCard
                  key={task.taskId}
                  task={task}
                  isManager={isManager}
                  teams={teams}
                  assigneeNames={assigneeNames}
                  onUpdated={onTaskUpdated}
                  onDeleted={onTaskDeleted}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
