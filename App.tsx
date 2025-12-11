
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveClient } from './services/liveClient';
import { LiveStatus, ChatMessage, Scenario, ScenarioType, AppView, UserProfile, UserPreferences, Agent, Language, KnowledgeAsset, ServiceTier } from './types';
import { SCENARIOS, AGENTS, getTranslation, getLocalizedAgents, getLocalizedScenarios } from './constants';
import { StorageService } from './services/storage';
import { AnalysisService } from './services/analysisService';
import { KnowledgeService } from './services/knowledgeService';
import { Visualizer } from './components/Visualizer';
import { ControlPanel } from './components/ControlPanel';
import { Transcript } from './components/Transcript';
import { Sidebar } from './components/Sidebar';
import { Recommendations } from './components/Recommendations';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { AgentSelector } from './components/AgentSelector';
import { ContextManager } from './components/ContextManager';
import { TierSelector } from './components/TierSelector';
import { Sparkles, Video, VideoOff, BrainCircuit, PanelLeftOpen, PanelLeftClose, ScanEye, X, Loader2, Trophy, Target, Globe, Key } from 'lucide-react';

const App: React.FC = () => {
  // Auth & User State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Localization & Tier State
  const [language, setLanguage] = useState<Language>('en');
  const [serviceTier, setServiceTier] = useState<ServiceTier>('standard');

  const [status, setStatus] = useState<LiveStatus>(LiveStatus.DISCONNECTED);
  const [inputVol, setInputVol] = useState(0);
  const [outputVol, setOutputVol] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Advanced Features State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [useCamera, setUseCamera] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('general');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(AGENTS[0].id);
  const [customGoal, setCustomGoal] = useState('');
  const [dynamicScenarios, setDynamicScenarios] = useState<Scenario[]>([]);
  const [videoAnalysis, setVideoAnalysis] = useState<{ loading: boolean; result: string | null }>({ loading: false, result: null });
  const [isAnalyzingSession, setIsAnalyzingSession] = useState(false);
  const [knowledgeAssets, setKnowledgeAssets] = useState<KnowledgeAsset[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('call');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(true);

  const liveClientRef = useRef<LiveClient | null>(null);
  const analysisServiceRef = useRef<AnalysisService>(new AnalysisService());

  // Load User from Storage on Mount
  useEffect(() => {
    const storedUser = StorageService.getUser();
    if (storedUser) {
      setUser(storedUser);
      setKnowledgeAssets(storedUser.knowledgeAssets || []);
      // Check if preferences are missing to show onboarding again (migration support)
      if (!storedUser.preferences) setShowOnboarding(true);
    }
  }, []);

  // Handle Login
  const handleLogin = (loggedInUser: UserProfile, lang: Language, tier: ServiceTier) => {
    setLanguage(lang);
    setServiceTier(tier);
    // Check if we have a stored version of this user to preserve history
    const stored = StorageService.getUser();
    if (stored && stored.id === loggedInUser.id) {
        setUser(stored);
        if (!stored.preferences) setShowOnboarding(true);
        if (stored.knowledgeAssets) setKnowledgeAssets(stored.knowledgeAssets);
    } else {
        setUser({ ...loggedInUser, history: [] }); // Initialize new history
        setShowOnboarding(true); // New user needs onboarding
        StorageService.saveUser({ ...loggedInUser, history: [] });
    }
  };

  // Handle Onboarding Completion
  const handleOnboardingComplete = (prefs: UserPreferences) => {
    if (user) {
        const updatedUser = { ...user, preferences: prefs };
        setUser(updatedUser);
        StorageService.saveUser(updatedUser);
        setShowOnboarding(false);
    }
  };

  // Update Assets Logic
  const handleUpdateAssets = (newAssets: KnowledgeAsset[]) => {
      setKnowledgeAssets(newAssets);
      if (user) {
          const updatedUser = { ...user, knowledgeAssets: newAssets };
          setUser(updatedUser);
          StorageService.saveUser(updatedUser);
      }
  };

  // Load Dynamic Scenarios when User changes
  useEffect(() => {
    if (user && liveClientRef.current) {
        liveClientRef.current.generateTailoredScenarios(user)
            .then(scenarios => {
                if (scenarios && scenarios.length > 0) {
                    setDynamicScenarios(scenarios);
                }
            })
            .catch(console.error);
    }
  }, [user]);

  // Combined Scenarios (Static + Dynamic) - Localized
  const localizedScenarios = getLocalizedScenarios(language);
  const displayScenarios = dynamicScenarios.length > 0 ? dynamicScenarios : localizedScenarios;
  const localizedAgents = getLocalizedAgents(language);

  useEffect(() => {
    liveClientRef.current = new LiveClient({
      onStatusChange: (newStatus) => setStatus(newStatus),
      onAudioOutput: () => {}, 
      onVolumeChange: (inV, outV) => {
        setInputVol(inV);
        setOutputVol(outV);
      },
      onTranscript: (role, text, isFinal) => {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          // Simple debouncing/concatenation for demo purposes
          if (lastMsg && lastMsg.role === role && !lastMsg.isFinal) {
             const updated = [...prev];
             updated[updated.length - 1] = { ...lastMsg, text: lastMsg.text + text };
             return updated;
          }
          return [...prev, { id: Date.now().toString(), role, text, isFinal }];
        });
      },
      onError: (err) => {
        console.error(err);
        setErrorMsg(err.message || "Connection error. Please try again.");
        setStatus(LiveStatus.ERROR);
      }
    });
    
    return () => {
      liveClientRef.current?.disconnect();
    };
  }, []);

  // Handle Video Preview
  useEffect(() => {
    if (status === LiveStatus.CONNECTED && useCamera && videoRef.current) {
        const stream = liveClientRef.current?.getVideoStream();
        if (stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Video play error", e));
        }
    }
  }, [status, useCamera, currentView]);

  const handleConnect = useCallback(async (overrideScenarioId?: string) => {
    const targetScenarioId = overrideScenarioId || selectedScenario;
    if (overrideScenarioId) setSelectedScenario(overrideScenarioId as ScenarioType);

    setErrorMsg(null);
    setMessages([]);

    // API Key Check
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      const hasKey = await aiStudio.hasSelectedApiKey();
      if (!hasKey) {
          try {
              await aiStudio.openSelectKey();
          } catch (e) {
              setErrorMsg("Failed to select API key.");
              return;
          }
      }
    }

    // Update status to Researching (shows UI loader)
    setStatus(LiveStatus.RESEARCHING);
    
    // 1. Resolve Scenario & Context
    const scenario = displayScenarios.find(s => s.id === targetScenarioId);
    let scenarioPrompt = scenario?.id !== 'general' ? `User Scenario: "${scenario?.label}". Context: ${scenario?.prompt}` : '';
    if (customGoal.trim()) {
        scenarioPrompt += ` | User Goal: "${customGoal.trim()}"`;
    }

    // 2. Resolve Agent
    const activeAgent = localizedAgents.find(a => a.id === selectedAgentId) || localizedAgents[0];

    // 3. Resolve RAG Context (Hybrid Research Engine)
    const focusAreas = user?.preferences?.focusAreas || [];
    let ragContext = '';
    
    try {
        // Pass serviceTier to knowledge service to avoid billing calls if Standard
        ragContext = await KnowledgeService.findOrFetchContext(customGoal, scenario?.label || '', focusAreas, serviceTier);
    } catch (e) {
        console.error("Context retrieval failed", e);
    }

    await liveClientRef.current?.connect({ 
        useVideo: useCamera,
        scenarioPrompt,
        preferences: user?.preferences,
        activeAgent,
        ragContext,
        language,
        knowledgeAssets: knowledgeAssets.filter(a => a.isActive),
        serviceTier
    });
    
  }, [useCamera, selectedScenario, displayScenarios, customGoal, user, selectedAgentId, language, localizedAgents, knowledgeAssets, serviceTier]);

  const handleDisconnect = useCallback(async () => {
    await liveClientRef.current?.disconnect();
    
    // TRIGGER AUTO-ANALYSIS ON DISCONNECT
    if (messages.length > 4) { // Only analyze significant conversations
       setIsAnalyzingSession(true);
       try {
         const scenarioLabel = displayScenarios.find(s => s.id === selectedScenario)?.label || 'General';
         const activeAgent = localizedAgents.find(a => a.id === selectedAgentId);
         
         // Pass serviceTier for analysis model selection
         const analysis = await analysisServiceRef.current.analyzeSession(messages, scenarioLabel, activeAgent, serviceTier);
         
         if (analysis) {
             const updatedUser = StorageService.addSessionAnalysis(analysis);
             if (updatedUser) setUser(updatedUser);
         }
       } catch(e) {
           console.error("Analysis failed", e);
       } finally {
           setIsAnalyzingSession(false);
       }
    }

  }, [messages, selectedScenario, displayScenarios, selectedAgentId, localizedAgents, serviceTier]);

  const handleAnalyzeVideo = async () => {
    if (!videoRef.current || !liveClientRef.current) return;
    
    setVideoAnalysis({ loading: true, result: null });
    
    try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            
            const result = await liveClientRef.current.analyzeVideoSnapshot(base64, serviceTier);
            setVideoAnalysis({ loading: false, result });
        }
    } catch (e) {
        setVideoAnalysis({ loading: false, result: "Failed to analyze video." });
    }
  };

  const toggleMenu = () => {
      if (window.innerWidth >= 768) {
          setDesktopMenuOpen(!desktopMenuOpen);
      } else {
          setMobileMenuOpen(!mobileMenuOpen);
      }
  };

  // Insight Progress Calculation
  const userMsgCount = messages.filter(m => m.role === 'user').length;
  const insightThreshold = 10;
  const insightProgress = Math.min((userMsgCount / insightThreshold) * 100, 100);

  // -- Views Components --
  const activeAgent = localizedAgents.find(a => a.id === selectedAgentId) || localizedAgents[0];

  const renderCallView = () => (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
        
        {/* Header */}
        <div className="flex-none z-20 w-full flex flex-col px-4 py-3 md:py-4 gap-2">
            <div className="flex justify-between items-center w-full">
                <button 
                    onClick={toggleMenu} 
                    className="p-2 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-stone-800/50"
                    title={desktopMenuOpen ? "Close Sidebar" : "Open Sidebar"}
                >
                    {desktopMenuOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
                </button>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg tracking-tight text-stone-100 hidden md:block">
                      {getTranslation(language, 'session')}
                    </span>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Tier Selector */}
                    {status === LiveStatus.DISCONNECTED && (
                        <TierSelector tier={serviceTier} onChange={setServiceTier} language={language} variant="header" />
                    )}

                    {/* Language Toggle */}
                    <button
                        onClick={() => setLanguage(prev => prev === 'en' ? 'th' : 'en')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-all text-xs font-bold tracking-wide border border-stone-700"
                    >
                        <Globe className="w-3.5 h-3.5" />
                        {language === 'en' ? 'EN' : 'TH'}
                    </button>

                    <button 
                        onClick={() => status === LiveStatus.DISCONNECTED && setUseCamera(!useCamera)}
                        className={`p-2 rounded-full transition-all border ${useCamera ? 'bg-stone-800 text-teal-400 border-teal-900/50' : 'text-stone-500 border-transparent hover:bg-stone-800'}`}
                        title={useCamera ? "Camera On" : "Camera Off"}
                        disabled={status !== LiveStatus.DISCONNECTED}
                    >
                        {useCamera ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            
            {/* Live Insight Progress Indicator */}
            {status === LiveStatus.CONNECTED && (
                <div className="w-full max-w-xs mx-auto flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-1000 ease-out"
                            style={{ width: `${insightProgress}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-teal-500 uppercase tracking-wider whitespace-nowrap">
                        {insightProgress < 100 ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {getTranslation(language, 'gathering_insights')}
                            </>
                        ) : (
                            <>
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                {getTranslation(language, 'insights_ready')}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4 min-h-0 relative">
            
            {/* Top Spacer */}
            <div className="flex-[0.2]" />

            {/* Intro Header */}
            {status === LiveStatus.DISCONNECTED && (
                <div className="w-full flex flex-col items-center text-center mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
                    <h2 className="text-2xl md:text-3xl font-semibold text-stone-100 mb-1 tracking-tight">
                        {getTranslation(language, 'anything_luna_know')}
                    </h2>
                    <p className="text-stone-400 text-sm md:text-base font-light">
                        {getTranslation(language, 'call_subtext')}
                    </p>
                </div>
            )}

            {/* CONFIGURATION PANEL (CLEANED UP) */}
            {status === LiveStatus.DISCONNECTED && (
                <div className="w-full max-w-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 z-20">
                    
                    {/* Agent Section */}
                    <div className="flex flex-col gap-2">
                        <AgentSelector 
                            selectedAgentId={selectedAgentId} 
                            onSelect={(agent) => setSelectedAgentId(agent.id)}
                            localizedAgents={localizedAgents}
                            language={language}
                        />
                    </div>

                    {/* Scenario & Goals Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Scenario Picker */}
                         <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-1">Scenario Context</span>
                             <div className="grid grid-cols-2 gap-2">
                                {displayScenarios.slice(0, 4).map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedScenario(prev => prev === s.id ? 'general' : s.id as ScenarioType)}
                                        className={`p-2 rounded-lg text-left text-xs transition-all border relative overflow-hidden ${
                                            selectedScenario === s.id 
                                            ? 'bg-stone-800 border-teal-500/30 text-teal-100' 
                                            : 'bg-stone-800/30 border-transparent text-stone-400 hover:bg-stone-800/50'
                                        }`}
                                    >
                                        <div className="font-medium truncate">{s.label}</div>
                                    </button>
                                ))}
                            </div>
                         </div>

                         {/* Goal Input */}
                         <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-1">Specific Goal</span>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={customGoal}
                                    onChange={(e) => setCustomGoal(e.target.value)}
                                    placeholder={getTranslation(language, 'custom_goal_placeholder')}
                                    className="w-full bg-stone-900/40 border border-stone-800 rounded-lg px-3 py-2.5 pl-9 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-teal-500/40 focus:bg-stone-900/60 transition-all text-sm"
                                />
                                <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Text / Analysis Loader */}
            <div className="flex-none h-6 flex items-center justify-center my-2 w-full">
                {isAnalyzingSession ? (
                    <span className="text-teal-400 text-sm font-medium animate-pulse flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {getTranslation(language, 'generating_report')}
                    </span>
                ) : status === LiveStatus.CONNECTED ? (
                    <span className="text-teal-400/80 text-xs font-bold tracking-[0.2em] uppercase animate-pulse flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                    {getTranslation(language, 'live_session_active')}
                    </span>
                ) : status === LiveStatus.ERROR ? (
                   <div className="flex items-center gap-3 bg-red-950/30 px-4 py-1.5 rounded-full border border-red-900/50 animate-in fade-in">
                     <span className="text-red-400 text-sm font-medium">{errorMsg}</span>
                     {errorMsg?.includes('permission') && (
                       <button 
                         onClick={() => (window as any).aistudio.openSelectKey()}
                         className="flex items-center gap-1 bg-red-900/30 text-red-300 px-3 py-1 rounded-full text-xs hover:bg-red-900/50 border border-red-800 transition-colors"
                       >
                         <Key className="w-3 h-3" />
                         Change Key
                       </button>
                     )}
                   </div>
                ) : null}
            </div>

            {/* Visualizer & Video Stack */}
            <div className={`w-full flex items-center justify-center relative transition-all duration-500 min-h-0 ${status === LiveStatus.CONNECTED ? 'flex-[2]' : 'flex-1'}`}>
                <Visualizer 
                    inputVolume={inputVol} 
                    outputVolume={outputVol} 
                    isActive={status === LiveStatus.CONNECTED}
                />
                
                {/* Camera Preview PIP */}
                {status === LiveStatus.CONNECTED && useCamera && (
                    <div className="absolute top-4 right-4 md:bottom-4 md:right-4 md:top-auto w-32 h-24 md:w-56 md:h-40 bg-stone-950 rounded-lg overflow-hidden border border-stone-800 shadow-2xl z-20 group">
                        <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay muted playsInline />
                        
                        {/* Analysis Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                                onClick={handleAnalyzeVideo}
                                className="bg-teal-600/90 hover:bg-teal-500 text-white p-2 rounded-full shadow-lg transform transition-transform hover:scale-110"
                                title="Analyze Body Language (AI Vision)"
                            >
                                <ScanEye className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Results Overlay */}
                        {(videoAnalysis.loading || videoAnalysis.result) && (
                            <div className="absolute inset-0 bg-stone-900/95 p-3 overflow-y-auto animate-in fade-in duration-300 custom-scrollbar">
                                {videoAnalysis.loading ? (
                                    <div className="flex flex-col items-center justify-center h-full text-teal-400">
                                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                        <span className="text-[10px] uppercase tracking-widest">Analyzing...</span>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button 
                                            onClick={() => setVideoAnalysis({ loading: false, result: null })}
                                            className="absolute -top-1 -right-1 text-stone-500 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <h4 className="text-[10px] uppercase font-bold text-teal-500 mb-1">Body Language Insights</h4>
                                        <p className="text-xs text-stone-300 leading-relaxed whitespace-pre-wrap">
                                            {videoAnalysis.result}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Transcript Area */}
            {status === LiveStatus.CONNECTED && (
                 <div className="flex-1 w-full min-h-0 mt-2 flex flex-col justify-end relative">
                    <div className="flex-1 min-h-0 overflow-hidden relative">
                         <Transcript messages={messages} agentName={activeAgent.name} />
                    </div>
                 </div>
            )}

            {/* Call to Action Text */}
            {status === LiveStatus.DISCONNECTED && (
                <div className="flex-none text-center text-stone-500 text-sm max-w-[280px] leading-relaxed mt-4 animate-in fade-in slide-in-from-bottom-2 delay-300">
                    <p className="mb-4">
                        {selectedScenario === 'general' && !customGoal
                            ? getTranslation(language, 'tap_mic_general')
                            : getTranslation(language, 'tap_mic_context')}
                    </p>
                </div>
            )}
            
            <div className="flex-[0.5]" />
        </div>

        {/* Footer Controls */}
        <div className="flex-none z-20 w-full py-4 md:py-8 flex justify-center bg-gradient-to-t from-stone-900 to-transparent">
            <ControlPanel 
                status={status} 
                onConnect={() => handleConnect()} 
                onDisconnect={handleDisconnect} 
                language={language}
            />
        </div>
    </div>
  );

  const renderSecondaryHeader = () => (
      <div className="p-4 flex items-center justify-between flex-none">
          <div className="flex items-center">
            <button 
                onClick={toggleMenu} 
                className="p-2 text-stone-400 hover:text-white transition-colors"
            >
                {desktopMenuOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftClose className="w-6 h-6" />}
            </button>
            <span className="ml-4 font-semibold text-lg text-stone-100 capitalize">
                {currentView === 'recommendations' 
                    ? getTranslation(language, 'nav_recs') 
                    : currentView === 'context'
                    ? getTranslation(language, 'context_hub')
                    : getTranslation(language, 'nav_profile')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle for Secondary Views */}
            <button
                    onClick={() => setLanguage(prev => prev === 'en' ? 'th' : 'en')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-all text-xs font-bold tracking-wide border border-stone-700"
            >
                    <Globe className="w-3.5 h-3.5" />
                    {language === 'en' ? 'EN' : 'TH'}
            </button>
          </div>
      </div>
  );

  if (!user) {
    return <Login onLogin={handleLogin} initialLanguage={language} />;
  }

  return (
    <div className="flex h-[100dvh] bg-stone-900 font-sans text-stone-100 overflow-hidden relative">
      
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        isOpen={mobileMenuOpen} 
        onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        desktopIsOpen={desktopMenuOpen}
        user={user}
        onLogout={() => { setUser(null); StorageService.clear(); }}
        language={language}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col w-full">
        {/* Global Background Ambience */}
        <div className="blob bg-teal-900/20 w-[120vh] h-[120vh] rounded-full top-[-40vh] left-[-40vh] absolute mix-blend-screen pointer-events-none blur-[100px]" />
        <div className="blob bg-orange-900/20 w-[120vh] h-[120vh] rounded-full bottom-[-40vh] right-[-40vh] absolute mix-blend-screen animation-delay-2000 pointer-events-none blur-[100px]" />

        {currentView === 'call' && renderCallView()}
        
        {currentView === 'recommendations' && (
            <div className="h-full flex flex-col overflow-y-auto relative z-10">
                {renderSecondaryHeader()}
                <Recommendations messages={messages} />
            </div>
        )}
        
        {currentView === 'profile' && (
             <div className="h-full flex flex-col overflow-y-auto relative z-10">
                {renderSecondaryHeader()}
                <Profile messages={messages} user={user} />
            </div>
        )}

        {currentView === 'context' && (
            <div className="h-full flex flex-col overflow-y-auto relative z-10">
               {renderSecondaryHeader()}
               <ContextManager 
                  assets={knowledgeAssets} 
                  onUpdate={handleUpdateAssets} 
                  language={language}
               />
            </div>
        )}
      </main>

    </div>
  );
};

export default App;
