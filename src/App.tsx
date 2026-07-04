import React, { useState, useEffect } from "react";
import ChessLogo from "./components/ChessLogo";
import DashboardView from "./components/DashboardView";
import PortfolioView from "./components/PortfolioView";
import SprintTaskView from "./components/SprintTaskView";
import ResourceView from "./components/ResourceView";
import ConsultantView from "./components/ConsultantView";
import WorkspaceView from "./components/WorkspaceView";
import { Project, Sprint, Task, Resource, RecentActivity } from "./types";
import {
  INITIAL_PROJECTS,
  INITIAL_SPRINTS,
  INITIAL_TASKS,
  INITIAL_RESOURCES,
} from "./initialData";
import {
  LayoutDashboard,
  FolderKanban,
  Milestone,
  Users,
  Sparkles,
  Info,
  Menu,
  X,
  Plus,
  ShieldAlert,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  FolderPlus,
  CalendarRange,
  CheckSquare,
  AlertCircle,
  Zap,
  Bell,
  Search,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  User as UserIcon,
  Settings,
  LogOut,
  Shield,
  Coins,
  Activity,
  Briefcase
} from "lucide-react";
import { 
  db, 
  initAuth, 
  logout,
  saveProjectToFirestore, 
  deleteProjectFromFirestore, 
  saveSprintToFirestore, 
  deleteSprintFromFirestore, 
  saveTaskToFirestore, 
  deleteTaskFromFirestore, 
  saveResourceToFirestore 
} from "./firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { User } from "firebase/auth";
import { generateExecutivePDF } from "./utils/pdfExport";

