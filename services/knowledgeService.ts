
import { GoogleGenAI } from '@google/genai';
import { KNOWLEDGE_LIBRARY } from '../data/knowledgeBase';
import { KnowledgeSnippet, ServiceTier } from '../types';

// Simple in-memory cache to avoid re-embedding the static library every time
let libraryEmbeddingsCache: { id: string; embedding: number[] }[] | null = null;

export class KnowledgeService {
  // Removed static instance to ensure fresh key usage

  /**
   * Calculates Cosine Similarity between two vectors.
   * Returns a value between -1 and 1 (1 being identical).
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Generates embeddings for the static library. 
   */
  private static async getLibraryEmbeddings(): Promise<{ id: string; embedding: number[] }[]> {
    if (libraryEmbeddingsCache) return libraryEmbeddingsCache;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // We process these in parallel
    const promises = KNOWLEDGE_LIBRARY.map(async (snippet) => {
      const textToEmbed = `${snippet.title} ${snippet.tags.join(' ')}: ${snippet.content}`;
      
      const result = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: { parts: [{ text: textToEmbed }] }
      });
      
      return {
        id: snippet.id,
        embedding: result.embeddings?.[0]?.values || []
      };
    });

    libraryEmbeddingsCache = await Promise.all(promises);
    return libraryEmbeddingsCache;
  }

  /**
   * Helper: Calculates Hybrid Score (Vector + Keyword Boost)
   */
  private static calculateHybridScores(queryEmbedding: number[], searchTerms: string[], libraryVectors: { id: string; embedding: number[] }[]) {
      return libraryVectors.map(item => {
        const snippet = KNOWLEDGE_LIBRARY.find(k => k.id === item.id);
        if (!snippet) return { id: item.id, score: 0, snippet: null };

        // Vector Score (Cosine Similarity)
        const vectorScore = this.cosineSimilarity(queryEmbedding, item.embedding);

        // Keyword Boost
        let keywordBoost = 0;
        const textToSearch = (snippet.title + ' ' + snippet.tags.join(' ')).toLowerCase();
        
        searchTerms.forEach(term => {
            if (term.length > 3 && textToSearch.includes(term)) {
                keywordBoost += 0.1; // Boost for keyword presence
            }
            if (term.length > 3 && snippet.title.toLowerCase().includes(term)) {
                keywordBoost += 0.1; // Extra boost for title match
            }
        });

        keywordBoost = Math.min(keywordBoost, 0.4); // Cap the boost

        return {
          id: item.id,
          score: vectorScore + keywordBoost,
          vectorScore,
          snippet
        };
      });
  }

  /**
   * Semantic RAG with Keyword Boosting
   */
  public static async getSemanticContext(userGoal: string, scenarioId: string, tags: string[] = []): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      // 1. Construct and Embed the Query
      const queryText = `Goal: ${userGoal}. Scenario: ${scenarioId}. Focus: ${tags.join(', ')}`;
      
      const queryResult = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: { parts: [{ text: queryText }] }
      });
      
      const queryEmbedding = queryResult.embeddings?.[0]?.values;
      if (!queryEmbedding) throw new Error("Failed to generate query embedding");

      // 2. Get Library Embeddings (Cached)
      const libraryVectors = await this.getLibraryEmbeddings();

      // 3. Calculate Hybrid Scores
      const searchTerms = [
          ...userGoal.toLowerCase().split(/\s+/), 
          ...scenarioId.toLowerCase().split(/\s+/),
          ...tags.map(t => t.toLowerCase())
      ];

      const scored = this.calculateHybridScores(queryEmbedding, searchTerms, libraryVectors);

      // 4. Sort by relevance
      const topMatches = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 2); // Get top 2

      // 5. Return Content
      const snippets = topMatches.map(match => {
        return match.snippet ? `RELEVANT FRAMEWORK (${Math.round(match.score * 100)}% match): ${match.snippet.title}\n${match.snippet.content}` : '';
      });

      return snippets.join('\n\n');

    } catch (e) {
      console.error("Vector search failed, falling back to basic matching", e);
      // Fallback to basic keyword match if API fails
      return this.keywordFallback(userGoal, scenarioId, tags);
    }
  }

  /**
   * Hybrid Research:
   * 1. Vector Search + Keyword Boosting (Local DB).
   * 2. If relevance is low, use Google Search (ONLY if Premium).
   */
  public static async findOrFetchContext(userGoal: string, scenarioId: string, tags: string[] = [], tier: ServiceTier = 'standard'): Promise<string> {
      let topLocalMatches: any[] = [];
      let queryEmbedding: number[] | undefined;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // 1. Local Hybrid Search
      try {
        const queryText = `Goal: ${userGoal}. Scenario: ${scenarioId}`;
        const queryResult = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: { parts: [{ text: queryText }] }
        });
        queryEmbedding = queryResult.embeddings?.[0]?.values;

        if (queryEmbedding) {
            const libraryVectors = await this.getLibraryEmbeddings();
            
            const searchTerms = [
                ...userGoal.toLowerCase().split(/\s+/), 
                ...scenarioId.toLowerCase().split(/\s+/),
                ...tags.map(t => t.toLowerCase())
            ];

            const scored = this.calculateHybridScores(queryEmbedding, searchTerms, libraryVectors);
            topLocalMatches = scored.sort((a, b) => b.score - a.score);
            const bestMatch = topLocalMatches[0];

            // Threshold: If high score, trust local DB
            if (bestMatch && bestMatch.score > 0.65) {
                return topLocalMatches.slice(0, 2).map(m => 
                     `RELEVANT FRAMEWORK (${Math.round(m.score * 100)}% match): ${m.snippet?.title}\n${m.snippet?.content}`
                 ).join('\n\n');
            }
        }
      } catch (e) {
          console.warn("Embedding check failed", e);
      }

      // 2. Web Research (ONLY FOR PREMIUM)
      if (tier === 'premium') {
        try {
            const searchPrompt = `
                User Goal: "${userGoal || 'Improve communication'}"
                Scenario: "${scenarioId}"
                Focus Areas: "${tags.join(', ')}"
                
                Find a recognized psychological framework, communication technique, or negotiation strategy that specifically addresses this situation.
                Explain the steps briefly for a real-time coach to use. 
                Do not just give generic advice; name a specific method (e.g., "The XYZ Technique").
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: searchPrompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    systemInstruction: "You are a specialized research assistant. Find a named communication framework. Output: FRAMEWORK NAME, then bullet points of steps."
                }
            });

            if (response.text) {
                const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                let sourceInfo = '';
                
                if (grounding && grounding.length > 0) {
                    const webChunk = grounding.find(c => c.web);
                    if (webChunk?.web?.title) {
                        sourceInfo = `(Source: ${webChunk.web.title})`;
                    }
                }

                return `RESEARCHED FRAMEWORK ${sourceInfo}:\n${response.text}`;
            }
        } catch (e) {
            console.warn("Web research failed.", e);
        }
      }

      // 3. Fallback to Local (whatever we found)
      if (topLocalMatches.length > 0) {
          return topLocalMatches.slice(0, 2).map(m => 
             `RELEVANT FRAMEWORK (${Math.round(m.score * 100)}% match): ${m.snippet?.title}\n${m.snippet?.content}`
          ).join('\n\n');
      }

      // 4. Final Fallback (Keywords)
      return this.keywordFallback(userGoal, scenarioId, tags);
  }

  // --- Legacy / Fallback Keyword System ---
  private static keywordFallback(userGoal: string, scenarioId: string, tags: string[] = []): string {
    const query = `${userGoal} ${scenarioId} ${tags.join(' ')}`.toLowerCase();
    
    const scored = KNOWLEDGE_LIBRARY.map(snippet => {
      let score = 0;
      snippet.tags.forEach(tag => { if (query.includes(tag.toLowerCase())) score += 2; });
      const keywords = query.split(' ');
      keywords.forEach(word => {
        if (word.length > 3 && snippet.content.toLowerCase().includes(word)) score += 1;
        if (word.length > 3 && snippet.title.toLowerCase().includes(word)) score += 3;
      });
      return { snippet, score };
    });

    const topSnippets = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 2).map(s => s.snippet);
    if (topSnippets.length === 0) {
        const fallback = KNOWLEDGE_LIBRARY.find(k => k.id === 'active-listening');
        return fallback ? `RELEVANT FRAMEWORK: ${fallback.title}\n${fallback.content}` : '';
    }
    return topSnippets.map(s => `RELEVANT FRAMEWORK: ${s.title}\n${s.content}`).join('\n\n');
  }
}
