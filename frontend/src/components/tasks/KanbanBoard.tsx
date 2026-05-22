import { useState } from 'react';

interface Task {
  taskId: string;
  title: string;
  status: string;
  assigneeName?: string;
}

const columns = ['To Do', 'In Progress', 'In Review', 'Done'];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([
    { taskId: '1', title: 'Example task', status: 'To Do', assigneeName: 'Ali' },
    { taskId: '2', title: 'Another task', status: 'In Progress', assigneeName: 'Sara' },
  ]);

  const updateStatus = (taskId: string, newStatus: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.taskId === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kanban Board</h1>
      <div className="grid grid-cols-4 gap-4">
        {columns.map(col => (
          <div key={col} className="bg-gray-100 p-3 rounded min-h-[200px]">
            <h2 className="font-semibold mb-2">{col}</h2>
            {getTasksByStatus(col).map(task => (
              <div key={task.taskId} className="bg-white p-2 rounded shadow mb-2">
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-gray-500">{task.assigneeName}</p>
                <select
                  className="mt-2 text-xs border rounded p-1"
                  value={task.status}
                  onChange={(e) => updateStatus(task.taskId, e.target.value)}
                >
                  {columns.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}