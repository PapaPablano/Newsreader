import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BeatSelector } from './components/BeatSelector';
import { ArticleRenderer } from './components/ArticleRenderer';
import { LiveSearch } from './components/LiveSearch';
import { WorkflowInspector } from './components/WorkflowInspector';
import { ReliabilityScoreManagerModal } from './components/ReliabilityScoreManagerModal';
import { BeatDefinition, SynthesisResult } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'beat' | 'search' | 'workflow'>('beat');
  const [beats, setBeats] = useState<BeatDefinition[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('ai-policy');
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-26');
  const [availableDates] = useState<string[]>(['2026-07-26', '2026-07-25']);
  
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState<boolean>(false);

  const workflowStatus = {
    scheduled_cron: '0 */6 * * *',
    active: false,
    note: 'Scheduled 6-hour refresh workflow paused to conserve API credits'
  };

  // 1. Fetch beats configuration on mount
  useEffect(() => {
    async function loadBeatsConfig() {
      try {
        const res = await fetch(`${API_BASE}/api/beats`);
        if (res.ok) {
          const data = await res.json();
          if (data.beats && data.beats.length > 0) {
            setBeats(data.beats);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch beats from server API:', e);
      }
    }
    loadBeatsConfig();
  }, []);

  // 2. Fetch specific beat synthesis when selectedSlug or selectedDate changes
  useEffect(() => {
    if (activeTab !== 'beat') return;

    async function fetchBeatSynthesis() {
      setLoading(true);
      setError(null);

      try {
        const url = `${API_BASE}/api/beat/${selectedSlug}${selectedDate ? `?date=${selectedDate}` : ''}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`Synthesis archive not found for ${selectedSlug}`);
        }

        const data = await res.json();
        setSynthesis(data);
      } catch (err: any) {
        console.error('Fetch synthesis error:', err);
        setError(err.message || 'Failed to load beat synthesis archive');
      } finally {
        setLoading(false);
      }
    }

    fetchBeatSynthesis();
  }, [selectedSlug, selectedDate, activeTab]);

  // Handle live search execution
  const handlePerformLiveSearch = async (query: string): Promise<SynthesisResult | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Live search synthesis failed');
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('Live search error:', err);
      throw err;
    }
  };

  const activeOutlets = synthesis && synthesis.sources ? synthesis.sources.map((s) => s.outlet) : [];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D2D2A] font-sans antialiased selection:bg-[#5A5A40] selection:text-[#FFFFFF] flex flex-col">
      
      {/* Navbar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        availableDates={availableDates}
        workflowStatus={workflowStatus}
        onOpenReliabilityScores={() => setIsScoreModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Curated Beat View */}
        {activeTab === 'beat' && (
          <div>
            <BeatSelector
              beats={beats}
              selectedSlug={selectedSlug}
              onSelectBeat={(slug) => setSelectedSlug(slug)}
            />

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="w-8 h-8 text-[#5A5A40] animate-spin" />
                <p className="text-xs font-mono text-[#6B695F]">
                  Loading synthesis archive for "{selectedSlug}"...
                </p>
              </div>
            ) : error ? (
              <div className="max-w-md mx-auto my-16 p-6 bg-[#F9F8F6] border border-[#E5E2DA] rounded-2xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-[#8C4B3E] mx-auto" />
                <h3 className="text-sm font-semibold text-[#2D2D2A]">
                  Archive Unavailable
                </h3>
                <p className="text-xs text-[#6B695F]">{error}</p>
                <button
                  onClick={() => setSelectedSlug('ai-policy')}
                  className="px-4 py-2 rounded-xl bg-[#5A5A40] text-[#FFFFFF] font-semibold text-xs hover:bg-[#4A4A35] transition-colors cursor-pointer"
                >
                  Return to AI Policy
                </button>
              </div>
            ) : synthesis ? (
              <ArticleRenderer
                synthesis={synthesis}
                onOpenScoreManager={() => setIsScoreModalOpen(true)}
              />
            ) : null}
          </div>
        )}

        {/* Live Search Producer View */}
        {activeTab === 'search' && (
          <LiveSearch
            onPerformSearch={handlePerformLiveSearch}
            onOpenScoreManager={() => setIsScoreModalOpen(true)}
          />
        )}

        {/* Architecture & Producer Inspector View */}
        {activeTab === 'workflow' && (
          <WorkflowInspector />
        )}

      </main>

      {/* Global Reliability Scores Modal */}
      <ReliabilityScoreManagerModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        activeOutlets={activeOutlets}
      />

      {/* Footer */}
      <footer className="border-t border-[#E5E2DA] bg-[#F4F1EA] py-6 text-center text-xs text-[#6B695F] font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>News Synthesis Engine • Shared JSON Contract v1.0 • Natural Tones Theme</span>
          <span>Outlet Reliability Indicators • Sentence Citations • Explicit Disagreements</span>
        </div>
      </footer>

    </div>
  );
}
