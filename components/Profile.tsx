
import React from 'react';
import { UserProfile } from '../types';
import { TrendingUp, Star, Calendar, Activity, Zap, Heart, Brain } from 'lucide-react';

interface ProfileProps {
  messages: any[]; // Kept for interface compatibility but we use user.history mostly
  user: UserProfile | null;
}

export const Profile: React.FC<ProfileProps> = ({ user }) => {
  if (!user) return null;

  const history = user.history || [];
  const latestAnalysis = history[history.length - 1];
  
  // Calculate Averages
  const avgClarity = history.length ? Math.round(history.reduce((a, b) => a + b.clarityScore, 0) / history.length * 10) / 10 : 0;
  const avgConfidence = history.length ? Math.round(history.reduce((a, b) => a + b.confidenceScore, 0) / history.length * 10) / 10 : 0;
  const avgEmpathy = history.length ? Math.round(history.reduce((a, b) => a + b.empathyScore, 0) / history.length * 10) / 10 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-in fade-in duration-500 pb-24">
      
      {/* HEADER */}
      <div className="flex items-center gap-6 mb-10">
        <div className="relative">
             {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full border-4 border-stone-800 shadow-xl" />
             ) : (
                <div className="w-24 h-24 rounded-full bg-stone-700 flex items-center justify-center border-4 border-stone-800 shadow-xl">
                    <span className="text-3xl font-bold text-stone-300">{user.name.charAt(0)}</span>
                </div>
             )}
             <div className="absolute bottom-1 right-1 bg-stone-900 rounded-full p-1.5 border border-stone-700">
                <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse" />
             </div>
        </div>
        <div>
            <h2 className="text-3xl font-bold text-stone-100 tracking-tight">{user.name}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-stone-400">
                <span className="flex items-center gap-1 bg-stone-800 px-2 py-1 rounded-md border border-stone-700/50">
                   {user.preferences?.coachingStyle ? 
                     user.preferences.coachingStyle.charAt(0).toUpperCase() + user.preferences.coachingStyle.slice(1) + " Coaching" 
                     : "General Coaching"}
                </span>
                <span>•</span>
                <span>{history.length} Sessions Completed</span>
            </div>
        </div>
      </div>

      {/* KEY METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <ScoreCard 
            label="Clarity" 
            value={avgClarity} 
            icon={<Brain className="w-5 h-5 text-blue-400" />} 
            color="text-blue-400" 
            bg="bg-blue-900/10" 
            borderColor="border-blue-500/20"
        />
        <ScoreCard 
            label="Confidence" 
            value={avgConfidence} 
            icon={<Zap className="w-5 h-5 text-yellow-400" />} 
            color="text-yellow-400" 
            bg="bg-yellow-900/10" 
            borderColor="border-yellow-500/20"
        />
        <ScoreCard 
            label="Empathy" 
            value={avgEmpathy} 
            icon={<Heart className="w-5 h-5 text-pink-400" />} 
            color="text-pink-400" 
            bg="bg-pink-900/10" 
            borderColor="border-pink-500/20"
        />
      </div>

      {/* PROGRESS HISTORY */}
      <h3 className="text-xl font-semibold text-stone-200 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-teal-500" />
        Recent Progress
      </h3>
      
      {history.length === 0 ? (
        <div className="bg-stone-800/30 border border-stone-800 rounded-2xl p-8 text-center text-stone-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Complete your first session to see AI analysis insights.</p>
        </div>
      ) : (
        <div className="space-y-4">
            {history.slice().reverse().map((session, idx) => (
                <div key={session.id || idx} className="bg-stone-800/40 border border-stone-800 rounded-xl p-5 hover:bg-stone-800/60 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-stone-700/50 text-stone-400 group-hover:bg-teal-900/20 group-hover:text-teal-400 transition-colors">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-medium text-stone-200">{session.topic || 'General Session'}</h4>
                                <p className="text-xs text-stone-500">{new Date(session.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                           <MiniBadge val={session.clarityScore} label="Cla" color="blue" />
                           <MiniBadge val={session.confidenceScore} label="Con" color="yellow" />
                           <MiniBadge val={session.empathyScore} label="Emp" color="pink" />
                        </div>
                    </div>
                    
                    <div className="relative pl-4 border-l-2 border-stone-700 group-hover:border-teal-500/50 transition-colors">
                        <p className="text-sm text-stone-300 italic">"{session.feedback}"</p>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* PREFERENCES SUMMARY */}
      <div className="mt-12 pt-8 border-t border-stone-800">
         <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Your Focus Areas</h3>
         <div className="flex flex-wrap gap-2">
            {user.preferences?.focusAreas?.map(area => (
                <span key={area} className="px-3 py-1 bg-stone-800 rounded-full text-xs text-stone-400 border border-stone-700">
                    {area}
                </span>
            ))}
            {(!user.preferences?.focusAreas || user.preferences.focusAreas.length === 0) && (
                <span className="text-stone-600 text-sm italic">No specific focus areas set.</span>
            )}
         </div>
      </div>

    </div>
  );
};

const ScoreCard = ({ label, value, icon, color, bg, borderColor }: any) => (
    <div className={`p-5 rounded-2xl border ${bg} ${borderColor} flex flex-col justify-between h-32`}>
        <div className="flex justify-between items-start">
            <span className={`text-sm font-semibold uppercase tracking-wider ${color} opacity-80`}>{label}</span>
            {icon}
        </div>
        <div>
            <span className={`text-4xl font-bold ${color}`}>{value}</span>
            <span className={`text-sm opacity-60 ml-1 ${color}`}>/10</span>
        </div>
    </div>
);

const MiniBadge = ({ val, label, color }: any) => {
    const colors: any = {
        blue: 'text-blue-400 bg-blue-900/20 border-blue-500/20',
        yellow: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/20',
        pink: 'text-pink-400 bg-pink-900/20 border-pink-500/20',
    };
    return (
        <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg border ${colors[color]}`}>
            <span className="text-[10px] font-bold">{val}</span>
            <span className="text-[8px] opacity-60 uppercase">{label}</span>
        </div>
    );
};
