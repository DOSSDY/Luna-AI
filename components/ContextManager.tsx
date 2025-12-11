
import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Check, X, FolderOpen, Loader2, Brain } from 'lucide-react';
import { KnowledgeAsset, Language } from '../types';
import { getTranslation } from '../constants';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Helper to safely access pdfjs
const getPdfJs = () => {
  const lib = pdfjsLib as any;
  return lib.default || lib;
};

// Set worker source to CDNJS for stability
try {
  const pdf = getPdfJs();
  if (pdf && pdf.GlobalWorkerOptions) {
     pdf.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
} catch (e) {
  console.error("PDF Worker init failed", e);
}

interface ContextManagerProps {
  assets: KnowledgeAsset[];
  onUpdate: (assets: KnowledgeAsset[]) => void;
  language: Language;
}

export const ContextManager: React.FC<ContextManagerProps> = ({ assets, onUpdate, language }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Partial<KnowledgeAsset>>({ type: 'text' });
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const parseFile = async (file: File) => {
    setIsParsing(true);
    try {
        let content = '';
        if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = getPdfJs();
            const loadingTask = pdf.getDocument({ data: arrayBuffer });
            const doc = await loadingTask.promise;
            
            let fullText = '';
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
            }
            content = fullText;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            content = result.value;
        } else {
            // Assume Text
            content = await file.text();
        }

        setCurrentAsset(prev => ({
            ...prev,
            name: file.name,
            content: content,
            type: 'file',
            fileName: file.name
        }));
        setIsEditing(true);

    } catch (e) {
        console.error("File parsing failed", e);
        alert("Failed to read file. Please try another format.");
    } finally {
        setIsParsing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        parseFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          parseFile(e.target.files[0]);
      }
  };

  const saveAsset = () => {
    if (!currentAsset.name || !currentAsset.content) return;
    
    const newAsset: KnowledgeAsset = {
      id: currentAsset.id || Date.now().toString(),
      name: currentAsset.name,
      content: currentAsset.content,
      type: currentAsset.type || 'text',
      isActive: currentAsset.isActive ?? true,
      fileName: currentAsset.fileName
    };

    const existingIndex = assets.findIndex(a => a.id === newAsset.id);
    let updatedAssets;
    if (existingIndex >= 0) {
      updatedAssets = [...assets];
      updatedAssets[existingIndex] = newAsset;
    } else {
      updatedAssets = [...assets, newAsset];
    }
    
    onUpdate(updatedAssets);
    setIsEditing(false);
    setCurrentAsset({ type: 'text' });
  };

  const deleteAsset = (id: string) => {
    onUpdate(assets.filter(a => a.id !== id));
  };

  const toggleActive = (id: string) => {
    onUpdate(assets.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-in fade-in duration-500 pb-24">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-3xl font-bold text-stone-100 tracking-tight flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-teal-500" />
                {getTranslation(language, 'context_title')}
            </h2>
            <p className="text-stone-400 mt-2">
                {getTranslation(language, 'context_desc')}
            </p>
        </div>
        <button 
            onClick={() => { setCurrentAsset({ type: 'text', isActive: true }); setIsEditing(true); }}
            className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-teal-900/20"
        >
            <Upload className="w-4 h-4" />
            {getTranslation(language, 'add_asset')}
        </button>
      </div>

      {isEditing ? (
        <div className="bg-stone-800/50 border border-stone-700 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-lg font-semibold text-stone-200 mb-4 flex items-center gap-2">
                {currentAsset.id ? 'Edit Asset' : getTranslation(language, 'add_asset')}
            </h3>

            {/* File Upload / Drop Zone */}
            {!currentAsset.content && (
                <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all mb-6 cursor-pointer ${
                        dragActive ? 'border-teal-500 bg-teal-900/20' : 'border-stone-700 hover:border-stone-600 bg-stone-900/30'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".txt,.md,.pdf,.docx" 
                        className="hidden" 
                        onChange={handleFileChange}
                    />
                    
                    {isParsing ? (
                        <div className="flex flex-col items-center text-teal-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-3" />
                            <p>{getTranslation(language, 'parsing')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-stone-400">
                            <Upload className="w-10 h-10 mb-3 opacity-50" />
                            <p className="font-medium text-stone-300">{getTranslation(language, 'drag_drop')}</p>
                            <p className="text-sm opacity-60 mt-1">{getTranslation(language, 'or_browse')}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                        {getTranslation(language, 'asset_name')}
                    </label>
                    <input 
                        type="text" 
                        value={currentAsset.name || ''}
                        onChange={(e) => setCurrentAsset({...currentAsset, name: e.target.value})}
                        className="w-full bg-stone-900/50 border border-stone-700 rounded-xl p-3 text-stone-100 focus:border-teal-500/50 outline-none"
                        placeholder="e.g. My Resume, Sales Script..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                        {getTranslation(language, 'asset_content')}
                    </label>
                    <textarea 
                        value={currentAsset.content || ''}
                        onChange={(e) => setCurrentAsset({...currentAsset, content: e.target.value})}
                        className="w-full h-64 bg-stone-900/50 border border-stone-700 rounded-xl p-3 text-stone-100 focus:border-teal-500/50 outline-none resize-none font-mono text-sm leading-relaxed"
                        placeholder={getTranslation(language, 'paste_text')}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-stone-400 hover:text-stone-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveAsset}
                        disabled={!currentAsset.name || !currentAsset.content}
                        className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        {getTranslation(language, 'save_asset')}
                    </button>
                </div>
            </div>
        </div>
      ) : (
        /* ASSET LIST */
        <div className="grid gap-4">
            {assets.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-stone-800 rounded-2xl bg-stone-900/30">
                    <Brain className="w-12 h-12 text-stone-700 mx-auto mb-3" />
                    <p className="text-stone-500">{getTranslation(language, 'no_assets')}</p>
                </div>
            ) : (
                assets.map(asset => (
                    <div key={asset.id} className="bg-stone-800/40 border border-stone-800 rounded-xl p-4 flex items-center gap-4 group hover:bg-stone-800 transition-colors">
                        <div className={`p-3 rounded-lg ${asset.type === 'file' ? 'bg-blue-900/20 text-blue-400' : 'bg-orange-900/20 text-orange-400'}`}>
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-stone-200 truncate">{asset.name}</h4>
                            <p className="text-xs text-stone-500 truncate">
                                {asset.content.substring(0, 60)}...
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => toggleActive(asset.id)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                    asset.isActive 
                                    ? 'bg-teal-900/30 text-teal-400 border-teal-500/30 hover:bg-teal-900/50' 
                                    : 'bg-stone-800 text-stone-600 border-stone-700 hover:text-stone-400'
                                }`}
                            >
                                {asset.isActive ? getTranslation(language, 'active') : getTranslation(language, 'inactive')}
                            </button>
                            <div className="w-px h-8 bg-stone-700 mx-2" />
                            <button 
                                onClick={() => { setCurrentAsset(asset); setIsEditing(true); }}
                                className="p-2 text-stone-500 hover:text-stone-200 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => deleteAsset(asset.id)}
                                className="p-2 text-stone-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      )}
    </div>
  );
};
