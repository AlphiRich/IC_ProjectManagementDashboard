import React, { useState } from "react";
import { AuditLog } from "../types";
import {
  Activity,
  Search,
  Filter,
  Clock,
  User as UserIcon,
  Trash2,
  FileText,
} from "lucide-react";

interface AuditTrailViewProps {
  logs: AuditLog[];
  isDark: boolean;
  onClearLocalLogs?: () => void;
  userEmail?: string;
}

export default function AuditTrailView({
  logs,
  isDark,
  onClearLocalLogs,
  userEmail,
}: AuditTrailViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Sort logs by timestamp descending (newest first)
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredLogs = sortedLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "All" ||
      (filterType === "Projects" && log.action.toLowerCase().includes("project")) ||
      (filterType === "Tasks" && log.action.toLowerCase().includes("task")) ||
      (filterType === "Sprints" && log.action.toLowerCase().includes("sprint")) ||
      (filterType === "System" &&
        (log.action.toLowerCase().includes("theme") ||
          log.action.toLowerCase().includes("export") ||
          log.action.toLowerCase().includes("auth")));

    return matchesSearch && matchesType;
  });

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("created") || act.includes("added")) {
      return {
        bg: isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700",
        label: "Create",
      };
    }
    if (act.includes("deleted") || act.includes("removed")) {
      return {
        bg: isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-700",
        label: "Delete",
      };
    }
    if (act.includes("updated") || act.includes("status") || act.includes("changed")) {
      return {
        bg: isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-700",
        label: "Update",
      };
    }
    return {
      bg: isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700",
      label: "System",
    };
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6" id="pmo-audit-trail-container">
      {/* Overview Card */}
      <div
        className={`${
          isDark
            ? "bg-[#161F30] border-slate-800"
            : "bg-white border-gray-100"
        } p-6 rounded-xl border shadow-sm space-y-4 transition-colors`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Activity className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-[#A67C00]"}`} />
              <h3 className={`text-base font-black uppercase tracking-tight ${isDark ? "text-slate-100" : "text-[#1B2A4A]"}`}>
                Strategic PMO Audit Log Registry
              </h3>
            </div>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Provides an immutable ledger of administrative actions, status changes, and report compilations to ensure complete operational transparency.
            </p>
          </div>
          {onClearLocalLogs && logs.length > 0 && (
            <button
              onClick={onClearLocalLogs}
              className={`px-3 py-1.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Real-time statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0F1622] border-slate-800" : "bg-gray-50 border-gray-100"}`}>
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-400"}`}>
              Total Logged Events
            </div>
            <div className={`text-2xl font-black mt-1 ${isDark ? "text-slate-100" : "text-[#1B2A4A]"}`}>
              {logs.length}
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0F1622] border-slate-800" : "bg-gray-50 border-gray-100"}`}>
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-400"}`}>
              Project Mutations
            </div>
            <div className="text-2xl font-black text-[#A67C00] mt-1">
              {logs.filter((l) => l.action.toLowerCase().includes("project")).length}
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0F1622] border-slate-800" : "bg-gray-50 border-gray-100"}`}>
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-400"}`}>
              Task Mutations
            </div>
            <div className="text-2xl font-black text-blue-500 mt-1">
              {logs.filter((l) => l.action.toLowerCase().includes("task")).length}
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0F1622] border-slate-800" : "bg-gray-50 border-gray-100"}`}>
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-400"}`}>
              Audited Operator
            </div>
            <div className={`text-sm font-bold truncate mt-2 ${isDark ? "text-slate-300" : "text-[#1B2A4A]"}`} title={userEmail || "Local Operator"}>
              {userEmail || "Local Operator"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div
        className={`${
          isDark
            ? "bg-[#161F30] border-slate-800"
            : "bg-white border-gray-100"
        } p-4 rounded-xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-colors`}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search actions or operators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                isDark
                  ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                  : "bg-white border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
              }`}
            />
          </div>

          {/* Action type filters */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className={`w-4 h-4 ${isDark ? "text-slate-300" : "text-[#1B2A4A]"} shrink-0`} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full sm:w-auto border text-xs rounded-lg p-2 focus:outline-none focus:ring-1 ${
                isDark
                  ? "bg-[#0F1622] border-slate-700 text-slate-100 focus:ring-amber-500"
                  : "bg-gray-50 border-gray-200 text-[#1B2A4A] focus:ring-[#A67C00]"
              }`}
            >
              <option value="All">All Categories</option>
              <option value="Projects">Projects</option>
              <option value="Tasks">Tasks</option>
              <option value="Sprints">Sprints</option>
              <option value="System">System / Theme / Export</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit List Table / Timeline */}
      <div
        className={`${
          isDark
            ? "bg-[#161F30] border-slate-800"
            : "bg-white border-gray-100"
        } rounded-xl border shadow-sm overflow-hidden transition-colors`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`${
                  isDark
                    ? "bg-[#0F1622] text-slate-200 border-b border-slate-800"
                    : "bg-[#1B2A4A] text-white"
                } text-xs font-semibold uppercase tracking-wider`}
              >
                <th className="p-4">Timestamp (SAST)</th>
                <th className="p-4">Operation</th>
                <th className="p-4">Action Event Description</th>
                <th className="p-4">operator details</th>
                <th className="p-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className={`p-8 text-center italic ${isDark ? "text-slate-400" : "text-gray-400"}`}
                  >
                    No audit records match the current filter query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr
                      key={log.id}
                      className={
                        isDark
                          ? idx % 2 === 0
                            ? "bg-[#161F30] hover:bg-slate-800/45"
                            : "bg-[#0F1622] hover:bg-slate-800/45"
                          : idx % 2 === 0
                          ? "bg-white hover:bg-gray-50"
                          : "bg-gray-50/50 hover:bg-gray-50"
                      }
                    >
                      {/* Timestamp */}
                      <td className="p-4 whitespace-nowrap font-mono text-xs">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className={isDark ? "text-slate-300" : "text-gray-700"}>
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* Badge classification */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Log Action Description */}
                      <td className="p-4">
                        <p className={`font-semibold ${isDark ? "text-slate-200" : "text-[#1B2A4A]"}`}>
                          {log.action}
                        </p>
                      </td>

                      {/* Operator Details */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isDark ? "bg-slate-800 text-amber-400 border border-slate-700" : "bg-gray-100 text-[#1B2A4A]"
                          }`}>
                            <UserIcon className="w-3 h-3" />
                          </div>
                          <span className={`text-xs font-mono font-medium ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                            {log.userEmail}
                          </span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="p-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center text-[10px] font-mono text-emerald-500 font-bold uppercase">
                          ● verified
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
