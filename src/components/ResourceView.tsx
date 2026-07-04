import React, { useState } from "react";
import { Resource } from "../types";
import { Users, ShieldAlert, Award, ArrowUpRight, Calculator, RefreshCw } from "lucide-react";

interface ResourceViewProps {
  resources: Resource[];
  onUpdateAllocation: (id: string, newAlloc: number) => void;
}

export default function ResourceView({ resources, onUpdateAllocation }: ResourceViewProps) {
  // Calculator states
  const [selectedResId, setSelectedResId] = useState(resources[0]?.id || "");
  const [hourlyRate, setHourlyRate] = useState("1200"); // typical corporate consultant ZAR rate
  const [hoursPerWeek, setHoursPerWeek] = useState("40");

  const selectedRes = resources.find((r) => r.id === selectedResId) || resources[0];

  const calculateMonthlyCost = () => {
    if (!selectedRes) return 0;
    const rate = Number(hourlyRate) || 0;
    const hrs = Number(hoursPerWeek) || 0;
    const allocationFactor = selectedRes.allocation / 100;
    // 4.33 weeks per month
    return Math.round(rate * hrs * 4.33 * allocationFactor);
  };

  const formatZAR = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6" id="resource-alloc-view">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Resource Allocation Loading Table */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#1B2A4A] flex items-center">
              <Users className="w-5 h-5 mr-2 text-[#A67C00]" />
              Staffing Capacity & Allocation
            </h3>
            <p className="text-gray-500 text-xs">Configure consultant workloads and resolve over-allocations.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="p-3">Consultant Detail</th>
                  <th className="p-3">Role / Capacity</th>
                  <th className="p-3 text-center">Projects</th>
                  <th className="p-3">Workload Status</th>
                  <th className="p-3 text-right">Adjust Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {resources.map((res) => {
                  const isOverloaded = res.allocation > 100;
                  return (
                    <tr key={res.id} className="hover:bg-gray-50/50">
                      {/* Name with Profile Picture */}
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          {/* Profile Picture with status border */}
                          <div className="relative shrink-0">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(res.name)}&background=1B2A4A&color=A67C00&bold=true&size=128`}
                              alt={res.name}
                              referrerPolicy="no-referrer"
                              className={`w-10 h-10 rounded-full border-2 object-cover transition-all ${
                                res.allocation > 100
                                  ? "border-red-500 shadow-sm shadow-red-100"
                                  : res.allocation >= 80
                                  ? "border-emerald-500 shadow-sm shadow-emerald-100"
                                  : res.allocation > 0
                                  ? "border-sky-400 shadow-sm shadow-sky-100"
                                  : "border-gray-200"
                              }`}
                              title={`${res.name} - Allocation: ${res.allocation}%`}
                            />
                            {/* Visual status dot */}
                            <span 
                              className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-1.5 ring-white dark:ring-slate-900 ${
                                res.allocation > 100
                                  ? "bg-red-500"
                                  : res.allocation >= 80
                                  ? "bg-emerald-500"
                                  : res.allocation > 0
                                  ? "bg-sky-400"
                                  : "bg-gray-300"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[#1B2A4A] flex items-center">
                              {res.name}
                              {isOverloaded && (
                                <span className="ml-1.5 p-0.5 bg-red-100 text-[#7D1B34] rounded" title="Overloaded Capacity">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">ID: {res.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-[#1B2A4A]/5 text-[#1B2A4A]">
                          {res.role}
                        </span>
                      </td>

                      {/* Project Count */}
                      <td className="p-3 text-center font-mono font-bold text-gray-600">
                        {res.activeProjectsCount}
                      </td>

                      {/* Allocation Load */}
                      <td className="p-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`font-mono font-bold ${isOverloaded ? "text-[#7D1B34]" : "text-[#1B2A4A]"}`}>
                            {res.allocation}% Load
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isOverloaded ? "bg-[#7D1B34]" : "bg-[#A67C00]"
                            }`}
                            style={{ width: `${Math.min(res.allocation, 100)}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Sliders */}
                      <td className="p-3 text-right">
                        <input
                          type="range"
                          min="0"
                          max="150"
                          step="5"
                          value={res.allocation}
                          onChange={(e) => onUpdateAllocation(res.id, Number(e.target.value))}
                          className="w-24 accent-[#A67C00] h-1 bg-gray-200 rounded-lg cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advisory Budget Estimator Calculator Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#A67C00]/10 rounded-lg text-[#A67C00]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1B2A4A]">Advisory Fee Planner</h3>
              <p className="text-gray-500 text-xs">Estimate project consulting budgets.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {/* Select Resource */}
            <div>
              <label className="block font-bold text-gray-500 uppercase tracking-wide mb-1">
                Consultant / Advisor
              </label>
              <select
                value={selectedResId}
                onChange={(e) => setSelectedResId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm text-[#1B2A4A]"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Hourly ZAR Rate */}
            <div>
              <label className="block font-bold text-gray-500 uppercase tracking-wide mb-1">
                Hourly Consultant Fee (ZAR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-mono text-sm">R</span>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-[#1B2A4A]"
                />
              </div>
            </div>

            {/* Std hours per week */}
            <div>
              <label className="block font-bold text-gray-500 uppercase tracking-wide mb-1">
                Standard Capacity Hours / Week
              </label>
              <input
                type="number"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm font-mono text-[#1B2A4A]"
              />
            </div>

            {/* Cost Breakdown */}
            {selectedRes && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-2 mt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Workload Factor:</span>
                  <span className="font-mono font-bold text-[#1B2A4A]">{selectedRes.allocation}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Estimated Weekly Hours:</span>
                  <span className="font-mono font-bold text-[#1B2A4A]">
                    {Math.round((Number(hoursPerWeek) || 0) * (selectedRes.allocation / 100))} hrs
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-gray-600 font-bold uppercase tracking-wider">Estimated Monthly Cost:</span>
                  <span className="text-[#A67C00] font-mono text-lg font-bold">
                    {formatZAR(calculateMonthlyCost())}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Advisory Note Banner */}
      <div className="bg-[#1B2A4A] p-5 rounded-xl text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm flex items-center text-[#A67C00]">
            <Award className="w-4 h-4 mr-1.5 shrink-0" />
            PMO Workload Allocation Rules
          </h4>
          <p className="text-gray-300 text-xs">
            Innovation Consult corporate rule 104: All lead senior engineering personnel should maintain a maximum of 100% combined allocation. Address any Red alerts immediately.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-[#A67C00] text-xs font-bold font-mono">
          <span>Target Capacity: Balanced</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

    </div>
  );
}
