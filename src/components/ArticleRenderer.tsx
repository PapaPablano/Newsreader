import React, { useState } from 'react';
import { SynthesisResult, SentenceCitation } from '../types';
import { ConsensusSnapshot } from './ConsensusSnapshot';
import { DisagreementPanel } from './DisagreementPanel';
import { CitationDrawer } from './CitationDrawer';
import { SourcesList } from './SourcesList';
import { ReliabilityScoreManagerModal } from './ReliabilityScoreManagerModal';
import { Clock, Layers, Sparkles, BookOpen, ChevronRight, Share2, Check } from 'lucide-react';

interface ArticleRendererProps {
  synthesis: SynthesisResult;
  onOpenScoreManager?: () => void;
}

export const ArticleRenderer: React.FC<ArticleRendererProps> = ({
  synthesis,
  onOpenScoreManager
}) => {
  const [selectedCitation, setSelectedCitation] = useState<SentenceCitation | null>(null);
  const [selectedSentenceText, setSelectedSentenceText] = useState<string>('');
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(synthesis.synthesized_at || Date.now()).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenScoreManager = () => {
    if (onOpenScoreManager) {
      onOpenScoreManager();
    } else {
      setIsScoreModalOpen(true);
    }
  };

  const activeOutlets = synthesis.sources ? synthesis.sources.map((s) => s.outlet) : [];

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-[#2D2D2A]">
      
      {/* Article Header & Metadata */}
      <div className="mb-8 border-b border-[#E5E2DA] pb-8">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#F4F1EA] text-[#5A5A40] border border-[#DEDAD0] flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              {synthesis.beat_title || 'Live Search Synthesis'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#FFFFFF] text-[#6B695F] border border-[#E5E2DA] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#5A5A40]" />
              {synthesis.sources_count} Outlets Synthesized
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#8C8A7D] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            <button
              onClick={handleCopyShare}
              className="p-1.5 rounded-lg bg-[#F4F1EA] border border-[#E5E2DA] text-[#6B695F] hover:text-[#2D2D2A] hover:bg-[#EFECE6] transition-colors cursor-pointer"
              title="Copy share link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2D4A2D]" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#2D2D2A] leading-tight tracking-tight mb-4">
          {synthesis.headline}
        </h1>

        {/* Executive Overview Intro */}
        <p className="text-base sm:text-lg font-sans text-[#3D3D38] leading-relaxed font-normal bg-[#F9F8F6] p-5 rounded-2xl border border-[#E5E2DA] shadow-xs">
          {synthesis.summary_intro}
        </p>
      </div>

      {/* Consensus Snapshot */}
      <ConsensusSnapshot consensus={synthesis.consensus} />

      {/* Explicit Disagreement Panel */}
      <DisagreementPanel
        disagreements={synthesis.disagreements}
        onOpenCitation={(citation) => {
          setSelectedCitation(citation);
          setSelectedSentenceText('');
        }}
        onOpenScoreManager={handleOpenScoreManager}
      />

      {/* Themed Prose Sections with Sentence-Level Transparent Citations */}
      <div className="space-y-8 my-10">
        <h2 className="text-xl font-serif font-bold text-[#2D2D2A] border-b border-[#E5E2DA] pb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#5A5A40]" />
          <span>Detailed Multi-Source Analysis</span>
        </h2>

        {synthesis.sections.map((section, sIdx) => (
          <section key={sIdx} className="bg-[#FFFFFF] border border-[#E5E2DA] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-[#5A5A40]" />
              <h3 className="text-base font-serif font-bold text-[#2D2D2A]">
                {section.title}
              </h3>
            </div>

            {section.summary && (
              <p className="text-xs font-mono text-[#6B695F] bg-[#F4F1EA] p-3 rounded-xl border border-[#E5E2DA]">
                {section.summary}
              </p>
            )}

            {/* Sentences with Inline Citation Chips */}
            <div className="text-sm text-[#2D2D2A] leading-relaxed space-y-3 font-sans">
              {section.sentences.map((sentence) => (
                <div 
                  key={sentence.id} 
                  className="p-3.5 rounded-xl hover:bg-[#F9F8F6] transition-colors border border-transparent hover:border-[#E5E2DA] group"
                >
                  <span className="text-[#2D2D2A] font-normal">
                    {sentence.text}{' '}
                  </span>

                  {/* Citation Chips */}
                  <span className="inline-flex items-center gap-1.5 ml-1 flex-wrap">
                    {sentence.citations.map((cit, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => {
                          setSelectedCitation(cit);
                          setSelectedSentenceText(sentence.text);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[#F4F1EA] text-[#5A5A40] border border-[#DEDAD0] hover:bg-[#5A5A40] hover:text-[#FFFFFF] transition-all font-medium cursor-pointer shadow-2xs"
                        title={`Click to view direct quote from ${cit.outlet}`}
                      >
                        <span>[{cit.outlet}]</span>
                      </button>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Sources Breakdown List */}
      <SourcesList sources={synthesis.sources} />

      {/* Citation Popover Drawer */}
      <CitationDrawer
        citation={selectedCitation}
        sentenceText={selectedSentenceText}
        onClose={() => setSelectedCitation(null)}
        onOpenScoreManager={handleOpenScoreManager}
      />

      {/* Local Modal if opened directly from ArticleRenderer */}
      <ReliabilityScoreManagerModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        activeOutlets={activeOutlets}
      />

    </article>
  );
};
