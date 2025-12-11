
import React from 'react';
import { Mic, BookOpen, User, X, MessageCircleHeart, LogOut, PanelLeftClose, FolderOpen } from 'lucide-react';
import { AppView, UserProfile, Language } from '../types';
import { getTranslation } from '../constants';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isOpen: boolean;       // Mobile state
  onToggle: () => void;  // Mobile toggle
  desktopIsOpen?: boolean; // Desktop state
  user: UserProfile | null;
  onLogout: () => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    onNavigate, 
    isOpen, 
    onToggle, 
    desktopIsOpen = true, 
    user, 
    onLogout,
    language
}) => {
  const navItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
    { id: 'call', label: getTranslation(language, 'nav_call'), icon: <Mic className="w-5 h-5" /> },
    { id: 'context', label: getTranslation(language, 'nav_context'), icon: <FolderOpen className="w-5 h-5" /> },
    { id: 'recommendations', label: getTranslation(language, 'nav_recs'), icon: <BookOpen className="w-5 h-5" /> },
    { id: 'profile', label: getTranslation(language, 'nav_profile'), icon: <User className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />

      {/* Sidebar Container */}
      {/* On mobile: Fixed, sliding X. On Desktop: Static (relative), sliding Width. */}
      <div className={`
        fixed inset-y-0 left-0 z-30 bg-stone-900 border-r border-stone-800 
        transform transition-[transform,width] duration-300 ease-in-out
        md:static md:transform-none md:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${desktopIsOpen ? 'md:w-72' : 'md:w-0 md:border-none'}
        md:overflow-hidden flex flex-col
      `}>
        
        {/* Inner Wrapper to maintain width while parent shrinks on desktop */}
        <div className="w-72 h-full flex flex-col min-w-[18rem]">
            
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-stone-800/50">
            <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400/20 to-emerald-400/20 flex items-center justify-center border border-teal-500/10 group-hover:border-teal-500/30 transition-all">
                    <MessageCircleHeart className="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-semibold text-2xl text-stone-100 tracking-tight">
                    {getTranslation(language, 'app_name')}
                </span>
            </div>
            {/* Close Button (Mobile) */}
            <button onClick={onToggle} className="md:hidden text-stone-400 hover:text-white">
                <X className="w-6 h-6" />
            </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
                <button
                key={item.id}
                onClick={() => {
                    onNavigate(item.id);
                    if (window.innerWidth < 768) onToggle();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    currentView === item.id
                    ? 'bg-stone-800 text-teal-400 shadow-lg shadow-teal-900/10 border border-stone-700'
                    : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200 border border-transparent'
                }`}
                >
                {item.icon}
                <span className="font-medium tracking-wide">{item.label}</span>
                </button>
            ))}
            </nav>

            {/* Footer info & User Profile */}
            <div className="p-4 border-t border-stone-800/50 bg-stone-900/50">
            {user ? (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-stone-800/30 border border-stone-800">
                <div className="relative">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border border-stone-700" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-900/50 text-teal-400 flex items-center justify-center font-bold border border-teal-500/20">
                        {user.name.charAt(0)}
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-stone-800"></div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-200 truncate">{user.name}</p>
                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
                </div>
                <button 
                    onClick={onLogout}
                    className="text-stone-500 hover:text-red-400 p-1.5 hover:bg-red-900/10 rounded-lg transition-colors"
                    title={getTranslation(language, 'nav_logout')}
                >
                    <LogOut className="w-4 h-4" />
                </button>
                </div>
            ) : (
                <p className="text-xs text-stone-600 text-center py-2">
                    {getTranslation(language, 'not_signed_in')}
                </p>
            )}
            </div>
        </div>
      </div>
    </>
  );
};
