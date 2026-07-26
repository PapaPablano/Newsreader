/**
 * Prompt Builder for News Synthesis Engine
 * Constructs prompts for Gemini / AI models ensuring compliance with the shared JSON contract.
 */

export function buildSynthesisPrompt(topicOrBeat, articlesList) {
  const articlesFormatted = articlesList.map((a, idx) => `
SOURCE [${a.id || idx + 1}]:
- Outlet: ${a.outlet}
- Title: ${a.title}
- Date: ${a.published_at || 'Recent'}
- URL: ${a.url}
- Excerpt/Content: ${a.snippet || a.content || 'N/A'}
`).join('\n---\n');

  return `
You are a precision multi-source news synthesis intelligence engine. Your task is to analyze coverage of the topic/beat: "${topicOrBeat}" from multiple news outlets and output a rigorous JSON synthesis.

CRITICAL PRINCIPLES & CONSTRAINTS:
1. DIFFERENTIATOR: Do NOT flatten coverage into a bland consensus summary like typical AI summarizers. You MUST explicitly surface exact points where news sources disagree, contradict each other, frame numbers differently, or prioritize conflicting perspectives.
2. CITATIONS: Every single sentence in your main prose sections MUST be grounded by transparent, direct per-sentence citations to one or more of the provided sources. Include exact direct quotes from the source when applicable.
3. OUTLET NAMES ONLY: Use source outlet names strictly (e.g. "Reuters", "Associated Press", "Bloomberg", "The Guardian", "Wall Street Journal"). NEVER include bias, political, or ideological tags.
4. JSON STRUCTURE: Respond ONLY with valid, strict JSON matching the schema format below. No markdown wrapping outside the JSON, no commentary.

REQUIRED JSON OUTPUT SCHEMA:
{
  "schema_version": "1.0",
  "headline": "A sharp, multi-perspective headline synthesizing the current state of this topic",
  "summary_intro": "A 2-3 sentence high-level overview of the narrative without diluting disagreements",
  "sources_count": ${articlesList.length},
  "consensus": [
    {
      "id": "c1",
      "fact": "Core fact that all reporting sources agree upon",
      "supporting_outlets": ["Reuters", "Associated Press"],
      "citation_ids": ["src_1", "src_2"]
    }
  ],
  "disagreements": [
    {
      "id": "d1",
      "topic": "Key Friction Point / Specific Metric or Stance Contradiction",
      "summary": "Brief explanation of why sources diverge on this point",
      "stance_a": {
        "outlet": "Outlet A Name",
        "claim": "Specific claim, figure, or stance reported by Outlet A",
        "quote": "Direct quote from Outlet A",
        "url": "Source URL"
      },
      "stance_b": {
        "outlet": "Outlet B Name",
        "claim": "Contrasting claim, figure, or stance reported by Outlet B",
        "quote": "Direct quote from Outlet B",
        "url": "Source URL"
      },
      "analysis": "Objective contextual analysis of why this discrepancy exists (e.g. different methodologies, conflicting official statements, varied editorial focus)"
    }
  ],
  "sections": [
    {
      "title": "Sub-theme / Narrative Angle Title",
      "summary": "Section thesis overview",
      "sentences": [
        {
          "id": "s1",
          "text": "Specific assertion or narrative sentence summarizing part of the development.",
          "citations": [
            {
              "source_id": "src_1",
              "outlet": "Outlet Name",
              "title": "Source Article Title",
              "url": "Source URL",
              "quote": "Exact direct quote backing this sentence"
            }
          ]
        }
      ]
    }
  ]
}

ARTICLES TO SYNTHESIZE:
${articlesFormatted}
`;
}
