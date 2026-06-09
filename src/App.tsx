import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  MapPin, 
  Sparkles, 
  GraduationCap, 
  Heart, 
  HeartHandshake, 
  Send, 
  Info, 
  Gamepad2, 
  Volume2, 
  Flame, 
  ChevronRight, 
  Github, 
  Linkedin, 
  ExternalLink,
  Mail,
  User,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Award,
  Globe2,
  Lock,
  Calendar,
  Settings,
  LogOut,
  RefreshCw,
  Database
} from 'lucide-react';

import WebGLBackground from './components/WebGLBackground';
import ThreeMesh from './components/ThreeMesh';
import RetroGame from './components/RetroGame';
import LofiSynth from './components/LofiSynth';
import GalleryLightbox from './components/GalleryLightbox';
import { SurpriseExplosion, SurpriseExplosionHandle } from './components/SurpriseExplosion';
import { VISUAL_LOGS, WISDOM_QUOTES, SavedMessage } from './types';

// Workspace Authentication and Google Forms Integration SDK
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  fetchForm, 
  fetchFormResponses,
  GoogleFormDetails,
  FormResponse
} from './lib/workspace';
import { User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const explosionRef = useRef<SurpriseExplosionHandle | null>(null);

  // Carousel Lightbox States
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'academic' | 'personal' | 'creatives'>('all');

  // Interactive quotes of the day
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isRotatingQuote, setIsRotatingQuote] = useState(false);

  // Easter Egg Secret note Decryptor states
  const [secretInput, setSecretInput] = useState('');
  const [secretResult, setSecretResult] = useState<string | null>(null);
  const [isSecretOpen, setIsSecretOpen] = useState(false);

  // Visitor Feedback Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localFeeds, setLocalFeeds] = useState<SavedMessage[]>([]);

  // Google Form Integration States
  const [isGFormEnabled, setIsGFormEnabled] = useState(() => {
    try {
      return localStorage.getItem('siyam_gform_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [gFormId, setGFormId] = useState(() => {
    try {
      return localStorage.getItem('siyam_gform_id') || '';
    } catch {
      return '';
    }
  });
  const [nameEntryId, setNameEntryId] = useState(() => {
    try {
      return localStorage.getItem('siyam_gform_name_id') || '';
    } catch {
      return '';
    }
  });
  const [emailEntryId, setEmailEntryId] = useState(() => {
    try {
      return localStorage.getItem('siyam_gform_email_id') || '';
    } catch {
      return '';
    }
  });
  const [msgEntryId, setMsgEntryId] = useState(() => {
    try {
      return localStorage.getItem('siyam_gform_msg_id') || '';
    } catch {
      return '';
    }
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);

  // Google Workspace API & Auth states
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [activeFeedbackTab, setActiveFeedbackTab] = useState<'local' | 'gform'>('local');
  const [gFormDetails, setGFormDetails] = useState<GoogleFormDetails | null>(null);
  const [gFormResponses, setGFormResponses] = useState<FormResponse[]>([]);
  const [isResponsesLoading, setIsResponsesLoading] = useState(false);
  const [formSyncStatus, setFormSyncStatus] = useState<string | null>(null);

  const handleSaveGFormSettings = (enabled: boolean, id: string, nameId: string, emailId: string, msgId: string) => {
    setIsGFormEnabled(enabled);
    setGFormId(id);
    setNameEntryId(nameId);
    setEmailEntryId(emailId);
    setMsgEntryId(msgId);
    try {
      localStorage.setItem('siyam_gform_enabled', String(enabled));
      localStorage.setItem('siyam_gform_id', id);
      localStorage.setItem('siyam_gform_name_id', nameId);
      localStorage.setItem('siyam_gform_email_id', emailId);
      localStorage.setItem('siyam_gform_msg_id', msgId);
      setIsSettingsSaved(true);
      setTimeout(() => setIsSettingsSaved(false), 2000);
    } catch {}
  };

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    if (isSigningInGoogle) return;
    setIsSigningInGoogle(true);
    setFormSyncStatus('Connecting securely to Google account (opening authentication popup)...');
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setFormSyncStatus('Successfully authenticated with Google.');
        setTimeout(() => setFormSyncStatus(null), 3000);
      } else {
        setFormSyncStatus('Connection was closed without credentials.');
      }
    } catch (err: any) {
      console.error('Core Sign In Error:', err);
      // Handle the cancelled popup request error gracefully, giving standard popup / iframe advice
      if (err?.code === 'auth/cancelled-popup-request' || err?.message?.includes('cancelled-popup-request') || err?.message?.includes('popup-blocked')) {
        setFormSyncStatus(
          'OAuth Popup Blocked/Cancelled! 🔐\n\nTo resolve this:\n1. Allow popups for this site in your browser address bar.\n2. OR, click the [Open in New Tab] button in the top right of this preview panel and sign-in directly!'
        );
      } else {
        setFormSyncStatus(`Google Login Failed: ${err.message || err}. Please try opening the app in a New Tab to login.`);
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Google Sign Out handler
  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setGFormDetails(null);
      setGFormResponses([]);
      setFormSyncStatus('Signed out from Google account.');
      setTimeout(() => setFormSyncStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Sync Google Form Structure and Submissions list
  const syncGoogleFormAndResponses = async (formUrlOrId: string) => {
    if (!formUrlOrId.trim()) return;
    setIsResponsesLoading(true);
    setFormSyncStatus('Directing secure request to Google API...');
    try {
      // 1. Fetch Form JSON details
      const details = await fetchForm(formUrlOrId);
      setGFormDetails(details);
      
      // Auto mapping suggestion:
      // Scan and find question text input field matches as a helper
      if (details.items) {
        let detectedName = '';
        let detectedEmail = '';
        let detectedMsg = '';

        details.items.forEach((item) => {
          const qId = item.questionItem?.question?.questionId;
          if (!qId) return;
          const title = (item.title || '').toLowerCase();
          
          if (title.includes('name') || title.includes('নাম') || title.includes('full name')) {
            detectedName = qId;
          } else if (title.includes('email') || title.includes('mail') || title.includes('ইমেইল')) {
            detectedEmail = qId;
          } else if (title.includes('message') || title.includes('statement') || title.includes('feedback') || title.includes('বার্তা') || title.includes('মন্তব্য') || title.includes('comment')) {
            detectedMsg = qId;
          }
        });

        // Auto save entry values if they're completely empty to ease setup
        if (!nameEntryId.trim() && detectedName) {
          setNameEntryId(detectedName);
          localStorage.setItem('siyam_gform_name_id', detectedName);
        }
        if (!emailEntryId.trim() && detectedEmail) {
          setEmailEntryId(detectedEmail);
          localStorage.setItem('siyam_gform_email_id', detectedEmail);
        }
        if (!msgEntryId.trim() && detectedMsg) {
          setMsgEntryId(detectedMsg);
          localStorage.setItem('siyam_gform_msg_id', detectedMsg);
        }
      }

      setFormSyncStatus('Google Form verified. Fetching submission responses...');
      
      // 2. Fetch Form responses live list
      const respData = await fetchFormResponses(formUrlOrId);
      if (respData && respData.responses) {
        setGFormResponses(respData.responses);
        setFormSyncStatus(`Google Form live! Synced ${respData.responses.length} visitor submissions successfully.`);
      } else {
        setGFormResponses([]);
        setFormSyncStatus('Google Form synced. No response logs exist yet.');
      }
    } catch (err: any) {
      console.error(err);
      setFormSyncStatus(`Sync error: ${err.message || 'Verification failed. Confirm Form ID & Permissions.'}`);
      setGFormDetails(null);
    } finally {
      setIsResponsesLoading(false);
      setTimeout(() => setFormSyncStatus(null), 5000);
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsub();
  }, []);

  // Sync automatically upon authentication or formId input change
  useEffect(() => {
    if (googleToken && gFormId) {
      syncGoogleFormAndResponses(gFormId);
    }
  }, [googleToken, gFormId]);

  // Convert raw API response logs into portfolio message items
  const getMappedGFormResponses = (): SavedMessage[] => {
    if (!gFormDetails || !gFormResponses) return [];
    
    let nameQId = '';
    let emailQId = '';
    let msgQId = '';
    
    if (gFormDetails.items) {
      gFormDetails.items.forEach(item => {
        const qId = item.questionItem?.question?.questionId;
        if (!qId) return;
        const title = (item.title || '').toLowerCase();
        
        if (title.includes('name') || title.includes('নাম') || title.includes('full name') || title.includes('identity')) {
          nameQId = qId;
        } else if (title.includes('email') || title.includes('mail') || title.includes('ইমেইল')) {
          emailQId = qId;
        } else if (title.includes('message') || title.includes('statement') || title.includes('feedback') || title.includes('comment') || title.includes('বার্তা') || title.includes('মন্তব্য') || title.includes('msg')) {
          msgQId = qId;
        }
      });
      
      const textQuestions = gFormDetails.items
        .filter(item => item.questionItem?.question?.questionId)
        .map(item => item.questionItem!.question.questionId);
        
      if (!nameQId && textQuestions.length > 0) nameQId = textQuestions[0];
      if (!emailQId && textQuestions.length > 1) emailQId = textQuestions[1];
      if (!msgQId && textQuestions.length > 2) msgQId = textQuestions[2];
      if (!msgQId && textQuestions.length > 0) {
        msgQId = textQuestions[textQuestions.length - 1];
      }
    }
    
    return gFormResponses.map(resp => {
      const answers = resp.answers || {};
      
      const getVal = (qId: string) => {
        if (!qId || !answers[qId]) return '';
        const textAnsws = answers[qId].textAnswers?.answers;
        if (textAnsws && textAnsws.length > 0) {
          return textAnsws[0].value || '';
        }
        return '';
      };
      
      return {
        id: resp.responseId,
        name: getVal(nameQId) || 'Anonymous Visitor',
        email: getVal(emailQId) || 'No email provided',
        message: getVal(msgQId) || '(Empty message)',
        timestamp: new Date(resp.lastSubmittedTime || resp.createTime).toLocaleString()
      };
    });
  };

  // Interactive Live Clock states (Dhaka Time offset UTC+6)
  const [dhakaTime, setDhakaTime] = useState('');

  // Floating Info Pill Quote
  const [infoPillHover, setInfoPillHover] = useState(false);

  // Subscribed stats counters
  const [streakPoints, setStreakPoints] = useState(() => {
    try {
      const saved = localStorage.getItem('siyam_streak_points');
      return saved ? parseInt(saved, 10) : 112; // Base points
    } catch {
      return 112;
    }
  });

  const [hasClaimedToday, setHasClaimedToday] = useState(() => {
    try {
      const today = new Date().toDateString();
      return localStorage.getItem('siyam_claimed_date') === today;
    } catch {
      return false;
    }
  });

  // Calculate Dhaka Clock
  useEffect(() => {
    const updateClock = () => {
      const options = {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit' as const,
        minute: '2-digit' as const,
        second: '2-digit' as const,
        hour12: true
      };
      const formatter = new Intl.DateTimeFormat([], options);
      setDhakaTime(formatter.format(new Date()));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Hydrate local submitted messages
  useEffect(() => {
    try {
      const stored = localStorage.getItem('siyam_feedbacks');
      if (stored) {
        setLocalFeeds(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Surprise trigger action
  const handleLogoExplode = (e: React.MouseEvent) => {
    explosionRef.current?.explode(e.clientX, e.clientY);
  };

  // Next Wisdom Quote
  const handleNextQuote = () => {
    setIsRotatingQuote(true);
    setTimeout(() => {
      setQuoteIndex(prev => (prev + 1) % WISDOM_QUOTES.length);
      setIsRotatingQuote(false);
    }, 250);
  };

  // Daily Streak Counter
  const handleDailyClaim = () => {
    if (hasClaimedToday) return;
    const nextPoints = streakPoints + 15;
    setStreakPoints(nextPoints);
    setHasClaimedToday(true);
    try {
      localStorage.setItem('siyam_streak_points', nextPoints.toString());
      localStorage.setItem('siyam_claimed_date', new Date().toDateString());
    } catch {}

    // Erupt particles inside center screen!
    if (explosionRef.current) {
      explosionRef.current.explode(window.innerWidth / 2, window.innerHeight / 2);
    }
  };

  // Secret code verification
  const handleVerifySecret = (e: React.FormEvent) => {
    e.preventDefault();
    const code = secretInput.trim().toUpperCase();
    if (code === 'SIYAM') {
      setSecretResult('🔓 ACCESS CONFIRMED: "The main pipeline compiler compiles at 100% capacity! Thank you for inspecting my workspace. Siyam is currently preparing for Higher Secondary HSC runs!"');
    } else if (code === '1337') {
      setSecretResult('⚡ LEET CODE: "Sahedur Rahman Siyam enjoys configuring system scripts, WebGL shaders, retro audio context grids, and bento UI structures."');
    } else if (code === 'AKMCC') {
      setSecretResult('🏫 CAMPUS DECRYPT: "Abdul Kadir Mollah City College is styled in gorgeous architectures located in Narsingdi, Bangladesh."');
    } else {
      setSecretResult('❌ UNRECOGNIZED BLOCK DECRYPT SEGMENT. Try "SIYAM", "1337", or "AKMCC".');
    }
  };

  // Form submit callback
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMsg.trim()) return;

    const newFeed: SavedMessage = {
      id: `${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim() || 'No email provided',
      message: formMsg.trim(),
      timestamp: new Date().toLocaleString()
    };

    const updated = [newFeed, ...localFeeds];
    setLocalFeeds(updated);
    setIsSubmitted(true);
    setFormMsg('');

    try {
      localStorage.setItem('siyam_feedbacks', JSON.stringify(updated));
    } catch {}

    // Dynamic Google Form submission in background
    if (isGFormEnabled && gFormId) {
      try {
        const cleanFormId = gFormId.trim();
        // Construct the formResponse endpoint safely
        let actionUrl = cleanFormId;
        if (!cleanFormId.startsWith('http')) {
          actionUrl = `https://docs.google.com/forms/d/e/${cleanFormId}/formResponse`;
        } else {
          actionUrl = cleanFormId.endsWith('/formResponse') 
            ? cleanFormId 
            : `${cleanFormId.replace(/\/viewform.*/, '')}/formResponse`;
        }

        const formData = new FormData();
        const nameKey = nameEntryId.trim().startsWith('entry.') ? nameEntryId.trim() : `entry.${nameEntryId.trim()}`;
        const emailKey = emailEntryId.trim().startsWith('entry.') ? emailEntryId.trim() : `entry.${emailEntryId.trim()}`;
        const msgKey = msgEntryId.trim().startsWith('entry.') ? msgEntryId.trim() : `entry.${msgEntryId.trim()}`;

        formData.append(nameKey, formName.trim());
        if (formEmail.trim() && emailEntryId.trim()) {
          formData.append(emailKey, formEmail.trim());
        }
        formData.append(msgKey, formMsg.trim());

        // We use mode 'no-cors' to bypass browser safety blocks on forms submission endpoint
        fetch(actionUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: formData
        }).catch(err => {
          console.warn('Silent Google Form submission handle:', err);
        });
      } catch (err) {
        console.warn('Pre-submit parse error:', err);
      }
    }

    // Trigger visual confetti particles
    const formElement = e.currentTarget;
    const rect = formElement.getBoundingClientRect();
    explosionRef.current?.explode(rect.left + rect.width / 2, rect.top + rect.height / 3);

    setTimeout(() => {
      setIsSubmitted(false);
    }, 4500);
  };

  // Remove submitted comments
  const handleClearFeedbacks = () => {
    setLocalFeeds([]);
    try {
      localStorage.removeItem('siyam_feedbacks');
    } catch {}
  };

  // Filter gallery items
  const filteredGallery = VISUAL_LOGS.filter(log => {
    if (galleryFilter === 'all') return true;
    return log.category === galleryFilter;
  });

  return (
    <div className="relative min-h-screen bg-[#07122a] text-[#d9e2ff] selection:bg-surface-tint selection:text-black font-sans antialiased overflow-x-hidden">
      
      {/* High-Performance WebGL Fluid Flowing shader Background */}
      <div className="fixed inset-0 w-full h-full z-0 opacity-35 pointer-events-none">
        <WebGLBackground />
      </div>

      {/* Luminous atmospheric glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/10 blur-[160px] pointer-events-none z-0"></div>

      {/* Interactive Surprise confession particles */}
      <SurpriseExplosion ref={explosionRef} />

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#07122a]/75 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="flex justify-between items-center px-gutter py-4 max-w-container-max-width mx-auto">
          {/* Logo element with custom click explosions */}
          <div 
            onClick={handleLogoExplode}
            className="font-display-lg text-[#dbfcff] text-xl font-extrabold tracking-tighter cursor-pointer hover:text-surface-tint active:scale-95 duration-150 select-none flex items-center gap-2 group"
          >
            <Terminal className="w-5 h-5 text-surface-tint group-hover:rotate-12 transition-transform" />
            SRS.DEV
            <span className="text-[10px] bg-cyan-950 text-cyan-400 font-mono px-2 py-0.5 rounded-full border border-cyan-800 animate-pulse">LIVE</span>
          </div>

          <div className="hidden md:flex gap-8 items-center text-sm font-semibold">
            <a href="#about" className="text-white hover:text-surface-tint transition-colors">About</a>
            <a href="#journey" className="text-[#b9cacb] hover:text-white transition-colors">Journey</a>
            <a href="#visuals" className="text-[#b9cacb] hover:text-white transition-colors">Visual Log</a>
            <a href="#interactive" className="text-[#b9cacb] hover:text-white transition-colors">Fun Zone</a>
            <a href="#connect" className="text-[#b9cacb] hover:text-white transition-colors">Contact</a>
          </div>

          <button 
            onClick={(e) => explosionRef.current?.explode(e.clientX, e.clientY)}
            className="bg-gradient-to-r from-surface-tint to-secondary-container text-[#002022] px-5 py-2 rounded-full text-xs font-mono font-bold hover:shadow-[0_0_15px_rgba(0,219,233,0.7)] hover:scale-[1.03] transition-all active:scale-95 duration-200"
          >
            ⚡ Surprise Me
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="about" className="relative min-h-screen pt-28 pb-16 flex items-center justify-center z-10 px-gutter">
        <div className="max-w-container-max-width w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Headline details */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            
            {/* Clock & Status badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 bg-cyan-505/10 border border-[#00dbe9]/35 rounded-full px-3.5 py-1.5 text-xs text-surface-tint">
                <Globe2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-mono uppercase tracking-wider">Dhaka Clock:</span>
                <span className="font-bold text-white font-mono">{dhakaTime || 'Calculating...'}</span>
              </div>

              <div 
                onClick={handleDailyClaim}
                className={`inline-flex items-center gap-1.5 border rounded-full px-3.5 py-1.5 text-xs cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                  hasClaimedToday
                  ? 'bg-purple-950/20 border-purple-800/30 text-[#ebb2ff]'
                  : 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white border-transparent hover:shadow-[0_0_10px_rgba(182,0,248,0.4)]'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${hasClaimedToday ? '' : 'animate-bounce'}`} />
                <span className="font-mono">Streak points: <span className="font-bold">{streakPoints}</span></span>
                {!hasClaimedToday && (
                  <span className="text-[9px] bg-white text-indigo-900 px-1.5 font-bold rounded">+15 pts</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="font-display-lg text-4xl md:text-6xl text-white tracking-tighter font-extrabold leading-none m-0">
                Sahedur Rahman <br />
                <span className="bg-gradient-to-right bg-gradient-to-r from-surface-tint via-[#ebb2ff] to-[#b600f8] bg-clip-text text-transparent">
                  Siyam
                </span>
              </h1>
              <p className="text-[#ebb2ff] font-mono text-sm tracking-wide">
                STUDENT @ AKMCC • FUTURE CODER • WEB DEV EXPLORER
              </p>
            </div>

            <p className="text-base text-[#b9cacb] leading-relaxed max-w-2xl font-sans">
              Crafting fluid digital experiences with elegant structural logic. Currently exploring responsive layouts, modern JavaScript paradigms, Web Audio synths, and robust full-stack schemas.
            </p>

            {/* Quick stats panel */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-surface-container/40 backdrop-blur rounded-xl p-4 border border-white/5 font-mono select-none">
              <div>
                <div className="text-xs text-on-surface-variant">LVL</div>
                <div className="text-xl font-bold text-surface-tint">19</div>
              </div>
              <div>
                <div className="text-xs text-on-surface-variant">REPOSITORIES</div>
                <div className="text-xl font-bold text-[#ebb2ff]">18+</div>
              </div>
              <div>
                <div className="text-xs text-on-surface-variant">REGION</div>
                <div className="text-sm font-bold text-zinc-300 mt-1 flex items-center gap-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  Dhaka
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-2">
              <a 
                href="#interactive"
                className="bg-gradient-to-r from-surface-tint to-secondary-container text-[#002022] px-6 py-2.5 rounded-lg text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,219,233,0.5)] transition-all flex items-center gap-1.5"
              >
                <Gamepad2 className="w-4 h-4" />
                Play Cyber Game
              </a>
              <a 
                href="#connect"
                className="border border-[#00dbe9]/55 text-surface-tint bg-transparent px-6 py-2.5 rounded-lg text-sm hover:bg-surface-tint/10 transition-all flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                Get in Touch
              </a>
            </div>

          </div>

          {/* Three.JS Canvas column & Graphic portrait card */}
          <div className="lg:col-span-5 flex flex-col gap-6 relative">
            
            {/* Embedded Rotate wireframe element */}
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 opacity-25 z-0 pointer-events-none">
              <ThreeMesh />
            </div>

            {/* Glassmorphic Portait container card rotated */}
            <div className="glass-card rounded-2xl p-4 transform rotate-1 hover:rotate-0 transition-transform duration-500 w-full max-w-sm mx-auto relative z-10 select-none shadow-xl">
              <div className="relative rounded-xl overflow-hidden aspect-[1.1] md:aspect-[0.9] bg-slate-900 border border-white/10 group">
                <img 
                  // B&W Portrait image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSkExnr8EGwW9Ccv39dEtM5pJWWgE_QOEQzlxXbn6kNK2K_SdJSQZeW98dDV_cMSDKoxZNu1O7a2jL8CgdaKc3Wy7EcuL9aP0fSyuRSYRrkfqe-hGwH87I03V5bDBxTrGYgFyrDMWEcmt_ueegWOBa9t61uEm6ya12cyFp1bnqW6yq6VUu-On6uixYUHoEnDZHgUslEC6RvTjl7T0dJ2jemdbSXL_Zke4NYa0LfP9FNBYt_qkUFUdtQ0w_CoZyG47_AC4v-xnWah8" 
                  alt="Portrait of Sahedur Siyam" 
                  className="w-full h-full object-cover object-top filter grayscale opacity-90 group-hover:scale-105 duration-700" 
                />
                
                {/* Floating caption overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#020c1b]/95 via-[#020c1b]/60 to-transparent">
                  <p className="font-code-sm text-[11px] text-zinc-400 font-mono">B&W Art Gallery Exhibition Portrait</p>
                </div>
              </div>

              {/* Interactive Tooltip label */}
              <div 
                className="mt-4 bg-[#151f37]/80 backdrop-blur rounded-lg p-3 border border-white/10 relative cursor-help"
                onMouseEnter={() => setInfoPillHover(true)}
                onMouseLeave={() => setInfoPillHover(false)}
              >
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Award className="w-3.5 h-3.5 text-surface-tint" />
                    Lvl. 19 Developer State
                  </span>
                  <Info className="w-3.5 h-3.5 text-surface-tint" />
                </div>

                <AnimatePresence>
                  {infoPillHover && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 right-0 bottom-full mb-2 bg-gradient-to-r from-secondary-container to-[#b600f8] text-white p-2.5 rounded-lg shadow-xl text-center text-[11px] font-mono border border-white/10 z-30 leading-normal"
                    >
                      "Still compiling... prepping HSC exam databases."
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Academic Journey Section */}
      <section id="journey" className="py-24 relative z-10 px-gutter">
        <div className="max-w-container-max-width mx-auto">
          
          <div className="flex items-center gap-3 mb-12">
            <GraduationCap className="text-surface-tint w-8 h-8" />
            <h2 className="font-display-lg text-2xl md:text-3xl text-white font-extrabold m-0">Academic Milestones</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* College Card */}
            <div className="glass-card rounded-xl overflow-hidden group flex flex-col justify-between hover:border-surface-tint/30 transition-all duration-300">
              <div className="relative h-48 md:h-56 bg-slate-900 overflow-hidden border-b border-white/5">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYMRzovIc9k7M4KmaB9JzCofXoiHMPEz9qYUjPvZwCwJ2LHzt6AeCZG5OSKwRsD6W2dPEMMtZW2IbTIxi8Bd1a6Ohbfyn7zr7WRn2Ov5jeX6fcWh04beJdR66KGTLhIP9hMLTtTj39s2s6nJMJ8SPe8cFDkQv501v40bfM1DAUBRQfZFOdMXYv4iM8dD1G9uI09hjEWEorO72jrWlfKsjLV0IRlrqz-oQz92V-RdPjBTZPNr2HFfzvoCK7B3XTnuyGYef57OSNIOQ" 
                  alt="Abdul Kadir Mollah City College" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80" 
                />
                <div className="absolute top-4 right-4 bg-surface-tint/20 backdrop-blur border border-surface-tint/45 rounded-md px-3 py-1 text-[10px] font-mono text-surface-tint font-bold uppercase tracking-wider">
                  Current
                </div>
              </div>
              <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-title-md text-lg text-white font-bold mb-1">Abdul Kadir Mollah City College</h3>
                  <p className="text-xs font-mono text-[#ebb2ff] uppercase tracking-wider mb-3">Higher Secondary Certificate HSC</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-6 font-sans">
                    Nesting modern analytical paradigms and computing mechanics. Engaged in core science curricula, technology courses, and future university preparations.
                  </p>
                </div>
                
                <div className="bg-surface-container rounded-lg p-3 border border-white/5 font-mono text-[11px] text-zinc-400">
                  <span className="text-[#ebb2ff]">const</span> <span className="text-surface-tint">curriculum</span> = [<span className="text-teal-300">'Science'</span>, <span className="text-teal-300">'Advanced_Maths'</span>, <span className="text-teal-300">'IT'</span>];
                </div>
              </div>
            </div>

            {/* School Card */}
            <div className="glass-card rounded-xl overflow-hidden group flex flex-col justify-between hover:border-surface-tint/30 transition-all duration-300">
              <div className="relative h-48 md:h-56 bg-slate-900 overflow-hidden border-b border-b-0 border-white/5">
                <img 
                  // Sahedur at school / rooftop
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxGRz7uAHmOrCXp665rval0INO-vRinBuvWHlqqAVKEd9y1nKNyH2iz4vNK2Tl0sjFKGYrYf1Ie8dNQJLG6qUSvRziuAM1vxDSEUxWIITULwixnbAAqlv0JlX0uRdvzvPRXeqxg2fBINyIm4qSJfQA8N7FzG3SFUSexaey2nBIbJBHuyf544WSUCggHzqzWDUNp3Tj7XYOLWqFeEZ5O_EKtkb06aoZ7Np1uavU1-kaGkD5-0_p2N7efs47xn9M2bilSQaFnCI536o" 
                  alt="Sheikh Russel Cantonment Public School" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80" 
                />
                <div className="absolute top-4 right-4 bg-zinc-800/80 backdrop-blur border border-white/10 rounded-md px-3 py-1 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Completed
                </div>
              </div>
              <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-title-md text-lg text-white font-bold mb-1">Sheikh Russel Cantonment Public School</h3>
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">Secondary School Certificate SSC</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-6 font-sans">
                    Constructed a fundamental grounding in algebraic computation, physics elements, and foundational computer sciences. Completed SSC milestones successfully.
                  </p>
                </div>

                <div className="bg-surface-container rounded-lg p-3 border border-white/5 font-mono text-[11px] text-zinc-400">
                  <span className="text-[#ebb2ff]">class</span> <span className="text-surface-tint">AcademicState</span> &#123; foundation: <span className="text-teal-300">"Excellent"</span> &#125;
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Visual Log Bento Gallery Grid */}
      <section id="visuals" className="py-24 bg-surface-container-low/50 relative z-10 px-gutter">
        <div className="max-w-container-max-width mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <h2 className="font-display-lg text-2xl md:text-3xl text-white font-extrabold flex items-center gap-2 m-0">
                <Globe2 className="text-secondary w-7 h-7" />
                Visual Log Grid
              </h2>
              <p className="text-xs text-on-surface-variant max-w-sm font-sans">
                A photographic timeline of academic steps and snapshots from Sahedur Rahman Siyam's journey. Click on items to open the interactive log panel!
              </p>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 font-mono text-xs select-none">
              {(['all', 'academic', 'personal', 'creatives'] as const).map(f => {
                const isActive = galleryFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setGalleryFilter(f)}
                    className={`px-3.5 py-1.5 rounded-full capitalize border transition-all ${
                      isActive 
                      ? 'bg-surface-tint border-transparent text-black font-semibold' 
                      : 'bg-transparent text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-auto md:h-[500px]">
            {filteredGallery.length === 0 ? (
              <div className="col-span-12 py-16 text-center border border-dashed border-white/5 rounded-xl font-mono text-sm text-zinc-500">
                No archived blocks found mapping this selection tag.
              </div>
            ) : (
              <>
                {/* Visual Log Main item (Col Span 6 / Row Span 2) */}
                {filteredGallery.map((item, idx) => {
                  const isMain = idx === 0;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => {
                        const originalIndex = VISUAL_LOGS.findIndex(v => v.id === item.id);
                        setSelectedPhotoIndex(originalIndex);
                      }}
                      className={`relative rounded-xl overflow-hidden glass-card cursor-pointer group flex flex-col justify-between select-none ${
                        isMain 
                        ? 'md:col-span-6 md:row-span-2 min-h-[280px]' 
                        : 'md:col-span-6 md:row-span-1 min-h-[190px]'
                      }`}
                    >
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 duration-700 opacity-60 group-hover:opacity-75"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020c1b]/95 via-[#020c1b]/35 to-transparent z-10" />

                      <div className="absolute top-4 right-4 z-20 bg-[#0A192F]/80 backdrop-blur rounded px-2.5 py-1 text-[10px] font-mono border border-white/10 text-on-surface uppercase tracking-wider">
                        {item.category}
                      </div>

                      <div className="relative z-20 mt-auto p-5 md:p-6 select-none pointer-events-none">
                        <h4 className="text-white font-bold text-base md:text-lg mb-1">{item.title}</h4>
                        <div className="flex gap-3 text-[10px] font-mono text-zinc-400">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3" /> {item.location}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="w-3" /> {item.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

        </div>
      </section>

      {/* Fun Zone Section */}
      <section id="interactive" className="py-24 relative z-10 px-gutter">
        <div className="max-w-container-max-width mx-auto">
          
          <div className="flex items-center gap-3 mb-12">
            <Gamepad2 className="text-surface-tint w-8 h-8" />
            <h2 className="font-display-lg text-2xl md:text-3xl text-white font-extrabold m-0">Interactive Fun Zone</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Column 1: Retro bug catcher Game (Col span 7/8) */}
            <div className="lg:col-span-7 h-full">
              <RetroGame />
            </div>

            {/* Column 2: Ambient synth music player + wisdom board (Col span 5) */}
            <div className="lg:col-span-5 flex flex-col gap-6 h-full">
              
              {/* Audio controller station */}
              <LofiSynth />

              {/* Quotes box */}
              <div className="glass-card rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <h3 className="font-title-md text-sm text-white mb-2 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                    Wisdom Pipeline
                  </h3>
                  <div className="h-[90px] flex items-center border-l-2 border-surface-tint/65 pl-4 py-1.5">
                    <p className={`text-sm italic font-sans leading-relaxed text-zinc-300 duration-200 ${
                      isRotatingQuote ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}>
                      "{WISDOM_QUOTES[quoteIndex].text}"
                    </p>
                  </div>
                  <div className="mt-2 text-right">
                    <p className="text-[10px] font-mono text-zinc-400">— {WISDOM_QUOTES[quoteIndex].author}</p>
                  </div>
                </div>

                <button 
                  onClick={handleNextQuote}
                  className="mt-4 border border-zinc-700 hover:border-white/20 text-xs font-mono font-bold text-zinc-300 hover:text-white px-3 py-1.5 rounded bg-[#101b33]/60 w-full duration-150 flex items-center justify-center gap-1"
                >
                  Retrieve Next Segment <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Secret button surprise trigger */}
              <div className="glass-card rounded-xl p-5 text-center relative overflow-hidden">
                {/* Background high-intensity glows */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-purple-600/5 pointer-events-none" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#ffb4ab] mb-2 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  Restricted Core Module
                </h4>
                <p className="text-xs text-zinc-400 font-sans mb-4 max-w-xs mx-auto leading-normal">Do not initiate central pipeline overflow sequence unless ready.</p>
                <button
                  id="secretBtn"
                  onClick={(e) => {
                    explosionRef.current?.explode(e.clientX, e.clientY);
                    // play damage buzz synth sound
                    try {
                      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                      const ctx = new AudioCtx();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.type = 'sawtooth';
                      osc.frequency.setValueAtTime(120, ctx.currentTime);
                      osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.5);
                      gain.gain.setValueAtTime(0.18, ctx.currentTime);
                      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.5);
                    } catch {}
                  }}
                  className="bg-red-500 font-bold hover:bg-red-600 text-white w-full py-2.5 rounded-lg text-xs uppercase tracking-widest duration-150 relative overflow-hidden active:scale-95 shadow-md shadow-red-500/10"
                >
                  Initiate Surprise! 💥
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Easter Egg Note / Decrypt Term */}
      <section className="py-12 bg-[#030d25] border-t border-b border-white/5 relative z-10 px-gutter font-mono">
        <div className="max-w-container-max-width mx-auto">
          <div className="glass-card rounded-xl p-6 max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-950 rounded-full flex items-center justify-center border border-cyan-800 animate-pulse text-cyan-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs text-[#dbfcff] font-bold">Encrypted Developer Note</h4>
                <p className="text-[10px] text-zinc-500">Decrypt secret snippets using codes like "SIYAM", "1337", or "AKMCC".</p>
              </div>
            </div>

            <button 
              onClick={() => setIsSecretOpen(!isSecretOpen)}
              className="bg-[#151f37] hover:bg-[#1f2942] text-[11px] text-surface-tint border border-white/10 px-4 py-2 rounded-lg duration-150 flex items-center gap-1"
            >
              <Terminal className="w-3.5 h-3.5" />
              {isSecretOpen ? 'Close Decryptor' : 'Launch Decryptor'}
            </button>
          </div>

          <AnimatePresence>
            {isSecretOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden max-w-2xl mx-auto mt-4"
              >
                <div className="bg-[#020c1b] p-4 rounded-xl border border-white/10">
                  <form onSubmit={handleVerifySecret} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER KEY DECRYPT CODE..."
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      className="flex-grow bg-slate-900 border border-white/10 rounded px-3 py-2 text-xs text-green-400 uppercase placeholder-zinc-600 focus:outline-none focus:border-green-500"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-500 text-black font-bold uppercase py-2 px-4 rounded text-xs duration-150"
                    >
                      Verify
                    </button>
                  </form>

                  {secretResult && (
                    <div className="mt-3 p-3 bg-slate-900/80 rounded border border-green-500/20 text-green-400 text-[10px] leading-relaxed">
                      {secretResult}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Contact Section / Feedback logs */}
      <section id="connect" className="py-24 relative z-10 px-gutter">
        <div className="max-w-container-max-width mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Column 1: Address Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#b600f8]/10 border border-[#b600f8]/30 text-xs font-code-sm text-[#ebb2ff] uppercase">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  Connect Segment
                </div>
                <h2 className="font-display-lg text-2xl md:text-3xl text-white font-extrabold m-0">Send a Statement</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-md font-sans">
                  Have inquiries, college notes, web requests, or want to say hello? Record a local feedback block. It will persist securely in your browser's compiler history!
                </p>
              </div>

              {/* Direct Channels */}
              <div className="space-y-3 font-mono text-xs text-zinc-300">
                <div className="flex items-center gap-3 bg-[#151f37]/50 rounded-lg p-3.5 border border-white/5">
                  <Mail className="w-4 h-4 text-surface-tint" />
                  <a href="mailto:siyamrahman1268@gmail.com" className="hover:text-white underline underline-offset-2">siyamrahman1268@gmail.com</a>
                </div>
                <div className="flex items-center gap-3 bg-[#151f37]/50 rounded-lg p-3.5 border border-white/5">
                  <MapPin className="w-4 h-4 text-[#ebb2ff]" />
                  <span>Dhaka, Bangladesh</span>
                </div>
              </div>

              {/* Google Form Connection Panel */}
              <div className="bg-[#0b1425]/80 border border-teal-500/30 rounded-xl p-5 font-sans space-y-4 shadow-lg shadow-teal-950/20">
                <div className="flex justify-between items-center border-b border-teal-500/10 pb-3">
                  <span className="text-xs font-mono text-teal-300 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <Settings className="w-4 h-4 text-teal-400 animate-spin-slow" />
                    Google Form Integration
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[#10192e] border border-white/10 text-teal-300 hover:bg-[#1a253f] duration-150"
                  >
                    {isSettingsOpen ? 'Hide Panel' : 'Configure (কনফিগার)'}
                  </button>
                </div>

                {/* Main Auth Panel */}
                <div className="space-y-3">
                  {!googleUser ? (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        Authenticate with your Google account to automatically list fields, structure mappings, and fetch live submissions list directly!
                      </p>
                      
                      {/* Standard Styled Google Sign In Button */}
                      <button 
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isSigningInGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-[#101b33] hover:bg-[#142343] active:scale-[0.98] duration-150 text-white font-mono font-semibold text-xs border border-white/10 rounded-lg py-2.5 px-4 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed select-none"
                      >
                        {isSigningInGoogle ? (
                          <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
                        ) : (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          </svg>
                        )}
                        {isSigningInGoogle ? 'Authorizing in popup...' : 'Sign in with Google'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#101b33]/60 rounded-lg p-3 border border-teal-500/10 text-xs flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center border border-teal-500/30 font-mono text-[11px] uppercase">
                            {googleUser.displayName ? googleUser.displayName[0] : 'S'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-teal-300 truncate max-w-[120px]">{googleUser.displayName || 'Authorized Admin'}</span>
                            <span className="text-[9px] text-zinc-400 font-mono truncate max-w-[120px]">{googleUser.email}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleGoogleSignOut}
                          className="p-1 px-1.5 rounded bg-red-950/20 hover:bg-red-950/40 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-all border border-red-500/10 text-red-300"
                        >
                          <LogOut className="w-3 h-3 text-red-0" />
                          Sign Out
                        </button>
                      </div>

                      {/* Display Synchronized Form Details */}
                      {gFormDetails ? (
                        <div className="mt-1 pt-2 border-t border-teal-500/10 space-y-1 bg-teal-950/10 p-2 rounded">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[9px] font-mono font-bold text-[#ebb2ff]">CONNECTED FORM:</span>
                            <span className="text-[9px] bg-emerald-500/25 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest text-[8px] animate-pulse">ACTIVE LIVE</span>
                          </div>
                          <p className="text-[11px] font-bold text-zinc-200 truncate">{gFormDetails.info.title || 'Untitled Form'}</p>
                          <p className="text-[9px] text-zinc-400 leading-normal line-clamp-1">{gFormDetails.info.description || 'No description provided'}</p>
                        </div>
                      ) : (
                        gFormId && (
                          <div className="mt-1 pt-2 border-t border-teal-500/10 text-[#ebb2ff] text-[9px] font-mono">
                            ⚠️ Enter details below to dynamically map fields.
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Toggle configuration state */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2 font-sans">
                      <div className="relative flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="gform-toggle"
                          checked={isGFormEnabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            handleSaveGFormSettings(val, gFormId, nameEntryId, emailEntryId, msgEntryId);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-500"></div>
                      </div>
                      <label htmlFor="gform-toggle" className="text-[11px] font-mono select-none cursor-pointer text-zinc-300">
                        {isGFormEnabled ? '🟢 Sync is Active' : '⚪ Sync is Offline'}
                      </label>
                    </div>

                    {googleUser && gFormId && (
                      <button
                        type="button"
                        disabled={isResponsesLoading}
                        onClick={() => syncGoogleFormAndResponses(gFormId)}
                        className="text-[9px] font-mono flex items-center gap-1.5 text-teal-400 hover:text-teal-300 bg-teal-950/20 border border-teal-500/20 hover:bg-teal-950/50 p-1 px-2 rounded duration-100 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isResponsesLoading ? 'animate-spin' : ''}`} />
                        {isResponsesLoading ? 'Syncing...' : 'Sync Now'}
                      </button>
                    )}
                  </div>

                  {/* Sync status messages */}
                  {formSyncStatus && (
                    <div className="p-2.5 rounded bg-teal-950/30 border border-teal-500/20 text-teal-300 font-mono text-[9px] leading-relaxed select-text">
                      🔹 {formSyncStatus}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-3 pt-2 text-xs border-t border-white/5 font-sans"
                    >
                      <div className="text-[11px] text-zinc-400 leading-relaxed space-y-1.5 font-sans bg-teal-950/20 p-2.5 rounded border border-teal-500/25">
                        <p className="font-bold text-teal-300">💡 কিভাবে কানেক্ট করবেন?</p>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[10px]">
                          <li>আপনার Google Form-টির <b>Preview ("চোখ" আইকন)</b> লিঙ্কে যান।</li>
                          <li>ফর্মের এড্রেস বার থেকে লিঙ্ক বা সম্পূর্ণ ID-টি কপি করে নিচে বসান।</li>
                          <li>ইনপুট ফিল্ডগুলোতে রাইট ক্লিক করে <b>Inspect</b> করুন এবং <code className="text-teal-300 font-mono">name="entry.XXXXXX"</code> থেকে ডিজিট বা সম্পূর্ণ নামগুলো সংগ্রহ করে নিচের এন্ট্রি বক্সে বসান।</li>
                        </ol>
                      </div>

                      <div className="space-y-2 font-mono text-[10px]">
                        <div className="space-y-1">
                          <span className="text-zinc-400">Google Form URL or ID:</span>
                          <input
                            type="text"
                            placeholder="e.g. 1FAIpQLSfDu9Xb..."
                            value={gFormId}
                            onChange={(e) => handleSaveGFormSettings(isGFormEnabled, e.target.value, nameEntryId, emailEntryId, msgEntryId)}
                            className="w-full bg-[#101b33] border border-white/10 rounded px-2.5 py-1.5 text-white text-[11px] focus:outline-none focus:border-teal-400"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <span className="text-zinc-400">Name Entry ID:</span>
                            <input
                              type="text"
                              placeholder="entry.11223"
                              value={nameEntryId}
                              onChange={(e) => handleSaveGFormSettings(isGFormEnabled, gFormId, e.target.value, emailEntryId, msgEntryId)}
                              className="w-full bg-[#101b33] border border-white/10 rounded px-2 py-1 text-white text-[11px] focus:outline-none focus:border-teal-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-zinc-400">Email Entry ID:</span>
                            <input
                              type="text"
                              placeholder="entry.44556"
                              value={emailEntryId}
                              onChange={(e) => handleSaveGFormSettings(isGFormEnabled, gFormId, nameEntryId, e.target.value, msgEntryId)}
                              className="w-full bg-[#101b33] border border-white/10 rounded px-2 py-1 text-white text-[11px] focus:outline-none focus:border-teal-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[#ebb2ff]">Msg Entry ID:</span>
                            <input
                              type="text"
                              placeholder="entry.77889"
                              value={msgEntryId}
                              onChange={(e) => handleSaveGFormSettings(isGFormEnabled, gFormId, nameEntryId, emailEntryId, e.target.value)}
                              className="w-full bg-[#101b33] border border-white/10 rounded px-2 py-1 text-white text-[11px] focus:outline-none focus:border-teal-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display Question structure read from API */}
                      {gFormDetails && gFormDetails.items && (
                        <div className="bg-[#10192e] p-2 rounded border border-white/5 space-y-1 text-[9px] font-mono select-text">
                          <p className="font-bold text-teal-400">📋 Detected Question Structure:</p>
                          <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                            {gFormDetails.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-zinc-400 border-b border-white/5 pb-0.5 last:border-0">
                                <span className="truncate">"{it.title || 'Question'}"</span>
                                <span className="text-teal-300 font-bold pl-1 shrink-0">{it.questionItem?.question?.questionId || 'No ID'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[9px] text-[#ebb2ff] font-sans">Settings auto-save locally!</span>
                        {isSettingsSaved && (
                          <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Saved
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Column 2: Send message form panel */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="glass-card rounded-xl p-6 md:p-8">
                <form onSubmit={handleFormSubmit} className="space-y-4 font-sans">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-surface-tint" /> Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Your full block name..."
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-[#101b33] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-surface-tint focus:ring-1 focus:ring-surface-tint"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#ebb2ff]" /> Email (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="mail@segments.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-[#101b33] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ebb2ff] focus:ring-1 focus:ring-[#ebb2ff]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.55">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#ebb2ff]" /> Message block
                    </label>
                    <textarea
                      required
                      placeholder="Compile statement or recommendations here..."
                      value={formMsg}
                      onChange={(e) => setFormMsg(e.target.value)}
                      rows={4}
                      className="w-full bg-[#101b33] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-surface-tint focus:ring-1 focus:ring-surface-tint resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-surface-tint via-[#ebb2ff] to-[#b600f8] text-[#002022] hover:shadow-[0_0_15px_rgba(0,219,233,0.5)] font-bold text-xs uppercase tracking-wider py-3 rounded-lg active:scale-95 duration-150 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4 fill-current" />
                    Submit Statement
                  </button>

                  <AnimatePresence>
                    {isSubmitted && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="p-3 bg-teal-950/20 border border-teal-500/30 rounded-lg text-teal-300 text-xs flex items-center gap-2 font-mono"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Compilation Successful! Statement stored securely in Local history.
                      </motion.div>
                    )}
                  </AnimatePresence>

                </form>
              </div>

              {/* Submitted visitor book log */}
              {(localFeeds.length > 0 || (googleUser && gFormId)) && (
                <div className="bg-[#101b33]/45 border border-white/5 rounded-xl p-5 md:p-6 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-teal-400" />
                      <span className="text-[#dbfcff] font-bold uppercase tracking-tight">Visitor Feedback Logs</span>
                    </div>
                    
                    {googleUser && gFormId && (
                      <div className="flex bg-[#0a1122] rounded p-0.5 border border-white/5 font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={() => setActiveFeedbackTab('local')}
                          className={`px-2.5 py-1 rounded transition-all font-bold ${activeFeedbackTab === 'local' ? 'bg-[#1e2e4f] text-[#dbfcff]' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Local ({localFeeds.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFeedbackTab('gform')}
                          className={`px-2.5 py-1 rounded transition-all font-bold flex items-center gap-1 ${activeFeedbackTab === 'gform' ? 'bg-teal-500/20 text-teal-300' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Google Forms ({getMappedGFormResponses().length})
                        </button>
                      </div>
                    )}
                  </div>

                  {activeFeedbackTab === 'local' ? (
                    localFeeds.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-end">
                          <button 
                            onClick={handleClearFeedbacks}
                            className="text-red-400 hover:text-red-300 underline underline-offset-4 font-bold tracking-tight text-[10px]"
                          >
                            Wipe Local Logs
                          </button>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/5 text-[11px] leading-relaxed">
                          {localFeeds.map(feed => (
                            <div key={feed.id} className="bg-[#0c1527] p-3 rounded border border-white/5">
                              <div className="flex justify-between mb-1.5 text-zinc-400">
                                <span className="font-bold text-[#dbfcff]">{feed.name}</span>
                                <span className="text-[9px]">{feed.timestamp}</span>
                              </div>
                              <p className="text-zinc-300 font-sans italic">"{feed.message}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400 py-4 italic text-center font-sans">No local feedback items found. Send a statement to populate!</p>
                    )
                  ) : (
                    // Google Forms tab is active
                    getMappedGFormResponses().length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-teal-400 font-bold">Synced Live from Google Forms responses</span>
                          <button
                            type="button"
                            disabled={isResponsesLoading}
                            onClick={() => syncGoogleFormAndResponses(gFormId)}
                            className="text-[10px] text-zinc-300 hover:text-white font-bold underline underline-offset-2 flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isResponsesLoading ? 'animate-spin' : ''}`} /> Refresh
                          </button>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/5 text-[11px] leading-relaxed animate-fade-in">
                          {getMappedGFormResponses().map((feed, index) => (
                            <div key={feed.id || index} className="bg-[#0c1425]/95 p-3 rounded border border-teal-500/10">
                              <div className="flex justify-between mb-1.5 text-zinc-400">
                                <span className="font-bold text-teal-300">{feed.name}</span>
                                <span className="text-[9px] text-teal-500">{feed.timestamp}</span>
                              </div>
                              <p className="text-zinc-300 font-sans italic">"{feed.message}"</p>
                              {feed.email && <div className="text-[9px] text-teal-500/50 mt-1 font-mono">📨 Mapped response (Anonymous email option)</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-2">
                        <p className="text-[11px] text-zinc-400 italic font-sans animate-pulse">No Google Form responses cached or found yet.</p>
                        <button
                          type="button"
                          onClick={() => syncGoogleFormAndResponses(gFormId)}
                          className="px-3 py-1.5 bg-teal-500/10 text-teal-300 border border-teal-500/25 text-[10px] rounded font-bold hover:bg-teal-500/20 duration-150 uppercase"
                        >
                          Check Real-Time Submissions
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* Lightbox photo logs modal */}
      {selectedPhotoIndex !== null && (
        <GalleryLightbox 
          logs={VISUAL_LOGS}
          currentIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
          onNavigate={(idx) => setSelectedPhotoIndex(idx)}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full py-12 border-t border-white/10 bg-[#030d25]/90 mt-28">
        <div className="flex flex-col md:flex-row justify-between items-center px-gutter max-w-container-max-width mx-auto gap-8 text-zinc-400 text-xs">
          <div className="font-display-lg text-lg text-white font-black tracking-tight">
            SRS<span className="text-surface-tint">.DEV</span>
          </div>

          <div className="text-center font-mono">
            © {new Date().getFullYear()} Sahedur Rahman Siyam. Built with precision.
          </div>

          <div className="flex gap-6 font-mono font-bold select-none text-[11px]">
            <a 
              href="https://linkedin.com" 
              className="hover:text-surface-tint transition-all underline underline-offset-4 flex items-center gap-1"
              target="_blank" 
              rel="noreferrer"
            >
              <Linkedin className="w-3.5 h-3.5" />
              LinkedIn
            </a>
            <a 
              href="https://github.com" 
              className="hover:text-surface-tint transition-all underline underline-offset-4 flex items-center gap-1"
              target="_blank" 
              rel="noreferrer"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
            <button 
              onClick={() => {
                setIsSecretOpen(true);
                const elem = document.getElementById('journey');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-surface-tint transition-all underline underline-offset-4 flex items-center gap-1"
            >
              <Terminal className="w-3.5 h-3.5" />
              Secret Note
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
