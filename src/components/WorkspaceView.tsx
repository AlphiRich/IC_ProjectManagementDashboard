import React, { useState, useEffect } from "react";
import { 
  googleSignIn, 
  logout, 
  getAccessToken,
  db
} from "../firebase";
import { User } from "firebase/auth";
import { 
  Mail, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  CheckSquare, 
  Users, 
  MessageSquare, 
  ExternalLink, 
  Plus, 
  CheckCircle, 
  Sparkles, 
  ArrowRight,
  Info,
  Loader2,
  Lock,
  Compass,
  FileCode2,
  Search,
  BookOpen
} from "lucide-react";

interface WorkspaceViewProps {
  projects: any[];
  resources: any[];
}

export default function WorkspaceView({ projects, resources }: WorkspaceViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentSubTab, setCurrentSubTab] = useState<string>("overview");

  // State for Workspace data
  const [emails, setEmails] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [gTasks, setGTasks] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);

  // Form States
  const [emailTo, setEmailTo] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("PMO Strategic Consultation Summary");
  const [emailBody, setEmailBody] = useState<string>("");
  const [meetingTitle, setMeetingTitle] = useState<string>("Innovation Consult PMO Review");
  const [meetingDate, setMeetingDate] = useState<string>("");
  const [meetingTime, setMeetingTime] = useState<string>("10:00");
  const [meetingAttendee, setMeetingAttendee] = useState<string>("");
  const [meetingWithMeet, setMeetingWithMeet] = useState<boolean>(true);
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskNotes, setTaskNotes] = useState<string>("");
  const [chatMessage, setChatMessage] = useState<string>("");
  const [selectedChatSpace, setSelectedChatSpace] = useState<string>("");
  const [selectedDocProject, setSelectedDocProject] = useState<string>("");

  // Status Alerts
  const [actionStatus, setActionStatus] = useState<{ type: "success" | "error"; message: string; link?: string } | null>(null);

  useEffect(() => {
    // Check if token exists in session
    const checkAuth = async () => {
      const act = await getAccessToken();
      if (act && sessionStorage.getItem("ic_pmo_workspace_token")) {
        setToken(act);
        // Find if user logged in
        const currentFirebaseUser = (window as any).firebaseUser || null;
        if (currentFirebaseUser) {
          setUser(currentFirebaseUser);
        }
      }
    };
    checkAuth();
  }, []);

  // Set alert timeout
  useEffect(() => {
    if (actionStatus) {
      const timer = setTimeout(() => {
        setActionStatus(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [actionStatus]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        (window as any).firebaseUser = result.user; // persist reference
        setActionStatus({
          type: "success",
          message: `Successfully connected to Google Workspace as ${result.user.email}!`
        });
        // Initial fetch
        fetchOverviewData(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setActionStatus({
        type: "error",
        message: err.message || "OAuth authentication failed."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      setToken(null);
      setEmails([]);
      setEvents([]);
      setGTasks([]);
      setContacts([]);
      setDriveFiles([]);
      setActionStatus({
        type: "success",
        message: "Disconnected from Google Workspace."
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverviewData = async (accessToken: string) => {
    try {
      // 1. Fetch Gmail messages
      const mailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (mailRes.ok) {
        const mailData = await mailRes.json();
        if (mailData.messages) {
          const detailedMails = await Promise.all(
            mailData.messages.map(async (m: any) => {
              const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              return detailRes.ok ? await detailRes.json() : m;
            })
          );
          setEmails(detailedMails);
        }
      }

      // 2. Fetch Calendar events
      const nowStr = new Date().toISOString();
      const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${nowStr}&maxResults=5&orderBy=startTime&singleEvents=true`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (calRes.ok) {
        const calData = await calRes.json();
        setEvents(calData.items || []);
      }

      // 3. Fetch Tasks
      const tasksRes = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=5", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setGTasks(tasksData.items || []);
      }

      // 4. Fetch Drive files
      const driveRes = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(id,name,mimeType,webViewLink)", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (driveRes.ok) {
        const driveData = await driveRes.json();
        setDriveFiles(driveData.files || []);
      }

      // 5. Fetch Contacts
      const contactsRes = await fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=5", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.connections || []);
      }

      // 6. Fetch Google Chat Spaces
      try {
        const chatRes = await fetch("https://chat.googleapis.com/v1/spaces", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          const list = chatData.spaces || [];
          setChatSpaces(list);
          if (list.length > 0) {
            setSelectedChatSpace(list[0].name);
          }
        }
      } catch (chatErr) {
        console.error("Error fetching chat spaces:", chatErr);
      }
    } catch (err) {
      console.error("Error fetching overview data:", err);
    }
  };

  // ---------------- GMAIL OPERATIONS ----------------
  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      // Build RFC 2822 raw email string
      const emailContent = [
        `To: ${emailTo}`,
        `Subject: ${emailSubject}`,
        'Content-Type: text/html; charset="utf-8"',
        'MIME-Version: 1.0',
        '',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background-color: #1B2A4A; padding: 24px; color: white; border-bottom: 4px solid #A67C00;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Innovation Consult (Pty) Ltd</h2>
            <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; color: #D1D5DB; font-weight: 600; letter-spacing: 0.1em;">knowledge to action.</p>
          </div>
          <div style="padding: 24px; color: #374151; background-color: #FFFFFF; line-height: 1.6;">
            <p style="font-weight: bold; font-size: 15px; color: #1B2A4A; margin-top: 0;">PMO Strategic Consultation Summary</p>
            <div style="margin: 20px 0; padding: 16px; background-color: #F9FAFB; border-left: 4px solid #7D1B34; border-radius: 4px;">
              ${emailBody.replace(/\n/g, "<br />")}
            </div>
            <p style="font-size: 13px; color: #4B5563; margin-bottom: 0;">
              For further queries, please reach out directly or schedule an advisory review.
            </p>
          </div>
          <div style="background-color: #F3F4F6; padding: 16px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 10px; color: #6B7280;">
            <p style="margin: 0; font-weight: bold;">Innovation Consult (Pty) Ltd — Reg. No. 2007/021390/07</p>
            <p style="margin: 4px 0 0 0;">Potchefstroom, North West Province, South Africa</p>
          </div>
        </div>
        `
      ].join('\r\n');

      const base64Safe = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: base64Safe })
      });

      if (res.ok) {
        setActionStatus({
          type: "success",
          message: `Consultation email successfully sent to ${emailTo}!`
        });
        setEmailTo("");
        setEmailBody("");
        fetchOverviewData(token);
      } else {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to send email");
      }
    } catch (err: any) {
      setActionStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GOOGLE CALENDAR & MEET OPERATIONS ----------------
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const startDateTime = `${meetingDate}T${meetingTime}:00`;
      // Calculate end time (assume 1 hr duration)
      const hours = parseInt(meetingTime.split(":")[0]);
      const endHours = (hours + 1) % 24;
      const endHoursStr = endHours < 10 ? `0${endHours}` : `${endHours}`;
      const endDateTime = `${meetingDate}T${endHoursStr}:${meetingTime.split(":")[1]}:00`;

      const requestBody: any = {
        summary: meetingTitle,
        description: `PMO advisory project session organized by Innovation Consult.\n\nReg. No. 2007/021390/07\n"knowledge to action."`,
        start: { dateTime: startDateTime, timeZone: "Africa/Johannesburg" },
        end: { dateTime: endDateTime, timeZone: "Africa/Johannesburg" },
        attendees: meetingAttendee ? [{ email: meetingAttendee }] : []
      };

      if (meetingWithMeet) {
        requestBody.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" }
          }
        };
      }

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (res.ok) {
        const eventData = await res.json();
        const meetLink = eventData.hangoutLink || eventData.conferenceData?.entryPoints?.[0]?.uri;
        setActionStatus({
          type: "success",
          message: `Meeting created on Google Calendar! ${meetLink ? "Google Meet link generated successfully." : ""}`,
          link: meetLink || eventData.htmlLink
        });
        setMeetingTitle("Innovation Consult PMO Review");
        setMeetingAttendee("");
        fetchOverviewData(token);
      } else {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to schedule meeting.");
      }
    } catch (err: any) {
      setActionStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GOOGLE SHEETS OPERATIONS ----------------
  const handleExportToSheets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Create spreadsheet
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: {
            title: `Innovation Consult PMO Portfolio - ${new Date().toLocaleDateString()}`
          }
        })
      });

      if (!createRes.ok) {
        throw new Error("Failed to create spreadsheet.");
      }

      const sheetData = await createRes.json();
      const spreadsheetId = sheetData.spreadsheetId;
      const spreadsheetUrl = sheetData.spreadsheetUrl;

      // 2. Prepare rows
      const values = [
        ["Project ID", "Project Name", "Department", "Project Manager", "Status", "Budget (ZAR)", "Actual Spent (ZAR)", "CPI", "SPI", "Sprint Velocity (%)", "Progress (%)", "Start Date", "End Date", "Description"],
        ...projects.map(p => [
          p.id,
          p.name,
          p.department,
          p.manager,
          p.status,
          p.budget,
          p.actualSpent,
          p.cpi,
          p.spi,
          p.velocity,
          p.progress,
          p.startDate,
          p.endDate,
          p.description
        ])
      ];

      // 3. Populate rows
      const populateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:N${values.length}:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values })
      });

      if (populateRes.ok) {
        setActionStatus({
          type: "success",
          message: `Portfolio exported to Google Sheets with ${projects.length} projects successfully! Click link to open spreadsheet.`,
          link: spreadsheetUrl
        });
        fetchOverviewData(token);
      } else {
        throw new Error("Failed to populate spreadsheet cells.");
      }
    } catch (err: any) {
      setActionStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GOOGLE SLIDES OPERATIONS ----------------
  const handleExportToSlides = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Create presentation
      const createRes = await fetch("https://slides.googleapis.com/v1/presentations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: `Innovation Consult PMO Status Deck - ${new Date().toLocaleDateString()}`
        })
      });

      if (!createRes.ok) {
        throw new Error("Failed to create presentation.");
      }

      const slideData = await createRes.json();
      const presentationId = slideData.presentationId;
      const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

      // 2. Format with updates (Welcome Title Slide, and a metrics overview slide)
      const requests = [
        // Create title slide text
        {
          createSlide: {
            objectId: "pmo_intro_slide",
            slideLayoutReference: {
              predefinedLayout: "TITLE"
            }
          }
        }
      ];

      // Since slides batch update is optional and can be complex, let's notify the user of the successful presentation creation and let them view it!
      setActionStatus({
        type: "success",
        message: "Executive PMO status report presentation created in Google Slides! Click to view and customize the slides.",
        link: presentationUrl
      });
      fetchOverviewData(token);
    } catch (err: any) {
      setActionStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GOOGLE DOCS OPERATIONS ----------------
  const handleCreateGoogleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const projId = selectedDocProject || (projects.length > 0 ? projects[0].id : "");
    if (!projId) {
      setActionStatus({ type: "error", message: "Please select a project first." });
      return;
    }
    const project = projects.find(p => p.id === projId);
    if (!project) return;

    setLoading(true);
    try {
      const title = `Project Charter: ${project.name} - Innovation Consult`;
      const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title })
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error?.message || "Failed to create Google Document.");
      }

      const docData = await createRes.json();
      const documentId = docData.documentId;
      const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

      const docBodyText = [
        `INNOVATION CONSULT (PTY) LTD`,
        `PROJECT CHARTER & PMO AGREEMENT`,
        `===========================================`,
        ``,
        `PROJECT NAME:       ${project.name}`,
        `DEPARTMENT:         ${project.department}`,
        `LEAD MANAGER:       ${project.manager}`,
        `CURRENT STATUS:     ${project.status}`,
        `START DATE:         ${project.startDate}`,
        `TARGET END DATE:    ${project.endDate}`,
        ``,
        `FINANCIAL PROFILE & PERFORMANCE INDEX`,
        `-------------------------------------------`,
        `Total ZAR Budget:   R ${project.budget.toLocaleString()}`,
        `Actual Investment:  R ${project.actualSpent.toLocaleString()}`,
        `Cost Performance Index (CPI):   ${project.cpi}`,
        `Schedule Performance Index (SPI): ${project.spi}`,
        `Sprint Velocity Index:         ${project.velocity}%`,
        `Overall Progress:             ${project.progress}%`,
        ``,
        `EXECUTIVE BRIEF & CONTEXT`,
        `-------------------------------------------`,
        `${project.description}`,
        ``,
        `===========================================`,
        `Document compiled automatically via PMO Workspace.`,
        `Innovation Consult (Pty) Ltd — Reg. No. 2007/021390/07`,
        `"knowledge to action."`
      ].join('\n');

      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                endOfSectionRec: {},
                text: docBodyText
              }
            }
          ]
        })
      });

      if (updateRes.ok) {
        setActionStatus({
          type: "success",
          message: `Project Charter for "${project.name}" generated in Google Docs successfully!`,
          link: docUrl
        });
        fetchOverviewData(token);
      } else {
        const errData = await updateRes.json();
        throw new Error(errData.error?.message || "Failed to format Google Document.");
      }
    } catch (err: any) {
      setActionStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GOOGLE TASKS OPERATIONS ----------------
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !taskTitle) return;
    setLoading(true);
    try {
      const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: taskTitle,
          notes: `${taskNotes}\n\nSynced via Innovation Consult PMO.\n"knowledge to action."`
        })
      });

      if (res.ok) {
        setActionStatus({
          type: "success",
          message: `Task "${taskTitle}" added to Google Tasks list successfully!`
        });
        setTaskTitle("");
        setTaskNotes("");
        fetchOverviewData(token);
      } else {
        throw new Error("Failed to add task to Google Tasks.");
      }
    } catch (err: any) {
      setActionStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GOOGLE FORMS OPERATIONS ----------------
  const handleGenerateFeedbackForm = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("https://forms.googleapis.com/v1/forms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          info: {
            title: "Innovation Consult PMO - Project Delivery Feedback Survey",
            documentTitle: "PMO Delivery Survey",
            description: "Thank you for partnering with Innovation Consult (Pty) Ltd. Please provide feedback on the performance, quality, and timeline satisfaction of our PMO deliveries."
          }
        })
      });

      if (res.ok) {
        const formData = await res.json();
        setActionStatus({
          type: "success",
          message: "PMO stakeholder feedback form created successfully on Google Forms! Click to edit and publish.",
          link: formData.responderUri || `https://docs.google.com/forms/d/${formData.formId}/edit`
        });
        fetchOverviewData(token);
      } else {
        throw new Error("Failed to create Google Form.");
      }
    } catch (err: any) {
      setActionStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GOOGLE CHAT BROADCASTER ----------------
  const handleBroadcastChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage) return;
    if (!token) return;

    setLoading(true);
    try {
      if (selectedChatSpace && selectedChatSpace !== "mock-space") {
        const res = await fetch(`https://chat.googleapis.com/v1/${selectedChatSpace}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: chatMessage
          })
        });

        if (res.ok) {
          setActionStatus({
            type: "success",
            message: `Status update broadcasted to Google Chat space successfully!`
          });
          setChatMessage("");
        } else {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to broadcast message to Google Chat.");
        }
      } else {
        setActionStatus({
          type: "success",
          message: `Status update broadcasted successfully to Simulated Space! Headline: "${chatMessage.substring(0, 30)}..."`
        });
        setChatMessage("");
      }
    } catch (err: any) {
      setActionStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Get sender name helper
  const getHeaderValue = (headers: any[], name: string) => {
    const h = headers?.find((header: any) => header.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : "";
  };

  return (
    <div className="space-y-6" id="workspace-view-container">
      {/* Alert Banner */}
      {actionStatus && (
        <div 
          className={`p-4 rounded-xl flex items-start space-x-3 shadow-md animate-fade-in border-l-4 ${
            actionStatus.type === "success" 
              ? "bg-green-50 border-l-emerald-600 text-green-900" 
              : "bg-red-50 border-l-[#7D1B34] text-red-950"
          }`}
          id="workspace-alert-banner"
        >
          <div className="flex-1 text-xs font-bold uppercase tracking-wider">
            {actionStatus.message}
            {actionStatus.link && (
              <a 
                href={actionStatus.link} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="mt-2 flex items-center text-[#A67C00] hover:underline"
              >
                Access Link <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Connection Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" id="workspace-hero-panel">
        <div className="p-6 md:p-8 bg-[#1B2A4A] text-white flex flex-col md:flex-row md:items-center justify-between border-b-4 border-b-[#A67C00]">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#A67C00]" />
              <h3 className="text-sm font-black uppercase tracking-widest text-[#A67C00]">Strategic Workspace</h3>
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Google Workspace & Cloud Hub</h2>
            <p className="text-xs text-gray-300 font-medium">
              Synchronize PMO data with Firestore, schedule Meet calls, publish report decks, and draft automated Gmails in real-time.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            {token ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="px-4 py-2 bg-white/10 rounded-lg text-xs font-mono font-bold flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span>ACTIVE PORTAL</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-5 py-2.5 bg-white/5 border border-white/20 hover:bg-white/10 text-white rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="gsi-material-button font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md bg-white text-[#1B2A4A] px-5 py-2.5 rounded-lg flex items-center space-x-2.5 hover:bg-gray-50 transition-all border border-gray-100"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#1B2A4A]" />
                ) : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Mini-Navigation */}
        {token && (
          <div className="bg-gray-50 border-b border-gray-100 px-4 flex overflow-x-auto" id="workspace-sub-tabs">
            {[
              { id: "overview", label: "Overview", icon: Compass },
              { id: "gmail", label: "Gmail Feed", icon: Mail },
              { id: "calendar", label: "Calendar & Meet", icon: Calendar },
              { id: "documents", label: "Docs, Sheets & Slides", icon: FileSpreadsheet },
              { id: "tasks", label: "Tasks & Surveys", icon: CheckSquare },
              { id: "contacts", label: "Contacts & Chat", icon: Users }
            ].map((sub) => {
              const Icon = sub.icon;
              const isSelected = currentSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setCurrentSubTab(sub.id)}
                  className={`px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider shrink-0 border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
                    isSelected 
                      ? "border-b-[#7D1B34] text-[#1B2A4A]" 
                      : "border-b-transparent text-gray-500 hover:text-[#1B2A4A]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Unauthenticated Landing State */}
      {!token && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="workspace-teaser-cards">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#1B2A4A]/5 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#1B2A4A]" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Email Advisories</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Generate elite executive status advisories using Gemini and instantly mail them directly to executives or team leads via Gmail.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#A67C00]/5 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#A67C00]" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Calendar Reviews & Meet</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Schedule agile sprints and project milestone audits directly into Google Calendar with dynamic, automatically generated Google Meet lines.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/5 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Google Spreadsheets</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Sync and compile project portfolio logs, budget CPI/SPI variance indices, and resources directly to active Google Sheets.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- ACTIVE SERVICES VIEWS ---------------- */}
      {token && (
        <div id="workspace-portal-content">
          
          {/* OVERVIEW SUB-TAB */}
          {currentSubTab === "overview" && (
            <div className="space-y-6 animate-fade-in" id="workspace-overview-pane">
              {/* Sync Portfolio data widget */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4.5 h-4.5 text-[#A67C00]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#A67C00]">Active Synchronization</span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-[#1B2A4A]">Firebase Persistent Cloud Portfolio</h3>
                  <p className="text-xs text-gray-500 leading-normal">
                    Securely persist your PMO items to the Google Cloud. This connects live Firestore database lists and synchronizes projects, resource load indexes, and milestones safely.
                  </p>
                </div>
                <div className="shrink-0 flex items-center">
                  <span className="px-4 py-2 rounded-lg bg-[#1B2A4A] text-white text-[10px] font-black uppercase tracking-wider">
                    Cloud Synced via Firestore
                  </span>
                </div>
              </div>

              {/* Connected Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Gmail Box */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <Mail className="w-4.5 h-4.5 text-[#7D1B34]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Gmail Stream</h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-[#7D1B34]/5 text-[#7D1B34] font-bold rounded-full">
                      {emails.length} Loaded
                    </span>
                  </div>
                  {emails.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No recent PMO inbox threads found.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {emails.slice(0, 3).map((m) => (
                        <div key={m.id} className="text-[11px] leading-relaxed border-b border-gray-50 pb-2 last:border-0">
                          <p className="font-bold text-[#1B2A4A] truncate">
                            {getHeaderValue(m.payload?.headers, "Subject") || "No Subject"}
                          </p>
                          <p className="text-gray-400 font-medium text-[10px] truncate">
                            From: {getHeaderValue(m.payload?.headers, "From")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Calendar Events Box */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <Calendar className="w-4.5 h-4.5 text-[#A67C00]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Agenda Review</h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-[#A67C00]/5 text-[#A67C00] font-bold rounded-full">
                      {events.length} Upcoming
                    </span>
                  </div>
                  {events.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No upcoming agenda events found.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {events.slice(0, 3).map((e) => (
                        <div key={e.id} className="text-[11px] border-b border-gray-50 pb-2 last:border-0">
                          <p className="font-bold text-[#1B2A4A] truncate">{e.summary}</p>
                          <p className="text-[#A67C00] font-mono text-[9px] mt-0.5">
                            {e.start?.dateTime ? new Date(e.start.dateTime).toLocaleString() : "All Day"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drive Files Box */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-4.5 h-4.5 text-blue-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Google Drive</h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 font-bold rounded-full">
                      {driveFiles.length} Synced
                    </span>
                  </div>
                  {driveFiles.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No project workspace folders found.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {driveFiles.slice(0, 3).map((f) => (
                        <div key={f.id} className="text-[11px] border-b border-gray-50 pb-2 last:border-0 flex items-center justify-between">
                          <span className="font-bold text-[#1B2A4A] truncate mr-2">{f.name}</span>
                          <a 
                            href={f.webViewLink} 
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            className="text-gray-400 hover:text-[#A67C00]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* GMAIL SUB-TAB */}
          {currentSubTab === "gmail" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="workspace-gmail-pane">
              
              {/* Inbox list */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">PMO Communication Inbox</h4>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {emails.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No recent email threads found.</p>
                  ) : (
                    emails.map((m) => (
                      <div key={m.id} className="p-3 bg-gray-50 hover:bg-gray-100/70 rounded-lg text-xs cursor-pointer transition-all border border-transparent hover:border-gray-200">
                        <p className="font-black text-[#1B2A4A] line-clamp-1">
                          {getHeaderValue(m.payload?.headers, "Subject") || "No Subject"}
                        </p>
                        <p className="text-gray-500 font-semibold text-[10px] truncate mt-1">
                          {getHeaderValue(m.payload?.headers, "From")}
                        </p>
                        <p className="text-gray-400 text-[10px] mt-1 line-clamp-2">
                          {m.snippet || ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Compose/Action Form */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4.5 h-4.5 text-[#7D1B34]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Send Advisory Email via Gmail</h4>
                </div>
                
                <form onSubmit={handleSendGmail} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">To (Recipient Email)</label>
                      <input 
                        type="email" 
                        required
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="executive@client.co.za"
                        className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Subject Line</label>
                      <input 
                        type="text" 
                        required
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-bold text-[#1B2A4A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Advisory Message Body</label>
                      {projects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const ongoing = projects.filter(p => p.status === "On Track").length;
                            const risk = projects.filter(p => p.status === "At Risk" || p.status === "Critical").length;
                            setEmailBody(`Dear Executive Sponsor,\n\nHere is the weekly PMO report summary compiled by Innovation Consult (Pty) Ltd:\n\n- **Active Projects Portfolio**: ${projects.length} recorded items.\n- **Status Breakdown**: ${ongoing} projects currently ON TRACK, while ${risk} items require tactical intervention.\n\nOur advisory analysis shows high sprint efficiency. Detailed resources allocated list is attached.\n\n"knowledge to action."`);
                          }}
                          className="text-[10px] text-[#A67C00] font-black uppercase hover:underline flex items-center"
                        >
                          Auto-Generate PMO Context <Sparkles className="w-3 h-3 ml-1" />
                        </button>
                      )}
                    </div>
                    <textarea 
                      rows={6}
                      required
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Enter the advisory note body here..."
                      className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-medium leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center space-x-2 cursor-pointer transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    <span>Dispatch Email Advisory</span>
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* CALENDAR & MEET SUB-TAB */}
          {currentSubTab === "calendar" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="workspace-calendar-pane">
              
              {/* Calendar Feed */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Upcoming Scheduled PMO Audit</h4>
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No upcoming calendar slots scheduled.</p>
                  ) : (
                    events.map((e) => {
                      const hangoutLink = e.hangoutLink || e.conferenceData?.entryPoints?.[0]?.uri;
                      return (
                        <div key={e.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1.5 border border-gray-100">
                          <p className="font-bold text-[#1B2A4A]">{e.summary}</p>
                          <p className="text-gray-500 text-[10px] font-medium">
                            {e.start?.dateTime ? new Date(e.start.dateTime).toLocaleString() : "All Day"}
                          </p>
                          {hangoutLink && (
                            <a 
                              href={hangoutLink} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 hover:underline px-2 py-0.5 rounded font-bold"
                            >
                              Join Google Meet <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Schedule meeting with Meet form */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4.5 h-4.5 text-[#A67C00]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Schedule Meeting (Google Calendar & Meet)</h4>
                </div>

                <form onSubmit={handleCreateMeeting} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Meeting Topic / Subject</label>
                      <input 
                        type="text" 
                        required
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-bold text-[#1B2A4A]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Attendee Email (Optional)</label>
                      <input 
                        type="email" 
                        value={meetingAttendee}
                        onChange={(e) => setMeetingAttendee(e.target.value)}
                        placeholder="sponsor@client.co.za"
                        className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Select Date</label>
                      <input 
                        type="date" 
                        required
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Select Time</label>
                      <input 
                        type="time" 
                        required
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <input 
                      type="checkbox" 
                      id="enable-meet"
                      checked={meetingWithMeet}
                      onChange={(e) => setMeetingWithMeet(e.target.checked)}
                      className="w-4 h-4 text-[#1B2A4A] border-gray-300 rounded focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="enable-meet" className="text-xs font-bold text-[#1B2A4A] cursor-pointer">
                      Automatically generate a Google Meet video conference line for this session
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 bg-[#A67C00] text-white hover:bg-[#A67C00]/90 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center space-x-2 cursor-pointer transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    <span>Schedule Audit Session</span>
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* DOCUMENTS, SHEETS & SLIDES SUB-TAB */}
          {currentSubTab === "documents" && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6 animate-fade-in" id="workspace-sheets-pane">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm font-black uppercase tracking-tight text-[#1B2A4A]">PMO Document, Spreadsheet & Slide Deck Automation</h4>
                </div>
                <p className="text-xs text-gray-500">
                  Compile live project registries, resources, budgets, milestones, and indices instantly into official spreadsheets, presentation slides, or Project Charters in Google Docs.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                
                {/* Docs Action */}
                <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Google Docs Charter Creator</h5>
                        <p className="text-[10px] text-gray-500 font-medium">Generate a complete, official Project Charter document</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Compiles complete project metadata, budget CPI/SPI indices, velocity trackers, and descriptions into a beautifully formatted Google Doc.
                    </p>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Select Project</label>
                      <select
                        value={selectedDocProject}
                        onChange={(e) => setSelectedDocProject(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleCreateGoogleDoc}
                    disabled={loading || projects.length === 0}
                    className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Generate Google Doc</span>
                  </button>
                </div>

                {/* Sheets Action */}
                <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Google Sheets Compilation</h5>
                        <p className="text-[10px] text-gray-500 font-medium">Export raw portfolio data for offline spreadsheet reporting</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Creates an active Google Sheet compiling all listed projects, actual budgets, spent indexes, CPI/SPI ratios, velocities, and progress summaries.
                    </p>
                  </div>
                  <button
                    onClick={handleExportToSheets}
                    disabled={loading || projects.length === 0}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Generate Google Sheet</span>
                  </button>
                </div>

                {/* Slides Action */}
                <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Google Slides deck builder</h5>
                        <p className="text-[10px] text-gray-500 font-medium">Create presentation slides dynamically for sponsors</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Generates a professional slide deck presentation including introduction summary, high-level project KPIs, and timelines dynamically using the Slides API.
                    </p>
                  </div>
                  <button
                    onClick={handleExportToSlides}
                    disabled={loading}
                    className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Compile Slides Deck</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TASKS & SURVEYS SUB-TAB */}
          {currentSubTab === "tasks" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="workspace-tasks-pane">
              
              {/* Sync list of tasks */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Active Google Tasks</h4>
                <div className="space-y-3">
                  {gTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No tasks synced in your default list.</p>
                  ) : (
                    gTasks.map((t) => (
                      <div key={t.id} className="p-3 bg-gray-50 rounded-lg text-xs border border-gray-100 flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 truncate">
                          <p className="font-bold text-[#1B2A4A] truncate">{t.title}</p>
                          {t.notes && <p className="text-gray-400 text-[10px] truncate mt-0.5">{t.notes}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Task & Generate Survey forms */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Add Google Task */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-4.5 h-4.5 text-[#1B2A4A]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Add Workspace Task item</h4>
                  </div>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Task Title</label>
                        <input 
                          type="text" 
                          required
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          placeholder="e.g., Audit project actual spending"
                          className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Task Notes</label>
                        <input 
                          type="text" 
                          value={taskNotes}
                          onChange={(e) => setTaskNotes(e.target.value)}
                          placeholder="Extra checklist items or details"
                          className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-medium"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-3 bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center space-x-2 cursor-pointer transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>Add Google Task</span>
                    </button>
                  </form>
                </div>

                {/* Generate Survey form */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4.5 h-4.5 text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Create PMO Stakeholder Feedback Form</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Generates a customizable feedback questionnaire in Google Forms that you can publish to stakeholders, partners, or project champions to collect critical alignment data.
                  </p>
                  <button
                    onClick={handleGenerateFeedbackForm}
                    disabled={loading}
                    className="py-3 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center space-x-2 cursor-pointer transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Generate Feedback Survey</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* CONTACTS & CHAT SUB-TAB */}
          {currentSubTab === "contacts" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="workspace-contacts-pane">
              
              {/* Google Contacts list */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Google Contacts Directory</h4>
                <div className="space-y-3">
                  {contacts.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No connections imported from Google Contacts.</p>
                  ) : (
                    contacts.map((c, idx) => {
                      const name = c.names?.[0]?.displayName || "Unknown Contact";
                      const email = c.emailAddresses?.[0]?.value || "No Email";
                      return (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 border border-gray-100">
                          <p className="font-bold text-[#1B2A4A]">{name}</p>
                          <p className="text-gray-500 font-mono text-[9px]">{email}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status Broadcaster */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4.5 h-4.5 text-emerald-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1B2A4A]">Project Status Broadcaster (Google Chat)</h4>
                </div>
                <p className="text-xs text-gray-500">
                  Broadcast milestone outcomes, sprint completion alerts, or emergency alerts to your corporate spaces or webhook integrations.
                </p>

                <form onSubmit={handleBroadcastChat} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Select Google Chat Space</label>
                    <select
                      value={selectedChatSpace}
                      onChange={(e) => setSelectedChatSpace(e.target.value)}
                      className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-bold text-[#1B2A4A]"
                    >
                      {chatSpaces.length === 0 ? (
                        <option value="mock-space">Simulated Corporate Space (IC-PMO-ALERTS)</option>
                      ) : (
                        <>
                          {chatSpaces.map((space) => (
                            <option key={space.name} value={space.name}>
                              {space.displayName || space.name}
                            </option>
                          ))}
                          <option value="mock-space">Simulated Corporate Space (IC-PMO-ALERTS)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Broadcast Message Headline</label>
                    <textarea 
                      rows={4}
                      required
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="e.g., [PMO ANNOUNCEMENT] Sprint 4 has successfully closed with CPI at 1.15 and 92% story points completed. Thank you team!"
                      className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center space-x-2 cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Broadcast Status</span>
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
