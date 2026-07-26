import React from 'react';
import { SentenceCitation } from '../types';
import { X, ExternalLink, Quote, Building2, FileText, Star, ShieldCheck } from 'lucide-react';
import {
  getOutletScoreDetails,
  isReliabilityScoresEnabled
} from '../utils/reliabilityScores';

interface CitationDrawerProps {
  citation: SentenceCitation | null;
  sentenceText?: string;
  onClose: () => void;
  onOpenScoreManager?: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  citation,
  sentenceText,
  onClose,
  onOpenScoreManager
}) => {
  if (!citation) return null;

  const scoreEnabled = isReliabilityScoresEnabled();
  const scoreDetails = getOutletScoreDetails(citation.outlet);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#F9F8F6] border border-[#E5E2DA] rounded-2xl max-w-lg w-full p-6 shadow-xl relative text-[#2D2D2A] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#6B695F] hover:text-[#2D2D2A] hover:bg-[#EFECE6] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Drawer Header */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#F4F1EA] border border-[#DEDAD0] text-[#5A5A40] shrink-0 mt-0.5">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#F4F1EA] text-[#2D2D2A] border border-[#E5E2DA]">
                {citation.outlet}
              </span>

              {scoreEnabled && (
                <button
                  onClick={onOpenScoreManager}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${scoreDetails.badgeBg} ${scoreDetails.badgeText} ${scoreDetails.badgeBorder}`}
                  title={`User Reliability Rating: ${scoreDetails.score}% (${scoreDetails.tierLabel}). Click to manage.`}
                >
                  <Star className="w-3 h-3 fill-current opacity-80" />
                  <span>{scoreDetails.score}% Reliability Score</span>
                </button>
              )}
            </div>

            <h3 className="text-base font-semibold text-[#2D2D2A] font-serif leading-snug">
              {citation.title}
            </h3>
          </div>
        </div>

        {/* Sentence context */}
        {sentenceText && (
          <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E5E2DA] text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#6B695F] font-mono text-[10px] uppercase">
              <FileText className="w-3 h-3 text-[#8C8A7D]" />
              <span>Synthesized Statement Context:</span>
            </div>
            <p className="text-[#2D2D2A] leading-relaxed font-sans">
              "{sentenceText}"
            </p>
          </div>
        )}

        {/* Direct Quote Box */}
        <div className="p-4 bg-[#F4F1EA] rounded-xl border border-[#DEDAD0] text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-[#5A5A40] font-mono text-[11px] font-semibold">
            <Quote className="w-3.5 h-3.5" />
            <span>Exact Direct Quote Excerpt:</span>
          </div>
          <p className="text-[#2D2D2A] italic leading-relaxed font-serif">
            "{citation.quote || sentenceText || 'Direct citation excerpt confirmed from outlet coverage.'}"
          </p>
        </div>

        {/* Action Link */}
        <div className="pt-2 flex items-center justify-between border-t border-[#E5E2DA]">
          <span className="text-xs text-[#8C8A7D] font-mono">
            ID: {citation.source_id}
          </span>
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#5A5A40] text-[#FFFFFF] hover:bg-[#4A4A35] transition-colors shadow-xs"
          >
            <span>Read Original Article</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
