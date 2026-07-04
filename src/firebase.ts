import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Google Auth Provider with Workspace scopes
export const provider = new GoogleAuthProvider();

// Workspace Scopes (matching authorized scopes exactly)
provider.addScope("https://mail.google.com/");
provider.addScope("https://www.googleapis.com/auth/gmail.compose");
provider.addScope("https://www.googleapis.com/auth/gmail.modify");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.addScope("https://www.googleapis.com/auth/gmail.send");
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/drive.file");
provider.addScope("https://www.googleapis.com/auth/drive.readonly");
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://www.googleapis.com/auth/calendar.events");
provider.addScope("https://www.googleapis.com/auth/presentations");
provider.addScope("https://www.googleapis.com/auth/tasks");
provider.addScope("https://www.googleapis.com/auth/forms.body");
provider.addScope("https://www.googleapis.com/auth/forms.responses.readonly");
provider.addScope("https://www.googleapis.com/auth/meetings.space.created");
provider.addScope("https://www.googleapis.com/auth/contacts");
provider.addScope("https://www.googleapis.com/auth/contacts.readonly");

// In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Check if token already exists in session or local storage
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // In web, sometimes we need to restore token or re-auth to get a fresh token.
      // We will look for a token stored in sessionStorage to recover across reloads (in-memory standard)
      const storedToken = sessionStorage.getItem("ic_pmo_workspace_token");
      if (storedToken) {
        cachedAccessToken = storedToken;
        if (onAuthSuccess) onAuthSuccess(user, storedToken);
      } else {
        // Fallback: request a login popup or just mark as success but token-less until signIn is triggered
        if (onAuthSuccess && cachedAccessToken) {
          onAuthSuccess(user, cachedAccessToken);
        } else {
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem("ic_pmo_workspace_token");
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google Workspace access token from auth result.");
    }
    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem("ic_pmo_workspace_token", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Firebase/Google Sign-In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  sessionStorage.removeItem("ic_pmo_workspace_token");
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || sessionStorage.getItem("ic_pmo_workspace_token");
};

// ================== FIRESTORE SYNCHRONIZATION HELPERS ==================

// Sync helper: Projects
export const saveProjectToFirestore = async (userId: string, project: any) => {
  try {
    const docRef = doc(db, "projects", project.id);
    await setDoc(docRef, { ...project, userId });
  } catch (err) {
    console.error("Error saving project:", err);
  }
};

export const deleteProjectFromFirestore = async (projectId: string) => {
  try {
    await deleteDoc(doc(db, "projects", projectId));
  } catch (err) {
    console.error("Error deleting project:", err);
  }
};

// Sync helper: Sprints
export const saveSprintToFirestore = async (userId: string, sprint: any) => {
  try {
    const docRef = doc(db, "sprints", sprint.id);
    await setDoc(docRef, { ...sprint, userId });
  } catch (err) {
    console.error("Error saving sprint:", err);
  }
};

export const deleteSprintFromFirestore = async (sprintId: string) => {
  try {
    await deleteDoc(doc(db, "sprints", sprintId));
  } catch (err) {
    console.error("Error deleting sprint:", err);
  }
};

// Sync helper: Tasks
export const saveTaskToFirestore = async (userId: string, task: any) => {
  try {
    const docRef = doc(db, "tasks", task.id);
    await setDoc(docRef, { ...task, userId });
  } catch (err) {
    console.error("Error saving task:", err);
  }
};

export const deleteTaskFromFirestore = async (taskId: string) => {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
  } catch (err) {
    console.error("Error deleting task:", err);
  }
};

// Sync helper: Resources
export const saveResourceToFirestore = async (userId: string, resource: any) => {
  try {
    const docRef = doc(db, "resources", resource.id);
    await setDoc(docRef, { ...resource, userId });
  } catch (err) {
    console.error("Error saving resource:", err);
  }
};

// Sync helper: Audit Logs
export const saveAuditLogToFirestore = async (userId: string, auditLog: any) => {
  try {
    const docRef = doc(db, "auditLogs", auditLog.id);
    await setDoc(docRef, { ...auditLog, userId });
  } catch (err) {
    console.error("Error saving audit log:", err);
  }
};

