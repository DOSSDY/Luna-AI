
import { GoogleGenAI, Type } from '@google/genai';
import { ChatMessage, SessionAnalysis, Agent } from '../types';

export class AnalysisService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Analyzes a set of messages to produce structured scoring metrics.
   * Now agent-aware: The active agent critiques the session based on their specific values.
   */
  public async analyzeSession(messages: ChatMessage[], topic: string, agent?: Agent): Promise<SessionAnalysis | null> {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.text).join('\n');
    
    if (!userMessages.trim()) return null;

    // Use agent-specific criteria if available
    const criteria = agent?.evaluationCriteria?.join(', ') || 'Clarity, Confidence, Empathy';
    const persona = agent?.name || 'The Coach';
    const perspective = agent?.stylePrompt || 'You are a neutral communication coach.';

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Roleplay: ${perspective}
          
          Task: Analyze the following user transcript.
          Topic: "${topic}"
          
          Evaluate the user specifically on these criteria: ${criteria}.
          
          TRANSCRIPT:
          ${userMessages}
          
          Provide a JSON response with:
          - clarityScore (1-10)
          - confidenceScore (1-10)
          - empathyScore (1-10)
          - feedback (One short sentence summary in the voice of ${persona})
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
          feedback: data.feedback,
          agentId: agent?.id
        };
      }
      return null;
    } catch (e) {
      console.error('Analysis failed:', e);
      return null;
    }
  }
}
