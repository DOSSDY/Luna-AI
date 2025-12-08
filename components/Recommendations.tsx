import React from 'react';
import { ChatMessage } from '../types';
import { ExternalLink, Book, Video, FileText } from 'lucide-react';

interface RecommendationsProps {
  messages: ChatMessage[];
  embedded?: boolean;
}

interface Resource {
  title: string;
  author: string;
  type: 'Book' | 'Article' | 'Video';
  url: string;
  tags: string[];
}

const RESOURCES: Resource[] = [
  {
    title: 'Nonviolent Communication: A Language of Life',
    author: 'Marshall B. Rosenberg',
    type: 'Book',
    url: '#',
    tags: ['conflict', 'emotions', 'relationships', 'general']
  },
  {
    title: 'Crucial Conversations: Tools for Talking When Stakes Are High',
    author: 'Kerry Patterson et al.',
    type: 'Book',
    url: '#',
    tags: ['work', 'conflict', 'interview', 'high-stakes']
  },
  {
    title: 'The 7 Habits of Highly Effective People',
    author: 'Stephen R. Covey',
    type: 'Book',
    url: '#',
    tags: ['professional', 'work', 'growth']
  },
  {
    title: 'Active Listening Techniques',
    author: 'Harvard Business Review',
    type: 'Article',
    url: '#',
    tags: ['general', 'work', 'interview']
  },
  {
    title: 'Brené Brown on Vulnerability',
    author: 'TED Talk',
    type: 'Video',
    url: '#',
    tags: ['relationships', 'emotions', 'anxiety']
  },
  {
    title: 'Negotiation Skills: Getting to Yes',
    author: 'Roger Fisher',
    type: 'Book',
    url: '#',
    tags: ['work', 'negotiation', 'interview']
  }
];

export const Recommendations: React.FC<RecommendationsProps> = ({ messages, embedded }) => {
  // Simple keyword extraction to recommend resources
  const allText = messages.map(m => m.text.toLowerCase()).join(' ');
  
  const relevantResources = RESOURCES.filter(r => {
    // Always show general if nothing specific matches
    if (r.tags.includes('general')) return true;
    return r.tags.some(tag => allText.includes(tag));
  }).sort((a, b) => {
    // Prioritize specific matches over general ones
    const aMatch = a.tags.filter(t => t !== 'general' && allText.includes(t)).length;
    const bMatch = b.tags.filter(t => t !== 'general' && allText.includes(t)).length;
    return bMatch - aMatch;
  });

  // Remove duplicates based on title
  const uniqueResources = Array.from(new Set(relevantResources.map(r => r.title)))
    .map(title => relevantResources.find(r => r.title === title)!);

  return (
    <div className={`w-full max-w-2xl mx-auto animate-in fade-in duration-500 ${embedded ? 'p-4' : 'p-6'}`}>
      {!embedded && (
        <>
            <h2 className="text-2xl font-semibold text-stone-100 mb-2">Recommended Resources</h2>
            <p className="text-stone-400 mb-8 text-sm">Curated materials based on your current conversation topics.</p>
        </>
      )}

      <div className="grid gap-4">
        {uniqueResources.map((resource, idx) => (
          <div key={idx} className="bg-stone-800/50 border border-stone-700/50 p-5 rounded-xl hover:bg-stone-800 transition-colors flex items-start gap-4 group">
            <div className={`p-3 rounded-lg ${
                resource.type === 'Book' ? 'bg-orange-900/20 text-orange-400' :
                resource.type === 'Video' ? 'bg-red-900/20 text-red-400' :
                'bg-blue-900/20 text-blue-400'
            }`}>
                {resource.type === 'Book' ? <Book className="w-6 h-6" /> :
                 resource.type === 'Video' ? <Video className="w-6 h-6" /> :
                 <FileText className="w-6 h-6" />}
            </div>
            
            <div className="flex-1">
                <h3 className="font-medium text-stone-200 group-hover:text-teal-400 transition-colors">
                    {resource.title}
                </h3>
                <p className="text-sm text-stone-500 mb-2">by {resource.author}</p>
                <div className="flex gap-2">
                    {resource.tags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider bg-stone-700/50 text-stone-400 px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            <button className="text-stone-500 hover:text-stone-300">
                <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};