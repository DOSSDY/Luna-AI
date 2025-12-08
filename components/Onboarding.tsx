
import React, { useState } from 'react';
import { UserPreferences, CoachingStyle } from '../types';
import { ArrowRight, Check, MessageSquare, Zap, Heart, Target } from 'lucide-react';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [style, setStyle] = useState<CoachingStyle>('gentle');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [goal, setGoal] = useState('');

  const toggleFocus = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else {
      if (focusAreas.length < 3) setFocusAreas([...focusAreas, area]);
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      onComplete({
        coachingStyle: style,
        focusAreas,
        communicationGoal: goal
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950 z-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-stone-800 w-full">
            <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Step 1: Coaching Style */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-semibold text-stone-100 mb-2">How should Luna coach you?</h2>
            <p className="text-stone-400 mb-6">Select a personality tone for your feedback.</p>
            
            <div className="grid gap-4">
              {[
                { id: 'gentle', label: 'Supportive & Gentle', desc: 'Encouraging, soft tone, focuses on strengths.', icon: <Heart className="w-5 h-5 text-pink-400"/> },
                { id: 'direct', label: 'Direct & Actionable', desc: 'Straight to the point, efficient, focuses on fixes.', icon: <Zap className="w-5 h-5 text-yellow-400"/> },
                { id: 'analytical', label: 'Analytical & Deep', desc: 'Detailed breakdowns, psychology-focused.', icon: <MessageSquare className="w-5 h-5 text-blue-400"/> }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setStyle(opt.id as CoachingStyle)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    style === opt.id 
                    ? 'bg-stone-800 border-teal-500/50 shadow-lg shadow-teal-900/10' 
                    : 'bg-stone-800/40 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  <div className={`p-3 rounded-full ${style === opt.id ? 'bg-stone-700' : 'bg-stone-800'}`}>
                    {opt.icon}
                  </div>
                  <div>
                    <h3 className={`font-medium ${style === opt.id ? 'text-teal-50 text-lg' : 'text-stone-300'}`}>{opt.label}</h3>
                    <p className="text-sm text-stone-500">{opt.desc}</p>
                  </div>
                  {style === opt.id && <Check className="w-6 h-6 text-teal-400 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Focus Areas */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-semibold text-stone-100 mb-2">What do you want to improve?</h2>
            <p className="text-stone-400 mb-6">Select up to 3 areas.</p>
            
            <div className="grid grid-cols-2 gap-3">
              {['Public Speaking', 'Conflict Resolution', 'Small Talk', 'Negotiation', 'Dating & Social', 'Leadership', 'Setting Boundaries', 'Emotional Intelligence'].map((area) => (
                <button
                  key={area}
                  onClick={() => toggleFocus(area)}
                  className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                    focusAreas.includes(area)
                    ? 'bg-teal-900/30 border-teal-500/50 text-teal-200'
                    : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:bg-stone-800'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Specific Goal */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <h2 className="text-2xl font-semibold text-stone-100 mb-2">One main goal?</h2>
             <p className="text-stone-400 mb-6">Tell us in your own words.</p>
             
             <div className="relative mb-6">
                <Target className="absolute left-4 top-4 text-stone-500 w-5 h-5" />
                <textarea 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. I want to sound less apologetic when asking for things..."
                  className="w-full bg-stone-800/50 border border-stone-700 rounded-xl p-4 pl-12 h-32 text-stone-100 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 outline-none resize-none"
                />
             </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone-800">
            <button 
              onClick={() => step > 1 && setStep(step - 1)}
              className={`text-stone-500 hover:text-stone-300 ${step === 1 ? 'invisible' : ''}`}
            >
              Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={step === 2 && focusAreas.length === 0}
              className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-900/20"
            >
              {step === 3 ? 'Finish Setup' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
        </div>

      </div>
    </div>
  );
};
