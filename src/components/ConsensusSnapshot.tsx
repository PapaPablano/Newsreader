import React from 'react';
import { ConsensusItem } from '../types';
import { CheckCircle2, ShieldCheck, Tag } from 'lucide-react';

interface ConsensusSnapshotProps {
  consensus: ConsensusItem[];
}

export const ConsensusSnapshot: React.FC<ConsensusSnapshotProps> = ({ consensus }) => {
  if (!consensus || consensus.length === 0) return null;

  return (
    <div id="consensus-snapshot-card" className="bg-[#F4F8F4] border border-[#B8CBB8] rounded-2xl p-5 sm:p-6 mb-8 shadow-xs">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="p-2 rounded-xl bg-[#EBF0EB] text-[#2D4A2D] border border-[#A3C1A3]">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-serif font-semibold text-[#2D4A2D] tracking-tight">
            Verified Consensus Snapshot
          </h3>
          <p className="text-xs text-[#526B52]">
            Factual statements independently verified across all consulting outlets without contradiction
          </p>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {consensus.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#D1E0D1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#2D4A2D] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-[#2D2D2A] leading-relaxed font-sans">
                {item.fact}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {item.supporting_outlets.map((outlet, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#EBF0EB] text-[#2D4A2D] border border-[#C5D6C5]"
                >
                  <Tag className="w-3 h-3 text-[#385E38]" />
                  {outlet}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
