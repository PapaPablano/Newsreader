import React from 'react';
import { BeatDefinition } from '../types';
import { Cpu, TrendingUp, Zap, Layers, Globe } from 'lucide-react';

interface BeatSelectorProps {
  beats: BeatDefinition[];
  selectedSlug: string;
  onSelectBeat: (slug: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Globe: <Globe className="w-4 h-4" />
};

export const BeatSelector: React.FC<BeatSelectorProps> = ({
  beats,
  selectedSlug,
  onSelectBeat
}) => {
  return (
    <div className="w-full border-b border-[#E5E2DA] bg-[#F9F8F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8C8A7D] mr-1 shrink-0">
            Topic Beats:
          </span>
          {beats.map((beat) => {
            const isSelected = beat.slug === selectedSlug;
            return (
              <button
                key={beat.slug}
                id={`beat-tab-${beat.slug}`}
                onClick={() => onSelectBeat(beat.slug)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#5A5A40] text-[#FFFFFF] border-[#4A4A35] font-semibold shadow-2xs'
                    : 'bg-[#FFFFFF] text-[#2D2D2A] border-[#E5E2DA] hover:border-[#C5C0B3] hover:bg-[#F4F1EA]'
                }`}
              >
                <span className={isSelected ? 'text-[#FFFFFF]' : 'text-[#5A5A40]'}>
                  {iconMap[beat.icon_name] || <Cpu className="w-4 h-4" />}
                </span>
                <span className="font-sans">{beat.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
