import React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { LiveStatus } from '../types';

interface ControlPanelProps {
  status: LiveStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ status, onConnect, onDisconnect }) => {
  if (status === LiveStatus.CONNECTING) {
    return (
      <div className="flex flex-col items-center gap-4">
        <button disabled className="bg-stone-700 text-stone-400 rounded-full p-6 transition-all">
          <Loader2 className="w-8 h-8 animate-spin" />
        </button>
        <p className="text-stone-400 text-sm tracking-wide animate-pulse">Connecting to PsySense...</p>
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
        <p className="text-stone-400 text-sm tracking-wide">Tap to end session</p>
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
      <p className="text-stone-400 text-sm tracking-wide">Tap to start coaching</p>
    </div>
  );
};
