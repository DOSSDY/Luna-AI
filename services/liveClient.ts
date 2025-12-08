
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { SYSTEM_INSTRUCTION_BASE } from '../constants';
import { createAudioBlob, base64ToArrayBuffer, int16ToFloat32 } from './audioUtils';
import { LiveStatus, Scenario, Tone, UserPreferences, Agent } from '../types';

interface LiveClientCallbacks {
  onStatusChange: (status: LiveStatus) => void;
  onAudioOutput: (audioBuffer: AudioBuffer) => void;
  onVolumeChange: (inputVol: number, outputVol: number) => void;
  onTranscript: (role: 'user' | 'model', text: string, isFinal: boolean) => void;
  onError: (error: Error) => void;
  onToneChange?: (tone: Tone) => void;
}

interface ConnectConfig {
    useVideo: boolean;
    scenarioPrompt?: string;
    preferences?: UserPreferences;
    activeAgent?: Agent;
    ragContext?: string;
}

export class LiveClient {
  private ai: GoogleGenAI;
  private status: LiveStatus = LiveStatus.DISCONNECTED;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private videoStream: MediaStream | null = null;
  private videoInterval: number | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private callbacks: LiveClientCallbacks;
  private sessionPromise: Promise<any> | null = null;
  
  // Analysers for visualization
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private analysisInterval: number | null = null;

