
import React from 'react';
import { Agent, Language } from '../types';
import { Check } from 'lucide-react';
import { getTranslation } from '../constants';

interface AgentSelectorProps {
  selectedAgentId: string;
  onSelect: (agent: Agent) => void;
  localizedAgents: Agent[];
  language: Language;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ selectedAgentId, onSelect, localizedAgents, language }) => {
  return (
    <div className="w-full max-w-4xl mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            {getTranslation(language, 'choose_partner')}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {localizedAgents.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent)}
              className={`relative flex items-center gap-4 p-3 rounded-xl border text-left transition-all group overflow-hidden ${
                isSelected
                  ? 'bg-stone-800 border-teal-500/50 shadow-lg shadow-teal-900/10'
                  : 'bg-stone-800/40 border-stone-800 hover:bg-stone-800'
              }`}
            >
              {/* Gradient Orb */}
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center shrink-0 shadow-inner`}>
                <span className="text-stone-900 font-bold text-lg opacity-75">{agent.name[0]}</span>
              </div>
              
              <div className="flex-1 min-w-0 z-10">
                <h3 className={`font-semibold truncate ${isSelected ? 'text-stone-100' : 'text-stone-300'}`}>
                    {agent.name}
                </h3>
                <p className="text-xs text-stone-500 truncate">{agent.role}</p>
              </div>

              {isSelected && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-teal-500/20 p-1 rounded-full">
                    <Check className="w-4 h-4 text-teal-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
