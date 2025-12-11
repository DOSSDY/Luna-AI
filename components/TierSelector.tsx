
import React from 'react';
import { ServiceTier, Language } from '../types';
import { Zap, Sparkles } from 'lucide-react';
import { getTranslation } from '../constants';

interface TierSelectorProps {
  tier: ServiceTier;
  onChange: (tier: ServiceTier) => void;
  language: Language;
  variant?: 'login' | 'header';
}

export const TierSelector: React.FC<TierSelectorProps> = ({ tier, onChange, language, variant = 'header' }) => {
  
  const isHeader = variant === 'header';

  return (
    <div className={`flex bg-stone-800/50 rounded-full p-1 border border-stone-700/50 backdrop-blur-md ${isHeader ? 'scale-90' : 'w-full max-w-xs mx-auto mb-6'}`}>
      <button
        onClick={() => onChange('standard')}
        className={`flex items-center justify-center gap-2 rounded-full transition-all duration-300 ${
          tier === 'standard'
            ? 'bg-stone-700 text-teal-400 shadow-md'
            : 'text-stone-500 hover:text-stone-300'
        } ${isHeader ? 'px-3 py-1.5' : 'flex-1 py-2'}`}
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span className="text-xs font-bold tracking-wide">{getTranslation(language, 'tier_standard')}</span>
      </button>

      <button
        onClick={() => onChange('premium')}
        className={`flex items-center justify-center gap-2 rounded-full transition-all duration-300 ${
          tier === 'premium'
            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-900/20'
            : 'text-stone-500 hover:text-stone-300'
        } ${isHeader ? 'px-3 py-1.5' : 'flex-1 py-2'}`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-xs font-bold tracking-wide">{getTranslation(language, 'tier_premium')}</span>
      </button>
    </div>
  );
};
