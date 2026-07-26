import React, { useState } from 'react';
import { SynthesisResult } from '../types';
import { ArticleRenderer } from './ArticleRenderer';
import { Search, Loader2, ArrowRight, Zap, RefreshCw, AlertCircle } from 'lucide-react';

interface LiveSearchProps {
  onPerformSearch: (query: string) => Promise<SynthesisResult | null>;
  onOpenScoreManager?: () => void;
}

const suggestedQueries = [
  "US Commerce Open Weights AI Export Limits",
  "Federal Reserve Rate Cut Schedule Disagreement",
  "Nvidia ASML Semiconductor Supply Control Policies",
  "EU Carbon Border Tax and Climate Summit Debates"
];

export const LiveSearch: React.FC<LiveSearchProps> = ({
  onPerformSearch,
  onOpenScoreManager
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    "Querying multi-outlet news coverage & search grounding...",
    "Extracting source claims, statistics, and direct quotes...",
    "Constructing explicit disagreement panel & consensus snapshot...",
    "Validating response against shared schema contract..."
  ];

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const res = await onPerformSearch(query.trim());
      if (res) {
        setResult(res);
      } else {
        setError('No synthesis result returned. Please check server connection.');
      }
    } catch (err: any) {
      setError(err.message || 'Live search synthesis failed');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    setQuery(preset);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-[#2D2D2A]">
      
      {/* Search Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F1EA] text-[#5A5A40] text-xs font-mono border border-[#DEDAD0] mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>Live Producer API</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#2D2D2A]">
          Ad-Hoc Topic News Synthesis
        </h2>
        <p className="text-xs sm:text-sm text-[#6B695F] mt-2 font-sans leading-relaxed">
          Enter any breaking news topic or controversy. The live producer synthesizes coverage into per-sentence citations & an explicit disagreement panel in real time.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-6">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-[#8C8A7D] absolute left-4 pointer-events-none" />
          <input
            id="live-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. EU AI Act open weights export controls..."
            disabled={loading}
            className="w-full bg-[#FFFFFF] border border-[#E5E2DA] rounded-2xl pl-12 pr-36 py-3.5 text-sm text-[#2D2D2A] placeholder-[#8C8A7D] focus:outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] transition-all shadow-sm"
          />
          <button
            id="live-search-submit-btn"
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 px-4 py-2 rounded-xl bg-[#5A5A40] text-[#FFFFFF] font-semibold text-xs hover:bg-[#4A4A35] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Synthesize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Topic Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto mb-10">
        <span className="text-xs font-mono text-[#8C8A7D]">Try topic:</span>
        {suggestedQueries.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetClick(preset)}
            className="px-2.5 py-1 rounded-lg bg-[#F9F8F6] border border-[#E5E2DA] text-xs text-[#3D3D38] hover:text-[#5A5A40] hover:border-[#C5C0B3] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Loading Steps Animation */}
      {loading && (
        <div className="max-w-lg mx-auto bg-[#F9F8F6] border border-[#E5E2DA] rounded-2xl p-6 text-center space-y-4 shadow-md">
          <div className="w-10 h-10 rounded-full bg-[#F4F1EA] border border-[#DEDAD0] text-[#5A5A40] flex items-center justify-center mx-auto">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#2D2D2A] font-serif">
              Live Synthesis In Progress
            </h4>
            <p className="text-xs font-mono text-[#5A5A40] mt-2 animate-pulse">
              {steps[loadingStep]}
            </p>
          </div>
          <div className="w-full bg-[#EFECE6] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[#5A5A40] h-full transition-all duration-500"
              style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-lg mx-auto bg-[#F9ECEB] border border-[#E5BDB8] rounded-2xl p-4 text-[#8C4B3E] text-xs flex items-start gap-2.5 mb-8">
          <AlertCircle className="w-4 h-4 text-[#8C4B3E] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Synthesis Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Live Synthesis Output */}
      {result && !loading && (
        <div className="mt-8 border-t border-[#E5E2DA] pt-8 animate-fade-in">
          <ArticleRenderer synthesis={result} onOpenScoreManager={onOpenScoreManager} />
        </div>
      )}

    </div>
  );
};
