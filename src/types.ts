export interface VisualLog {
  id: string;
  title: string;
  category: 'academic' | 'personal' | 'creatives';
  location: string;
  date: string;
  url: string;
  description: string;
}

export interface Quote {
  text: string;
  author: string;
}

export interface Track {
  id: string;
  title: string;
  freqs: number[];
  durationString: string;
}

export interface SavedMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
}

export const VISUAL_LOGS: VisualLog[] = [
  {
    id: 'log-1',
    title: 'Horizon Dreams',
    category: 'academic',
    location: 'Sheikh Russel Cantonment',
    date: 'April 2024',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwe5vJR9DF51kd96Qq1gyhA5SXrMkIU6hG_tRdeQM1ar2uZLK6wJ2Bm5doX6Eb2GO5KnOcGQRe_yg7eQXdO7jPzOdkfFII2vtIMjMhMjiLZfIEn5IudesQ-Oh-CWecrXgNpMvZmBwFtAK30K4LmKDBdQOqkHH1HmsUQgmQmP-3MZwqx_7JerAfguEbZkQizLOCmRV0kJuT7bs3QUZpMf9HJaKzykzBpig5PqiLb68zIXQIy10yEj_OdV390OKtwrLvqqgShCu1JE4',
    description: 'A striking perspective of comradeship and focus. Gazing out toward a blue horizon under the radiant sun of youth and disciplined studies.'
  },
  {
    id: 'log-2',
    title: 'Become Your Best Version',
    category: 'creatives',
    location: 'Cyber Desk Room',
    date: 'Ongoing Mood',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEDiwE_5lH5ToORDhCgrczaCWevNiKk1hmm8pR7-cCwdmrSCdcetcKx_I1pI3v3-U4yRfOA-nTqg6xq7UTLHlpW0krgnH_Ug_HM7vRq6tYrmufU3jMTdrA-4YsY-503NUeTX-tHQ7wqesgU7KDYLGM5uoikC6kcEr8ovLkFneP0Tk0zzNfFBReNjGXezQJyOjvSAFaDTJQo4CsuVSqJ14T2JyykRcvtk1hmH7oNjC5_G6TWNPtXQj56Bd4O7-ZU_rUbteIuJqzbQw',
    description: 'Saturated neon blue and crimson graphic art modeling continuous self-improvement, grit, and cyber-aesthetic inspirations.'
  },
  {
    id: 'log-3',
    title: 'Minimalist Reflection',
    category: 'personal',
    location: 'Dhaka City Bench',
    date: 'December 2025',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMIz6FxfT7C3Tvt1pypI0TXqYyB4xXHdnhtLp1Sb1wWubRBYVTYk9I5LFFpA-shU1QWhk8aCQe8Ihhf2nZMW5rkayY3wcVIOxAUZ7u2o0yXaKH0-UAGvfDC2Tc5FG6FNOvaRrH9vVJzZKYNUnLa-3eGqtTmz5BZ-1USO7Y0eDliuJHNLl625ZikckDTNBAZfLEYNApYD8s8OqXddmBco9yoOmWWSaeZ00mzi9AimB96uwcK7n1WnHZrflW9XBB1fMHQC-MxyrFmDI',
    description: 'An off-duty capture sitting under the afternoon breeze, analyzing software patterns and code pipelines mentally before the evening code run.'
  }
];

export const WISDOM_QUOTES: Quote[] = [
  { text: "I write code that works on my machine. Everything else is a server issue.", author: "Sahedur Siyam" },
  { text: "Simplicity is the soul of efficient software design.", author: "Interstellar Coder" },
  { text: "Programming isn't about what you know; it's about what you can figure out.", author: "Chris Pine" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "First compile, then optimize, then celebrate.", author: "Midnight Scriptor" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" }
];

export const LOFI_TRACKS: Track[] = [
  { id: 'track-1', title: 'Midnight Code Loop', freqs: [146.83, 196.00, 246.94, 293.66], durationString: '4:20' }, // G major / D chords
  { id: 'track-2', title: 'Dhaka Ambient Rain', freqs: [110.00, 164.81, 220.00, 261.63], durationString: '3:45' }, // Am chord
  { id: 'track-3', title: 'Vibe compile-success', freqs: [130.81, 164.81, 196.00, 261.63], durationString: '5:12' }, // C major
  { id: 'track-4', title: 'Sora Glass Dream', freqs: [164.81, 207.65, 246.94, 329.63], durationString: '4:04' }  // E major
];
