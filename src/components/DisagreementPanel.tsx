import React from 'react';
import { DisagreementItem, SentenceCitation } from '../types';
import { GitCompare, ExternalLink, HelpCircle, Quote, Star } from 'lucide-react';
import {
  getOutletScoreDetails,
  isReliabilityScoresEnabled
} from '../utils/reliabilityScores';

interface DisagreementPanelProps {
  disagreements: DisagreementItem[];
  onOpenCitation: (citation: SentenceCitation) => void;
  onOpenScoreManager?: () => void;
}

export const DisagreementPanel: React.FC<DisagreementPanelProps> = ({
  disagreements,
  onOpenCitation,
  onOpenScoreManager
}) => {
  if (!disagreements || disagreements.length === 0) return null;

  const scoreEnabled = isReliabilityScoresEnabled();

  return (
    <div id="disagreement-panel" className="bg-[#FAF4F2] border border-[#E2C7C1] rounded-2xl p-5 sm:p-6 mb-8 shadow-xs">
      
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E8D0CB]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#F4E3DF] text-[#8C4B3E] border border-[#E0B9B1]">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif font-semibold text-[#8C4B3E] tracking-tight">
                Explicit Disagreement Panel
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F2DCD7] text-[#8C4B3E] border border-[#E2B8B1]">
                Core Differentiator
              </span>
            </div>
            <p className="text-xs text-[#73524B] mt-0.5">
              Directly surfacing where reporting outlets diverge instead of flattening coverage into artificial consensus
            </p>
          </div>
        </div>
      </div>

      {/* Disagreement Items */}
      <div className="space-y-6">
        {disagreements.map((item, idx) => {
          const stanceAScore = getOutletScoreDetails(item.stance_a.outlet);
          const stanceBScore = getOutletScoreDetails(item.stance_b.outlet);

          return (
            <div
              key={item.id || idx}
              className="bg-[#FFFFFF] rounded-xl p-4 sm:p-5 border border-[#E2D2CE] shadow-2xs space-y-3"
            >
              {/* Topic Title */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#F4E3DF] text-[#8C4B3E] border border-[#E0B9B1] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-serif font-semibold text-[#2D2D2A]">
                    {item.topic}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-[#6B695F] pl-7">
                {item.summary}
              </p>

              {/* Side-by-Side Stances */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                
                {/* Stance A */}
                <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#E5E2DA] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#F4F1EA] text-[#8C4B3E] border border-[#E2B8B1]">
                          {item.stance_a.outlet}
                        </span>

                        {scoreEnabled && (
                          <button
                            onClick={onOpenScoreManager}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${stanceAScore.badgeBg} ${stanceAScore.badgeText} ${stanceAScore.badgeBorder}`}
                            title={`Reliability Score for ${item.stance_a.outlet}: ${stanceAScore.score}%`}
                          >
                            <Star className="w-2.5 h-2.5 fill-current opacity-80" />
                            <span>{stanceAScore.score}%</span>
                          </button>
                        )}
                      </div>

                      <a
                        href={item.stance_a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8C8A7D] hover:text-[#8C4B3E] transition-colors"
                        title="Open source article"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="text-xs font-medium text-[#2D2D2A] mb-2 leading-relaxed font-sans">
                      "{item.stance_a.claim}"
                    </p>

                    {item.stance_a.quote && (
                      <div className="flex items-start gap-1.5 p-2 bg-[#FFFFFF] rounded-lg text-[11px] text-[#6B695F] italic border border-[#E5E2DA]">
                        <Quote className="w-3 h-3 text-[#8C4B3E]/60 shrink-0 mt-0.5" />
                        <span className="font-serif">{item.stance_a.quote}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stance B */}
                <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#E5E2DA] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#F4F1EA] text-[#5A5A40] border border-[#DEDAD0]">
                          {item.stance_b.outlet}
                        </span>

                        {scoreEnabled && (
                          <button
                            onClick={onOpenScoreManager}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${stanceBScore.badgeBg} ${stanceBScore.badgeText} ${stanceBScore.badgeBorder}`}
                            title={`Reliability Score for ${item.stance_b.outlet}: ${stanceBScore.score}%`}
                          >
                            <Star className="w-2.5 h-2.5 fill-current opacity-80" />
                            <span>{stanceBScore.score}%</span>
                          </button>
                        )}
                      </div>

                      <a
                        href={item.stance_b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8C8A7D] hover:text-[#5A5A40] transition-colors"
                        title="Open source article"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="text-xs font-medium text-[#2D2D2A] mb-2 leading-relaxed font-sans">
                      "{item.stance_b.claim}"
                    </p>

                    {item.stance_b.quote && (
                      <div className="flex items-start gap-1.5 p-2 bg-[#FFFFFF] rounded-lg text-[11px] text-[#6B695F] italic border border-[#E5E2DA]">
                        <Quote className="w-3 h-3 text-[#5A5A40]/60 shrink-0 mt-0.5" />
                        <span className="font-serif">{item.stance_b.quote}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Synthesis Analysis */}
              {item.analysis && (
                <div className="mt-3 p-3 rounded-xl bg-[#F4F1EA] border border-[#E5E2DA] text-xs text-[#3D3D38] flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-[#8C4B3E] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#8C4B3E] font-mono text-[11px] mr-1 uppercase">
                      Synthesis Analysis:
                    </span>
                    <span>{item.analysis}</span>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
