export type ProjectStatus = "On Track" | "At Risk" | "Critical" | "Completed";

export interface Project {
  id: string;
  name: string;
  department: string;
  manager: string;
  status: ProjectStatus;
  budget: number;
  actualSpent: number;
  cpi: number; // Cost Performance Index: >1 is under budget, <1 is over budget
  spi: number; // Schedule Performance Index: >1 is ahead of schedule, <1 is behind
  velocity: number; // Sprint velocity
  progress: number; // Percentage
  tasksTotal: number;
  tasksCompleted: number;
  description: string;
  startDate: string;
  endDate: string;
}

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  status: "Planning" | "Active" | "Completed";
  startDate: string;
  endDate: string;
  targetPoints: number;
  completedPoints: number;
}

export interface Task {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  assignee: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "In Review" | "Done";
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  allocation: number; // percentage
  activeProjectsCount: number;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  timestamp: string;
}

export interface RecentActivity {
  id: string;
  type: "project_creation" | "task_update" | "sprint_deployment" | "system_event";
  title: string;
  details: string;
  timestamp: string;
}

