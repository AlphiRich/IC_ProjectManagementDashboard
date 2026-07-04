import React, { useState } from "react";
import { Project, ProjectStatus, Task } from "../types";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  X,
  FileText,
  AlertCircle,
  Download,
  Printer,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface PortfolioViewProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (project: Omit<Project, "id" | "progress" | "tasksTotal" | "tasksCompleted" | "velocity">) => void;
  onDeleteProject: (id: string) => void;
  onAskConsultant: (prompt: string) => void;
  isDark: boolean;
}

export default function PortfolioView({
  projects,
  tasks = [],
  onAddProject,
  onDeleteProject,
  onAskConsultant,
  isDark,
}: PortfolioViewProps) {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");

  // Deletion confirm tracking
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Modal tracking
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [manager, setManager] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("On Track");
  const [budget, setBudget] = useState("");
  const [actualSpent, setActualSpent] = useState("");
  const [cpi, setCpi] = useState("1.00");
  const [spi, setSpi] = useState("1.00");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [formError, setFormError] = useState("");

  const departments = Array.from(new Set(projects.map((p) => p.department)));

  // Filtered projects: supports real-time filtering by title or status
  const filteredProjects = projects.filter((p) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.manager.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.status.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesDept = deptFilter === "All" || p.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleExportCSV = () => {
    const headers = [
      "Project ID",
      "Name",
      "Department",
      "Manager",
      "Description",
      "Status",
      "Budget (ZAR)",
      "Actual Spent (ZAR)",
      "CPI",
      "SPI",
      "Start Date",
      "End Date",
      "Total Tasks",
      "Completed Tasks",
      "Progress (%)"
    ];

    const rows = projects.map((p) => [
      p.id,
      p.name,
      p.department,
      p.manager,
      p.description,
      p.status,
      p.budget,
      p.actualSpent,
      p.cpi,
      p.spi,
      p.startDate,
      p.endDate,
      p.tasksTotal,
      p.tasksCompleted,
      p.progress
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((val) => {
            const strValue = val === null || val === undefined ? "" : String(val);
            const escaped = strValue.replace(/"/g, '""');
            return escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")
              ? `"${escaped}"`
              : escaped;
          })
          .join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pmo_project_portfolio_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !department || !manager || !budget || !actualSpent) {
      setFormError("Please fill out all required fields.");
      return;
    }

    const budgetVal = Number(budget);
    const spentVal = Number(actualSpent);
    if (isNaN(budgetVal) || isNaN(spentVal)) {
      setFormError("Budget and Spent values must be valid numbers.");
      return;
    }

    onAddProject({
      name,
      department,
      manager,
      description: description || "No description provided.",
      status,
      budget: budgetVal,
      actualSpent: spentVal,
      cpi: parseFloat(cpi) || 1.0,
      spi: parseFloat(spi) || 1.0,
      startDate,
      endDate,
    });

    // Reset Form
    setName("");
    setDepartment("");
    setManager("");
    setDescription("");
    setStatus("On Track");
    setBudget("");
    setActualSpent("");
    setCpi("1.00");
    setSpi("1.00");
    setFormError("");
    setIsModalOpen(false);
  };

  // Currency utility
  const formatZAR = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const primaryTextClass = isDark ? "text-slate-100" : "text-[#1B2A4A]";
  const secondaryTextClass = isDark ? "text-slate-400" : "text-gray-500";
  const borderClass = isDark ? "border-slate-800" : "border-gray-100";
  const bgClass = isDark ? "bg-[#161F30]" : "bg-white";

  const priorityData = [
    { name: "High", value: tasks.filter((t) => t.priority === "High").length, color: "#7D1B34" }, // Burgundy
    { name: "Medium", value: tasks.filter((t) => t.priority === "Medium").length, color: "#A67C00" }, // Gold
    { name: "Low", value: tasks.filter((t) => t.priority === "Low").length, color: "#10B981" }, // Green
  ];

  return (
    <div className="space-y-6" id="portfolio-view-container">
      {/* Print Stylesheet and Header Block */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: #000000 !important;
            font-family: system-ui, sans-serif !important;
          }
          #persistent-sidebar,
          header,
          nav,
          aside,
          #portfolio-insights-grid,
          #portfolio-view-container > div:first-child, /* Action bar */
          .no-print,
          button,
          select,
          input,
          footer {
            display: none !important;
          }
          #portfolio-view-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .print-only {
            display: block !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 15px !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 10px !important;
            text-align: left !important;
            font-size: 11px !important;
            color: #0f172a !important;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}} />

      <div className="hidden print:block mb-6 border-b-2 border-[#1B2A4A] pb-4" id="print-header-block">
        <h1 className="text-2xl font-black text-[#1B2A4A] uppercase tracking-wider">Innovation Consult (Pty) Ltd</h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Strategic Project Portfolio & PMO Transaction Log</p>
        <div className="flex justify-between items-center mt-4 text-[11px] text-gray-400 font-mono">
          <span>Date Exported: {new Date().toLocaleDateString("en-ZA")}</span>
          <span>Total Registered Projects: {projects.length}</span>
        </div>
      </div>
      {/* 1. Filter and Action Bar */}
      <div className={`${bgClass} ${borderClass} p-4 rounded-xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-colors`}>
        
        {/* Left Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, status, or PM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                isDark
                  ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                  : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
              }`}
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className={`w-4 h-4 ${isDark ? "text-slate-300" : "text-[#1B2A4A]"} shrink-0`} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full sm:w-auto border text-xs rounded-lg p-2 focus:outline-none focus:ring-1 ${
                isDark
                  ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                  : "bg-gray-50 border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
              }`}
            >
              <option value="All">All Statuses</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Critical">Critical</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Dept filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className={`w-full sm:w-auto border text-xs rounded-lg p-2 focus:outline-none focus:ring-1 ${
              isDark
                ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                : "bg-gray-50 border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
            }`}
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Right CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={() => window.print()}
            className={`w-full sm:w-auto px-4 py-2 border rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer text-center ${
              isDark
                ? "border-slate-700 bg-[#0F1622] text-slate-200 hover:bg-slate-800"
                : "border-gray-200 bg-white text-[#1B2A4A] hover:bg-gray-50"
            }`}
            title="Print current project portfolio data"
          >
            <Printer className="w-4 h-4 text-[#7D1B34]" />
            <span>Print Portfolio</span>
          </button>

          <button
            onClick={handleExportCSV}
            className={`w-full sm:w-auto px-4 py-2 border rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer text-center ${
              isDark
                ? "border-slate-700 bg-[#0F1622] text-slate-200 hover:bg-slate-800"
                : "border-gray-200 bg-white text-[#1B2A4A] hover:bg-gray-50"
            }`}
            title="Export project portfolio to CSV"
          >
            <Download className="w-4 h-4 text-[#A67C00]" />
            <span>Export to CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer text-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Strategic Project</span>
          </button>
        </div>
      </div>

      {/* Portfolio Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="portfolio-insights-grid">
        {/* KPI Card 1: Budget Snapshot */}
        <div className={`${bgClass} ${borderClass} rounded-xl border p-5 shadow-sm flex flex-col justify-between space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${primaryTextClass}`}>Portfolio Budget Snapshot</h4>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#A67C00]">{formatZAR(projects.reduce((sum, p) => sum + p.budget, 0))}</div>
            <p className={`text-xs mt-1 ${secondaryTextClass}`}>
              Spent: <span className="font-bold">{formatZAR(projects.reduce((sum, p) => sum + p.actualSpent, 0))}</span>
            </p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#A67C00] h-full transition-all duration-500"
              style={{ 
                width: `${Math.min(100, (projects.reduce((sum, p) => sum + p.actualSpent, 0) / (projects.reduce((sum, p) => sum + p.budget, 0) || 1)) * 100)}%` 
              }}
            />
          </div>
        </div>

        {/* KPI Card 2: Status Breakdown */}
        <div className={`${bgClass} ${borderClass} rounded-xl border p-5 shadow-sm flex flex-col justify-between space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${primaryTextClass}`}>Project Status</h4>
            <div className="p-2 bg-[#1B2A4A]/10 text-[#1B2A4A] dark:text-sky-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "On Track", color: "bg-emerald-500 text-emerald-800", text: "text-emerald-500" },
              { label: "At Risk", color: "bg-amber-500 text-amber-800", text: "text-amber-500 animate-pulse" },
              { label: "Critical", color: "bg-red-500 text-red-800", text: "text-[#7D1B34]" },
              { label: "Completed", color: "bg-sky-500 text-sky-800", text: "text-sky-500" },
            ].map((st) => {
              const count = projects.filter(p => p.status === st.label).length;
              return (
                <div key={st.label} className={`p-2 rounded-lg border ${isDark ? "bg-[#0F1622] border-slate-800" : "bg-gray-50 border-gray-100"} flex flex-col`}>
                  <span className={`text-[10px] font-bold ${secondaryTextClass}`}>{st.label}</span>
                  <span className={`text-base font-black ${st.text}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* KPI Card 3: Task Priority Breakdown Donut Chart */}
        <div className={`${bgClass} ${borderClass} rounded-xl border p-5 shadow-sm flex flex-col justify-between space-y-3`} id="task-priority-breakdown-card">
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${primaryTextClass}`}>Task Priority Breakdown</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDark ? "bg-slate-800 text-slate-300" : "bg-gray-100 text-gray-600"}`}>
              {tasks.length} Total Tasks
            </span>
          </div>
          
          <div className="flex items-center justify-between h-[100px]">
            {/* Donut Chart using Recharts */}
            <div className="w-[110px] h-[100px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={42}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: '11px', 
                      borderRadius: '8px', 
                      backgroundColor: isDark ? '#161F30' : '#ffffff',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      color: isDark ? '#F1F5F9' : '#1E293B'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-xs font-black ${primaryTextClass}`}>
                  {tasks.length > 0 ? Math.round(((tasks.filter(t => t.priority === "High").length) / tasks.length) * 100) : 0}%
                </span>
                <span className="text-[7px] text-gray-400 font-bold uppercase">High</span>
              </div>
            </div>

            {/* Legend info */}
            <div className="flex-1 pl-4 space-y-1 text-xs">
              {priorityData.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className={`${secondaryTextClass} text-[11px] font-medium`}>{p.name}</span>
                  </div>
                  <span className={`font-mono font-bold ${primaryTextClass} text-[11px]`}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Projects List Table */}
      <div className={`${bgClass} ${borderClass} rounded-xl border shadow-sm overflow-hidden transition-colors`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${isDark ? "bg-[#0F1622] text-slate-200" : "bg-[#1B2A4A] text-white"} text-xs font-semibold uppercase tracking-wider`}>
                <th className="p-4 rounded-tl-xl">Project Details</th>
                <th className="p-4">Department & PM</th>
                <th className="p-4">Delivery Status</th>
                <th className="p-4">Budget & Variance</th>
                <th className="p-4 text-center">CPI / SPI</th>
                <th className="p-4">Delivery Progress</th>
                <th className="p-4 text-right rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`p-8 text-center italic ${secondaryTextClass}`}>
                    No corporate projects found matching the specified parameters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p, idx) => {
                  const variance = p.budget - p.actualSpent;
                  const isOverBudget = variance < 0;

                  return (
                    <tr
                      key={p.id}
                      className={
                        isDark
                          ? idx % 2 === 0
                            ? "bg-[#161F30] hover:bg-slate-800/30"
                            : "bg-[#0F1622] hover:bg-slate-800/30"
                          : idx % 2 === 0
                          ? "bg-white hover:bg-gray-50"
                          : "bg-gray-50/50 hover:bg-gray-50"
                      }
                    >
                      {/* Name & Desc */}
                      <td className="p-4 max-w-xs">
                        <div className={`font-bold hover:underline cursor-pointer ${primaryTextClass}`}>
                          {p.name}
                        </div>
                        <p className={`${secondaryTextClass} text-xs mt-1 line-clamp-2`}>
                          {p.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-[10px] text-gray-400 font-mono">
                          <span>Start: {p.startDate}</span>
                          <span>End: {p.endDate}</span>
                        </div>
                      </td>

                      {/* Dept & Manager */}
                      <td className="p-4">
                        <div className={`font-medium ${primaryTextClass}`}>{p.department}</div>
                        <div className={`${secondaryTextClass} text-xs mt-0.5`}>{p.manager}</div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.status === "On Track"
                              ? "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400"
                              : p.status === "At Risk"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                              : p.status === "Critical"
                              ? "bg-red-100 text-[#7D1B34] dark:bg-red-500/10 dark:text-red-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            p.status === "On Track"
                              ? "bg-green-600"
                              : p.status === "At Risk"
                              ? "bg-amber-600"
                              : p.status === "Critical"
                              ? "bg-red-600"
                              : "bg-blue-600"
                          }`}></span>
                          {p.status}
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="p-4 font-mono">
                        <div className={`font-bold ${primaryTextClass}`}>
                          {formatZAR(p.budget)}
                        </div>
                        <div
                          className={`text-xs font-semibold mt-0.5 ${
                            isOverBudget ? "text-[#7D1B34] dark:text-red-400" : "text-green-600 dark:text-emerald-400"
                          }`}
                        >
                          {isOverBudget ? "Overspent" : "Surplus"}: {formatZAR(Math.abs(variance))}
                        </div>
                      </td>

                      {/* CPI / SPI indexes */}
                      <td className="p-4 text-center font-mono">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              p.cpi >= 1 
                                ? "bg-green-50 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                                : "bg-red-50 text-[#7D1B34] dark:bg-red-500/10 dark:text-red-400"
                            }`}
                            title="Cost Performance Index: >1 under budget, <1 over"
                          >
                            CPI: {p.cpi.toFixed(2)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              p.spi >= 1 
                                ? "bg-green-50 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                                : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                            }`}
                            title="Schedule Performance Index: >1 ahead, <1 delayed"
                          >
                            SPI: {p.spi.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Delivery Progress */}
                      <td className="p-4 max-w-[150px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`font-semibold ${secondaryTextClass}`}>
                            {p.tasksCompleted}/{p.tasksTotal} Tasks
                          </span>
                          <span className={`font-mono font-bold ${primaryTextClass}`}>
                            {p.progress}%
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isDark ? "bg-slate-800" : "bg-gray-200"}`}>
                          <div
                            className="bg-[#A67C00] h-2 rounded-full transition-all"
                            style={{ width: `${p.progress}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              onAskConsultant(
                                `We are evaluating project: ${p.name}. Provide a comprehensive corporate status brief explaining the impact of a CPI of ${p.cpi} and SPI of ${p.spi} for Mooirivier stakeholders.`
                              )
                            }
                            className="p-1.5 text-gray-400 hover:text-[#A67C00] transition-colors rounded hover:bg-gray-100"
                            title="Brief Project"
                          >
                            <FileText className="w-4.5 h-4.5" />
                          </button>

                          {projectToDelete === p.id ? (
                            <div className="flex items-center space-x-1 animate-fade-in">
                              <button
                                onClick={() => {
                                  onDeleteProject(p.id);
                                  setProjectToDelete(null);
                                }}
                                className="px-2 py-1 bg-[#7D1B34] text-white text-[10px] font-bold rounded hover:bg-[#5C1426]"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setProjectToDelete(null)}
                                className="px-2 py-1 bg-gray-200 text-gray-700 text-[10px] rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setProjectToDelete(p.id)}
                              className="p-1.5 text-gray-400 hover:text-[#7D1B34] transition-colors rounded hover:bg-gray-100"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Create Project Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-[#1B2A4A] p-4 text-white rounded-t-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Add Strategic Strategic Project</h3>
                <p className="text-gray-300 text-xs">Innovation Consult (Pty) Ltd — Potchefstroom PMO</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className={`p-6 space-y-4 ${isDark ? "bg-[#161F30] text-slate-100" : "bg-white text-gray-900"}`}>
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#7D1B34] text-xs rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Template Selector dropdown */}
              <div className="bg-[#1B2A4A]/5 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-100 dark:border-slate-800 space-y-1.5">
                <label className={`block text-[10px] font-black uppercase tracking-wider ${isDark ? "text-amber-400" : "text-[#A67C00]"}`}>
                  Structure Setup Template Selector (Optional)
                </label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "agile") {
                      setName("Agile Scrum Delivery Sprint");
                      setDepartment("Software Development");
                      setManager("Agile PMO Lead");
                      setBudget("1250000");
                      setActualSpent("450000");
                      setCpi("1.10");
                      setSpi("1.05");
                      setDescription("Strategic Agile execution track targeting bi-weekly development intervals, complete story maps, backlog groomings, and automated integration cycles.");
                      setStatus("On Track");
                    } else if (val === "waterfall") {
                      setName("Enterprise Core Infrastructure Overhaul");
                      setDepartment("Government & Infrastructure");
                      setManager("Program Director");
                      setBudget("4500000");
                      setActualSpent("4800000");
                      setCpi("0.88");
                      setSpi("0.92");
                      setDescription("Structured waterfall project plan including requirements specification sign-off, telemetry array installation, architecture reviews, and regulatory validation gates.");
                      setStatus("At Risk");
                    } else if (val === "innovation") {
                      setName("Mooirivier Greenfield Prototype Sprint");
                      setDepartment("Research & Development");
                      setManager("Innovation Facilitator");
                      setBudget("350000");
                      setActualSpent("120000");
                      setCpi("1.30");
                      setSpi("1.20");
                      setDescription("High-velocity prototyping sprint designed to generate mockups, conduct stakeholder user interviews, and compile initial PMO viability briefs.");
                      setStatus("On Track");
                    } else {
                      setName("");
                      setDepartment("");
                      setManager("");
                      setBudget("");
                      setActualSpent("");
                      setCpi("1.00");
                      setSpi("1.00");
                      setDescription("");
                      setStatus("On Track");
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
                <p className="text-[10px] text-gray-400 italic">Selecting a template auto-populates structured fields instantly.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-1 md:col-span-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mooirivier Basin Telemetry Array"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                        : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                    }`}
                  />
                </div>

                {/* Dept */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Department / Vertical *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Government & Infrastructure"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
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
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
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
                    Planned Investment Budget (ZAR) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
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
                    value={actualSpent}
                    onChange={(e) => setActualSpent(e.target.value)}
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
                    Initial Cost Index (CPI)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.0"
                    value={cpi}
                    onChange={(e) => setCpi(e.target.value)}
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
                    Initial Schedule Index (SPI)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.0"
                    value={spi}
                    onChange={(e) => setSpi(e.target.value)}
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
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
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
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                        : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                    }`}
                  />
                </div>

                {/* Status */}
                <div className="col-span-1 md:col-span-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Current Delivery Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
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
                <div className="col-span-1 md:col-span-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                    Brief Strategy / Deliverable Scope Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter project targets, milestones, and high-level corporate scope..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 ${
                      isDark
                        ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                        : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
                    }`}
                  ></textarea>
                </div>
              </div>

              {/* Action buttons */}
              <div className={`flex items-center justify-end space-x-3 pt-4 border-t ${isDark ? "border-slate-800" : "border-gray-100"}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 border rounded-lg text-xs font-bold focus:outline-none transition-all cursor-pointer ${
                    isDark
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Publish Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
