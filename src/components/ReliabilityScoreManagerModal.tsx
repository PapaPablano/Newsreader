import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Search,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  getReliabilityScores,
  setOutletReliabilityScore,
  resetReliabilityScores,
  isReliabilityScoresEnabled,
  setReliabilityScoresEnabled,
  getOutletScoreDetails,
  DEFAULT_RELIABILITY_SCORES
} from '../utils/reliabilityScores';

interface ReliabilityScoreManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOutlets?: string[];
}

export const ReliabilityScoreManagerModal: React.FC<ReliabilityScoreManagerModalProps> = ({
  isOpen,
  onClose,
  activeOutlets = []
}) => {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEnabled(isReliabilityScoresEnabled());
      setScores(getReliabilityScores());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Combine active outlets from current synthesis with default known outlets
  const allOutlets = Array.from(
    new Set([...activeOutlets, ...Object.keys(DEFAULT_RELIABILITY_SCORES), ...Object.keys(scores)])
  ).filter((outlet) => outlet.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  const handleScoreChange = (outlet: string, val: number) => {
    setOutletReliabilityScore(outlet, val);
    setScores((prev) => ({ ...prev, [outlet]: val }));
  };

  const handleToggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    setReliabilityScoresEnabled(next);
    showFeedback(next ? 'Reliability indicators enabled' : 'Reliability indicators hidden');
  };

  const handleResetAll = () => {
    resetReliabilityScores();
    setScores({ ...DEFAULT_RELIABILITY_SCORES });
    showFeedback('Scores reset to default ratings');
  };

  const showFeedback = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#F9F8F6] border border-[#E5E2DA] rounded-2xl max-w-2xl w-full p-6 shadow-xl relative text-[#2D2D2A] space-y-5 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E2DA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EBF0EB] border border-[#C5D6C5] text-[#2D4A2D]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-semibold text-[#2D2D2A] tracking-tight">
                Source Reliability Score Manager
              </h3>
              <p className="text-xs text-[#6B695F] mt-0.5">
                Track and customize your personal reliability ratings for news outlets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B695F] hover:text-[#2D2D2A] hover:bg-[#EFECE6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Optionality & Disclaimer Banner */}
        <div className="p-4 bg-[#F4F1EA] border border-[#E5E2DA] rounded-xl flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#5A5A40] shrink-0 mt-0.5" />
            <div className="text-xs text-[#3D3D38]">
              <span className="font-semibold block text-[#2D2D2A] mb-0.5">
                Optional Customization
              </span>
              User-provided scores display reliability indicators alongside cited sources. These ratings are stored locally and do not alter AI synthesis results.
            </div>
          </div>

          <button
            onClick={handleToggleEnabled}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border ${
              enabled
                ? 'bg-[#EBF0EB] text-[#2D4A2D] border-[#B8CBB8]'
                : 'bg-[#EFECE6] text-[#6B695F] border-[#DEDAD0]'
            }`}
          >
            {enabled ? (
              <>
                <ToggleRight className="w-4 h-4 text-[#2D4A2D]" />
                <span>Indicators On</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-[#6B695F]" />
                <span>Indicators Off</span>
              </>
            )}
          </button>
        </div>

        {/* Search & Feedback Notification */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C8A7D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news outlet name (e.g. Reuters, Bloomberg)..."
              className="w-full bg-[#FFFFFF] border border-[#E5E2DA] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D2D2A] placeholder-[#8C8A7D] focus:outline-none focus:border-[#5A5A40]"
            />
          </div>

          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#EFECE6] text-[#5A5A40] border border-[#DEDAD0] hover:bg-[#E5E2DA] transition-colors shrink-0"
            title="Reset all source scores to standard defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {savedFeedback && (
          <div className="p-2.5 rounded-lg bg-[#EBF0EB] border border-[#B8CBB8] text-[#2D4A2D] text-xs font-medium flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedFeedback}</span>
          </div>
        )}

        {/* Outlets Rating List */}
        <div className="overflow-y-auto pr-1 space-y-3 flex-1">
          {allOutlets.length === 0 ? (
            <p className="text-xs text-[#8C8A7D] text-center py-8">
              No matching news outlets found.
            </p>
          ) : (
            allOutlets.map((outlet) => {
              const details = getOutletScoreDetails(outlet);
              const scoreVal = scores[outlet] ?? details.score;

              return (
                <div
                  key={outlet}
                  className="p-3.5 bg-[#FFFFFF] border border-[#E5E2DA] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D0C9BD] transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#2D2D2A] font-serif">
                        {outlet}
                      </span>
                      {activeOutlets.includes(outlet) && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#EBF0EB] text-[#2D4A2D] border border-[#C5D6C5]">
                          Cited in Article
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${details.badgeBg} ${details.badgeText} ${details.badgeBorder}`}
                      >
                        {scoreVal}% • {details.tierLabel}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Slider & Number */}
                  <div className="flex items-center gap-3 sm:w-64">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={scoreVal}
                      onChange={(e) => handleScoreChange(outlet, Number(e.target.value))}
                      className="w-full accent-[#5A5A40] cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreVal}
                      onChange={(e) => handleScoreChange(outlet, Number(e.target.value))}
                      className="w-14 bg-[#F4F1EA] border border-[#E5E2DA] rounded-lg px-2 py-1 text-xs font-mono font-semibold text-center text-[#2D2D2A] focus:outline-none focus:border-[#5A5A40]"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-[#E5E2DA] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#5A5A40] text-[#FFFFFF] hover:bg-[#4A4A35] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
