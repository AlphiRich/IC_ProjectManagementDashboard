import React, { useState } from "react";
import { Project, Sprint, Task } from "../types";
import {
  Milestone,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";

interface SprintTaskViewProps {
  projects: Project[];
  sprints: Sprint[];
  tasks: Task[];
  onAddSprint: (sprint: Omit<Sprint, "id" | "completedPoints">) => void;
  onAddTask: (task: Omit<Task, "id">) => void;
  onUpdateTaskStatus: (id: string, newStatus: Task["status"]) => void;
  onDeleteTask: (id: string) => void;
}

export default function SprintTaskView({
  projects,
  sprints,
  tasks,
  onAddSprint,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
}: SprintTaskViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
  const [draggedOverLane, setDraggedOverLane] = useState<string | null>(null);

  // Modal tracking
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Form states: Sprint
  const [sprintName, setSprintName] = useState("");
  const [sprintTargetPoints, setSprintTargetPoints] = useState("40");
  const [sprintStart, setSprintStart] = useState("2026-07-01");
  const [sprintEnd, setSprintEnd] = useState("2026-07-15");
  const [sprintProjId, setSprintProjId] = useState(projects[0]?.id || "");

  // Form states: Task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [taskProjId, setTaskProjId] = useState(projects[0]?.id || "");
  const [taskStatus, setTaskStatus] = useState<Task["status"]>("To Do");

  // Filter tasks to show project names
  const tasksWithProjectNames = tasks.map((t) => {
    const proj = projects.find((p) => p.id === t.projectId);
    return {
      ...t,
      projectName: proj ? proj.name : "Unassociated",
    };
  });

  const activeSprints = sprints.map((s) => {
    const proj = projects.find((p) => p.id === s.projectId);
    return {
      ...s,
      projectName: proj ? proj.name : "Unassociated",
    };
  });

  // Sprint addition
  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName || !sprintProjId) return;

    onAddSprint({
      name: sprintName,
      projectId: sprintProjId,
      status: "Active",
      startDate: sprintStart,
      endDate: sprintEnd,
      targetPoints: Number(sprintTargetPoints) || 40,
    });

    setSprintName("");
    setIsSprintModalOpen(false);
  };

  // Task addition
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskAssignee || !taskProjId) return;

    onAddTask({
      projectId: taskProjId,
      title: taskTitle,
      assignee: taskAssignee,
      priority: taskPriority,
      status: taskStatus,
    });

    setTaskTitle("");
    setTaskAssignee("");
    setTaskPriority("Medium");
    setIsTaskModalOpen(false);
  };

  // Movement of task state
  const moveTask = (task: Task, direction: "next" | "prev") => {
    const statuses: Task["status"][] = ["To Do", "In Progress", "In Review", "Done"];
    const currentIndex = statuses.indexOf(task.status);
    let targetIndex = currentIndex;

    if (direction === "next" && currentIndex < statuses.length - 1) {
      targetIndex += 1;
    } else if (direction === "prev" && currentIndex > 0) {
      targetIndex -= 1;
    }

    if (targetIndex !== currentIndex) {
      onUpdateTaskStatus(task.id, statuses[targetIndex]);
    }
  };

  // Kanban lanes definition
  const lanes: { title: Task["status"]; color: string; badge: string }[] = [
    { title: "To Do", color: "border-t-4 border-t-gray-300", badge: "bg-gray-100 text-gray-700" },
    { title: "In Progress", color: "border-t-4 border-t-[#A67C00]", badge: "bg-amber-50 text-[#A67C00]" },
    { title: "In Review", color: "border-t-4 border-[#1B2A4A]", badge: "bg-blue-50 text-[#1B2A4A]" },
    { title: "Done", color: "border-t-4 border-t-green-600", badge: "bg-green-100 text-green-800" },
  ];

  return (
    <div className="space-y-6" id="sprints-tasks-view">
      {/* 1. Sprints Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#1B2A4A] flex items-center">
              <Milestone className="w-5 h-5 mr-2 text-[#A67C00]" />
              Active Sprint Iterations
            </h3>
            <p className="text-gray-500 text-xs">Manage milestone velocities and point completion indexes.</p>
          </div>
          <button
            onClick={() => setIsSprintModalOpen(true)}
            className="px-4 py-2 border border-[#A67C00] text-[#A67C00] hover:bg-[#A67C00] hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sprint</span>
          </button>
        </div>

        {/* Sprint Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeSprints.map((s) => {
            const percentage = s.targetPoints > 0 ? Math.round((s.completedPoints / s.targetPoints) * 100) : 0;
            return (
              <div
                key={s.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 uppercase tracking-wide">
                      {s.status}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{s.startDate} to {s.endDate}</span>
                  </div>
                  <h4 className="font-bold text-[#1B2A4A] text-sm leading-tight mb-1">{s.name}</h4>
                  <p className="text-gray-500 text-xs font-medium">Project: {s.projectName}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                    <span className="text-gray-500 font-semibold">
                      Completed: {s.completedPoints} / {s.targetPoints} SP
                    </span>
                    <span className="text-[#1B2A4A] font-bold">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Task Backlog Board Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#1B2A4A] flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-[#7D1B34]" />
              PMO Task Kanban Board
            </h3>
            <p className="text-gray-500 text-xs">Visualise action items across development phases.</p>
          </div>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sprint Task</span>
          </button>
        </div>

        {/* Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {lanes.map((lane) => {
            const laneTasks = tasksWithProjectNames.filter((t) => t.status === lane.title);
            const isHovered = draggedOverLane === lane.title;
            return (
              <div
                key={lane.title}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => { e.preventDefault(); setDraggedOverLane(lane.title); }}
                onDragLeave={() => setDraggedOverLane(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData("text/plain");
                  if (taskId) {
                    onUpdateTaskStatus(taskId, lane.title);
                  }
                  setDraggedOverLane(null);
                }}
                className={`p-4 rounded-xl flex flex-col min-h-[480px] transition-all duration-200 ${lane.color} ${
                  isHovered 
                    ? "bg-[#A67C00]/10 border-2 border-dashed border-[#A67C00]/40 scale-[1.01] shadow-inner" 
                    : "bg-gray-50/70 border border-transparent"
                }`}
              >
                {/* Lane Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider">
                    {lane.title}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${lane.badge}`}>
                    {laneTasks.length}
                  </span>
                </div>

                {/* Tasks Stack */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {laneTasks.length === 0 ? (
                    <div className="h-full border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                      <Clock className="w-6 h-6 text-gray-300 mb-1" />
                      <p className="text-[11px] text-gray-400 italic">No tasks in this lane.</p>
                    </div>
                  ) : (
                    laneTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", task.id);
                        }}
                        className="bg-white p-3.5 rounded-lg border border-gray-100 shadow-sm space-y-2 hover:shadow hover:border-amber-500/30 transition-all cursor-grab active:cursor-grabbing"
                      >
                        {/* Tags */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            task.priority === "High"
                              ? "bg-red-50 text-[#7D1B34]"
                              : task.priority === "Medium"
                              ? "bg-amber-50 text-[#A67C00]"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {task.priority} Priority
                          </span>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="text-gray-400 hover:text-[#7D1B34] p-0.5 rounded"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Task Title */}
                        <h5 className="text-xs font-bold text-[#1B2A4A] leading-normal">
                          {task.title}
                        </h5>

                        {/* Project Name */}
                        <div className="text-[10px] text-gray-400 font-medium truncate">
                          {task.projectName}
                        </div>

                        {/* Assignee Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[10px]">
                          <span className="flex items-center text-gray-500">
                            <User className="w-3 h-3 mr-1 text-[#A67C00]" />
                            {task.assignee}
                          </span>

                          {/* Controls to move */}
                          <div className="flex items-center space-x-1">
                            {task.status !== "To Do" && (
                              <button
                                onClick={() => moveTask(task, "prev")}
                                className="p-0.5 bg-gray-100 rounded text-gray-500 hover:bg-gray-200"
                                title="Move Backward"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {task.status !== "Done" && (
                              <button
                                onClick={() => moveTask(task, "next")}
                                className="p-0.5 bg-gray-100 rounded text-[#1B2A4A] hover:bg-[#A67C00] hover:text-white"
                                title="Move Forward"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Create Sprint Modal Dialog */}
      {isSprintModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full">
            <div className="bg-[#1B2A4A] p-4 text-white rounded-t-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Create Strategic Sprint</h3>
                <p className="text-gray-300 text-[11px]">Deploy iteration scope variables</p>
              </div>
              <button onClick={() => setIsSprintModalOpen(false)} className="text-gray-200 hover:text-white">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreateSprint} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                  Sprint / Milestone Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 15 - IoT Node Configuration"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm text-[#1B2A4A] focus:outline-none focus:ring-1 focus:ring-[#A67C00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                  Associate Project *
                </label>
                <select
                  value={sprintProjId}
                  onChange={(e) => setSprintProjId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm text-[#1B2A4A] focus:outline-none focus:ring-1 focus:ring-[#A67C00]"
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
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                    Target Story Points
                  </label>
                  <input
                    type="number"
                    value={sprintTargetPoints}
                    onChange={(e) => setSprintTargetPoints(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm font-mono text-[#1B2A4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={sprintStart}
                    onChange={(e) => setSprintStart(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs text-[#1B2A4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                  End Date
                </label>
                <input
                  type="date"
                  value={sprintEnd}
                  onChange={(e) => setSprintEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs text-[#1B2A4A]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSprintModalOpen(false)}
                  className="px-4 py-2 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white rounded-lg text-xs font-bold"
                >
                  Deploy Iteration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create Task Modal Dialog */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full">
            <div className="bg-[#1B2A4A] p-4 text-white rounded-t-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Add Sprint Task</h3>
                <p className="text-gray-300 text-[11px]">Define strategic deliverable items</p>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-200 hover:text-white">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                  Task Title / Deliverable *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Map River pH sensor response values"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm text-[#1B2A4A] focus:outline-none focus:ring-1 focus:ring-[#A67C00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                    Assignee Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lerato Dlamini"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm text-[#1B2A4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "High" | "Medium" | "Low")}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm text-[#1B2A4A]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                    Initial Phase
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as Task["status"])}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm text-[#1B2A4A]"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1B2A4A] mb-1 uppercase tracking-wider">
                    Strategic Project *
                  </label>
                  <select
                    value={taskProjId}
                    onChange={(e) => setTaskProjId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm text-[#1B2A4A]"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white rounded-lg text-xs font-bold"
                >
                  Publish Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
