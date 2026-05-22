const handleTaskSubmit = (payload: Task | Partial<Task>) => {
  // Ensure payload has required fields
  if (!payload.taskId) {
    // Creating new task
    createTaskMutation.mutate(payload as Omit<Task, 'taskId'>);
  } else {
    updateTaskMutation.mutate(payload as Task);
  }
};