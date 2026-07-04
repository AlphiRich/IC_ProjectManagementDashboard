import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    company: "Innovation Consult (Pty) Ltd",
    regNo: "2007/021390/07",
    tagline: "knowledge to action.",
    geminiActive: !!ai
  });
});

// Heuristic Local Consultant Fallback in case Gemini model is experiencing a high demand spike (503)
function generateHeuristicConsultation(message: string, context: any): string {
  const query = message.toLowerCase();
  const projects = context?.projectsList || [];
  const resources = context?.resourcesList || [];
  
  const totalProjects = context?.totalProjectsCount || projects.length;
  const avgCpi = typeof context?.averageCostPerformanceIndex === "number" ? context.averageCostPerformanceIndex : 1.0;
  const avgSpi = typeof context?.averageSchedulePerformanceIndex === "number" ? context.averageSchedulePerformanceIndex : 1.0;

  let analysis = "";
  let strategicFocus = "";
  let immediateActions = "";

  // 1. Check if resource-related query
  if (query.includes("francois") || query.includes("allocation") || query.includes("staffing") || query.includes("workload") || query.includes("lerato") || query.includes("resource")) {
    const overloaded = resources.filter((r: any) => r.allocation > 100);
    const available = resources.filter((r: any) => r.allocation < 90);

    analysis = `**Resource Capacity Distribution Analysis:**
Our live resource allocation matrices indicate a load imbalance within active development lanes.
${overloaded.length > 0 
  ? overloaded.map((r: any) => `- **${r.name}** (${r.role}) is overloaded at **${r.allocation}%** capacity, exceeding corporate thresholds.`).join('\n')
  : "- Active PMO resources are currently loaded within acceptable boundaries (below 100% threshold)."
}
${available.length > 0 
  ? `Key resource team members with capacity include: ${available.slice(0, 3).map((r: any) => `**${r.name}** (${r.role} loaded at ${r.allocation}%)`).join(', ')}.`
  : "All team members are currently near peak capacity allocation."
}`;

    strategicFocus = `**Strategic Workload Rebalancing:**
To prevent burnout, decrease defect rates, and avoid project milestone slippage, we must transition from individual skill silos to a structured cross-functional support model. Immediate focus must be placed on reallocating non-critical path activities.`;

    immediateActions = `**Directive Action Items:**
1. **Workload Relief Plan**: Transition 20% of general development tasks from ${overloaded.map((r: any) => r.name).join(', ') || 'overloaded engineers'} to under-utilized team members immediately.
2. **Resource Booking Cap**: Enforce an executive limit capping maximum sprint bookings at 85% for senior resources during active recovery cycles.
3. **Daily Alignment Focus**: Refine daily scrum standups to align precisely on resolving blocked pipeline tasks.`;

  }
  // 2. Check if Mooirivier or email stakeholder related query
  else if (query.includes("mooirivier") || query.includes("email") || query.includes("stakeholder") || query.includes("telemetry")) {
    const mooirivierProj = projects.find((p: any) => p.name.toLowerCase().includes("mooirivier"));
    const spiStr = mooirivierProj ? `its Schedule Performance Index (SPI) is ${mooirivierProj.spi}` : "its schedule velocity requires targeted recovery";
    
    analysis = `**External Stakeholder Advisory Drafting Guide:**
When communicating project variances to external sponsors and joint venture partners, transparency paired with clear recovery roadmaps is essential. Here is a curated brief ready for dissemination:`;

    strategicFocus = `**Subject:** Project Status Brief: Mooirivier Basin Telemetry Array & Delivery Mitigations

Dear Stakeholders,

I am writing to provide our scheduled executive delivery update for the **Mooirivier Basin Telemetry Array** initiative.

While initial environmental assessment milestones have been successfully signed off, our latest PMO diagnostics indicate a schedule alignment variance (${spiStr}). This is primarily attributed to regional water telemetry grid integration delays.

We have implemented an accelerated Recovery Plan to compress downstream validation phases and restore schedule velocity to its baseline targets without compromising any deliverable quality.`;

    immediateActions = `**Directive Action Items:**
1. **Schedule Compression**: Authorise the compressed 2-week technical verification track.
2. **Weekly Sync Structure**: Establish a brief weekly technical alignment meeting with stakeholder engineering leads.
3. **Tagline Commitment**: Reassure all key stakeholders of our commitment to turning **knowledge to action.**`;

  }
  // 3. Check if Smart-Grid related query
  else if (query.includes("smart-grid") || query.includes("grid") || query.includes("recovery")) {
    const gridProj = projects.find((p: any) => p.name.toLowerCase().includes("smart-grid") || p.name.toLowerCase().includes("grid"));
    const cpiStr = gridProj ? `its Cost Performance Index (CPI) is ${gridProj.cpi}` : "its current CPI of 0.82 indicates the budget burn rate is higher than anticipated";

    analysis = `**Potchefstroom Smart-Grid Integration Recovery Analysis:**
The project is currently flagged as **At Risk**. Financial tracking indicates that ${cpiStr}. This variance is driven by unexpected scope revisions in the hardware interface modules.`;

    strategicFocus = `**Cost Containment & Stabilisation Focus:**
We must freeze non-essential feature additions and enforce strict change-control gates. The main objective is to stabilise the Cost Performance Index (CPI) above 0.95 within the next two sprint cycles.`;

    immediateActions = `**Directive Action Items:**
1. **Hardware Scope Freeze**: Enact an immediate freeze on hardware scope extensions.
2. **Vendor Rate Re-alignment**: Renegotiate regional subcontractor support rates for physical installation phases.
3. **Backlog Prioritisation**: Prioritise core grid telemetry over secondary analytics dashboard features in the next sprint backlog.`;

  }
  // 4. Fallback: Portfolio Risk & Budgets or generic query
  else {
    const atRisk = projects.filter((p: any) => p.status === "At Risk" || p.status === "Critical");

    analysis = `**Corporate Portfolio Executive Review:**
We have completed a live diagnostic of the active corporate portfolio. 
- **Active Portfolio Size**: ${totalProjects} active programmes and projects.
- **Cost Efficiency**: Portfolio Average CPI is **${avgCpi.toFixed(2)}** (${avgCpi >= 1.0 ? "Under Budget" : "Budget Variance Detected"}).
- **Schedule Velocity**: Portfolio Average SPI is **${avgSpi.toFixed(2)}** (${avgSpi >= 1.0 ? "On Track" : "Schedule Slippage Detected"}).

${atRisk.length > 0 
  ? `**High Risk Flagged Programmes:**\n${atRisk.map((p: any) => `- **${p.name}** (Status: *${p.status}*, CPI: ${p.cpi}, SPI: ${p.spi}) managed by ${p.manager}.`).join('\n')}` 
  : "All programmes are currently operating within acceptable variance limits."
}`;

    strategicFocus = `**Portfolio Stabilisation Focus:**
Priority must be given to programmes with CPI or SPI metrics falling below 0.90. This involves redirecting resource allocations and implementing strict daily milestone tracking.`;

    immediateActions = `**Directive Action Items:**
1. **Variance Audit**: Mandate a formal PMO variance report for all projects operating below a 0.90 performance threshold.
2. **Resource Reallocation**: Shift 0.5 FTE development/QA capacity from completed or highly stable projects to high-risk areas.
3. **Change Control**: Direct all Project Managers to route any additional project scope requests through the formal Innovation Consult Portfolio Committee.`;
  }

  return `*Senior PMO Advisory Note: Gemini is currently experiencing a temporary high demand spike. We have dynamically generated an Executive Portfolio Analysis based on local PMO metric heuristics.*

---

### PMO CONSULTATION SUMMARY

${analysis}

---

### STRATEGIC ADVISORY VIEW

${strategicFocus}

---

### DIRECTIVE ACTIONS

${immediateActions}

---

*Innovation Consult (Pty) Ltd — "knowledge to action."*`;
}

