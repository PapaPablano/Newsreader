import React, { useState, useEffect } from 'react';
import { NewsSource } from '../types';
import { Building2, ExternalLink, ShieldCheck, Sliders, Star } from 'lucide-react';
import {
  getOutletScoreDetails,
  isReliabilityScoresEnabled
} from '../utils/reliabilityScores';
import { ReliabilityScoreManagerModal } from './ReliabilityScoreManagerModal';

interface SourcesListProps {
  sources: NewsSource[];
}

export const SourcesList: React.FC<SourcesListProps> = ({ sources }) => {
  const [scoresEnabled, setScoresEnabled] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setScoresEnabled(isReliabilityScoresEnabled());

    const handleUpdate = () => {
      setScoresEnabled(isReliabilityScoresEnabled());
    };

    window.addEventListener('reliability_scores_updated', handleUpdate);
    return () => window.removeEventListener('reliability_scores_updated', handleUpdate);
  }, []);

  if (!sources || sources.length === 0) return null;

  const activeOutlets = sources.map((s) => s.outlet);

  return (
    <div id="sources-list-section" className="bg-[#F9F8F6] border border-[#E5E2DA] rounded-xl p-5 my-8 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5E2DA]">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#5A5A40]" />
          <h3 className="text-base font-semibold text-[#2D2D2A] font-serif">
            Curated Sources Consulted ({sources.length})
          </h3>
        </div>

        {/* Reliability Scores Control Toggle / Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium bg-[#F4F1EA] text-[#5A5A40] border border-[#DEDAD0] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            title="Manage source reliability ratings"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#4A5D4A]" />
            <span>Reliability Scores</span>
            <Sliders className="w-3 h-3 text-[#8C8A7D]" />
          </button>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((src) => {
          const scoreDetails = getOutletScoreDetails(src.outlet);

          return (
            <div
              key={src.id}
              className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E5E2DA] hover:border-[#C8C2B5] transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold text-[#2D2D2A] px-2 py-0.5 rounded bg-[#F4F1EA] border border-[#E5E2DA]">
                    {src.outlet}
                  </span>

                  {/* Optional Reliability Score Badge */}
                  {scoresEnabled && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${scoreDetails.badgeBg} ${scoreDetails.badgeText} ${scoreDetails.badgeBorder}`}
                      title={`User-configured reliability score for ${src.outlet}: ${scoreDetails.score}% (${scoreDetails.tierLabel})`}
                    >
                      <Star className="w-3 h-3 fill-current opacity-80" />
                      <span>{scoreDetails.score}% Score</span>
                    </button>
                  )}
                </div>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group-hover:text-[#5A5A40] transition-colors"
                >
                  <h4 className="text-xs font-medium text-[#2D2D2A] line-clamp-2 leading-snug font-sans flex items-start justify-between gap-1">
                    <span>{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8C8A7D] shrink-0 mt-0.5 group-hover:text-[#5A5A40] transition-colors" />
                  </h4>
                </a>
              </div>

              {src.snippet && (
                <p className="text-[11px] text-[#6B695F] line-clamp-2 mt-2 pt-2 border-t border-[#F4F1EA] italic font-serif">
                  "{src.snippet}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for adjusting source reliability scores */}
      <ReliabilityScoreManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeOutlets={activeOutlets}
      />
    </div>
  );
};
