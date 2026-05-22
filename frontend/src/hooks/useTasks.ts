import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, deleteTask, getTask, getTasks, updateTask } from '@/services/tasks.service';
import type { Task, TaskCreatePayload, TaskFilters, TaskUpdatePayload } from '@/types/tasks';

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasks(filters)
  });
}

export function useTask(taskId?: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId as string),
    enabled: Boolean(taskId)
  });
}

export function useTaskMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: TaskCreatePayload) => createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: TaskUpdatePayload }) => updateTask(taskId, payload),
    onMutate: async ({ taskId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueriesData({ queryKey: ['tasks'] });
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: { tasks: Task[]; count: number } | undefined) => {
        if (!old) return old;
        const nextTasks = old.tasks.map((task) => (task.taskId === taskId ? { ...task, ...payload } : task));
        return { ...old, tasks: nextTasks };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return { createMutation, updateMutation, deleteMutation };
}
