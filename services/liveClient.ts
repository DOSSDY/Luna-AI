
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { SYSTEM_INSTRUCTION, VOICE_NAME } from '../constants';
import { createAudioBlob, base64ToArrayBuffer, int16ToFloat32 } from './audioUtils';
import { LiveStatus, Scenario, Tone } from '../types';

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

      // Construct effective system instruction
      let effectiveSystemInstruction = SYSTEM_INSTRUCTION;
      if (config.scenarioPrompt) {
          effectiveSystemInstruction += `\n\nCURRENT SCENARIO CONTEXT:\nThe user has selected a specific practice scenario. ${config.scenarioPrompt}\n\nCRITICAL INSTRUCTION: You MUST speak first immediately. Start the conversation by acknowledging this context and asking the user a relevant opening question.`;
      } else {
          effectiveSystemInstruction += `\n\nCRITICAL INSTRUCTION: You MUST speak first immediately. Start the conversation by introducing yourself warmly.`;
      }

      // Connect to Gemini Live
      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
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

  /**
   * Captures a snapshot analysis using the high-reasoning Gemini 3 Pro model.
   * This provides deeper insights into body language than the streaming model.
   */
  public async analyzeVideoSnapshot(base64Image: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { 
              text: "You are an expert non-verbal communication coach. Analyze this video frame of the user. " +
                    "Identify key indicators of their emotional state, confidence level, and engagement based on facial expressions, eye contact, and posture. " +
                    "Provide 2-3 short, actionable tips to improve their presence. Keep the response concise and supportive." 
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
          // Send 0.5s of silence to trigger the model's turn if it's waiting for input
          // This acts as a "start signal" without user needing to speak
          const silence = new Float32Array(16000 * 0.5); 
          const blob = createAudioBlob(silence, 16000);
          session.sendRealtimeInput({ media: blob });
      } catch (e) {
          console.warn("Failed to wake model", e);
      }
  }

  public async disconnect() {
    // 1. Stop processing FIRST to prevent new data from entering the pipeline
    this.stopAudioProcessing();
    this.updateStatus(LiveStatus.DISCONNECTED);

    // 2. Close session safely
    if (this.sessionPromise) {
      const currentPromise = this.sessionPromise;
      this.sessionPromise = null; // Detach immediately to prevent race conditions

      try {
        const session = await currentPromise;
        if (session && typeof session.close === 'function') {
            session.close();
        }
      } catch (e) {
          // Swallow errors during close, as we are disconnecting anyway
      }
    }
  }

  public getVideoStream(): MediaStream | null {
      return this.videoStream;
  }

  private handleOnOpen() {
    this.updateStatus(LiveStatus.CONNECTED);
    
    // Trigger the model to speak first by sending a silent "poke"
    this.wakeModel();

    if (!this.inputAudioContext || !this.stream) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      // CRITICAL: Strict check to ensure we don't send data if disconnected or tearing down
      if (this.status !== LiveStatus.CONNECTED || !this.sessionPromise) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const blob = createAudioBlob(inputData, 16000);
      
      // Capture local reference
      const currentSessionPromise = this.sessionPromise;
      
      if (currentSessionPromise) {
          currentSessionPromise.then((session) => {
            // Re-check status inside the promise resolution to avoid race condition
            if (this.status !== LiveStatus.CONNECTED) return;
            try { 
                session.sendRealtimeInput({ media: blob }); 
            } catch (err) { 
                // Silently fail if send fails (e.g. network glitch or closed socket)
            }
          }).catch((_e) => {
             // Silently swallow unhandled rejections from the promise chain
          });
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

    // Send frames at 2 FPS to reduce bandwidth but maintain body language context
    const FRAME_RATE = 2; 

    this.videoInterval = window.setInterval(() => {
        if (!ctx || videoEl.videoWidth === 0) return;
        
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0);
        
        const base64 = canvasEl.toDataURL('image/jpeg', 0.6).split(',')[1];

        // Ensure session exists and is connected before sending video frame
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

    // Transcription Handling
    if (serverContent?.inputTranscription) {
        this.callbacks.onTranscript('user', serverContent.inputTranscription.text || '', false);
    }
    if (serverContent?.outputTranscription) {
        const text = serverContent.outputTranscription.text || '';
        this.callbacks.onTranscript('model', text, false);

        // Parse Tone Tag if present [TONE: ...]
        const toneMatch = text.match(/\[TONE:\s*([a-zA-Z]+)\]/);
        if (toneMatch && toneMatch[1] && this.callbacks.onToneChange) {
            const rawTone = toneMatch[1].toLowerCase();
            let mappedTone: Tone = 'neutral';
            if (rawTone.includes('warm') || rawTone.includes('calm')) mappedTone = 'warm';
            else if (rawTone.includes('anxious') || rawTone.includes('tens') || rawTone.includes('fast')) mappedTone = 'anxious';
            else if (rawTone.includes('encourag') || rawTone.includes('excit')) mappedTone = 'encouraging';
            else if (rawTone.includes('assert') || rawTone.includes('confiden')) mappedTone = 'assertive';
            
            this.callbacks.onToneChange(mappedTone);
        }
    }
    if (serverContent?.turnComplete) {
         // Could mark transcript as final here if we were aggregating parts
    }

    // Audio Handling
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
    // If we are already disconnected, ignore errors
    if (this.status === LiveStatus.DISCONNECTED) return;

    let message = "Connection error";
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null) {
        message = (error as any).message || "Network connection failed.";
    }
    
    // Only log real errors, not close events
    if (!message.includes("closed") && !message.includes("aborted")) {
        console.error("Live Client Error Details:", error);
        this.stopAudioProcessing();
        this.updateStatus(LiveStatus.ERROR);
        this.callbacks.onError(new Error(message));
    } else {
        // Treat as disconnect
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
