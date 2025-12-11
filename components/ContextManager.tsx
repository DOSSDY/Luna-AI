
import React, { useState } from 'react';
import { KnowledgeAsset, Language } from '../types';
import { getTranslation } from '../constants';
import { FileText, Plus, Trash2, CheckCircle, Circle, Save, File, X } from 'lucide-react';

interface ContextManagerProps {
  assets: KnowledgeAsset[];
  onUpdateAssets: (assets: KnowledgeAsset[]) => void;
  language: Language;
}

export const ContextManager: React.FC<ContextManagerProps> = ({ assets, onUpdateAssets, language }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newContent.trim()) return;
    
    const newAsset: KnowledgeAsset = {
      id: Date.now().toString(),
      name: newName,
      type: 'text',
      content: newContent,
      isActive: true
    };
    
    onUpdateAssets([...assets, newAsset]);
    setNewName('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onUpdateAssets(assets.filter(a => a.id !== id));
  };

  const toggleActive = (id: string) => {
    onUpdateAssets(assets.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-in fade-in duration-500 pb-24 h-full flex flex-col">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-stone-100 tracking-tight mb-2">
            {getTranslation(language, 'context_hub_title')}
        </h2>
        <p className="text-stone-400">
            {getTranslation(language, 'context_hub_desc')}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Left Col: Asset List */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-stone-700 text-stone-500 hover:border-teal-500/50 hover:text-teal-400 hover:bg-stone-800/30 transition-all"
            >
                <Plus className="w-5 h-5" />
                <span className="font-medium">{getTranslation(language, 'add_asset')}</span>
            </button>

            {assets.length === 0 && !isAdding && (
                <div className="text-center p-8 text-stone-600 italic border border-stone-800 rounded-xl bg-stone-900/50">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    {getTranslation(language, 'no_assets')}
                </div>
            )}

            {assets.map(asset => (
                <div key={asset.id} className={`p-4 rounded-xl border transition-all ${asset.isActive ? 'bg-stone-800 border-teal-500/30' : 'bg-stone-800/40 border-stone-800 opacity-75'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${asset.isActive ? 'bg-teal-900/30 text-teal-400' : 'bg-stone-700 text-stone-400'}`}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className={`font-semibold ${asset.isActive ? 'text-stone-200' : 'text-stone-400'}`}>{asset.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => toggleActive(asset.id)}
                                className={`p-2 rounded-lg transition-colors ${asset.isActive ? 'text-teal-400 hover:bg-teal-900/20' : 'text-stone-600 hover:text-stone-400'}`}
                                title={asset.isActive ? "Deactivate" : "Activate"}
                            >
                                {asset.isActive ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <button 
                                onClick={() => handleDelete(asset.id)}
                                className="p-2 text-stone-600 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="bg-stone-900/50 rounded-lg p-3 text-xs text-stone-500 font-mono h-20 overflow-hidden relative">
                        {asset.content}
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-transparent to-transparent pointer-events-none" />
                    </div>
                </div>
            ))}
        </div>

        {/* Right Col: Editor (if adding) or Info */}
        <div className="bg-stone-800/20 border border-stone-800 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden">
            {isAdding ? (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-stone-200 flex items-center gap-2">
                            <File className="w-4 h-4 text-teal-500" />
                            New Asset
                        </h3>
                        <button onClick={() => setIsAdding(false)} className="text-stone-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <input 
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder={getTranslation(language, 'asset_name')}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 mb-4 text-stone-200 focus:border-teal-500/50 outline-none transition-colors"
                    />
                    
                    <textarea 
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                        placeholder={getTranslation(language, 'paste_content')}
                        className="flex-1 w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-300 font-mono text-sm focus:border-teal-500/50 outline-none resize-none mb-4"
                    />
                    
                    <button 
                        onClick={handleAdd}
                        disabled={!newName || !newContent}
                        className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {getTranslation(language, 'save_asset')}
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-stone-600 text-center p-8">
                     <div className="w-24 h-24 rounded-full bg-stone-800 flex items-center justify-center mb-6 border border-stone-700/50">
                        <Brain className="w-10 h-10 text-stone-700" />
                     </div>
                     <h3 className="text-xl font-medium text-stone-300 mb-2">{getTranslation(language, 'active_assets')}</h3>
                     <p className="text-sm max-w-xs">
                        {assets.filter(a => a.isActive).length > 0 
                            ? `${assets.filter(a => a.isActive).length} assets currently loaded into Luna's memory.` 
                            : "No active assets. Luna will use general knowledge."}
                     </p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

// Simple icon component to avoid huge imports above if Brain wasn't imported
import { Brain } from 'lucide-react';
