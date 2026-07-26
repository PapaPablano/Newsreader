export interface NewsSource {
  id: string;
  outlet: string;
  title: string;
  url: string;
  published_at: string;
  snippet?: string;
  feed_url?: string;
}

export interface SentenceCitation {
  source_id: string;
  outlet: string;
  title: string;
  url: string;
  quote: string;
}

export interface SynthesisSentence {
  id: string;
  text: string;
  citations: SentenceCitation[];
}

export interface SynthesisSection {
  title: string;
  summary: string;
  sentences: SynthesisSentence[];
}

export interface DisagreementStance {
  outlet: string;
  claim: string;
  quote: string;
  url: string;
}

export interface DisagreementItem {
  id: string;
  topic: string;
  summary: string;
  stance_a: DisagreementStance;
  stance_b: DisagreementStance;
  analysis: string;
}

export interface ConsensusItem {
  id: string;
  fact: string;
  supporting_outlets: string[];
  citation_ids: string[];
}

export interface SynthesisResult {
  schema_version: string;
  headline: string;
  summary_intro: string;
  synthesized_at: string;
  beat_slug?: string;
  beat_title?: string;
  search_query?: string;
  sources_count: number;
  sources: NewsSource[];
  consensus: ConsensusItem[];
  disagreements: DisagreementItem[];
  sections: SynthesisSection[];
}

export interface BeatDefinition {
  slug: string;
  title: string;
  description: string;
  icon_name: string;
  query: string;
  sources: {
    outlet: string;
    feed_url: string;
  }[];
}
