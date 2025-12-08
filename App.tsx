import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveClient } from './services/liveClient';
import { LiveStatus, ChatMessage, Scenario, ScenarioType, AppView, UserProfile } from './types';
import { SCENARIOS } from './constants';
import { Visualizer } from './components/Visualizer';
import { ControlPanel } from './components/ControlPanel';
import { Transcript } from './components/Transcript';
import { Sidebar } from './components/Sidebar';
import { Recommendations } from './components/Recommendations';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { Sparkles, Video, VideoOff, BrainCircuit, PanelLeftOpen, PanelLeftClose, ScanEye, X, Loader2, Trophy, Target } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);

  const [status, setStatus] = useState<LiveStatus>(LiveStatus.DISCONNECTED);
  const [inputVol, setInputVol] = useState(0);
  const [outputVol, setOutputVol] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Advanced Features State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [useCamera, setUseCamera] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('general');
  const [customGoal, setCustomGoal] = useState('');
  const [dynamicScenarios, setDynamicScenarios] = useState<Scenario[]>([]);
  const [videoAnalysis, setVideoAnalysis] = useState<{ loading: boolean; result: string | null }>({ loading: false, result: null });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('call');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(true);

  const liveClientRef = useRef<LiveClient | null>(null);

  // Load Dynamic Scenarios on User Login
  useEffect(() => {
    if (user && liveClientRef.current) {
        // Attempt to generate tailored scenarios
        liveClientRef.current.generateTailoredScenarios(user.name)
            .then(scenarios => {
                if (scenarios && scenarios.length > 0) {
                    setDynamicScenarios(scenarios);
                }
            })
            .catch(console.error);
    }
  }, [user]);

  // Combine static and dynamic scenarios
  const displayScenarios = dynamicScenarios.length > 0 ? dynamicScenarios : SCENARIOS;

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
        setErrorMsg("Connection error. Please try again.");
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
  }, [status, useCamera, currentView]); // Re-attach if view changes back to call

  const handleConnect = useCallback(async (overrideScenarioId?: string) => {
    const targetScenarioId = overrideScenarioId || selectedScenario;
    if (overrideScenarioId) setSelectedScenario(overrideScenarioId as ScenarioType);

    setErrorMsg(null);
    setMessages([]);
    if (!process.env.API_KEY) {
      setErrorMsg("API Key not found.");
      return;
    }
    
    // Inject Scenario Prompt via System Instruction Extension
    const scenario = displayScenarios.find(s => s.id === targetScenarioId);
    
    let promptParts = [];
    if (scenario && scenario.id !== 'general') {
        promptParts.push(`User Scenario Selection: "${scenario.label}". Base Context: ${scenario.prompt}`);
    }
    if (customGoal.trim()) {
        promptParts.push(`User Specific Goal/Context: "${customGoal.trim()}"`);
    }

    const scenarioPrompt = promptParts.length > 0 ? promptParts.join(' | ') : undefined;

    await liveClientRef.current?.connect({ 
        useVideo: useCamera,
        scenarioPrompt
    });
    
  }, [useCamera, selectedScenario, displayScenarios, customGoal]);

  const handleDisconnect = useCallback(async () => {
    await liveClientRef.current?.disconnect();
  }, []);

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
            
            const result = await liveClientRef.current.analyzeVideoSnapshot(base64);
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
                    <span className="font-semibold text-lg tracking-tight text-stone-100 hidden md:block">Session</span>
                </div>
                <div className="flex gap-2">
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
                                Gathering Insights
                            </>
                        ) : (
                            <>
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                Insights Ready
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Main Content Area - Strictly Flexible with min-h-0 to prevent overflow */}
        <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4 min-h-0 relative">
            
            {/* Top Spacer */}
            <div className="flex-[0.5]" />

            {/* Intro Header */}
            {status === LiveStatus.DISCONNECTED && (
                <div className="w-full flex flex-col items-center text-center mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
                    <h2 className="text-2xl md:text-3xl font-semibold text-stone-100 mb-2 tracking-tight">
                        Anything Luna should know?
                    </h2>
                    <p className="text-stone-400 text-sm md:text-base font-light">
                        Call to strengthen your communication skills with Luna
                    </p>
                </div>
            )}

            {/* Scenario Selector & Custom Goal */}
            {status === LiveStatus.DISCONNECTED && (
                <div className="w-full flex-none flex flex-col gap-4 mb-2 md:mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-4xl z-20">
                    
                    <div className="flex flex-col gap-2">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Select a Focus (Optional)</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {displayScenarios.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedScenario(prev => prev === s.id ? 'general' : s.id as ScenarioType)}
                                    className={`p-3 md:p-4 rounded-xl text-left text-sm transition-all border relative overflow-hidden group ${
                                        selectedScenario === s.id 
                                        ? 'bg-stone-800 border-teal-500/50 text-teal-100 shadow-lg shadow-teal-900/20' 
                                        : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                                    }`}
                                >
                                    {selectedScenario === s.id && <div className="absolute inset-0 bg-teal-500/5 pointer-events-none" />}
                                    <div className="font-medium text-sm md:text-base mb-1 relative z-10">{s.label}</div>
                                    <div className="text-xs opacity-60 truncate leading-tight relative z-10">{s.prompt}</div>
                                    {/* Rendering hint if it exists */}
                                    {(s as any).hint && (
                                        <div className="text-[10px] text-teal-500/80 mt-1 font-medium relative z-10">{(s as any).hint}</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Goal Input */}
                     <div className="w-full">
                         <div className="relative group">
                            <input
                                type="text"
                                value={customGoal}
                                onChange={(e) => setCustomGoal(e.target.value)}
                                placeholder={
                                    selectedScenario === 'general' 
                                    ? "Add a specific goal (e.g., 'I want to work on my tone')..." 
                                    : `Add details for ${displayScenarios.find(s => s.id === selectedScenario)?.label}...`
                                }
                                className="w-full bg-stone-800/40 border border-stone-800 rounded-xl px-4 py-3 pl-10 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-teal-500/50 focus:bg-stone-800 transition-all text-sm shadow-inner"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-teal-500 transition-colors">
                                <Target className="w-4 h-4" />
                            </div>
                            {customGoal && (
                                <button 
                                    onClick={() => setCustomGoal('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white p-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* Status Text */}
            <div className="flex-none h-6 flex items-center justify-center my-1 w-full">
                {status === LiveStatus.CONNECTED ? (
                    <span className="text-teal-400/80 text-xs font-bold tracking-[0.2em] uppercase animate-pulse flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                    {selectedScenario === 'general' ? 'Live Session' : displayScenarios.find(s => s.id === selectedScenario)?.label} Active
                    </span>
                ) : status === LiveStatus.ERROR ? (
                    <span className="text-red-400 text-sm font-medium">{errorMsg}</span>
                ) : null}
            </div>

            {/* Visualizer & Video Stack - Flexible */}
            <div className={`w-full flex items-center justify-center relative transition-all duration-500 min-h-0 ${status === LiveStatus.CONNECTED ? 'flex-[2]' : 'flex-1'}`}>
                <Visualizer 
                    inputVolume={inputVol} 
                    outputVolume={outputVol} 
                    isActive={status === LiveStatus.CONNECTED}
                />
                
                {/* Camera Preview PIP with Video Analysis */}
                {status === LiveStatus.CONNECTED && useCamera && (
                    <div className="absolute bottom-0 right-4 w-32 h-24 md:w-56 md:h-40 bg-stone-950 rounded-lg overflow-hidden border border-stone-800 shadow-2xl z-20 group">
                        <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay muted playsInline />
                        
                        {/* Analysis Trigger Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                                onClick={handleAnalyzeVideo}
                                className="bg-teal-600/90 hover:bg-teal-500 text-white p-2 rounded-full shadow-lg transform transition-transform hover:scale-110"
                                title="Analyze Body Language (Gemini Pro)"
                            >
                                <ScanEye className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Analysis Result Overlay */}
                        {(videoAnalysis.loading || videoAnalysis.result) && (
                            <div className="absolute inset-0 bg-stone-900/95 p-3 overflow-y-auto animate-in fade-in duration-300">
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
                         <Transcript messages={messages} />
                    </div>
                 </div>
            )}

            {/* Call to Action Helper Text */}
            {status === LiveStatus.DISCONNECTED && (
                <div className="flex-none text-center text-stone-500 text-sm max-w-[280px] leading-relaxed mt-4 animate-in fade-in slide-in-from-bottom-2 delay-300">
                    <p className="mb-4">
                        {selectedScenario === 'general' && !customGoal
                            ? "Ready to practice? Tap the microphone below." 
                            : "Tap mic to start session with your selected context."}
                    </p>
                    <div className="flex justify-center gap-4 opacity-50">
                        <BrainCircuit className="w-6 h-6" />
                        <Video className="w-6 h-6" />
                    </div>
                </div>
            )}
            
            {/* Bottom Spacer */}
            <div className="flex-[0.5]" />

        </div>

        {/* Footer Controls - Fixed height in flex flow */}
        <div className="flex-none z-20 w-full py-4 md:py-8 flex justify-center bg-gradient-to-t from-stone-900 to-transparent">
            <ControlPanel 
                status={status} 
                onConnect={() => handleConnect()} 
                onDisconnect={handleDisconnect} 
            />
        </div>
    </div>
  );

  const renderSecondaryHeader = () => (
      <div className="p-4 flex items-center flex-none">
          <button 
            onClick={toggleMenu} 
            className="p-2 text-stone-400 hover:text-white transition-colors"
          >
             {desktopMenuOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
          </button>
          <span className="ml-4 font-semibold text-lg text-stone-100 capitalize">
              {currentView === 'recommendations' ? 'Recommended Resources' : 'My Profile'}
          </span>
      </div>
  );

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="flex h-[100dvh] bg-stone-900 font-sans text-stone-100 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        isOpen={mobileMenuOpen} 
        onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        desktopIsOpen={desktopMenuOpen}
        user={user}
        onLogout={() => setUser(null)}
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
      </main>

    </div>
  );
};

export default App;