export default function App() {
  // Authentication & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const triggerSyncAnimation = (ms = 1200) => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, ms);
  };

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem("ic_pmo_theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("ic_pmo_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("ic_pmo_theme", "light");
    }
  }, [isDark]);

  // 1. Core Portfolio States
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [sprints, setSprints] = useState<Sprint[]>(INITIAL_SPRINTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);

  // Tab management
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Mobile sidebar drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initial prompt redirection to Consultant Pane
  const [initialConsultantPrompt, setInitialConsultantPrompt] = useState<string | null>(null);

  // Quick Actions Dropdown & Modals State
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isQuickProjectOpen, setIsQuickProjectOpen] = useState(false);
  const [isQuickSprintOpen, setIsQuickSprintOpen] = useState(false);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);

  // Global Search & Notification Center States
  const [globalSearch, setGlobalSearch] = useState("");
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Recent Activities State with LocalStorage persistence
  const [activities, setActivities] = useState<RecentActivity[]>(() => {
    const saved = localStorage.getItem("portfolio_activities");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore parsing error
      }
    }
    return [
      {
        id: "act-1",
        type: "sprint_deployment",
        title: "Sprint Deployed: Potchefstroom Substation Phase 2",
        details: "Iterative deployment verified on municipal testbed grid. Actual velocity matching expectations.",
        timestamp: "2 hours ago",
      },
      {
        id: "act-2",
        type: "task_update",
        title: "Task Updated: Audit Potchefstroom substation telemetry API keys",
        details: "Status changed from 'In Progress' to 'Done' by Lead Engineer.",
        timestamp: "5 hours ago",
      },
      {
        id: "act-3",
        type: "project_creation",
        title: "New Project Registered: Medupi Desulfurization Retrofit",
        details: "Initialized in Critical Infrastructure Portfolio. Initial budget allocation set to R4,500,000.",
        timestamp: "1 day ago",
      },
      {
        id: "act-4",
        type: "task_update",
        title: "Task Updated: Perform manual penetration testing on telemetry endpoint",
        details: "Status changed to 'In Review'. Pending final security clearance.",
        timestamp: "2 days ago",
      }
    ];
  });

  // Save activities to localStorage
  useEffect(() => {
    localStorage.setItem("portfolio_activities", JSON.stringify(activities));
  }, [activities]);

  // Global Alt-based Keyboard Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.getAttribute("contenteditable") === "true"
      )) {
        return;
      }

      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "1" || key === "d") {
          e.preventDefault();
          setActiveTab("dashboard");
        } else if (key === "2" || key === "p") {
          e.preventDefault();
          setActiveTab("portfolio");
        } else if (key === "3" || key === "s") {
          e.preventDefault();
          setActiveTab("sprints");
        } else if (key === "4" || key === "r") {
          e.preventDefault();
          setActiveTab("resources");
        } else if (key === "5" || key === "w") {
          e.preventDefault();
          setActiveTab("workspace");
        } else if (key === "6" || key === "c") {
          e.preventDefault();
          setActiveTab("consultant");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const logActivity = (type: RecentActivity["type"], title: string, details: string) => {
    const newAct: RecentActivity = {
      id: `act-${Date.now()}`,
      type,
      title,
      details,
      timestamp: "Just now",
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  // Authentication Setup & Restoration
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync state between Local Storage and Firestore depending on login status
  useEffect(() => {
    if (!user) {
      // Local storage fallback for unauthenticated offline sessions
      const savedProjects = localStorage.getItem("ic_pmo_projects");
      if (savedProjects) setProjects(JSON.parse(savedProjects));
      const savedSprints = localStorage.getItem("ic_pmo_sprints");
      if (savedSprints) setSprints(JSON.parse(savedSprints));
      const savedTasks = localStorage.getItem("ic_pmo_tasks");
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      const savedResources = localStorage.getItem("ic_pmo_resources");
      if (savedResources) setResources(JSON.parse(savedResources));
      return;
    }

    // Subscribe to Projects in Firestore
    const qProj = query(collection(db, "projects"), where("userId", "==", user.uid));
    const unsubProj = onSnapshot(qProj, (snapshot) => {
      triggerSyncAnimation(800);
      const list = snapshot.docs.map(doc => doc.data() as Project);
      if (list.length > 0) {
        setProjects(list);
      } else {
        INITIAL_PROJECTS.forEach(p => saveProjectToFirestore(user.uid, p));
      }
    });

    // Subscribe to Sprints in Firestore
    const qSprint = query(collection(db, "sprints"), where("userId", "==", user.uid));
    const unsubSprint = onSnapshot(qSprint, (snapshot) => {
      triggerSyncAnimation(800);
      const list = snapshot.docs.map(doc => doc.data() as Sprint);
      if (list.length > 0) {
        setSprints(list);
      } else {
        INITIAL_SPRINTS.forEach(s => saveSprintToFirestore(user.uid, s));
      }
    });

    // Subscribe to Tasks in Firestore
    const qTask = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const unsubTask = onSnapshot(qTask, (snapshot) => {
      triggerSyncAnimation(800);
      const list = snapshot.docs.map(doc => doc.data() as Task);
      if (list.length > 0) {
        setTasks(list);
      } else {
        INITIAL_TASKS.forEach(t => saveTaskToFirestore(user.uid, t));
      }
    });

    // Subscribe to Resources in Firestore
    const qRes = query(collection(db, "resources"), where("userId", "==", user.uid));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      triggerSyncAnimation(800);
      const list = snapshot.docs.map(doc => doc.data() as Resource);
      if (list.length > 0) {
        setResources(list);
      } else {
        INITIAL_RESOURCES.forEach(r => saveResourceToFirestore(user.uid, r));
      }
    });

    return () => {
      unsubProj();
      unsubSprint();
      unsubTask();
      unsubRes();
    };
  }, [user]);

  // Save changes to local storage when offline only
  useEffect(() => {
    if (!user) {
      localStorage.setItem("ic_pmo_projects", JSON.stringify(projects));
    }
  }, [projects, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("ic_pmo_sprints", JSON.stringify(sprints));
    }
  }, [sprints, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("ic_pmo_tasks", JSON.stringify(tasks));
    }
  }, [tasks, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("ic_pmo_resources", JSON.stringify(resources));
    }
  }, [resources, user]);

  // Sync project progress when tasks change
  useEffect(() => {
    const updatedProjects = projects.map((p) => {
      const projTasks = tasks.filter((t) => t.projectId === p.id);
      const total = projTasks.length;
      const completed = projTasks.filter((t) => t.status === "Done").length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : p.progress;
      
      return {
        ...p,
        tasksTotal: total,
        tasksCompleted: completed,
        progress,
        status: progress === 100 ? "Completed" as const : p.status,
      };
    });

    if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) {
      setProjects(updatedProjects);
      // If user is logged in, sync progress back to Firestore
      if (user) {
        updatedProjects.forEach(p => saveProjectToFirestore(user.uid, p));
      }
    }
  }, [tasks, user]);

  // Sync sprint completion points when tasks change
  useEffect(() => {
    const updatedSprints = sprints.map((s) => {
      const sprintTasks = tasks.filter((t) => t.projectId === s.projectId);
      const completedCount = sprintTasks.filter((t) => t.status === "Done").length;
      const completedPoints = Math.min(completedCount * 8, s.targetPoints);

      return {
        ...s,
        completedPoints,
      };
    });

    if (JSON.stringify(updatedSprints) !== JSON.stringify(sprints)) {
      setSprints(updatedSprints);
      if (user) {
        updatedSprints.forEach(s => saveSprintToFirestore(user.uid, s));
      }
    }
  }, [tasks, user]);

  // 2. Project State Management Handlers
  const handleAddProject = (newProj: Omit<Project, "id" | "progress" | "tasksTotal" | "tasksCompleted" | "velocity">) => {
    triggerSyncAnimation();
    const id = `proj-${Date.now()}`;
    const project: Project = {
      ...newProj,
      id,
      velocity: 30,
      progress: 0,
      tasksTotal: 0,
      tasksCompleted: 0,
    };
    if (user) {
      saveProjectToFirestore(user.uid, project);
    } else {
      setProjects((prev) => [...prev, project]);
    }
    logActivity(
      "project_creation",
      `New Project Registered: ${project.name}`,
      `Department: ${project.department}; Manager: ${project.manager}; Budget: R${project.budget.toLocaleString("en-ZA")}`
    );
  };

  const handleDeleteProject = (id: string) => {
    triggerSyncAnimation();
    const matched = projects.find((p) => p.id === id);
    if (user) {
      deleteProjectFromFirestore(id);
      // Clean up related sprints & tasks
      sprints.filter((s) => s.projectId === id).forEach(s => deleteSprintFromFirestore(s.id));
      tasks.filter((t) => t.projectId === id).forEach(t => deleteTaskFromFirestore(t.id));
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setSprints((prev) => prev.filter((s) => s.projectId !== id));
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
    if (matched) {
      logActivity(
        "project_creation",
        `Project Removed: ${matched.name}`,
        `All associated milestones, iterations, and tasks have been archived.`
      );
    }
  };

  const handleUpdateResourceAllocation = (id: string, newAlloc: number) => {
    triggerSyncAnimation();
    const matched = resources.find(r => r.id === id);
    if (matched) {
      const updated = { ...matched, allocation: newAlloc };
      if (user) {
        saveResourceToFirestore(user.uid, updated);
      } else {
        setResources((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    }
  };

  // 3. Sprint State Management Handlers
  const handleAddSprint = (newSprint: Omit<Sprint, "id" | "completedPoints">) => {
    triggerSyncAnimation();
    const sprint: Sprint = {
      ...newSprint,
      id: `sprint-${Date.now()}`,
      completedPoints: 0,
    };
    if (user) {
      saveSprintToFirestore(user.uid, sprint);
    } else {
      setSprints((prev) => [...prev, sprint]);
    }
    const parentProj = projects.find(p => p.id === sprint.projectId);
    logActivity(
      "sprint_deployment",
      `Sprint Milestone Added: ${sprint.name}`,
      `Program Iteration started under "${parentProj ? parentProj.name : "Portfolio Scope"}" with a target of ${sprint.targetPoints} velocity points.`
    );
  };

  // 4. Task State Management Handlers
  const handleAddTask = (newTask: Omit<Task, "id">) => {
    triggerSyncAnimation();
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
    };
    if (user) {
      saveTaskToFirestore(user.uid, task);
    } else {
      setTasks((prev) => [...prev, task]);
    }
    const parentProj = projects.find(p => p.id === task.projectId);
    logActivity(
      "task_update",
      `Task Created: ${task.title}`,
      `Assigned to: ${task.assignee} (${task.priority} Priority). Project: "${parentProj ? parentProj.name : "Unassigned"}"`
    );
  };

  const handleUpdateTaskStatus = (id: string, newStatus: Task["status"]) => {
    triggerSyncAnimation();
    const matched = tasks.find(t => t.id === id);
    if (matched) {
      const updated = { ...matched, status: newStatus };
      if (user) {
        saveTaskToFirestore(user.uid, updated);
      } else {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
      logActivity(
        "task_update",
        `Task Status Updated: ${matched.title}`,
        `Status set to "${newStatus}" (Assigned: ${matched.assignee})`
      );
    }
  };

  const handleDeleteTask = (id: string) => {
    triggerSyncAnimation();
    if (user) {
      deleteTaskFromFirestore(id);
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Quick Action Forms States
  const [qpName, setQpName] = useState("");
  const [qpDepartment, setQpDepartment] = useState("");
  const [qpManager, setQpManager] = useState("");
  const [qpBudget, setQpBudget] = useState("");
  const [qpActualSpent, setQpActualSpent] = useState("");
  const [qpCpi, setQpCpi] = useState("1.00");
  const [qpSpi, setQpSpi] = useState("1.00");
  const [qpStartDate, setQpStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [qpEndDate, setQpEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split("T")[0];
  });
  const [qpStatus, setQpStatus] = useState<"On Track" | "At Risk" | "Critical" | "Completed">("On Track");
  const [qpDescription, setQpDescription] = useState("");
  const [qpError, setQpError] = useState("");

  const [qsName, setQsName] = useState("");
  const [qsProjId, setQsProjId] = useState("");
  const [qsTargetPoints, setQsTargetPoints] = useState("40");
  const [qsStart, setQsStart] = useState(() => new Date().toISOString().split("T")[0]);
  const [qsEnd, setQsEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [qsError, setQsError] = useState("");

  const [qtTitle, setQtTitle] = useState("");
  const [qtAssignee, setQtAssignee] = useState("");
  const [qtPriority, setQtPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [qtStatus, setQtStatus] = useState<Task["status"]>("To Do");
  const [qtProjId, setQtProjId] = useState("");
  const [qtError, setQtError] = useState("");

  // Sync selection targets when projects load
  useEffect(() => {
    if (projects.length > 0) {
      if (!qsProjId) setQsProjId(projects[0].id);
      if (!qtProjId) setQtProjId(projects[0].id);
    }
  }, [projects]);

  const handleQpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qpName || !qpDepartment || !qpManager || !qpBudget || !qpActualSpent) {
      setQpError("Please fill out all required fields (*)");
      return;
    }
    const budgetNum = Number(qpBudget);
    const spentNum = Number(qpActualSpent);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setQpError("Budget must be a positive number.");
      return;
    }
    if (isNaN(spentNum) || spentNum < 0) {
      setQpError("Actual spent cannot be negative.");
      return;
    }

    handleAddProject({
      name: qpName,
      department: qpDepartment,
      manager: qpManager,
      budget: budgetNum,
      actualSpent: spentNum,
      cpi: Number(qpCpi) || 1.0,
      spi: Number(qpSpi) || 1.0,
      startDate: qpStartDate,
      endDate: qpEndDate,
      status: qpStatus,
      description: qpDescription,
    });

    setQpName("");
    setQpDepartment("");
    setQpManager("");
    setQpBudget("");
    setQpActualSpent("");
    setQpCpi("1.00");
    setQpSpi("1.00");
    setQpDescription("");
    setQpStatus("On Track");
    setQpError("");
    setIsQuickProjectOpen(false);
  };

  const handleQsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qsName) {
      setQsError("Sprint name is required");
      return;
    }
    const targetProjId = qsProjId || (projects[0]?.id || "");
    if (!targetProjId) {
      setQsError("A project must exist to associate a sprint.");
      return;
    }

    handleAddSprint({
      name: qsName,
      projectId: targetProjId,
      status: "Active",
      targetPoints: Number(qsTargetPoints) || 40,
      startDate: qsStart,
      endDate: qsEnd,
    });

    setQsName("");
    setQsError("");
    setIsQuickSprintOpen(false);
  };

  const handleQtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtTitle || !qtAssignee) {
      setQtError("Task title and assignee are required.");
      return;
    }
    const targetProjId = qtProjId || (projects[0]?.id || "");
    if (!targetProjId) {
      setQtError("A project must exist to publish a task.");
      return;
    }

    handleAddTask({
      title: qtTitle,
      assignee: qtAssignee,
      priority: qtPriority,
      status: qtStatus,
      projectId: targetProjId,
    });

    setQtTitle("");
    setQtAssignee("");
    setQtPriority("Medium");
    setQtStatus("To Do");
    setQtError("");
    setIsQuickTaskOpen(false);
  };

  const handleAskConsultant = (initialPrompt: string) => {
    setInitialConsultantPrompt(initialPrompt);
    setActiveTab("consultant");
  };

  // Dynamic notification items definition
  interface NotificationItem {
    id: string;
    type: "project" | "task" | "sprint";
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
    severity: "high" | "medium" | "low";
  }

  const getDynamicNotifications = (): NotificationItem[] => {
    const items: NotificationItem[] = [];

    // 1. Projects updates/status
    projects.forEach((proj) => {
      if (proj.status === "Critical") {
        items.push({
          id: `proj-crit-${proj.id}`,
          type: "project",
          title: `CRITICAL STATUS: ${proj.name}`,
          description: `Strategic project "${proj.name}" is marked Critical. CPI is ${proj.cpi} and SPI is ${proj.spi}. Immediate intervention recommended.`,
          timestamp: "Recently updated",
          read: false,
          severity: "high",
        });
      } else if (proj.status === "At Risk") {
        items.push({
          id: `proj-risk-${proj.id}`,
          type: "project",
          title: `AT RISK: ${proj.name}`,
          description: `Strategic project "${proj.name}" is marked At Risk. Monitor CPI (${proj.cpi}) closely.`,
          timestamp: "Recently updated",
          read: false,
          severity: "medium",
        });
      }

      // Check for extremely low CPI
      if (proj.cpi < 0.9 && proj.status !== "Completed" && proj.status !== "Critical") {
        items.push({
          id: `proj-cpi-${proj.id}`,
          type: "project",
          title: `Overbudget Risk: ${proj.name}`,
          description: `Investment is running over budget. Current Cost Performance Index is ${proj.cpi}.`,
          timestamp: "Overspend risk",
          read: false,
          severity: "high",
        });
      }
    });

    // 2. Sprint deadlines
    sprints.forEach((sprint) => {
      if (sprint.status === "Active") {
        const end = new Date(sprint.endDate);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          items.push({
            id: `sprint-overdue-${sprint.id}`,
            type: "sprint",
            title: `Milestone Overdue: ${sprint.name}`,
            description: `Active sprint target date (${sprint.endDate}) has elapsed. Update status.`,
            timestamp: "Overdue",
            read: false,
            severity: "high",
          });
        } else if (diffDays <= 7) {
          items.push({
            id: `sprint-deadline-${sprint.id}`,
            type: "sprint",
            title: `Sprint Deadline: ${sprint.name}`,
            description: `Milestone iteration ends in ${diffDays} day${diffDays === 1 ? "" : "s"} (${sprint.endDate}).`,
            timestamp: `Ends in ${diffDays}d`,
            read: false,
            severity: "medium",
          });
        }
      }
    });

    // 3. Overdue/Urgent Tasks
    tasks.forEach((task) => {
      if (task.status !== "Done") {
        if (task.priority === "High") {
          items.push({
            id: `task-high-${task.id}`,
            type: "task",
            title: `High Priority Deliverable`,
            description: `Task "${task.title}" assigned to ${task.assignee} is pending execution.`,
            timestamp: "Urgent",
            read: false,
            severity: "medium",
          });
        }

        const parentProj = projects.find(p => p.id === task.projectId);
        if (parentProj && parentProj.status === "Critical") {
          items.push({
            id: `task-crit-proj-${task.id}`,
            type: "task",
            title: `Critical Dependency: ${task.title}`,
            description: `Pending task for critical program "${parentProj.name}".`,
            timestamp: "Blocked Risk",
            read: false,
            severity: "high",
          });
        }
      }
    });

    return items;
  };

  // Filter notifications using user-dismissed state
  const activeNotifications = getDynamicNotifications().filter(n => !dismissedNotifications.includes(n.id));

  // Compute Total Completion Rate of Active Projects
  const activeProjectsList = projects.filter(p => p.status !== "Completed");
  const activeCompletionRate = activeProjectsList.length > 0 
    ? Math.round(activeProjectsList.reduce((sum, p) => sum + (p.progress || 0), 0) / activeProjectsList.length)
    : (projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0);

  // Global Search Filtering
  const filteredProjects = projects.filter((proj) => {
    if (!globalSearch.trim()) return true;
    const s = globalSearch.toLowerCase();
    return (
      proj.name.toLowerCase().includes(s) ||
      proj.department.toLowerCase().includes(s) ||
      proj.manager.toLowerCase().includes(s) ||
      proj.description.toLowerCase().includes(s) ||
      proj.status.toLowerCase().includes(s)
    );
  });

  const filteredSprints = sprints.filter((sprint) => {
    if (!globalSearch.trim()) return true;
    const s = globalSearch.toLowerCase();
    const parentProj = projects.find(p => p.id === sprint.projectId);
    return (
      sprint.name.toLowerCase().includes(s) ||
      (parentProj && parentProj.name.toLowerCase().includes(s))
    );
  });

  const filteredTasks = tasks.filter((task) => {
    if (!globalSearch.trim()) return true;
    const s = globalSearch.toLowerCase();
    const parentProj = projects.find(p => p.id === task.projectId);
    return (
      task.title.toLowerCase().includes(s) ||
      task.assignee.toLowerCase().includes(s) ||
      task.priority.toLowerCase().includes(s) ||
      task.status.toLowerCase().includes(s) ||
      (parentProj && parentProj.name.toLowerCase().includes(s))
    );
  });

  const filteredResources = resources.filter((res) => {
    if (!globalSearch.trim()) return true;
    const s = globalSearch.toLowerCase();
    return (
      res.name.toLowerCase().includes(s) ||
      res.role.toLowerCase().includes(s)
    );
  });

  // Navigation Sidebar Item Definition
  const navigationItems = [
    { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "portfolio", label: "Project Portfolio", icon: FolderKanban },
    { id: "sprints", label: "Sprints & Backlog", icon: Milestone },
    { id: "resources", label: "Resource Capacity", icon: Users },
    { id: "workspace", label: "Google Workspace Hub", icon: Globe },
    { id: "consultant", label: "Gemini PMO Advisor", icon: Sparkles },
  ];

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0B0F19]" : "bg-gray-100"} flex flex-col font-sans transition-colors duration-200`} id="ic-applet-root">
      
      {/* Container wrapper */}
      <div className="flex flex-1 relative">
        
        {/* ================= SIDE NAVIGATION BAR (Navy Background) ================= */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-84 bg-[#1B2A4A] text-white flex flex-col justify-between transform transition-transform duration-300 md:translate-x-0 md:static md:h-screen ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          id="corporate-sidebar-nav"
        >
          {/* Top Brand Identity - Integrated complete logo */}
          <div className="p-6 border-b border-white/10 bg-[#16233F] flex flex-col items-center justify-center">
            <img 
              src="/114455195.jpg" 
              alt="Innovation Consult" 
              className="w-full h-auto max-h-40 object-contain block mx-auto rounded-lg"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('/assets/')) {
                  target.src = '/assets/114455195.jpg';
                }
              }}
            />
          </div>

          {/* Navigation Items (active Burgundy state highlight) */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#7D1B34] text-white shadow-md border-l-4 border-l-[#A67C00]"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Corporate Credentials Footer */}
          <div className="p-4 border-t border-white/10 bg-black/10 space-y-2.5 text-[10px] text-gray-400">
            <div className="flex items-center space-x-2">
              <Info className="w-3.5 h-3.5 text-[#A67C00]" />
              <span className="font-bold text-gray-300 uppercase tracking-wide">Corporate Registry</span>
            </div>
            <div className="space-y-1 leading-normal font-medium">
              <p className="text-gray-300">Reg. No. 2007/021390/07</p>
              <p>Potchefstroom, North West</p>
              <p className="text-gray-300">info@innovationconsult.co.za</p>
              <p>admin@innovationconsult.co.za</p>
            </div>
          </div>
        </aside>

        {/* Mobile menu backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* ================= MAIN WORKSPACE AREA ================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
          
          {/* Sticky Header - Reduced to a slim, non-intrusive utility bar with search, alerts, and progress */}
          <header className={`relative sticky top-0 border-b py-2 px-6 h-14 flex items-center justify-between z-20 shadow-sm transition-all duration-200 ${
            isDark ? "bg-[#161F30] border-slate-800 text-slate-100" : "bg-white border-gray-100 text-[#1B2A4A]"
          }`} id="corporate-header">
            {/* Mobile trigger & Section Title */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-1 rounded-lg md:hidden ${
                  isDark ? "text-slate-200 hover:bg-slate-800" : "text-[#1B2A4A] hover:bg-gray-100"
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2.5">
                {/* Prominent Application Module Icon */}
                <div className={`hidden md:flex p-1.5 rounded-lg border shadow-sm ${
                  isDark 
                    ? "bg-[#0F1622] border-slate-800 text-amber-400" 
                    : "bg-amber-500/5 border-amber-500/10 text-[#A67C00]"
                }`} id="module-context-icon">
                  {(activeTab === "dashboard" || activeTab === "portfolio") && <Briefcase className="w-3.5 h-3.5" />}
                  {activeTab === "sprints" && <Activity className="w-3.5 h-3.5" />}
                  {activeTab === "resources" && <Coins className="w-3.5 h-3.5" />}
                  {activeTab === "workspace" && <Globe className="w-3.5 h-3.5" />}
                  {activeTab === "consultant" && <Shield className="w-3.5 h-3.5" />}
                </div>

                <div className="flex flex-col">
                  {/* Breadcrumb Navigation Trail */}
                  <div className="hidden md:flex items-center space-x-1.5 text-[9px] font-black tracking-widest uppercase text-gray-400 dark:text-slate-500">
                    <span>PMO Suite</span>
                    <ChevronRight className="w-2.5 h-2.5 text-gray-300 dark:text-slate-600" />
                    <span className="text-[#A67C00] dark:text-amber-400">
                      {activeTab === "dashboard" && "Module 1: Portfolio Master"}
                      {activeTab === "portfolio" && "Module 1: Portfolio Master"}
                      {activeTab === "sprints" && "Module 2: Project Execution"}
                      {activeTab === "resources" && "Module 3: Project Financials"}
                      {activeTab === "workspace" && "Workspace Hub"}
                      {activeTab === "consultant" && "Module 4: Governance & AI"}
                    </span>
                  </div>
                  {/* Main Section Header */}
                  <h2 className={`text-xs sm:text-xs md:text-sm font-black tracking-wider uppercase hidden sm:block ${isDark ? "text-slate-100" : "text-[#1B2A4A]"} -mt-0.5`}>
                    {activeTab === "dashboard" && "Portfolio Dashboard"}
                    {activeTab === "portfolio" && "Project Portfolio Registry"}
                    {activeTab === "sprints" && "Milestone Iteration & Backlog"}
                    {activeTab === "resources" && "Staffing Load & Cost Calculator"}
                    {activeTab === "workspace" && "Google Workspace Integration"}
                    {activeTab === "consultant" && "Lead AI Strategic Consultation"}
                  </h2>
                </div>
              </div>
            </div>

            {/* Global Search Bar (with Quick Filtering support) */}
            <div className="flex-1 max-w-[140px] xs:max-w-[180px] sm:max-w-xs md:max-w-sm mx-3 sm:mx-6 relative">
              <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
              <input
                type="text"
                placeholder="Search projects, tasks, resources..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className={`w-full pl-9 pr-8 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 transition-all ${
                  isDark 
                    ? "bg-[#0F1622] border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-amber-500" 
                    : "bg-gray-50 border-gray-200 text-[#1B2A4A] placeholder-gray-400 focus:ring-[#A67C00]"
                }`}
              />
              {globalSearch && (
                <button 
                  onClick={() => setGlobalSearch("")} 
                  className={`absolute right-2.5 top-2 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ${
                    isDark ? "text-slate-400" : "text-gray-400"
                  }`}
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* User credentials, status, Notifications & Theme switch */}
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-bold shrink-0">
              {/* Quick Actions Dropdown Menu */}
              <div className="relative" id="quick-actions-container">
                <button
                  onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                    isDark 
                      ? "bg-[#1f2d47] border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300" 
                      : "bg-[#1B2A4A]/5 border-[#1B2A4A]/10 text-[#1B2A4A] hover:bg-[#1B2A4A]/10"
                  }`}
                  id="btn-quick-actions"
                  title="Create project, sprint, or task instantly"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span className="hidden lg:inline">Quick Actions</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isQuickActionsOpen ? "rotate-180" : ""}`} />
                </button>

                {isQuickActionsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsQuickActionsOpen(false)}
                    ></div>
                    <div 
                      className={`absolute right-0 mt-2 w-52 rounded-xl shadow-xl border p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100 ${
                        isDark 
                          ? "bg-[#161F30] border-slate-800 text-slate-100" 
                          : "bg-white border-gray-200 text-[#1B2A4A]"
                      }`}
                      id="quick-actions-dropdown"
                    >
                      <div className="px-2 py-1 border-b border-gray-150 dark:border-slate-800/60 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Strategic Workspace</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsQuickProjectOpen(true);
                          setIsQuickActionsOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-left rounded-lg transition-colors text-xs font-bold cursor-pointer ${
                          isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-gray-50 text-[#1B2A4A]"
                        }`}
                        id="action-new-project"
                      >
                        <FolderPlus className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Create New Project</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsQuickSprintOpen(true);
                          setIsQuickActionsOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-left rounded-lg transition-colors text-xs font-bold cursor-pointer ${
                          isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-gray-50 text-[#1B2A4A]"
                        }`}
                        id="action-new-sprint"
                      >
                        <CalendarRange className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>Create New Sprint</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsQuickTaskOpen(true);
                          setIsQuickActionsOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2.5 px-2.5 py-2 text-left rounded-lg transition-colors text-xs font-bold cursor-pointer ${
                          isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-gray-50 text-[#1B2A4A]"
                        }`}
                        id="action-new-task"
                      >
                        <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Create New Task</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Bell Icon Notification Center Dropdown */}
              <div className="relative" id="notifications-container">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
                    isDark ? "text-slate-200 hover:bg-slate-800" : "text-[#1B2A4A] hover:bg-gray-100"
                  }`}
                  id="btn-notifications"
                  title="Portfolio Alerts & Deadlines"
                >
                  <Bell className="w-5 h-5" />
                  {activeNotifications.length > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-[#161F30]">
                      {activeNotifications.length}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationsOpen(false)}
                    ></div>
                    <div 
                      className={`absolute right-0 mt-2 w-80 md:w-96 rounded-xl shadow-2xl border p-4 z-50 animate-in fade-in slide-in-from-top-1 duration-100 ${
                        isDark 
                          ? "bg-[#161F30] border-slate-800 text-slate-100" 
                          : "bg-white border-gray-200 text-[#1B2A4A]"
                      }`}
                      id="notifications-dropdown"
                    >
                      <div className="flex items-center justify-between border-b border-gray-150 dark:border-slate-800/60 pb-2.5 mb-2.5">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-4 h-4 text-amber-500" />
                          <h4 className="text-xs font-black uppercase tracking-wider">PMO Alerts Center</h4>
                        </div>
                        {activeNotifications.length > 0 && (
                          <button
                            onClick={() => {
                              setDismissedNotifications(prev => [
                                ...prev,
                                ...activeNotifications.map(n => n.id)
                              ]);
                            }}
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-bold"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {activeNotifications.length === 0 ? (
                          <div className="py-8 text-center space-y-2">
                            <CheckSquare className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">All Clear / Strategic Sync Perfect</p>
                            <p className="text-[10px] text-gray-500">No overdue tasks, critical project alerts, or immediate sprint deadlines detected.</p>
                          </div>
                        ) : (
                          activeNotifications.map((notif) => {
                            const typeColor = 
                              notif.type === "project" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200" :
                              notif.type === "sprint" ? "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200" :
                              "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200";

                            const severityIndicator = 
                              notif.severity === "high" 
                                ? "border-l-4 border-l-red-500" 
                                : "border-l-4 border-l-amber-500";

                            return (
                              <div 
                                key={notif.id}
                                className={`p-2.5 rounded-lg border text-left flex gap-2.5 items-start relative transition-colors ${severityIndicator} ${
                                  isDark ? "bg-[#0F1622]/60 border-slate-800/80" : "bg-gray-50 border-gray-100"
                                }`}
                              >
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${typeColor}`}>
                                      {notif.type}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500">
                                      {notif.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-black leading-snug">{notif.title}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-normal">{notif.description}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setDismissedNotifications(prev => [...prev, notif.id]);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                  title="Dismiss notification"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Help & Shortcuts Popover */}
              <div className="relative" id="help-popover-container">
                <button
                  onClick={() => setIsHelpOpen(!isHelpOpen)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
                    isDark ? "text-slate-200 hover:bg-slate-800" : "text-[#1B2A4A] hover:bg-gray-100"
                  }`}
                  id="btn-help-shortcuts"
                  title="PMO Navigation & Keyboard Shortcuts Help"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>

                {isHelpOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsHelpOpen(false)}
                    ></div>
                    <div 
                      className={`absolute right-0 mt-2 w-72 rounded-xl shadow-2xl border p-4 z-50 animate-in fade-in slide-in-from-top-1 duration-100 ${
                        isDark 
                          ? "bg-[#161F30] border-slate-800 text-slate-100" 
                          : "bg-white border-gray-200 text-[#1B2A4A]"
                      }`}
                      id="help-shortcuts-popover"
                    >
                      <div className="flex items-center space-x-2 border-b border-gray-150 dark:border-slate-800/60 pb-2 mb-3">
                        <HelpCircle className="w-4 h-4 text-[#A67C00]" />
                        <h4 className="text-xs font-black uppercase tracking-wider">PMO Help & Navigation</h4>
                      </div>

                      {/* Page Status Indicators */}
                      <div className="mb-4 space-y-2">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-400">System Indicators</h5>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className={`p-1.5 rounded-lg border ${isDark ? "bg-[#0F1622] border-slate-800" : "bg-gray-50 border-gray-100"}`}>
                            <p className="text-gray-400 font-medium">Page State</p>
                            <p className="font-bold text-emerald-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              Active & Healthy
                            </p>
                          </div>
                          <div className={`p-1.5 rounded-lg border ${isDark ? "bg-[#0F1622] border-slate-800" : "bg-gray-50 border-gray-100"}`}>
                            <p className="text-gray-400 font-medium">Sync Source</p>
                            <p className="font-bold text-amber-500">
                              {user ? "Firestore DB" : "Local Storage"}
                            </p>
                          </div>
                          <div className={`p-1.5 rounded-lg border ${isDark ? "bg-[#0F1622] border-slate-800" : "bg-gray-50 border-gray-100"}`}>
                            <p className="text-gray-400 font-medium">Projects Loaded</p>
                            <p className="font-mono font-bold">{projects.length}</p>
                          </div>
                          <div className={`p-1.5 rounded-lg border ${isDark ? "bg-[#0F1622] border-slate-800" : "bg-gray-50 border-gray-100"}`}>
                            <p className="text-gray-400 font-medium">Tasks Total</p>
                            <p className="font-mono font-bold">{tasks.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Keyboard Navigation Shortcuts */}
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Navigation Shortcuts</h5>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">Dashboard</span>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-mono font-bold text-[9px] shadow-sm">Alt + D</kbd>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">Project Registry</span>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-mono font-bold text-[9px] shadow-sm">Alt + P</kbd>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">Sprints & Backlog</span>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-mono font-bold text-[9px] shadow-sm">Alt + S</kbd>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">Resource Capacity</span>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-mono font-bold text-[9px] shadow-sm">Alt + R</kbd>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">Google Workspace</span>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-mono font-bold text-[9px] shadow-sm">Alt + W</kbd>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 dark:text-slate-400 font-semibold">AI Strategic Advisor</span>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-mono font-bold text-[9px] shadow-sm">Alt + C</kbd>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-150 dark:border-slate-800/60 text-center text-[9px] text-gray-400 font-medium">
                        Innovation Consult (Pty) Ltd © 2026
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Firestore Sync Status Indicator */}
              <div 
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                  isDark 
                    ? "bg-[#0F1622]/60 border-slate-800 text-slate-300" 
                    : "bg-gray-50/80 border-gray-150 text-[#1B2A4A]"
                }`} 
                id="firestore-sync-indicator"
                title={isSyncing ? "Data is being synchronized with Firebase Firestore cloud..." : "All local metrics are fully up to date and synchronized with Cloud Firestore."}
              >
                <div className="relative flex h-2 w-2">
                  {isSyncing ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </>
                  ) : (
                    <>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  )}
                </div>
                {isSyncing && (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
                )}
                <span className={isSyncing ? "text-amber-500 font-black animate-pulse" : "text-emerald-600 dark:text-emerald-400 font-black"}>
                  {isSyncing ? "Syncing" : "Synced"}
                </span>
              </div>

              {/* Theme switcher toggle button */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isDark ? "text-amber-400 hover:bg-slate-800" : "text-[#1B2A4A] hover:bg-gray-100"
                }`}
                title={isDark ? "Switch to Corporate Style" : "Switch to High-Contrast Dark Mode"}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Identity and Clickable Dropdown Menu */}
              <div className="relative" id="user-profile-dropdown-container">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity focus:outline-none text-left cursor-pointer"
                  id="btn-user-profile-dropdown"
                  aria-haspopup="true"
                  aria-expanded={isProfileOpen}
                >
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-gray-400 font-mono text-[9px] uppercase tracking-wider">
                      {user ? "Cloud Synced Workspace" : "Local Workspace"}
                    </span>
                    <span className={`font-semibold text-xs ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                      {user ? user.email : "neodlutu@gmail.com"}
                    </span>
                  </div>
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border-2 border-amber-500/50 hover:border-amber-500 shadow-sm transition-colors"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center font-mono text-xs border-2 border-amber-500/30 hover:border-amber-500/85 shadow-sm transition-colors ${
                      isDark ? "bg-slate-800 text-slate-200" : "bg-[#1B2A4A]/10 text-[#1B2A4A]"
                    }`}>
                      {user ? user.email?.substring(0, 2).toUpperCase() : "ND"}
                    </div>
                  )}
                </button>

                {isProfileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileOpen(false)}
                    ></div>
                    <div 
                      className={`absolute right-0 mt-2.5 w-64 rounded-xl shadow-2xl border p-4.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100 ${
                        isDark 
                          ? "bg-[#161F30] border-slate-800 text-slate-100" 
                          : "bg-white border-gray-200 text-[#1B2A4A]"
                      }`}
                      id="user-profile-dropdown-menu"
                    >
                      {/* Dropdown Header */}
                      <div className="flex items-center space-x-3 border-b border-gray-100 dark:border-slate-800/60 pb-3 mb-2.5">
                        {user?.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.displayName || "User"} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-800"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center font-mono text-sm ${
                            isDark ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-[#1B2A4A]/10 text-[#1B2A4A]"
                          }`}>
                            {user ? user.email?.substring(0, 2).toUpperCase() : "ND"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black truncate text-gray-900 dark:text-slate-100">
                            {user?.displayName || "Lead Portfolio Sponsor"}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate dark:text-slate-400 font-medium">
                            {user ? user.email : "neodlutu@gmail.com"}
                          </p>
                          <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-[#A67C00] dark:text-amber-400 border border-amber-500/20">
                            PMO Director
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Actions */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsProfileModalOpen(true);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2.5 cursor-pointer ${
                            isDark ? "hover:bg-slate-800/80 text-slate-200" : "hover:bg-gray-50 text-gray-700"
                          }`}
                          id="btn-profile-management"
                        >
                          <UserIcon className="w-4 h-4 text-sky-500 shrink-0" />
                          <span>Profile Management</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsSettingsModalOpen(true);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2.5 cursor-pointer ${
                            isDark ? "hover:bg-slate-800/80 text-slate-200" : "hover:bg-gray-50 text-gray-700"
                          }`}
                          id="btn-user-settings"
                        >
                          <Settings className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>User Settings</span>
                        </button>

                        <div className="border-t border-gray-100 dark:border-slate-800/60 my-2"></div>

                        <button
                          onClick={async () => {
                            setIsProfileOpen(false);
                            if (user) {
                              try {
                                triggerSyncAnimation();
                                await logout();
                                logActivity("system_event", "Sign Out Completed", "User successfully signed out from Firebase cloud workspace.");
                              } catch (err) {
                                console.error("Sign out error", err);
                              }
                            } else {
                              logActivity("system_event", "Demo Sign Out", "Reset local sandbox simulation context.");
                              alert("Offline sandbox mode reset. In production, this securely unlinks your Google Firebase session.");
                            }
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2.5 text-[#7D1B34] dark:text-red-400 dark:hover:bg-red-950/20 hover:bg-red-50 cursor-pointer`}
                          id="btn-sign-out"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Subtle horizontal progress bar representing total completion rate of all active projects */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-slate-800/80 overflow-hidden" title={`Active Projects Completion: ${activeCompletionRate}%`}>
              <div 
                className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500 ease-out" 
                style={{ width: `${activeCompletionRate}%` }}
              />
            </div>
          </header>

          {/* Main Dashboard Pages router */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            {activeTab === "dashboard" && (
              <DashboardView
                projects={filteredProjects}
                resources={filteredResources}
                activities={activities}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onAskConsultant={handleAskConsultant}
                isDark={isDark}
                onExportPDF={() => generateExecutivePDF(projects, resources)}
              />
            )}

            {activeTab === "portfolio" && (
              <PortfolioView
                projects={filteredProjects}
                tasks={tasks}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
                onAskConsultant={handleAskConsultant}
                isDark={isDark}
              />
            )}

            {activeTab === "sprints" && (
              <SprintTaskView
                projects={filteredProjects}
                sprints={filteredSprints}
                tasks={filteredTasks}
                onAddSprint={handleAddSprint}
                onAddTask={handleAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeTab === "resources" && (
              <ResourceView
                resources={filteredResources}
                onUpdateAllocation={handleUpdateResourceAllocation}
              />
            )}

            {activeTab === "workspace" && (
              <WorkspaceView
                projects={filteredProjects}
                resources={filteredResources}
              />
            )}

            {activeTab === "consultant" && (
              <ConsultantView
                projects={filteredProjects}
                resources={filteredResources}
                initialPrompt={initialConsultantPrompt}
                onClearInitialPrompt={() => setInitialConsultantPrompt(null)}
              />
            )}
          </main>

        </div>

      </div>

      {/* ================= QUICK ACTION DIALOG MODALS ================= */}
      {/* 1. Quick Project Modal */}
      {isQuickProjectOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className={`rounded-xl shadow-2xl border max-w-lg w-full overflow-hidden transition-all duration-200 animate-in zoom-in-95 ${
            isDark ? "bg-[#161F30] border-slate-800 text-slate-100" : "bg-white border-gray-200 text-[#1B2A4A]"
          }`} id="quick-project-modal">
            {/* Modal Header */}
            <div className="bg-[#1B2A4A] p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Quick-Create Corporate Project</h3>
                <p className="text-gray-300 text-[11px] uppercase tracking-wider font-mono">Innovation Consult (Pty) Ltd</p>
              </div>
              <button 
                onClick={() => setIsQuickProjectOpen(false)} 
                className="text-gray-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleQpSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {qpError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[#7D1B34] dark:text-red-200 text-xs rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{qpError}</span>
                </div>
              )}

              {/* Template Selector dropdown */}
              <div className="bg-[#1B2A4A]/5 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-150 dark:border-slate-800 space-y-1">
                <label className={`block text-[10px] font-black uppercase tracking-wider ${isDark ? "text-amber-400" : "text-[#A67C00]"}`}>
                  Structure Setup Template Selector (Optional)
                </label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "agile") {
                      setQpName("Agile Scrum Delivery Sprint");
                      setQpDepartment("Software Development");
                      setQpManager("Agile PMO Lead");
                      setQpBudget("1250000");
                      setQpActualSpent("450000");
                      setQpCpi("1.10");
                      setQpSpi("1.05");
                      setQpDescription("Strategic Agile execution track targeting bi-weekly development intervals, complete story maps, backlog groomings, and automated integration cycles.");
                      setQpStatus("On Track");
                    } else if (val === "waterfall") {
                      setQpName("Enterprise Core Infrastructure Overhaul");
                      setQpDepartment("Government & Infrastructure");
                      setQpManager("Program Director");
                      setQpBudget("4500000");
                      setQpActualSpent("4800000");
                      setQpCpi("0.88");
                      setQpSpi("0.92");
                      setQpDescription("Structured waterfall project plan including requirements specification sign-off, telemetry array installation, architecture reviews, and regulatory validation gates.");
                      setQpStatus("At Risk");
                    } else if (val === "innovation") {
                      setQpName("Mooirivier Greenfield Prototype Sprint");
                      setQpDepartment("Research & Development");
                      setQpManager("Innovation Facilitator");
                      setQpBudget("350000");
                      setQpActualSpent("120000");
                      setQpCpi("1.30");
                      setQpSpi("1.20");
                      setQpDescription("High-velocity prototyping sprint designed to generate mockups, conduct stakeholder user interviews, and compile initial PMO viability briefs.");
                      setQpStatus("On Track");
                    } else {
                      setQpName("");
                      setQpDepartment("");
                      setQpManager("");
                      setQpBudget("");
                      setQpActualSpent("");
                      setQpCpi("1.00");
                      setQpSpi("1.00");
                      setQpDescription("");
                      setQpStatus("On Track");
                    }
                  }}
                  className={`w-full border text-xs rounded-lg p-2 font-bold focus:outline-none focus:ring-1 ${
                    isDark
                      ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                      : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                  }`}
                >
                  <option value="">-- Choose Corporate Template --</option>
                  <option value="agile">Agile Scrum Delivery Template (On Track, R1.25M)</option>
                  <option value="waterfall">Waterfall Enterprise Infrastructure (At Risk, R4.5M)</option>
                  <option value="innovation">Greenfield Innovation Sprint (On Track, R350k)</option>
                </select>
              </div>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mooirivier Basin Telemetry Array"
                    value={qpName}
                    onChange={(e) => setQpName(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                        : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Dept */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                      Department / Vertical *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Government & Infrastructure"
                      value={qpDepartment}
                      onChange={(e) => setQpDepartment(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                        isDark
                          ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                          : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                      }`}
                    />
                  </div>

                  {/* Manager */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                      Senior Advisor / Manager *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Kobus Van der Merwe"
                      value={qpManager}
                      onChange={(e) => setQpManager(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                        isDark
                          ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                          : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                      }`}
                    />
                  </div>

                  {/* Budget */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                      Investment Budget (ZAR) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1500000"
                      value={qpBudget}
                      onChange={(e) => setQpBudget(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm font-mono focus:outline-none focus:ring-1 ${
                        isDark
                          ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                          : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                      }`}
                    />
                  </div>

                  {/* Spent */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                      Actual Spent (ZAR) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1200000"
                      value={qpActualSpent}
                      onChange={(e) => setQpActualSpent(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm font-mono focus:outline-none focus:ring-1 ${
                        isDark
                          ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                          : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                      }`}
                    />
                  </div>

                  {/* CPI */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                      CPI Index
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1.0"
                      value={qpCpi}
                      onChange={(e) => setQpCpi(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm font-mono focus:outline-none focus:ring-1 ${
                        isDark
                          ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                          : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                      }`}
                    />
                  </div>

                  {/* SPI */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                      SPI Index
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1.0"
                      value={qpSpi}
                      onChange={(e) => setQpSpi(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm font-mono focus:outline-none focus:ring-1 ${
                        isDark
                          ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                          : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                      }`}
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={qpStartDate}
                      onChange={(e) => setQpStartDate(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                        isDark
                          ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                          : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                      }`}
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                      Target End Date
                    </label>
                    <input
                      type="date"
                      value={qpEndDate}
                      onChange={(e) => setQpEndDate(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                        isDark
                          ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                          : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                      }`}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Delivery Status
                  </label>
                  <select
                    value={qpStatus}
                    onChange={(e) => setQpStatus(e.target.value as any)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                        : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                    }`}
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Critical">Critical</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Deliverable Strategy Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter strategic goals, indicators, and timelines..."
                    value={qpDescription}
                    onChange={(e) => setQpDescription(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                        : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                    }`}
                  ></textarea>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickProjectOpen(false)}
                  className={`px-4 py-2 border rounded-lg text-xs font-bold focus:outline-none cursor-pointer ${
                    isDark
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Publish Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Quick Sprint Modal */}
      {isQuickSprintOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className={`rounded-xl shadow-2xl border max-w-md w-full overflow-hidden transition-all duration-200 animate-in zoom-in-95 ${
            isDark ? "bg-[#161F30] border-slate-800 text-slate-100" : "bg-white border-gray-200 text-[#1B2A4A]"
          }`} id="quick-sprint-modal">
            {/* Modal Header */}
            <div className="bg-[#1B2A4A] p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Quick-Create Iteration Sprint</h3>
                <p className="text-gray-300 text-[11px] uppercase tracking-wider font-mono">Innovation Consult (Pty) Ltd</p>
              </div>
              <button 
                onClick={() => setIsQuickSprintOpen(false)} 
                className="text-gray-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleQsSubmit} className="p-6 space-y-4">
              {qsError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[#7D1B34] dark:text-red-200 text-xs rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{qsError}</span>
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                  Sprint / Milestone Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 15 - IoT Config"
                  value={qsName}
                  onChange={(e) => setQsName(e.target.value)}
                  className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                    isDark
                      ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                      : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                  Associate Strategic Project *
                </label>
                <select
                  value={qsProjId}
                  onChange={(e) => setQsProjId(e.target.value)}
                  className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                    isDark
                      ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                      : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                  }`}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Story Points Target
                  </label>
                  <input
                    type="number"
                    value={qsTargetPoints}
                    onChange={(e) => setQsTargetPoints(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm font-mono focus:outline-none ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100"
                        : "bg-white border-gray-200 text-[#1B2A4A]"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={qsStart}
                    onChange={(e) => setQsStart(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-xs focus:outline-none ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100"
                        : "bg-white border-gray-200 text-[#1B2A4A]"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={qsEnd}
                  onChange={(e) => setQsEnd(e.target.value)}
                  className={`w-full border rounded-lg p-2 text-xs focus:outline-none ${
                    isDark
                      ? "bg-[#0F1622] border-slate-700 text-slate-100"
                      : "bg-white border-gray-200 text-[#1B2A4A]"
                  }`}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickSprintOpen(false)}
                  className={`px-4 py-2 border rounded-lg text-xs font-bold focus:outline-none cursor-pointer ${
                    isDark
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Deploy Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Quick Task Modal */}
      {isQuickTaskOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className={`rounded-xl shadow-2xl border max-w-md w-full overflow-hidden transition-all duration-200 animate-in zoom-in-95 ${
            isDark ? "bg-[#161F30] border-slate-800 text-slate-100" : "bg-white border-gray-200 text-[#1B2A4A]"
          }`} id="quick-task-modal">
            {/* Modal Header */}
            <div className="bg-[#1B2A4A] p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Quick-Publish Strategic Task</h3>
                <p className="text-gray-300 text-[11px] uppercase tracking-wider font-mono">Innovation Consult (Pty) Ltd</p>
              </div>
              <button 
                onClick={() => setIsQuickTaskOpen(false)} 
                className="text-gray-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleQtSubmit} className="p-6 space-y-4">
              {qtError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[#7D1B34] dark:text-red-200 text-xs rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{qtError}</span>
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                  Task Title / Deliverable *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Map River pH sensor response values"
                  value={qtTitle}
                  onChange={(e) => setQtTitle(e.target.value)}
                  className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                    isDark
                      ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                      : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Assignee Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lerato Dlamini"
                    value={qtAssignee}
                    onChange={(e) => setQtAssignee(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100"
                        : "bg-white border-gray-200 text-[#1B2A4A]"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Priority
                  </label>
                  <select
                    value={qtPriority}
                    onChange={(e) => setQtPriority(e.target.value as any)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100"
                        : "bg-white border-gray-200 text-[#1B2A4A]"
                    }`}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Initial Phase
                  </label>
                  <select
                    value={qtStatus}
                    onChange={(e) => setQtStatus(e.target.value as any)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100"
                        : "bg-white border-gray-200 text-[#1B2A4A]"
                    }`}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Strategic Project *
                  </label>
                  <select
                    value={qtProjId}
                    onChange={(e) => setQtProjId(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100"
                        : "bg-white border-gray-200 text-[#1B2A4A]"
                    }`}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickTaskOpen(false)}
                  className={`px-4 py-2 border rounded-lg text-xs font-bold focus:outline-none cursor-pointer ${
                    isDark
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Publish Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= USER SETTINGS & PROFILE DIALOG MODALS ================= */}
      {/* Profile Management Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" id="profile-management-modal">
          <div className={`rounded-xl shadow-2xl border max-w-md w-full overflow-hidden transition-all duration-200 animate-in zoom-in-95 ${
            isDark ? "bg-[#161F30] border-slate-800 text-slate-100" : "bg-white border-gray-200 text-[#1B2A4A]"
          }`}>
            {/* Modal Header */}
            <div className="bg-[#1B2A4A] p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">PMO Executive Profile</h3>
                <p className="text-gray-300 text-[11px] uppercase tracking-wider font-mono">Innovation Consult (Pty) Ltd</p>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)} 
                className="text-gray-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="flex flex-col items-center text-center space-y-3 pb-2 border-b border-gray-100 dark:border-slate-800/60">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-full border-4 border-amber-500/30 shadow-md"
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-full font-black flex items-center justify-center font-mono text-2xl border-4 border-amber-500/20 ${
                    isDark ? "bg-slate-800 text-slate-200" : "bg-[#1B2A4A]/10 text-[#1B2A4A]"
                  }`}>
                    {user ? user.email?.substring(0, 2).toUpperCase() : "ND"}
                  </div>
                )}
                <div>
                  <h4 className="font-black text-lg text-gray-900 dark:text-slate-100">
                    {user?.displayName || "Lead Portfolio Sponsor"}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {user ? user.email : "neodlutu@gmail.com"}
                  </p>
                  <p className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-[#A67C00] dark:text-amber-400 border border-amber-500/20">
                    PMO Executive Director
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Assigned Division</label>
                  <p className="font-bold">Sub-Saharan Infrastructure & Technology Portfolio</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Corporate Signature</label>
                  <textarea 
                    className={`w-full p-2.5 rounded-lg border text-xs focus:outline-none focus:ring-1 resize-none h-16 ${
                      isDark ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500" : "bg-gray-50 border-gray-250 text-[#1B2A4A] focus:ring-[#A67C00]"
                    }`}
                    defaultValue="knowledge to action. Empowering African structural transformation."
                    placeholder="Enter custom signature..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Session Type</label>
                    <p className="font-mono text-xs font-semibold">
                      {user ? "Cloud (Firebase)" : "Sandbox (Offline)"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Authorization</label>
                    <p className="font-mono text-xs text-emerald-500 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Verified Secure
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PMO Enterprise Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" id="user-settings-modal">
          <div className={`rounded-xl shadow-2xl border max-w-md w-full overflow-hidden transition-all duration-200 animate-in zoom-in-95 ${
            isDark ? "bg-[#161F30] border-slate-800 text-slate-100" : "bg-white border-gray-200 text-[#1B2A4A]"
          }`}>
            {/* Modal Header */}
            <div className="bg-[#1B2A4A] p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">PMO Strategic System Settings</h3>
                <p className="text-gray-300 text-[11px] uppercase tracking-wider font-mono">Innovation Consult (Pty) Ltd</p>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)} 
                className="text-gray-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-slate-800 pb-1.5 mb-2">Governance Threshold Toggles</h4>
              
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">Enforce 85% Resource Cap Warning</p>
                    <p className="text-[10px] text-gray-400">Flag over-allocated engineers during active sprint planning cycles.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-gray-300 cursor-pointer" 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">Enable Status Push Alerts</p>
                    <p className="text-[10px] text-gray-400">Trigger system notifications for newly added "Critical" risks.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-gray-300 cursor-pointer" 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">Integrative Database Diagnostics</p>
                    <p className="text-[10px] text-gray-400">Simulate backend health verification indices.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      triggerSyncAnimation();
                      alert("Firestore DB Integrity Diagnostic: All collections are verified. Schemas compliant with firebase-blueprint.json.");
                    }}
                    className="px-2.5 py-1.5 bg-[#1B2A4A]/5 hover:bg-[#1B2A4A]/10 border border-gray-200 dark:border-slate-800 text-[10px] font-black uppercase rounded transition-colors text-amber-500 cursor-pointer"
                  >
                    Run Health Diagnostic
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">System Reference Currency</label>
                  <select 
                    className={`w-full border rounded-lg p-2 text-xs focus:outline-none ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100"
                        : "bg-white border-gray-200 text-[#1B2A4A]"
                    }`}
                    defaultValue="zar"
                  >
                    <option value="zar">South African Rand (ZAR - R)</option>
                    <option value="usd">United States Dollar (USD - $)</option>
                    <option value="eur">Euro (EUR - €)</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
