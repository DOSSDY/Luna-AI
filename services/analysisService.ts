
import { GoogleGenAI, Type } from '@google/genai';
import { ChatMessage, SessionAnalysis } from '../types';

export class AnalysisService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Analyzes a set of messages to produce structured scoring metrics.
   */
  public async analyzeSession(messages: ChatMessage[], topic: string): Promise<SessionAnalysis | null> {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.text).join('\n');
    
    if (!userMessages.trim()) return null;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Analyze the following user communication transcript based on the topic: "${topic}".
          
          TRANSCRIPT:
          ${userMessages}
          
          Provide a JSON response with:
          - clarityScore (1-10)
          - confidenceScore (1-10)
          - empathyScore (1-10)
          - feedback (One short sentence summary of their performance)
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clarityScore: { type: Type.NUMBER },
              confidenceScore: { type: Type.NUMBER },
              empathyScore: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
            },
            required: ['clarityScore', 'confidenceScore', 'empathyScore', 'feedback'],
          },
        },
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        return {
          id: Date.now().toString(),
          timestamp: Date.now(),
          topic,
          clarityScore: data.clarityScore,
          confidenceScore: data.confidenceScore,
          empathyScore: data.empathyScore,
          feedback: data.feedback
        };
      }
      return null;
    } catch (e) {
      console.error('Analysis failed:', e);
      return null;
    }
  }
}
