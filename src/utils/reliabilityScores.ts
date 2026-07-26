/**
 * Helper utility for tracking user-provided reliability scores for news outlets.
 * Scores are stored in localStorage and do NOT affect core AI synthesis logic.
 */

const STORAGE_KEY = 'news_source_reliability_scores_v1';
const TOGGLE_KEY = 'news_source_reliability_enabled_v1';

export const DEFAULT_RELIABILITY_SCORES: Record<string, number> = {
  'Reuters': 94,
  'Associated Press': 95,
  'Bloomberg': 91,
  'Financial Times': 90,
  'Wall Street Journal': 89,
  'BBC News': 88,
  'The Guardian': 85,
  'MIT Technology Review': 92,
  'Ars Technica': 87,
  'Nikkei Asia': 88,
  'TechCrunch': 84,
  'Foreign Affairs': 93,
  'New York Times': 89,
  'Washington Post': 88,
  'CNBC': 82
};

export function isReliabilityScoresEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(TOGGLE_KEY);
  return val !== null ? val === 'true' : true;
}

export function setReliabilityScoresEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOGGLE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent('reliability_scores_updated'));
}

export function getReliabilityScores(): Record<string, number> {
  if (typeof window === 'undefined') return { ...DEFAULT_RELIABILITY_SCORES };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_RELIABILITY_SCORES };
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_RELIABILITY_SCORES, ...parsed };
  } catch (e) {
    return { ...DEFAULT_RELIABILITY_SCORES };
  }
}

export function setOutletReliabilityScore(outlet: string, score: number): void {
  if (typeof window === 'undefined') return;
  const current = getReliabilityScores();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  current[outlet] = clamped;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent('reliability_scores_updated'));
}

export function resetReliabilityScores(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('reliability_scores_updated'));
}

export interface OutletScoreDetails {
  score: number;
  isDefault: boolean;
  tierLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export function getOutletScoreDetails(outletName: string): OutletScoreDetails {
  const scores = getReliabilityScores();
  const cleanName = outletName || 'Unknown Outlet';
  
  const hasUserDefined = typeof scores[cleanName] === 'number';
  const score = hasUserDefined ? scores[cleanName] : (DEFAULT_RELIABILITY_SCORES[cleanName] ?? 80);
  const isDefault = !hasUserDefined || (DEFAULT_RELIABILITY_SCORES[cleanName] === scores[cleanName]);

  let tierLabel = 'High Trust';
  let badgeBg = 'bg-[#EBF0EB]';
  let badgeText = 'text-[#2D4A2D]';
  let badgeBorder = 'border-[#B8CBB8]';

  if (score >= 90) {
    tierLabel = 'Very High Trust';
    badgeBg = 'bg-[#EBF0EB]';
    badgeText = 'text-[#2D4A2D]';
    badgeBorder = 'border-[#A3C1A3]';
  } else if (score >= 80) {
    tierLabel = 'High Trust';
    badgeBg = 'bg-[#F5F2EB]';
    badgeText = 'text-[#5A5A40]';
    badgeBorder = 'border-[#D9D3C5]';
  } else if (score >= 70) {
    tierLabel = 'Moderate Trust';
    badgeBg = 'bg-[#FAF3E8]';
    badgeText = 'text-[#8C6239]';
    badgeBorder = 'border-[#E3CBB3]';
  } else {
    tierLabel = 'Caution / Low Rating';
    badgeBg = 'bg-[#F9ECEB]';
    badgeText = 'text-[#8C4B3E]';
    badgeBorder = 'border-[#E5BDB8]';
  }

  return {
    score,
    isDefault,
    tierLabel,
    badgeBg,
    badgeText,
    badgeBorder
  };
}
