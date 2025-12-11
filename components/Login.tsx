
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { MessageCircleHeart, Loader2, Globe } from 'lucide-react';
import { getTranslation } from '../constants';

interface LoginProps {
  onLogin: (user: UserProfile, lang: Language) => void;
  initialLanguage?: Language;
}

export const Login: React.FC<LoginProps> = ({ onLogin, initialLanguage = 'en' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>(initialLanguage);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Simulate OAuth delay
    setTimeout(() => {
      // Mock User Profile returned from "Google"
      const mockUser: UserProfile = {
        id: '1029384756',
        name: 'Alex Taylor',
        email: 'alex.taylor@example.com',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
        history: []
      };
      onLogin(mockUser, language);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-stone-900 font-sans">
      {/* Background Ambience */}
      <div className="blob bg-teal-900/30 w-[600px] h-[600px] rounded-full top-[-150px] left-[-150px] absolute mix-blend-screen blur-[100px]" />
      <div className="blob bg-indigo-900/30 w-[600px] h-[600px] rounded-full bottom-[-150px] right-[-150px] absolute mix-blend-screen blur-[100px] animation-delay-2000" />

      {/* Language Toggle Top Right */}
      <div className="absolute top-6 right-6 z-20">
         <button
            onClick={() => setLanguage(prev => prev === 'en' ? 'th' : 'en')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-800/50 hover:bg-stone-800 text-stone-300 hover:text-white transition-all backdrop-blur-md border border-stone-700 shadow-lg"
         >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-semibold">{language === 'en' ? 'English' : 'ไทย'}</span>
         </button>
      </div>

      <div className="z-10 w-full max-w-md p-8 mx-4">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400/20 to-emerald-400/20 flex items-center justify-center border border-teal-500/20 shadow-2xl shadow-teal-900/30 mb-6">
            <MessageCircleHeart className="w-10 h-10 text-teal-400" />
          </div>
          <h1 className="text-4xl font-semibold text-stone-100 mb-2 tracking-tight text-center">
             {getTranslation(language, 'app_name')}
          </h1>
          <p className="text-stone-400 text-center text-lg">
             {getTranslation(language, 'app_subtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-800/40 backdrop-blur-xl border border-stone-700/50 rounded-2xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          <h2 className="text-xl font-medium text-stone-200 mb-6 text-center">
             {getTranslation(language, 'sign_in')}
          </h2>
          
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-stone-100 text-stone-900 font-medium py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-stone-950/50 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{getTranslation(language, 'sign_in_google')}</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
             <p className="text-xs text-stone-500">
               {getTranslation(language, 'terms')}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
