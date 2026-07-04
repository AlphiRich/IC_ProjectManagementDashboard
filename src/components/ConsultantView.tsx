import React, { useState, useRef, useEffect } from "react";
import { Project, Resource } from "../types";
import { Sparkles, Send, ShieldCheck, Mail, HelpCircle, Loader, MessageCircle } from "lucide-react";

interface ConsultantViewProps {
  projects: Project[];
  resources: Resource[];
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ConsultantView({
  projects,
  resources,
  initialPrompt,
  onClearInitialPrompt,
}: ConsultantViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome to the strategic PMO Consultation desk. I am the Innovation Consult Lead PMO Advisor. I can analyze your Potchefstroom project delivery indices, evaluate cost variances (CPI), review schedule slippages (SPI), and draft recovery roadmaps. Let's move **knowledge to action.**"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested Prompts
  const suggestedPrompts = [
    {
      label: "Portfolio Risk & Budgets",
      prompt: "Perform a comprehensive risk review of all projects. Highlight cost and schedule variances and propose direct remedial actions."
    },
    {
      label: "Smart-Grid Recovery Plan",
      prompt: "Draft an urgent recovery schedule roadmap for the Potchefstroom Smart-Grid Integration Initiative which is currently 'At Risk' with CPI of 0.82."
    },
    {
      label: "DevOps Staffing Solution",
      prompt: "Francois du Toit is overloaded at 110% allocation. Suggest how we can redistribute tasks to Lerato Dlamini or others to balance the DevOps workload."
    },
    {
      label: "Mooirivier Stakeholder Email",
      prompt: "Draft an elegant progress report email for Mooirivier Water telemetry stakeholders, detailing our current SPI index of 0.65 and explaining the delay mitigations."
    }
  ];

  // Auto-fill initial prompt if navigated to via "Draft Recovery" or "Brief Project"
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const promptText = textToSend || input;
    if (!promptText.trim()) return;

    const userMsg: Message = { role: "user", content: promptText };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      // Package context to send to Gemini API
      const projectContext = {
        totalProjectsCount: projects.length,
        averageCostPerformanceIndex: projects.reduce((sum, p) => sum + p.cpi, 0) / (projects.length || 1),
        averageSchedulePerformanceIndex: projects.reduce((sum, p) => sum + p.spi, 0) / (projects.length || 1),
        projectsList: projects.map((p) => ({
          name: p.name,
          manager: p.manager,
          status: p.status,
          budget: p.budget,
          spent: p.actualSpent,
          cpi: p.cpi,
          spi: p.spi,
          progress: p.progress,
        })),
        resourcesList: resources.map((r) => ({
          name: r.name,
          role: r.role,
          allocation: r.allocation,
        })),
      };

      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptText,
          projectContext,
          history: messages.slice(1), // omit the initial welcome greeting from AI history to avoid bloating
        }),
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
      } else {
        throw new Error(data.error || "Failed to get PMO strategic consultation.");
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `*Lead Consultant Alert: Connection interrupted.* \n\nWe encountered an error analyzing the parameters. Here is a baseline recommendation based on your inquiry:\n\n- **Cost Review**: Recommend auditing immediate invoices for budget categories exceeding R100k.\n- **Schedule Recovery**: Reallocate 0.5 FTE frontend/testing tasks to under-utilized resources immediately to regain SPI traction.\n\n*Error details: ${err.message}*`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="consultation-interface">
      {/* 1. Left Sidebar: Suggested Scenarios */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider flex items-center">
            <Sparkles className="w-4.5 h-4.5 mr-1.5 text-[#A67C00]" />
            Strategic Scenarios
          </h4>
          <p className="text-gray-500 text-xs">Select a scenario to analyze our Potchefstroom active portfolio:</p>
          <div className="space-y-2">
            {suggestedPrompts.map((scenario) => (
              <button
                key={scenario.label}
                onClick={() => handleSend(scenario.prompt)}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-[#1B2A4A]/5 hover:border-[#A67C00]/30 text-xs text-[#1B2A4A] transition-all font-medium disabled:opacity-50 cursor-pointer"
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legal credentials info block */}
        <div className="bg-[#1B2A4A]/5 p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
          <h5 className="font-bold text-[#1B2A4A]">Consulting Desk Info</h5>
          <p className="text-gray-600 leading-relaxed text-[11px]">
            Consultations are powered by Gemini with ground context from active CPI/SPI metrics at Potchefstroom.
          </p>
          <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-400 space-y-1">
            <p>Innovation Consult (Pty) Ltd</p>
            <p>Reg No. 2007/021390/07</p>
            <p>South Africa</p>
          </div>
        </div>
      </div>

      {/* 2. Right Workspace: Chat Feed */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-[600px] lg:col-span-3">
        {/* Workspace Header */}
        <div className="bg-[#1B2A4A] p-4 text-white rounded-t-xl flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#A67C00] flex items-center justify-center text-white">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Lead PMO Senior Consultant</h4>
              <p className="text-gray-300 text-[11px] italic">Strategic portfolio advisory desk</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-[#A67C00] font-mono bg-white/5 px-2 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>Interactive Contextual Mode</span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((m, idx) => {
            const isAss = m.role === "assistant";
            return (
              <div
                key={idx}
                className={`flex ${isAss ? "justify-start" : "justify-end"} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 shadow-sm text-xs leading-relaxed space-y-2 ${
                    isAss
                      ? "bg-white border border-gray-100 text-[#1B2A4A]"
                      : "bg-[#1B2A4A] text-white"
                  }`}
                >
                  {/* Speaker Label */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase tracking-wider text-[9px] opacity-75">
                      {isAss ? "Lead PMO Consultant (Advisor)" : "Corporate PMO Director"}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="whitespace-pre-line font-medium prose prose-xs">
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 text-[#1B2A4A] rounded-xl p-4 shadow-sm flex items-center space-x-2 text-xs">
                <Loader className="w-4 h-4 text-[#A67C00] animate-spin" />
                <span className="italic text-gray-500 font-medium">Formulating strategic advisor response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-gray-100 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Type corporate strategy query, e.g. Analyze budget overruns..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            disabled={isLoading}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-[#1B2A4A] focus:outline-none focus:ring-1 focus:ring-[#A67C00]"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-[#A67C00] hover:bg-[#856300] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Strategic branding footer quote */}
        <div className="text-center p-2 bg-gray-50 border-t border-gray-100 rounded-b-xl">
          <p className="text-[10px] text-gray-400">
            Innovation Consult (Pty) Ltd — <span className="font-medium italic text-[#1B2A4A]">"knowledge to action."</span>
          </p>
        </div>
      </div>
    </div>
  );
}
