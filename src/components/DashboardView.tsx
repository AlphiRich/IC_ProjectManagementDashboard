import React from "react";
import { Project, Resource, RecentActivity } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  CheckCircle,
  HelpCircle,
  Clock,
  FileText,
  Plus,
  RefreshCw,
} from "lucide-react";

interface DashboardViewProps {
  projects: Project[];
  resources: Resource[];
  activities: RecentActivity[];
  onNavigateToTab: (tab: string) => void;
  onAskConsultant: (initialPrompt: string) => void;
  isDark: boolean;
  onExportPDF: () => void;
}

export default function DashboardView({
  projects,
  resources,
  activities,
  onNavigateToTab,
  onAskConsultant,
  isDark,
  onExportPDF,
}: DashboardViewProps) {
  // Calculations
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status !== "Completed").length;
  const completedProjects = projects.filter((p) => p.status === "Completed").length;
  
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.actualSpent, 0);
  const overallBudgetVariance = totalBudget - totalSpent;
  const avgVelocity = Math.round(
    projects.reduce((sum, p) => sum + p.velocity, 0) / (projects.length || 1)
  );

  // Average CPI and SPI
  const avgCpi = parseFloat(
    (projects.reduce((sum, p) => sum + p.cpi, 0) / (projects.length || 1)).toFixed(2)
  );
  const avgSpi = parseFloat(
    (projects.reduce((sum, p) => sum + p.spi, 0) / (projects.length || 1)).toFixed(2)
  );

  // Resource loading calculations
  const overloadedResources = resources.filter((r) => r.allocation > 100);

  // Formatting currency
  const formatZAR = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Chart data 1: Budget vs Spent
  const budgetChartData = projects.map((p) => ({
    name: p.name.length > 20 ? p.name.substring(0, 18) + "..." : p.name,
    Planned: p.budget,
    Spent: p.actualSpent,
  }));

  // Chart data 2: Resources loading
  const resourceChartData = resources.map((r) => ({
    name: r.name.split(" ")[0] + " " + (r.name.split(" ")[1]?.substring(0, 1) || "") + ".",
    Allocation: r.allocation,
  }));

  // Critical alerts
  const riskProjects = projects.filter((p) => p.status === "Critical" || p.status === "At Risk");

  const cardBgClass = isDark ? "bg-[#161F30] border-slate-800 text-slate-100" : "bg-white border-gray-100 text-gray-900";
  const primaryTextClass = isDark ? "text-slate-100" : "text-[#1B2A4A]";
  const secondaryTextClass = isDark ? "text-slate-400" : "text-gray-500";
  const mutedTextClass = isDark ? "text-slate-500" : "text-gray-400";

  return (
    <div className="space-y-6 relative min-h-screen" id="dashboard-view-container">
      {/* Subtle Logo Watermark Background (Grayscale, very low opacity) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center select-none z-0">
        <img 
          src="/93206411 (1).jpg" 
          alt="Watermark Background" 
          className="w-[500px] h-[500px] max-w-full object-contain filter grayscale opacity-[0.03] dark:opacity-[0.015]"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('/assets/')) {
              target.src = '/assets/93206411 (1).jpg';
            }
          }}
        />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Dynamic top bar with PDF Export */}
      <div className={`p-4 rounded-xl border ${isDark ? "bg-[#161F30] border-slate-800" : "bg-white border-gray-100"} flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm`}>
        <div>
          <h3 className={`text-sm font-black uppercase tracking-wider ${primaryTextClass}`}>Portfolio Executive Dashboard</h3>
          <p className={`text-xs ${secondaryTextClass}`}>Live telemetry indicators, budget performance indexes, and staffing constraints.</p>
        </div>
        <button
          onClick={onExportPDF}
          className="px-4 py-2 bg-[#A67C00] hover:bg-[#856300] text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-2 shadow-sm cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Export Executive PDF</span>
        </button>
      </div>

      {/* 1. Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Portfolio Health */}
        <div className={`${cardBgClass} p-5 rounded-xl border shadow-sm flex flex-col justify-between`} id="metric-card-health">
          <div className="flex items-center justify-between">
            <span className={`${secondaryTextClass} text-xs font-bold uppercase tracking-wider`}>Portfolio Health Index</span>
            <div className={`p-2 rounded-lg ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-[#1B2A4A]/5 text-[#1B2A4A]"}`}>
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-bold tracking-tight ${primaryTextClass} font-mono`}>
                {avgSpi >= 1 ? "Optimal" : "Slowing"}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-2 text-xs">
              <span className={`px-2 py-0.5 rounded font-bold ${avgCpi >= 1 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                CPI: {avgCpi}
              </span>
              <span className={`px-2 py-0.5 rounded font-bold ${avgSpi >= 1 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                SPI: {avgSpi}
              </span>
            </div>
          </div>
          <p className={`${mutedTextClass} text-[11px] mt-3`}>CPI &amp; SPI portfolio performance metrics.</p>
        </div>

        {/* Card 2: Budget Variance Monitor */}
        <div className={`${cardBgClass} p-5 rounded-xl border shadow-sm flex flex-col justify-between`} id="metric-card-budget">
          <div className="flex items-center justify-between">
            <span className={`${secondaryTextClass} text-xs font-bold uppercase tracking-wider`}>Net Budget Variance</span>
            <div className={`p-2 rounded-lg ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-[#A67C00]/5 text-[#A67C00]"}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-2xl font-bold tracking-tight ${primaryTextClass} font-mono block`}>
              {formatZAR(overallBudgetVariance)}
            </span>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-green-600 font-bold flex items-center mr-2">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                {Math.round((overallBudgetVariance / (totalBudget || 1)) * 100)}% under budget
              </span>
            </div>
          </div>
          <p className={`${mutedTextClass} text-[11px] mt-3`}>Total portfolio planned surplus index.</p>
        </div>

        {/* Card 3: Resource Allocations */}
        <div className={`${cardBgClass} p-5 rounded-xl border shadow-sm flex flex-col justify-between`} id="metric-card-resources">
          <div className="flex items-center justify-between">
            <span className={`${secondaryTextClass} text-xs font-bold uppercase tracking-wider`}>Resource Constraints</span>
            <div className={`p-2 rounded-lg ${isDark ? "bg-red-500/10 text-red-400" : "bg-[#7D1B34]/5 text-[#7D1B34]"}`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-1">
              <span className={`text-3xl font-bold tracking-tight ${primaryTextClass} font-mono`}>
                {resources.length}
              </span>
              <span className={`${secondaryTextClass} text-xs`}>active personnel</span>
            </div>
            <div className="mt-2 text-xs">
              {overloadedResources.length > 0 ? (
                <span className="text-[#7D1B34] dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded flex items-center w-fit">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {overloadedResources.length} Overloaded (&gt;100%)
                </span>
              ) : (
                <span className="text-green-600 font-bold bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded">
                  All loads balanced
                </span>
              )}
            </div>
          </div>
          <p className={`${mutedTextClass} text-[11px] mt-3`}>Resource hours distribution status.</p>
        </div>

        {/* Card 4: Sprints Velocity */}
        <div className={`${cardBgClass} p-5 rounded-xl border shadow-sm flex flex-col justify-between`} id="metric-card-velocity">
          <div className="flex items-center justify-between">
            <span className={`${secondaryTextClass} text-xs font-bold uppercase tracking-wider`}>Scrum Velocity index</span>
            <div className={`p-2 rounded-lg ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-[#1B2A4A]/5 text-[#1B2A4A]"}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-1">
              <span className={`text-3xl font-bold tracking-tight ${primaryTextClass} font-mono`}>
                {avgVelocity}
              </span>
              <span className={`${secondaryTextClass} text-xs`}>pts / sprint</span>
            </div>
            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
              <span className={`flex items-center ${secondaryTextClass}`}>
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" />
                {completedProjects} of {totalProjects} completed
              </span>
            </div>
          </div>
          <p className={`${mutedTextClass} text-[11px] mt-3`}>Measured across active milestones.</p>
        </div>

      </div>

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Budget Variance (Planned vs Spent) */}
        <div className={`${isDark ? "bg-[#161F30] border-slate-800" : "bg-white border-gray-100"} p-5 rounded-xl border shadow-sm lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-lg font-bold ${primaryTextClass}`}>Budget Variance Analytics</h3>
              <p className={`${secondaryTextClass} text-xs`}>Comparing total planned investment vs actual spend by project.</p>
            </div>
            <div className="flex space-x-4 text-xs">
              <span className={`flex items-center ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                <span className="w-3 h-3 bg-[#1B2A4A] rounded-sm mr-1.5 inline-block"></span>
                Planned Budget
              </span>
              <span className={`flex items-center ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                <span className="w-3 h-3 bg-[#A67C00] rounded-sm mr-1.5 inline-block"></span>
                Actual Spent
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetChartData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1E293B" : "#F3F4F6"} />
                <XAxis dataKey="name" tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 11 }} tickLine={false} />
                <YAxis
                  tickFormatter={(val) => `R${val / 1000}k`}
                  tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 11 }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [formatZAR(Number(value)), ""]}
                  contentStyle={{ backgroundColor: isDark ? "#0F1622" : "#1B2A4A", borderColor: isDark ? "#334155" : "#1B2A4A", borderRadius: "8px", color: "#FFF" }}
                />
                <Bar dataKey="Planned" fill="#1B2A4A" radius={[4, 4, 0, 0]} maxBarSize={45} />
                <Bar dataKey="Spent" fill="#A67C00" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Resource Allocation Loading */}
        <div className={`${isDark ? "bg-[#161F30] border-slate-800" : "bg-white border-gray-100"} p-5 rounded-xl border shadow-sm`}>
          <div>
            <h3 className={`text-lg font-bold ${primaryTextClass}`}>Staffing Load Chart</h3>
            <p className={`${secondaryTextClass} text-xs`}>Individual consultant allocation percentage across projects.</p>
          </div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={resourceChartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#1E293B" : "#F3F4F6"} />
                <XAxis type="number" domain={[0, 120]} tickFormatter={(val) => `${val}%`} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#6B7280' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: isDark ? '#E2E8F0' : '#1B2A4A', fontWeight: 500 }} />
                <Tooltip
                  formatter={(value: any) => [`${value}% Allocation`, ""]}
                  contentStyle={{ backgroundColor: isDark ? "#0F1622" : "#1B2A4A", borderColor: isDark ? "#334155" : "#1B2A4A", borderRadius: "8px", color: "#FFF" }}
                />
                <Bar dataKey="Allocation" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {resourceChartData.map((entry, index) => {
                    // Color code overloaded consultants in burgundy
                    const color = entry.Allocation > 100 ? "#7D1B34" : isDark ? "#A67C00" : "#1B2A4A";
                    return <rect key={`rect-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Gantt Timeline Visualization */}
      {(() => {
        // Find project start and end range for Gantt Chart
        const ganttProjects = projects.filter(p => p.startDate && p.endDate);
        const dates = ganttProjects.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
        const earliestGantt = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date("2026-06-01");
        const latestGantt = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date("2026-12-31");
        
        // Add comfort padding around the limits
        const startLimit = new Date(earliestGantt.getFullYear(), earliestGantt.getMonth() - 1, 1);
        const endLimit = new Date(latestGantt.getFullYear(), latestGantt.getMonth() + 2, 0);
        
        const timelineStartMs = startLimit.getTime();
        const timelineEndMs = endLimit.getTime();
        const totalDurationGantt = timelineEndMs - timelineStartMs;

        const currentMockDateMs = new Date("2026-06-27").getTime(); // Local current date from metadata
        const todayPositionPercent = ((currentMockDateMs - timelineStartMs) / totalDurationGantt) * 100;

        // Generate monthly columns
        const ganttMonths: { name: string; year: number }[] = [];
        const walkDate = new Date(startLimit);
        while (walkDate <= endLimit && ganttMonths.length < 12) {
          const monthName = walkDate.toLocaleString("en-US", { month: "short" });
          const year = walkDate.getFullYear();
          ganttMonths.push({ name: monthName, year });
          walkDate.setMonth(walkDate.getMonth() + 1);
        }
        const monthPercentWidth = 100 / (ganttMonths.length || 1);

        const getGanttBarProps = (pStartStr: string, pEndStr: string, status: string) => {
          const pStart = new Date(pStartStr);
          const pEnd = new Date(pEndStr);
          const pStartMs = isNaN(pStart.getTime()) ? timelineStartMs : pStart.getTime();
          const pEndMs = isNaN(pEnd.getTime()) ? timelineEndMs : pEnd.getTime();

          const leftPercent = ((pStartMs - timelineStartMs) / totalDurationGantt) * 100;
          const widthPercent = ((pEndMs - pStartMs) / totalDurationGantt) * 100;

          let barColor = "bg-emerald-500 hover:bg-emerald-600 border-emerald-600/30"; // On Track
          if (status === "At Risk") {
            barColor = "bg-[#A67C00] hover:bg-[#856300] border-amber-500/30";
          } else if (status === "Critical") {
            barColor = "bg-[#7D1B34] hover:bg-[#631428] border-red-600/30";
          } else if (status === "Completed") {
            barColor = "bg-sky-500 hover:bg-sky-600 border-sky-600/30";
          }

          return {
            left: `${Math.max(0, Math.min(95, leftPercent))}%`,
            width: `${Math.max(4, Math.min(100 - leftPercent, widthPercent))}%`,
            colorClass: barColor
          };
        };

        return (
          <div className={`${isDark ? "bg-[#161F30] border-slate-800" : "bg-white border-gray-100"} p-5 rounded-xl border shadow-sm space-y-4`} id="gantt-chart-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className={`text-base font-black uppercase tracking-wider ${primaryTextClass}`}>PMO Strategic Gantt Roadmap</h3>
                <p className={`${secondaryTextClass} text-xs`}>
                  Timeline distribution of active portfolio projects relative to evaluation date (<span className="text-[#A67C00] font-bold">27 June 2026</span>).
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded mr-1 inline-block"></span>On Track</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-[#A67C00] rounded mr-1 inline-block"></span>At Risk</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-[#7D1B34] rounded mr-1 inline-block"></span>Critical</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-sky-500 rounded mr-1 inline-block"></span>Completed</span>
              </div>
            </div>

            <div className="relative border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden bg-gray-50/10 dark:bg-slate-900/10 p-4">
              {/* Timeline Header (Months) */}
              <div className="flex border-b border-gray-100 dark:border-slate-800/80 pb-2.5 text-[9px] font-black tracking-wider uppercase text-gray-400 dark:text-slate-500">
                <div className="w-1/4 shrink-0 text-left pl-1">Corporate Portfolio Item</div>
                <div className="w-3/4 flex relative">
                  {ganttMonths.map((m, i) => (
                    <div 
                      key={`${m.name}-${i}`} 
                      style={{ width: `${monthPercentWidth}%` }}
                      className="text-center border-l border-gray-100 dark:border-slate-800/40"
                    >
                      {m.name} '{String(m.year).substring(2)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Gantt Rows */}
              <div className="relative divide-y divide-gray-100/60 dark:divide-slate-800/40 mt-2">
                {/* Today Line Indicator */}
                {todayPositionPercent >= 0 && todayPositionPercent <= 100 && (
                  <div 
                    className="absolute top-0 bottom-0 border-l border-dashed border-[#7D1B34] z-20 flex flex-col items-center pointer-events-none"
                    style={{ left: `calc(25% + ${todayPositionPercent * 0.75}%)` }}
                  >
                    <span className="bg-[#7D1B34] text-white text-[7px] px-1 py-0.2 rounded uppercase font-black tracking-widest -mt-2">
                      Evaluation Point
                    </span>
                  </div>
                )}

                {projects.length === 0 ? (
                  <div className="py-12 text-center text-xs italic text-gray-400">
                    No corporate projects listed in current portfolio selection.
                  </div>
                ) : (
                  projects.map((proj) => {
                    const bar = getGanttBarProps(proj.startDate, proj.endDate, proj.status);
                    return (
                      <div key={proj.id} className="flex items-center py-2.5 hover:bg-gray-50/50 dark:hover:bg-slate-800/5 transition-colors">
                        {/* Project Name & Meta */}
                        <div className="w-1/4 pr-4 shrink-0 truncate">
                          <h5 className={`font-black text-xs truncate ${primaryTextClass}`} title={proj.name}>
                            {proj.name}
                          </h5>
                          <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                            <span>PM: {proj.manager}</span>
                            <span>•</span>
                            <span className="font-mono">CPI: {proj.cpi}</span>
                          </div>
                        </div>

                        {/* Timeline bar container */}
                        <div className="w-3/4 h-7 relative flex items-center">
                          {/* Month vertical grid backgrounds */}
                          <div className="absolute inset-0 flex">
                            {ganttMonths.map((_, idx) => (
                              <div 
                                key={`grid-${idx}`} 
                                style={{ width: `${monthPercentWidth}%` }}
                                className="h-full border-l border-gray-100 dark:border-slate-800/20"
                              />
                            ))}
                          </div>

                          {/* Dynamic Bar */}
                          <div 
                            className={`absolute h-5 rounded-md border shadow-sm flex items-center justify-between px-2 transition-all hover:scale-[1.01] hover:shadow cursor-help z-10 text-white ${bar.colorClass}`}
                            style={{ left: bar.left, width: bar.width }}
                            title={`${proj.name} [${proj.startDate} to ${proj.endDate}]`}
                          >
                            <span className="text-[8px] font-black truncate drop-shadow-sm opacity-90">
                              {proj.startDate}
                            </span>
                            <span className="text-[8px] font-black truncate drop-shadow-sm opacity-90">
                              {proj.endDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Bento Grid: Recent Activity & Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-bento-grid">
        
        {/* Recent Activity Widget */}
        <div className={`${isDark ? "bg-[#161F30] border-slate-800" : "bg-white border-gray-100"} p-5 rounded-xl border shadow-sm lg:col-span-2 flex flex-col justify-between space-y-4`} id="recent-activity-widget">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-base font-bold ${primaryTextClass}`}>Recent Activity Feed</h4>
                  <p className={`${secondaryTextClass} text-xs`}>Dynamic timestamped audit trail of portfolio creations, updates, and deployments.</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${isDark ? "bg-[#0F1622] text-slate-400" : "bg-gray-100 text-gray-500"}`}>
                Live Feed ({activities.length})
              </span>
            </div>
          </div>

          <div className="overflow-y-auto pr-1 space-y-3.5 max-h-[320px] custom-scrollbar">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-pulse" />
                <p className="font-bold uppercase tracking-wider text-[10px]">No Activity Logged</p>
                <p className="text-[10px] text-gray-500 mt-1">Activities will appear as projects, tasks, and sprints are updated.</p>
              </div>
            ) : (
              activities.map((act) => {
                const getIconAndBg = (type: string) => {
                  switch (type) {
                    case "project_creation":
                      return {
                        icon: <Plus className="w-4 h-4 text-emerald-500" />,
                        bg: "bg-emerald-500/10 border-emerald-500/20",
                        label: "PROJECT REGISTERED",
                        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200"
                      };
                    case "sprint_deployment":
                      return {
                        icon: <TrendingUp className="w-4 h-4 text-sky-500" />,
                        bg: "bg-sky-500/10 border-sky-500/20",
                        label: "MILESTONE DEPLOYED",
                        badge: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200"
                      };
                    case "task_update":
                    default:
                      return {
                        icon: <Clock className="w-4 h-4 text-amber-500" />,
                        bg: "bg-amber-500/10 border-amber-500/20",
                        label: "DELIVERABLE UPDATE",
                        badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200"
                      };
                  }
                };

                const meta = getIconAndBg(act.type);

                return (
                  <div 
                    key={act.id} 
                    className={`flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all hover:translate-x-0.5 duration-200 ${
                      isDark ? "bg-[#0F1622]/40 border-slate-800/80 hover:bg-[#0F1622]" : "bg-gray-50/70 border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 ${meta.bg}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 text-[8px] font-black tracking-wider uppercase rounded border ${meta.badge}`}>
                          {meta.label}
                        </span>
                        <span className={`text-[9px] font-mono font-bold shrink-0 ${mutedTextClass}`}>
                          {act.timestamp}
                        </span>
                      </div>
                      <h5 className={`text-xs font-black truncate leading-tight ${primaryTextClass}`}>
                        {act.title}
                      </h5>
                      <p className={`text-[11px] leading-relaxed ${secondaryTextClass}`}>
                        {act.details}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. PMO Portfolio Risk Event Management */}
        <div className={`${isDark ? "bg-[#7D1B34]/10 border-[#7D1B34]/30" : "bg-[#7D1B34]/5 border-[#7D1B34]/20"} border p-5 rounded-xl shadow-sm flex flex-col justify-between space-y-4 lg:col-span-1`} id="risk-management-alerts-card">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-[#7D1B34]/10 rounded-lg text-[#7D1B34]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-black uppercase text-sm tracking-wider ${primaryTextClass}`}>Risk Indicators ({riskProjects.length})</h4>
                <p className={`${mutedTextClass} text-[10px]`}>Projects breaching standard PMO indexes.</p>
              </div>
            </div>
            
            <p className={`${isDark ? "text-slate-300" : "text-gray-600"} text-xs leading-relaxed`}>
              The PMO engine detected active metrics variance breaching control limits. Immediate recovery action is recommended.
            </p>
          </div>

          {/* List risk projects */}
          <div className="overflow-y-auto pr-1 space-y-3 max-h-[220px]">
            {riskProjects.length === 0 ? (
              <div className="py-6 text-center text-emerald-500 text-xs font-bold">
                No Critical Risks Active
              </div>
            ) : (
              riskProjects.map((proj) => (
                <div
                  key={proj.id}
                  className={`${isDark ? "bg-[#0F1622] border-slate-800/80" : "bg-white border-gray-100"} p-3 rounded-lg border flex flex-col justify-between gap-2.5`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        proj.status === "Critical" ? "bg-red-100 text-[#7D1B34]" : "bg-amber-100 text-[#A67C00]"
                      }`}>
                        {proj.status}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500">CPI: {proj.cpi}</span>
                    </div>
                    <h5 className={`font-bold text-xs truncate ${primaryTextClass}`}>{proj.name}</h5>
                    <p className={`${secondaryTextClass} text-[10px] truncate`}>Lead: {proj.manager}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-slate-800/50">
                    <span className={`text-[10px] font-mono font-bold ${secondaryTextClass}`}>SPI: {proj.spi}</span>
                    <button
                      onClick={() => onAskConsultant(`Analyze the risks for the ${proj.name} project led by ${proj.manager}. It has a status of ${proj.status}, CPI of ${proj.cpi}, and SPI of ${proj.spi}. Suggest a recovery plan.`)}
                      className="text-[10px] font-black text-[#A67C00] hover:text-[#7A5C00] underline uppercase cursor-pointer"
                    >
                      Draft Recovery
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigateToTab("consultant")}
            className="w-full py-2.5 bg-[#7D1B34] hover:bg-[#631428] text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer text-center"
          >
            Consult Gemini Advisor
          </button>
        </div>

      </div>

      {/* 4. Strategic advisory footer quote */}
      <div className={`text-center py-4 border-t ${isDark ? "border-slate-800" : "border-gray-100"}`}>
        <p className={`${mutedTextClass} text-xs italic`}>
          Innovation Consult (Pty) Ltd — <span className={`font-medium ${primaryTextClass}`}>"knowledge to action."</span>
        </p>
      </div>

      </div>
    </div>
  );
}
