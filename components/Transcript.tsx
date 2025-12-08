
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { Activity } from 'lucide-react';

interface TranscriptProps {
  messages: ChatMessage[];
  agentName?: string;
}

export const Transcript: React.FC<TranscriptProps> = ({ messages, agentName }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full max-w-4xl flex flex-col gap-2 z-10 h-full min-h-0">
      
      {/* Live Header Indicator */}
      <div className="flex items-center justify-between px-2 flex-none">
         <span className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3 text-teal-500 animate-pulse" />
            Live Transcript
         </span>
         <span className="text-[10px] text-stone-600 bg-stone-900/50 px-2 py-0.5 rounded-full border border-stone-800">
            Real-time interpretation
         </span>
      </div>

      {/* Scrollable Area - consumes remaining space */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-gradient-to-b from-stone-900/80 to-stone-900/40 backdrop-blur-md rounded-2xl p-4 overflow-y-auto border border-stone-800 shadow-xl scroll-smooth min-h-0"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-600 text-sm italic">
            <p>Start speaking to see your words here...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, index) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className="flex items-center gap-2 mb-1 opacity-70">
                   <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-teal-400' : 'text-orange-400'}`}>
                    {msg.role === 'user' ? 'You' : (agentName || 'Luna')}
                  </span>
                </div>
                
                <div className={`relative rounded-2xl px-4 py-2 text-sm md:text-base leading-relaxed max-w-[90%] shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-stone-800 text-stone-100 rounded-tr-none border border-stone-700/50' 
                    : 'bg-stone-800/40 text-stone-300 rounded-tl-none border border-stone-800'
                }`}>
                  {msg.text}
                  {index === messages.length - 1 && msg.role === 'user' && !msg.isFinal && (
                     <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-teal-500 animate-pulse rounded-full"/>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
