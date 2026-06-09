import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, Tag, Heart, ChevronLeft, ChevronRight, Send, Trash2 } from 'lucide-react';
import { VisualLog } from '../types';

interface GalleryLightboxProps {
  logs: VisualLog[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function GalleryLightbox({ logs, currentIndex, onClose, onNavigate }) {
  const currentLog = logs[currentIndex];

  const [likes, setLikes] = useState<Record<string, number>>({});
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, { id: string; author: string; text: string; time: string }[]>>({});
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');

  // Hydrate likes & comments logs from storage
  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem('siyam_log_likes');
      const storedHasLiked = localStorage.getItem('siyam_log_hasliked');
      const storedComments = localStorage.getItem('siyam_log_comments');

      if (storedLikes) setLikes(JSON.parse(storedLikes));
      if (storedHasLiked) setHasLiked(JSON.parse(storedHasLiked));
      if (storedComments) setComments(JSON.parse(storedComments));
    } catch (e) {
      console.warn('LocalStorage reads failed:', e);
    }
  }, []);

  const saveLikes = (newL: Record<string, number>, newHL: Record<string, boolean>) => {
    setLikes(newL);
    setHasLiked(newHL);
    try {
      localStorage.setItem('siyam_log_likes', JSON.stringify(newL));
      localStorage.setItem('siyam_log_hasliked', JSON.stringify(newHL));
    } catch {}
  };

  const handleLike = () => {
    const logId = currentLog.id;
    const isLiked = !!hasLiked[logId];
    
    const newL = { ...likes };
    const newHL = { ...hasLiked };

    if (isLiked) {
      newL[logId] = Math.max(0, (newL[logId] || 0) - 1);
      newHL[logId] = false;
    } else {
      newL[logId] = (newL[logId] || 0) + 1;
      newHL[logId] = true;
    }

    saveLikes(newL, newHL);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const author = commenterName.trim() || 'Visitor';
    const commentItem = {
      id: `${Date.now()}-${Math.random()}`,
      author,
      text: newComment,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const logId = currentLog.id;
    const newLogsComments = { ...comments };
    if (!newLogsComments[logId]) {
      newLogsComments[logId] = [];
    }
    
    newLogsComments[logId] = [...newLogsComments[logId], commentItem];
    setComments(newLogsComments);
    setNewComment('');

    try {
      localStorage.setItem('siyam_log_comments', JSON.stringify(newLogsComments));
    } catch {}
  };

  const handleDeleteComment = (commentId: string) => {
    const logId = currentLog.id;
    const newLogsComments = { ...comments };
    if (!newLogsComments[logId]) return;

    newLogsComments[logId] = newLogsComments[logId].filter(c => c.id !== commentId);
    setComments(newLogsComments);

    try {
      localStorage.setItem('siyam_log_comments', JSON.stringify(newLogsComments));
    } catch {}
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIndex = currentIndex === 0 ? logs.length - 1 : currentIndex - 1;
    onNavigate(prevIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = currentIndex === logs.length - 1 ? 0 : currentIndex + 1;
    onNavigate(nextIndex);
  };

  // Close on Escape keyboard tap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(currentIndex === 0 ? logs.length - 1 : currentIndex - 1);
      if (e.key === 'ArrowRight') onNavigate(currentIndex === logs.length - 1 ? 0 : currentIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, logs, onClose, onNavigate]);

  const currentLikes = likes[currentLog.id] || 0;
  const isCurrentlyLiked = !!hasLiked[currentLog.id];
  const currentComments = comments[currentLog.id] || [];

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#020c1b]/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="glass-card rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-12 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Absolute header controllers */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-surface-dim/75 border border-white/10 flex items-center justify-center text-on-surface hover:text-white hover:bg-surface-bright/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Carousel Viewer */}
        <div className="md:col-span-7 bg-[#020C1B] relative flex items-center justify-center min-h-[280px] md:min-h-[500px] border-b md:border-b-0 md:border-r border-white/10 group select-none">
          <img 
            src={currentLog.url} 
            alt={currentLog.title}
            className="w-full h-full max-h-[550px] object-contain transition-transform duration-300 pointer-events-none"
          />

          {/* Hover visual controls */}
          <button 
            onClick={handlePrev}
            className="absolute left-4 w-9 h-9 md:w-11 md:h-11 rounded-full bg-surface/60 backdrop-blur text-white hover:bg-surface-tint hover:text-on-primary-fixed flex items-center justify-center border border-white/10 hover:shadow-[0_0_12px_rgba(0,219,233,0.4)] transition-all"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-4 w-9 h-9 md:w-11 md:h-11 rounded-full bg-surface/60 backdrop-blur text-white hover:bg-surface-tint hover:text-on-primary-fixed flex items-center justify-center border border-white/10 hover:shadow-[0_0_12px_rgba(0,219,233,0.4)] transition-all"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Pagination badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0A192F]/85 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-zinc-400">
            {currentIndex + 1} / {logs.length}
          </div>
        </div>

        {/* Column 2: Details & Interactive Logs comments */}
        <div className="md:col-span-5 p-6 md:p-8 flex flex-col justify-between max-h-[500px] md:max-h-[550px] overflow-y-auto">
          <div>
            {/* Title & Tags */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-tint/10 border border-surface-tint/20 text-xs font-code-sm text-surface-tint uppercase mb-3">
              <Tag className="w-3 h-3" />
              {currentLog.category}
            </div>

            <h3 className="font-title-md text-xl text-white font-bold leading-tight mb-2">
              {currentLog.title}
            </h3>

            {/* Timings */}
            <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant font-sans mb-4 border-b border-white/5 pb-4">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                {currentLog.location}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-secondary" />
                {currentLog.date}
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-6 font-sans">
              {currentLog.description}
            </p>

            {/* Like Action Toggle */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
                  isCurrentlyLiked
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-[#151f37] text-on-surface-variant border-transparent hover:border-white/10'
                }`}
              >
                <Heart className={`w-4 h-4 ${isCurrentlyLiked ? 'fill-red-400 text-red-400 animate-heartbeat' : ''}`} />
                {currentLikes === 0 ? 'Be the first to like' : `${currentLikes} Likes`}
              </button>
            </div>
          </div>

          {/* Comments section */}
          <div className="border-t border-white/5 pt-4 flex flex-col min-h-0">
            <h4 className="text-xs font-mono text-zinc-400 mb-3 uppercase tracking-wider">Comments Log ({currentComments.length})</h4>
            
            {/* Comments list scroll */}
            <div className="flex-grow overflow-y-auto max-h-[140px] pr-1 flex flex-col gap-2 mb-3 scrollbar-thin scrollbar-thumb-white/5 font-sans">
              {currentComments.length === 0 ? (
                <div className="text-[11px] text-zinc-500 italic py-2">No statements recorded yet. Leave your feedback below!</div>
              ) : (
                currentComments.map(comment => (
                  <div key={comment.id} className="bg-[#151f37]/50 rounded-lg p-2.5 border border-white/5 text-[11px] leading-relaxed group relative">
                    <div className="flex justify-between items-center mb-1 text-zinc-400 font-mono">
                      <span className="font-semibold text-white">{comment.author}</span>
                      <span className="text-[9px]">{comment.time}</span>
                    </div>
                    <p className="text-zinc-300">{comment.text}</p>
                    
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 duration-150"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form input */}
            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  className="bg-surface-dim border border-white/10 rounded px-2 py-1.5 text-[10px] text-white placeholder-zinc-500 focus:outline-none focus:border-surface-tint focus:ring-1 focus:ring-surface-tint"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-grow bg-surface-dim border border-white/10 rounded px-2 py-1.5 text-[10px] text-white placeholder-zinc-500 focus:outline-none focus:border-surface-tint focus:ring-1 focus:ring-surface-tint"
                  />
                  <button
                    type="submit"
                    className="bg-surface-tint hover:bg-cyan-500 text-on-primary-fixed px-2.5 rounded flex items-center justify-center transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
