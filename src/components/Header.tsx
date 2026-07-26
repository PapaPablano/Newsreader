import React from 'react';
import { Newspaper, Search, Calendar, Cpu, GitBranch, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'beat' | 'search' | 'workflow';
  setActiveTab: (tab: 'beat' | 'search' | 'workflow') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableDates: string[];
  workflowStatus: {
    scheduled_cron: string;
    active: boolean;
    note: string;
  };
  onOpenReliabilityScores?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  availableDates,
  onOpenReliabilityScores
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#F4F1EA]/95 backdrop-blur border-b border-[#E5E2DA] text-[#2D2D2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFFFFF] border border-[#E5E2DA] rounded-lg text-[#5A5A40] shadow-2xs">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-[#2D2D2A] font-serif">
                  News Synthesis
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFECE6] text-[#6B695F] border border-[#DEDAD0]">
                  Natural Tones • v1.0
                </span>
              </div>
              <p className="text-xs text-[#6B695F] hidden sm:block">
                Transparent multi-source news synthesis & explicit disagreement engine
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Mode Switcher Buttons */}
            <div className="flex items-center p-1 bg-[#FFFFFF] border border-[#E5E2DA] rounded-xl shadow-2xs">
              <button
                id="tab-beats-btn"
                onClick={() => setActiveTab('beat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'beat'
                    ? 'bg-[#5A5A40] text-[#FFFFFF] shadow-2xs font-semibold'
                    : 'text-[#6B695F] hover:text-[#2D2D2A] hover:bg-[#F4F1EA]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Curated Beats</span>
              </button>

              <button
                id="tab-search-btn"
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'search'
                    ? 'bg-[#5A5A40] text-[#FFFFFF] shadow-2xs font-semibold'
                    : 'text-[#6B695F] hover:text-[#2D2D2A] hover:bg-[#F4F1EA]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Live Search</span>
              </button>

              <button
                id="tab-workflow-btn"
                onClick={() => setActiveTab('workflow')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'workflow'
                    ? 'bg-[#5A5A40] text-[#FFFFFF] shadow-2xs font-semibold'
                    : 'text-[#6B695F] hover:text-[#2D2D2A] hover:bg-[#F4F1EA]'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Arch & Producer</span>
                <span className="md:hidden">Producer</span>
              </button>
            </div>

            {/* Source Reliability Quick Button */}
            {onOpenReliabilityScores && (
              <button
                onClick={onOpenReliabilityScores}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#EBF0EB] border border-[#B8CBB8] text-[#2D4A2D] text-xs font-medium hover:bg-[#E2EBE2] transition-colors"
                title="Manage user reliability scores for news outlets"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D4A2D]" />
                <span className="hidden md:inline">Source Reliability</span>
              </button>
            )}

            {/* Archive Date Selector (if in beat mode) */}
            {activeTab === 'beat' && availableDates.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#6B695F] bg-[#FFFFFF] px-2.5 py-1.5 rounded-xl border border-[#E5E2DA]">
                <Calendar className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span className="text-[#8C8A7D]">Archive:</span>
                <select
                  id="header-archive-date-select"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-[#2D2D2A] font-mono text-xs focus:outline-none cursor-pointer"
                >
                  {availableDates.map(d => (
                    <option key={d} value={d} className="bg-[#FFFFFF] text-[#2D2D2A]">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Workflow Cron Status Indicator */}
            <div 
              id="header-status-badge"
              onClick={() => setActiveTab('workflow')}
              title="Click to inspect GitHub Actions & Cloudflare Worker architecture"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FAF3E8] border border-[#E3CBB3] text-[#8C6239] text-xs cursor-pointer hover:bg-[#F5EADB] transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C6239] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8C6239]"></span>
              </span>
              <span className="font-mono text-[11px] hidden xl:inline">Cron: 0 */6 * * * (Paused)</span>
              <span className="font-mono text-[11px] xl:hidden">Cron Paused</span>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