  constructor(callbacks: LiveClientCallbacks) {
    this.callbacks = callbacks;
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public async connect(config: ConnectConfig) {
    if (this.status === LiveStatus.CONNECTING || this.status === LiveStatus.CONNECTED) {
      return;
    }

    try {
      this.updateStatus(LiveStatus.CONNECTING);
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // 1. Audio Stream
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Video Stream (Optional)
      if (config.useVideo) {
          try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          } catch (e) {
            console.warn("Camera access denied or failed", e);
          }
      }

      // Initialize Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
      if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

      // Setup Analysers
      this.inputAnalyser = this.inputAudioContext.createAnalyser();
      this.outputAnalyser = this.outputAudioContext.createAnalyser();
      this.inputAnalyser.fftSize = 64;
      this.outputAnalyser.fftSize = 64;
      this.inputAnalyser.smoothingTimeConstant = 0.5;
      this.outputAnalyser.smoothingTimeConstant = 0.5;

      this.startAnalysisLoop();

      // --- CONSTRUCT SYSTEM INSTRUCTION ---
      let effectiveSystemInstruction = SYSTEM_INSTRUCTION_BASE;

      // 1. Agent Persona (Level 4 - Enhanced)
      if (config.activeAgent) {
        effectiveSystemInstruction += `\n\nYOUR PERSONA:\n${config.activeAgent.stylePrompt}\n`;
        
        // Inject Hidden Directives for Agentic Behavior
        if (config.activeAgent.hiddenDirectives?.length) {
             effectiveSystemInstruction += `\n\nOPERATIONAL DIRECTIVES (Follow these strictly):\n`;
             config.activeAgent.hiddenDirectives.forEach(d => {
                 effectiveSystemInstruction += `- ${d}\n`;
             });
        }
      }

      // 2. RAG Context (Level 3)
      if (config.ragContext) {
        effectiveSystemInstruction += `\n\nCONSULTED KNOWLEDGE BASE:\n${config.ragContext}\n`;
      }

      // 3. User Preferences (Level 5)
      if (config.preferences) {
          effectiveSystemInstruction += `\n\nUSER PERSONALIZATION:\n
          - Style: ${config.preferences.coachingStyle.toUpperCase()}.
          - Goals: ${config.preferences.focusAreas.join(', ')}.
          - Note: "${config.preferences.communicationGoal}".
          `;
      }

      // 4. Scenario
      if (config.scenarioPrompt) {
          effectiveSystemInstruction += `\n\nCURRENT SCENARIO: ${config.scenarioPrompt}\n\nCRITICAL: Start by acknowledging this context.`;
      } else {
          effectiveSystemInstruction += `\n\nCRITICAL: Start the conversation by introducing yourself as ${config.activeAgent?.name || 'Luna'}.`;
      }

      const voiceName = config.activeAgent?.voiceName || 'Zephyr';

      // Connect to Gemini Live
      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: effectiveSystemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: this.handleOnOpen.bind(this),
          onmessage: this.handleOnMessage.bind(this),
          onerror: this.handleOnError.bind(this),
          onclose: this.handleOnClose.bind(this),
        },
      });
      
      await this.sessionPromise;

      // Start Video Loop if enabled
      if (this.videoStream) {
          this.startVideoLoop();
      }

    } catch (error: any) {
      // If connect fails immediately, clean up and report
      this.sessionPromise = null;
      this.handleOnError(error);
    }
  }

  public async generateTailoredScenarios(userName: string): Promise<Scenario[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create 4 personalized communication coaching scenarios for a user named ${userName}. Return a JSON array.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                prompt: { type: Type.STRING },
              },
              required: ['id', 'label', 'prompt'],
            },
          },
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as Scenario[];
      }
      return [];
    } catch (e) {
      console.error('Error generating tailored scenarios:', e);
      return [];
    }
  }

  public async analyzeVideoSnapshot(base64Image: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { 
              text: "You are an expert non-verbal communication coach. Analyze this video frame. Identify key indicators of emotional state and confidence. Provide 2-3 short, actionable tips." 
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      });
      return response.text || "No analysis generated.";
    } catch (e) {
      console.error("Video analysis error:", e);
      throw new Error("Unable to analyze video frame.");
    }
  }

  private async wakeModel() {
      if (!this.sessionPromise) return;
      try {
          const session = await this.sessionPromise;
          const silence = new Float32Array(16000 * 0.5); 
          const blob = createAudioBlob(silence, 16000);
          session.sendRealtimeInput({ media: blob });
      } catch (e) {
          console.warn("Failed to wake model", e);
      }
  }

  public async disconnect() {
    this.stopAudioProcessing();
    this.updateStatus(LiveStatus.DISCONNECTED);

    if (this.sessionPromise) {
      const currentPromise = this.sessionPromise;
      this.sessionPromise = null; 

      try {
        const session = await currentPromise;
        if (session && typeof session.close === 'function') {
            session.close();
        }
      } catch (e) {
      }
    }
  }

  public getVideoStream(): MediaStream | null {
      return this.videoStream;
  }

  private handleOnOpen() {
    this.updateStatus(LiveStatus.CONNECTED);
    this.wakeModel();

    if (!this.inputAudioContext || !this.stream) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      // Safety check: ensure we are actually connected before processing
      if (this.status !== LiveStatus.CONNECTED || !this.sessionPromise) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const blob = createAudioBlob(inputData, 16000);
      
      const currentSessionPromise = this.sessionPromise;
      if (currentSessionPromise) {
          currentSessionPromise.then((session) => {
            // Re-check status inside the microtask to avoid race conditions on disconnect
            if (this.status !== LiveStatus.CONNECTED) return;
            try { 
                session.sendRealtimeInput({ media: blob }); 
            } catch (err) {}
          }).catch((_e) => {});
      }
    };

    if (this.inputAnalyser) this.inputSource.connect(this.inputAnalyser);
    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private startVideoLoop() {
    if (!this.videoStream) return;
    
    const videoEl = document.createElement('video');
    videoEl.srcObject = this.videoStream;
    videoEl.muted = true;
    videoEl.play();

    const canvasEl = document.createElement('canvas');
    const ctx = canvasEl.getContext('2d');
    const FRAME_RATE = 2; 

    this.videoInterval = window.setInterval(() => {
        if (!ctx || videoEl.videoWidth === 0) return;
        
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0);
        
        const base64 = canvasEl.toDataURL('image/jpeg', 0.6).split(',')[1];
        const currentSessionPromise = this.sessionPromise;

        if (currentSessionPromise && this.status === LiveStatus.CONNECTED) {
            currentSessionPromise.then(session => {
                if (this.status !== LiveStatus.CONNECTED) return;
                try {
                    session.sendRealtimeInput({
                        media: { mimeType: 'image/jpeg', data: base64 }
                    });
                } catch (e) { /* ignore */ }
            }).catch(() => {});
        }

    }, 1000 / FRAME_RATE);
  }

  private async handleOnMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;

    if (serverContent?.interrupted) {
      this.activeSources.forEach((source) => { try { source.stop(); } catch(e) {} });
      this.activeSources.clear();
      this.nextStartTime = 0;
    }

    if (serverContent?.inputTranscription) {
        this.callbacks.onTranscript('user', serverContent.inputTranscription.text || '', false);
    }
    if (serverContent?.outputTranscription) {
        const text = serverContent.outputTranscription.text || '';
        this.callbacks.onTranscript('model', text, false);

        const toneMatch = text.match(/\[TONE:\s*([a-zA-Z]+)\]/);
        if (toneMatch && toneMatch[1] && this.callbacks.onToneChange) {
            const rawTone = toneMatch[1].toLowerCase();
            let mappedTone: Tone = 'neutral';
            if (rawTone.includes('warm') || rawTone.includes('calm')) mappedTone = 'warm';
            else if (rawTone.includes('anxious') || rawTone.includes('tens')) mappedTone = 'anxious';
            else if (rawTone.includes('encourag')) mappedTone = 'encouraging';
            else if (rawTone.includes('assert')) mappedTone = 'assertive';
            
            this.callbacks.onToneChange(mappedTone);
        }
    }

    const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext) {
      try {
        const audioData = base64ToArrayBuffer(base64Audio);
        const int16Data = new Int16Array(audioData);
        const float32Data = int16ToFloat32(int16Data);
        const audioBuffer = this.outputAudioContext.createBuffer(1, float32Data.length, 24000);
        audioBuffer.getChannelData(0).set(float32Data);
        this.scheduleAudioChunk(audioBuffer);
      } catch (e) {
        console.error("Error processing audio message:", e);
      }
    }
  }

  private scheduleAudioChunk(buffer: AudioBuffer) {
    if (!this.outputAudioContext) return;
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    
    if (this.outputAnalyser) {
        source.connect(this.outputAnalyser);
        this.outputAnalyser.connect(this.outputAudioContext.destination);
    } else {
        source.connect(this.outputAudioContext.destination);
    }

    const currentTime = this.outputAudioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.activeSources.add(source);
    source.onended = () => {
      this.activeSources.delete(source);
    };
  }

  private handleOnError(error: any) {
    if (this.status === LiveStatus.DISCONNECTED) return;

    let message = "Connection error";
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null) {
        message = (error as any).message || JSON.stringify(error) || "Network connection failed.";
    }
    
    if (!message.includes("closed") && !message.includes("aborted")) {
        console.error("Live Client Error Details:", error);
        this.stopAudioProcessing();
        this.updateStatus(LiveStatus.ERROR);
        this.callbacks.onError(new Error(message));
    } else {
        this.handleOnClose(new CloseEvent("close"));
    }
  }

  private handleOnClose(event: CloseEvent) {
    this.stopAudioProcessing();
    if (this.status !== LiveStatus.DISCONNECTED) {
        this.updateStatus(LiveStatus.DISCONNECTED);
    }
  }

  private stopAudioProcessing() {
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.videoStream) { this.videoStream.getTracks().forEach(t => t.stop()); this.videoStream = null; }
    if (this.inputSource) { this.inputSource.disconnect(); this.inputSource = null; }
    if (this.processor) { this.processor.disconnect(); this.processor = null; }
    if (this.inputAudioContext) { this.inputAudioContext.close().catch(console.error); this.inputAudioContext = null; }
    if (this.outputAudioContext) { this.outputAudioContext.close().catch(console.error); this.outputAudioContext = null; }
    if (this.analysisInterval) { window.clearInterval(this.analysisInterval); this.analysisInterval = null; }
    if (this.videoInterval) { window.clearInterval(this.videoInterval); this.videoInterval = null; }
    this.activeSources.forEach(s => { try { s.stop(); } catch (e) {} });
    this.activeSources.clear();
    this.nextStartTime = 0;
  }

  private updateStatus(status: LiveStatus) {
    this.status = status;
    this.callbacks.onStatusChange(status);
  }

  private startAnalysisLoop() {
    this.analysisInterval = window.setInterval(() => {
        let inputVol = 0, outputVol = 0;
        if (this.inputAnalyser) {
            const data = new Uint8Array(this.inputAnalyser.frequencyBinCount);
            this.inputAnalyser.getByteFrequencyData(data);
            inputVol = data.reduce((a, b) => a + b, 0) / data.length;
        }
        if (this.outputAnalyser) {
            const data = new Uint8Array(this.outputAnalyser.frequencyBinCount);
            this.outputAnalyser.getByteFrequencyData(data);
            outputVol = data.reduce((a, b) => a + b, 0) / data.length;
        }
        this.callbacks.onVolumeChange(inputVol, outputVol);
    }, 50);
  }
}
