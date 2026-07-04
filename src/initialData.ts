import { Project, Sprint, Task, Resource } from "./types";

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "NWU Digital Infrastructure Transition",
    department: "Government & Education",
    manager: "Dr. Kobus Van der Merwe",
    status: "On Track",
    budget: 1200000,
    actualSpent: 850000,
    cpi: 1.12,
    spi: 1.05,
    velocity: 45,
    progress: 72,
    tasksTotal: 12,
    tasksCompleted: 8,
    startDate: "2026-02-01",
    endDate: "2026-09-30",
    description: "Transitioning the North West University (NWU) Potchefstroom campus systems to a unified multi-cloud environment to enhance remote collaboration and administrative throughput."
  },
  {
    id: "proj-2",
    name: "Potchefstroom Smart-Grid Integration Initiative",
    department: "Energy & Infrastructure",
    manager: "Thabo Mokoena",
    status: "At Risk",
    budget: 3400000,
    actualSpent: 2900000,
    cpi: 0.82,
    spi: 0.88,
    velocity: 32,
    progress: 48,
    tasksTotal: 18,
    tasksCompleted: 8,
    startDate: "2026-01-15",
    endDate: "2026-11-15",
    description: "Integrating IoT sensors and automated load-balancing algorithms into local Potchefstroom substations to mitigate load-shedding variance and stabilise energy distribution."
  },
  {
    id: "proj-3",
    name: "Mooirivier Water Quality Telemetry",
    department: "Environmental Affairs",
    manager: "Sarah Jenkins",
    status: "Critical",
    budget: 650000,
    actualSpent: 450000,
    cpi: 0.70,
    spi: 0.65,
    velocity: 18,
    progress: 15,
    tasksTotal: 10,
    tasksCompleted: 2,
    startDate: "2026-05-01",
    endDate: "2026-12-15",
    description: "Setting up real-time telemetry sensors along the Mooi River basin in Potchefstroom to categorise water pollutants and alert surrounding agricultural estates."
  },
  {
    id: "proj-4",
    name: "Agri-Tech Supply-Chain Optimization",
    department: "Agriculture & Trade",
    manager: "Pieter Botha",
    status: "Completed",
    budget: 1800000,
    actualSpent: 1750000,
    cpi: 1.03,
    spi: 1.00,
    velocity: 52,
    progress: 100,
    tasksTotal: 15,
    tasksCompleted: 15,
    startDate: "2025-08-01",
    endDate: "2026-06-01",
    description: "Developing and implementing a distributed ledger system for secure grain origin tracking and trade documentation across North West farms."
  }
];

export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: "sprint-1",
    name: "Sprint 14 - Multi-Cloud Transit Mappings",
    projectId: "proj-1",
    status: "Active",
    startDate: "2026-06-15",
    endDate: "2026-06-29",
    targetPoints: 48,
    completedPoints: 36
  },
  {
    id: "sprint-2",
    name: "Sprint 8 - Sensor Substation Mesh Config",
    projectId: "proj-2",
    status: "Active",
    startDate: "2026-06-20",
    endDate: "2026-07-04",
    targetPoints: 40,
    completedPoints: 12
  },
  {
    id: "sprint-3",
    name: "Sprint 1 - Sensor Baseline Deployments",
    projectId: "proj-3",
    status: "Planning",
    startDate: "2026-07-01",
    endDate: "2026-07-15",
    targetPoints: 24,
    completedPoints: 0
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    projectId: "proj-1",
    title: "Configure AWS Transit Gateway routing mappings",
    assignee: "Francois du Toit",
    priority: "High",
    status: "Done"
  },
  {
    id: "task-2",
    projectId: "proj-1",
    title: "Deploy React dashboard pages with Tailwind",
    assignee: "Lerato Dlamini",
    priority: "Medium",
    status: "In Progress"
  },
  {
    id: "task-3",
    projectId: "proj-1",
    title: "Test secondary backup load balancer latency",
    assignee: "Francois du Toit",
    priority: "Low",
    status: "In Review"
  },
  {
    id: "task-4",
    projectId: "proj-2",
    title: "Audit Potchefstroom substation telemetry API keys",
    assignee: "Thabo Mokoena",
    priority: "High",
    status: "To Do"
  },
  {
    id: "task-5",
    projectId: "proj-2",
    title: "Calibrate automated load-balancing mesh algorithms",
    assignee: "Lerato Dlamini",
    priority: "High",
    status: "In Progress"
  },
  {
    id: "task-6",
    projectId: "proj-3",
    title: "Implement river pH sensing calibration loops",
    assignee: "Sarah Jenkins",
    priority: "Medium",
    status: "In Review"
  },
  {
    id: "task-7",
    projectId: "proj-4",
    title: "Optimize blockchain grain state query indexes",
    assignee: "Pieter Botha",
    priority: "Low",
    status: "Done"
  },
  {
    id: "task-8",
    projectId: "proj-2",
    title: "Refactor legacy telemetry storage schema",
    assignee: "Francois du Toit",
    priority: "Medium",
    status: "To Do"
  }
];

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: "res-1",
    name: "Dr. Kobus Van der Merwe",
    role: "Senior Consultant / PM",
    allocation: 85,
    activeProjectsCount: 1
  },
  {
    id: "res-2",
    name: "Thabo Mokoena",
    role: "Infrastructure Engineer",
    allocation: 100,
    activeProjectsCount: 1
  },
  {
    id: "res-3",
    name: "Sarah Jenkins",
    role: "Environmental Advisor",
    allocation: 40,
    activeProjectsCount: 1
  },
  {
    id: "res-4",
    name: "Pieter Botha",
    role: "Supply-Chain Architect",
    allocation: 20,
    activeProjectsCount: 1
  },
  {
    id: "res-5",
    name: "Lerato Dlamini",
    role: "Lead UI Developer",
    allocation: 95,
    activeProjectsCount: 2
  },
  {
    id: "res-6",
    name: "Francois du Toit",
    role: "DevOps & Cloud Lead",
    allocation: 110, // Overloaded!
    activeProjectsCount: 3
  }
];
