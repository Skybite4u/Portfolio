import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Workspace scope for Forms
provider.addScope('https://www.googleapis.com/auth/forms');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Read cached token from session storage or keep in memory
// To persist the token across page refreshes for a smoother user experience, 
// we can temporarily cache it in sessionStorage which is isolated to the session,
// but let's default to in-memory caching as suggested by guidelines, 
// using sessionStorage as a fallback if the token was recently obtained.
try {
  cachedAccessToken = sessionStorage.getItem('siyam_workspace_token');
} catch {}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try { sessionStorage.removeItem('siyam_workspace_token'); } catch {}
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
      throw new Error('Failed to get access token from Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    try {
      sessionStorage.setItem('siyam_workspace_token', cachedAccessToken);
    } catch {}
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try { sessionStorage.removeItem('siyam_workspace_token'); } catch {}
};

// Forms API calls
export interface FormItem {
  itemId: string;
  title?: string;
  description?: string;
  questionItem?: {
    question: {
      questionId: string;
      required?: boolean;
      textQuestion?: Record<string, any>;
    };
  };
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  responderUri?: string;
  items?: FormItem[];
}

export interface FormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers?: Record<string, {
    questionId: string;
    textAnswers: {
      answers: Array<{ value: string }>;
    };
  }>;
}

export async function fetchForm(formId: string): Promise<GoogleFormDetails> {
  const token = await getAccessToken();
  if (!token) throw new Error('No authentication token available');

  const cleanId = formId.replace(/https:\/\/docs\.google\.com\/forms\/d\/e\/([a-zA-Z0-9_-]+)\/.*/, '$1')
                        .replace(/https:\/\/docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)\/.*/, '$1')
                        .trim();

  const res = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Forms API error: ${res.statusText} (${errText})`);
  }

  return res.json();
}

export async function fetchFormResponses(formId: string): Promise<{ responses?: FormResponse[] }> {
  const token = await getAccessToken();
  if (!token) throw new Error('No authentication token available');

  const cleanId = formId.replace(/https:\/\/docs\.google\.com\/forms\/d\/e\/([a-zA-Z0-9_-]+)\/.*/, '$1')
                        .replace(/https:\/\/docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)\/.*/, '$1')
                        .trim();

  const res = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}/responses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Forms API error while fetching responses: ${res.statusText} (${errText})`);
  }

  return res.json();
}
