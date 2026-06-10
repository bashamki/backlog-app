export interface Epic { id: string; title: string; color?: string; position: number; }
export interface Sprint { id: string; name: string; year: number; weekNo: number; state: string; taskSprints?: { task: Task }[]; }
export interface Task {
  id: string; epicId?: string | null; parentId?: string | null; title: string;
  description?: string | null; weeekUrl?: string | null;
  priorityLabel: "hot" | "high" | "medium" | "low" | "none";
  status: "todo" | "in_progress" | "done" | "paused";
  hoursPlan?: number | null; hoursFact?: number | null;
  isConditional: boolean; conditionText?: string | null; conditionMet?: boolean;
  position: number;
  taskSprints?: { sprint: Sprint }[];
}
