
import React, { useState, useMemo } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { Briefcase, Heart, MessageCircle, Shield, TrendingUp, Star, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Send, MessageSquarePlus, Trophy, Target, Lock, Unlock } from 'lucide-react';

interface ProfileProps {
  messages: ChatMessage[];
  user: UserProfile | null;
}

interface FeedbackState {
  rating: number;
  comment: string;
  submitted: boolean;
}

export const Profile: React.FC<ProfileProps> = ({ messages, user }) => {
  const [feedback, setFeedback] = useState<FeedbackState>({ rating: 0, comment: '', submitted: false });
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);

  // --- ANALYSIS ENGINE ---
  const analysis = useMemo(() => {
    const userMsgCount = messages.filter(m => m.role === 'user').length;
    const modelMsgCount = messages.filter(m => m.role === 'model').length;
    
    // Extract textual content
    const fullText = messages.map(m => m.text.toLowerCase()).join(' ');
    
    // Categorization logic (Keywords)
    const topics = {
      professional: {
        matches: ['work', 'boss', 'job', 'career', 'interview', 'colleague', 'meeting', 'professional'],
        label: 'Professional Profile',
        icon: <Briefcase className="w-5 h-5" />,
        color: 'text-blue-400',
        bg: 'bg-blue-900/20',
        border: 'border-blue-500/30'
      },
      conflict: {
        matches: ['conflict', 'argue', 'fight', 'mad', 'angry', 'tension', 'disagree', 'boundaries', 'no'],
        label: 'Conflict Resolution',
        icon: <Shield className="w-5 h-5" />,
        color: 'text-red-400',
        bg: 'bg-red-900/20',
        border: 'border-red-500/30'
      },
      emotional: {
        matches: ['feel', 'sad', 'happy', 'anxious', 'scared', 'love', 'empathy', 'listen', 'connect'],
        label: 'Ideal Conversation',
        icon: <Heart className="w-5 h-5" />,
        color: 'text-purple-400',
        bg: 'bg-purple-900/20',
        border: 'border-purple-500/30'
      }
    };

    // Determine active topics and extract specific advice
    const activeTopics = Object.entries(topics).map(([key, config]) => {
      const isRelevant = config.matches.some(keyword => fullText.includes(keyword));
      
      // Find specific "Coaching Moments" (Model messages that contain advice keywords)
      const advice = messages
        .filter(m => m.role === 'model' && config.matches.some(k => m.text.toLowerCase().includes(k)))
        .map(m => m.text)
        .slice(0, 3); // Top 3 pieces of advice

      return { key, ...config, isRelevant, advice };
    });

    return { userMsgCount, modelMsgCount, activeTopics };
  }, [messages]);

  // --- MILESTONE LOGIC ---
  const userCount = analysis.userMsgCount;
  // Levels definition
  const levels = [
      { min: 0, label: 'Observer', max: 5 },
      { min: 5, label: 'Participant', max: 15 },
      { min: 15, label: 'Analyst', max: 30 },
      { min: 30, label: 'Master', max: 100 }
  ];
  
  const currentLevelIndex = levels.findIndex(l => userCount >= l.min && userCount < l.max);
  const currentLevel = currentLevelIndex === -1 ? levels[levels.length - 1] : levels[currentLevelIndex];
  
  // Calculate progress within current level
  const range = currentLevel.max - currentLevel.min;
  const valInLevel = userCount - currentLevel.min;
  const progressPercent = Math.min((valInLevel / range) * 100, 100);

  const handleFeedbackSubmit = () => {
    // In a real app, this would send data to a backend
    console.log("Feedback submitted:", feedback);
    setFeedback({ ...feedback, submitted: true });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-in fade-in duration-500 pb-24">
      
      {/* HEADER */}
      <div className="flex items-center gap-5 mb-8 bg-stone-800/30 p-6 rounded-2xl border border-stone-800">
        <div className="relative">
             {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full border-4 border-stone-800 shadow-xl" />
             ) : (
                <div className="w-20 h-20 rounded-full bg-stone-700 flex items-center justify-center border-4 border-stone-800 shadow-xl">
                    <span className="text-2xl font-bold text-stone-300">{user?.name.charAt(0) || 'U'}</span>
                </div>
             )}
        </div>
        <div>
            <h2 className="text-2xl font-semibold text-stone-100">{user?.name || 'User Profile'}</h2>
            <p className="text-stone-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"/>
                Active Learner
            </p>
        </div>
      </div>

      {/* MILESTONE / LEVEL BAR */}
      <div className="mb-8 p-6 bg-gradient-to-r from-stone-800 to-stone-800/60 rounded-2xl border border-stone-700/50 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-24 h-24 text-teal-400" />
          </div>
          
          <div className="relative z-10">
              <div className="flex justify-between items-end mb-2">
                  <div>
                      <h3 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
                          Communication Level: <span className="text-teal-400">{currentLevel.label}</span>
                      </h3>
                      <p className="text-xs text-stone-400 mt-1">
                          {userCount < 30 
                            ? "Keep chatting to unlock deeper personality insights." 
                            : "Excellent! Sufficient data gathered for deep analysis."}
                      </p>
                  </div>
                  <div className="text-right">
                      <span className="text-2xl font-bold text-stone-200">{userCount}</span>
                      <span className="text-sm text-stone-500">/{currentLevel.max} turns</span>
                  </div>
              </div>

              {/* Progress Track */}
              <div className="h-3 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                      <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                  </div>
              </div>

              {/* Milestones markers */}
              <div className="flex justify-between mt-3 px-1">
                  {levels.slice(0,3).map((l, idx) => {
                      const isUnlocked = userCount >= l.max;
                      return (
                        <div key={idx} className={`flex flex-col items-center gap-1 ${isUnlocked ? 'text-teal-500' : 'text-stone-600'}`}>
                             {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                             <span className="text-[10px] font-medium uppercase tracking-wider">{l.max}</span>
                        </div>
                      );
                  })}
              </div>
          </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-stone-800/40 border border-stone-700/50 p-5 rounded-2xl flex flex-col justify-between hover:bg-stone-800/60 transition-colors">
            <div className="flex items-center gap-2 text-stone-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Total Turns</span>
            </div>
            <div className="text-3xl font-bold text-stone-200">{messages.length}</div>
        </div>
        <div className="bg-stone-800/40 border border-stone-700/50 p-5 rounded-2xl flex flex-col justify-between hover:bg-stone-800/60 transition-colors">
             <div className="flex items-center gap-2 text-stone-400 mb-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Your Inputs</span>
            </div>
            <div className="text-3xl font-bold text-stone-200">{analysis.userMsgCount}</div>
        </div>
        <div className="bg-stone-800/40 border border-stone-700/50 p-5 rounded-2xl flex flex-col justify-between hover:bg-stone-800/60 transition-colors">
             <div className="flex items-center gap-2 text-stone-400 mb-2">
                <Star className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Coaching Tips</span>
            </div>
            <div className="text-3xl font-bold text-stone-200">{analysis.modelMsgCount}</div>
        </div>
      </div>

      {/* DETAILED TOPIC BREAKDOWN */}
      <h3 className="text-lg font-medium text-stone-200 mb-4 flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-teal-400" />
        Session Insights
      </h3>
      
      <div className="space-y-4 mb-10">
        {userCount < 3 && (
            <div className="p-4 bg-teal-900/10 border border-teal-500/20 rounded-xl text-sm text-teal-200/80 flex gap-3">
                <Target className="w-5 h-5 flex-none" />
                <p>Start chatting more to unlock detailed insights about your professional tone, conflict resolution style, and emotional intelligence.</p>
            </div>
        )}
        
        {analysis.activeTopics.map((topic) => (
            <div 
                key={topic.key} 
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                    topic.isRelevant ? `bg-stone-800 ${topic.border}` : 'bg-stone-900/50 border-stone-800 opacity-60'
                }`}
            >
                <button 
                    onClick={() => setExpandedTopic(expandedTopic === topic.key ? null : topic.key)}
                    className="w-full flex items-center justify-between p-4"
                    disabled={!topic.isRelevant}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${topic.bg} ${topic.color}`}>
                            {topic.icon}
                        </div>
                        <div className="text-left">
                            <h4 className={`font-medium ${topic.isRelevant ? 'text-stone-200' : 'text-stone-500'}`}>
                                {topic.label}
                            </h4>
                            <p className="text-xs text-stone-500">
                                {topic.isRelevant 
                                    ? `${topic.advice.length} key points identified` 
                                    : 'Not discussed in this session'}
                            </p>
                        </div>
                    </div>
                    {topic.isRelevant && (
                        <div className="text-stone-500">
                            {expandedTopic === topic.key ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    )}
                </button>

                {/* Expanded Insights */}
                {expandedTopic === topic.key && topic.isRelevant && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                        <div className="h-px w-full bg-stone-700/50 mb-3" />
                        <h5 className="text-xs font-semibold text-stone-400 uppercase mb-2">Key Takeaways</h5>
                        <ul className="space-y-2">
                            {topic.advice.length > 0 ? topic.advice.map((tip, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-stone-300 bg-stone-900/50 p-2 rounded-lg border border-stone-800/50">
                                    <div className={`min-w-1 w-1 rounded-full ${topic.color.replace('text', 'bg')}`} />
                                    <span>{tip}</span>
                                </li>
                            )) : (
                                <li className="text-sm text-stone-500 italic">General discussion detected without specific advice blocks.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* COLLAPSIBLE FEEDBACK MECHANISM */}
      <div className="bg-stone-800/30 border border-stone-800 rounded-2xl overflow-hidden transition-all duration-300">
        <button 
            onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
            className="w-full flex items-center justify-between p-6 hover:bg-stone-800/50 transition-colors"
        >
            <div className="flex items-center gap-3">
                 <div className="bg-teal-900/20 text-teal-400 p-2 rounded-lg">
                    <MessageSquarePlus className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                    <h3 className="text-lg font-medium text-stone-200">Rate this Session</h3>
                    <p className="text-xs text-stone-400">Help Luna learn and improve.</p>
                 </div>
            </div>
            <div className="text-stone-500">
                {isFeedbackExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
        </button>

        {isFeedbackExpanded && (
            <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                <div className="h-px w-full bg-stone-700/50 mb-6" />
                
                {!feedback.submitted ? (
                    <div className="space-y-6">
                        {/* Rating */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">How helpful was this?</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        onClick={() => setFeedback({ ...feedback, rating: star })}
                                        className={`p-2 rounded-lg transition-all ${
                                            feedback.rating >= star ? 'text-yellow-400 bg-yellow-400/10' : 'text-stone-600 bg-stone-800 hover:bg-stone-700'
                                        }`}
                                    >
                                        <Star className={`w-6 h-6 ${feedback.rating >= star ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Specifics */}
                        <div className="flex gap-4">
                            <button className="flex-1 py-3 px-4 rounded-xl bg-stone-800 border border-stone-700 hover:bg-stone-700 text-stone-300 text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95">
                                <ThumbsUp className="w-4 h-4" /> Advice was clear
                            </button>
                            <button className="flex-1 py-3 px-4 rounded-xl bg-stone-800 border border-stone-700 hover:bg-stone-700 text-stone-300 text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95">
                                <ThumbsDown className="w-4 h-4" /> Too generic
                            </button>
                        </div>

                        {/* Comment */}
                        <div className="relative">
                            <textarea 
                                value={feedback.comment}
                                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                                placeholder="Any specific thoughts? (Optional)"
                                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-3 text-stone-200 text-sm focus:outline-none focus:border-teal-500/50 resize-none h-24"
                            />
                        </div>

                        <button 
                            onClick={handleFeedbackSubmit}
                            disabled={feedback.rating === 0}
                            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" /> Submit Feedback
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
                            <ThumbsUp className="w-6 h-6" />
                        </div>
                        <h4 className="text-xl font-semibold text-stone-200">Thank you!</h4>
                        <p className="text-stone-400 text-sm mt-2">Your feedback helps Luna learn.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);
