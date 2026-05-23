export interface TeamOption {
  id: string;
  name: string;
}

const DEFAULT_TEAMS: TeamOption[] = [
  { id: 'frontend', name: 'Frontend' },
  { id: 'backend', name: 'Backend' },
  { id: 'devops', name: 'DevOps' },
  { id: 'qa', name: 'QA' }
];

export function loadTeamOptions(): TeamOption[] {
  const raw = import.meta.env.VITE_TEAMS;
  if (!raw) return DEFAULT_TEAMS;
  try {
    const parsed = JSON.parse(raw) as TeamOption[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* use defaults */
  }
  return DEFAULT_TEAMS;
}

export function teamLabel(teamId: string, teams: TeamOption[]): string {
  return teams.find((t) => t.id === teamId)?.name ?? teamId;
}
