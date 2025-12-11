
import React from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';
import { LiveStatus, Language } from '../types';
import { getTranslation } from '../constants';

interface ControlPanelProps {
  status: LiveStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  language: Language;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ status, onConnect, onDisconnect, language }) => {
  if (status === LiveStatus.RESEARCHING) {
      return (
        <div className="flex flex-col items-center gap-4">
          <button disabled className="bg-stone-800 text-teal-400 rounded-full p-6 transition-all border border-teal-500/30">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </button>
          <div className="flex flex-col items-center">
             <p className="text-teal-400 text-sm font-medium tracking-wide animate-pulse">
                {getTranslation(language, 'researching')}
             </p>
             <p className="text-stone-600 text-xs mt-1">
                {getTranslation(language, 'scanning_db')}
             </p>
          </div>
        </div>
      );
  }

  if (status === LiveStatus.CONNECTING) {
    return (
      <div className="flex flex-col items-center gap-4">
        <button disabled className="bg-stone-700 text-stone-400 rounded-full p-6 transition-all">
          <Loader2 className="w-8 h-8 animate-spin" />
        </button>
        <p className="text-stone-400 text-sm tracking-wide animate-pulse">
            {getTranslation(language, 'connecting')}
        </p>
      </div>
    );
  }

  if (status === LiveStatus.CONNECTED) {
    return (
      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={onDisconnect}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg shadow-red-900/20 transition-all hover:scale-105 active:scale-95"
        >
          <Square className="w-8 h-8 fill-current" />
        </button>
        <p className="text-stone-400 text-sm tracking-wide">
            {getTranslation(language, 'tap_end')}
        </p>
      </div>
    );
  }

  // Default / Disconnected / Error
  return (
    <div className="flex flex-col items-center gap-4">
      <button 
        onClick={onConnect}
        className="bg-teal-600 hover:bg-teal-500 text-white rounded-full p-6 shadow-lg shadow-teal-900/20 transition-all hover:scale-105 active:scale-95 group"
      >
        <Mic className="w-8 h-8 group-hover:stroke-2" />
      </button>
      <p className="text-stone-400 text-sm tracking-wide">
         {getTranslation(language, 'tap_start')}
      </p>
    </div>
  );
};