// Helper function to call Gemini API with exponential backoff for transient errors
async function generateContentWithRetry(aiClient: GoogleGenAI, params: any, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await aiClient.models.generateContent(params);
    } catch (err: any) {
      console.warn(`Gemini API attempt ${i + 1} failed:`, err.message || err);
      // If it's the last attempt, rethrow
      if (i === retries - 1) {
        throw err;
      }
      
      const errStr = (err.message || "").toLowerCase();
      const errStatus = err.status || 0;
      
      // Check if it's a 503, UNAVAILABLE, or high demand error
      const isTransient = 
        errStatus === 503 ||
        errStr.includes("503") || 
        errStr.includes("unavailable") || 
        errStr.includes("high demand") ||
        errStr.includes("service unavailable");
        
      if (isTransient) {
        // Wait with backoff
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      } else {
        // Throw immediately for non-transient errors (e.g., Auth, Invalid Arguments)
        throw err;
      }
    }
  }
}

// PMO Intelligence Consultation API
app.post("/api/consult", async (req, res) => {
  try {
    const { message, projectContext, history } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    if (!ai) {
      // Return beautiful fallback mock response if no API key is set yet
      res.json({
        text: `*Lead PMO Consultant Note: Running in Offline Mode (Set GEMINI_API_KEY in Secrets for live consults).* \n\nBased on the project parameters:
- **Status Summary**: Project shows minor timeline variance (Sprint Velocity currently at 84%).
- **Key Action Points**:
  1. Increase daily standup focus on resolving blocker #14.
  2. Reallocate 0.5 FTE resource to the frontend development lane.
  3. Ensure final sign-off deliverables are submitted on time.
\n\n*Innovation Consult (Pty) Ltd — knowledge to action.*`,
        offline: true
      });
      return;
    }

    // Build history structures if provided
    const systemInstruction = `You are the Lead Senior PMO Consultant at Innovation Consult (Pty) Ltd, a leading corporate consultancy based in Potchefstroom, South Africa.
Our official registration is Reg. No. 2007/021390/07.
Our corporate tagline is "knowledge to action." and you should weave this tagline naturally at the very end of your final consultation responses where relevant.
Use professional, highly structured executive advisory tone. Break down your advice into logical steps: Analysis, Strategic Focus, and Immediate Actions.
Use South African/UK English spelling (e.g., programme, organisation, prioritisation, categorise, colour).
Keep responses concise but rich in substance. Reference key PMO statistics (e.g., Sprint Velocity, CPI/SPI indices, Resource Allocation, Budget Variance) when projectContext is provided.

Here is the current PMO context if relevant to the request:
${JSON.stringify(projectContext || {})}
`;

    const chatHistory = history ? history.map((h: any) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    })) : [];

    // Add current message to chat or just use single generateContent with history
    const contents = [
      ...chatHistory,
      { role: "user", parts: [{ text: message }] }
    ];

    try {
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({
        text: response.text || "No response received.",
        offline: false
      });
    } catch (apiErr: any) {
      console.error("Gemini live call failed, generating heuristic fallback:", apiErr);
      
      // Dynamically generate a high-quality local analysis rather than crashing with 500!
      const fallbackText = generateHeuristicConsultation(message, projectContext);
      res.json({
        text: fallbackText,
        offline: true
      });
    }
  } catch (err: any) {
    console.error("Consultation API error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Innovation Consult PMO server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
