/**
 * Shared AI provider helpers: Groq (LLM synthesis) and Tavily (search grounding).
 * Used by server.ts (live search route) and scripts/refresh-beats.js (scheduled producer).
 */

const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function callGroq(prompt, systemInstruction) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Groq API returned no content');
  }
  return text;
}

export async function searchTavily(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY environment variable is not configured');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      max_results: 8,
      include_answer: false
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Tavily API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const results = data.results || [];

  return results.map((r, idx) => {
    let domain = 'News Source';
    try {
      domain = new URL(r.url).hostname.replace(/^www\./, '');
    } catch (e) {}

    let outlet = domain;
    if (domain.includes('reuters')) outlet = 'Reuters';
    else if (domain.includes('apnews')) outlet = 'Associated Press';
    else if (domain.includes('bloomberg')) outlet = 'Bloomberg';
    else if (domain.includes('bbc')) outlet = 'BBC News';
    else if (domain.includes('wsj')) outlet = 'Wall Street Journal';
    else if (domain.includes('ft.com')) outlet = 'Financial Times';
    else if (domain.includes('theguardian')) outlet = 'The Guardian';
    else if (domain.includes('technologyreview')) outlet = 'MIT Technology Review';
    else if (domain.includes('arstechnica')) outlet = 'Ars Technica';
    else if (domain.includes('techcrunch')) outlet = 'TechCrunch';
    else if (domain.includes('cnbc')) outlet = 'CNBC';
    else if (domain.includes('nytimes')) outlet = 'New York Times';
    else if (domain.includes('washingtonpost')) outlet = 'Washington Post';

    return {
      id: `src_live_${idx + 1}`,
      outlet,
      title: r.title || `${outlet} coverage`,
      url: r.url,
      published_at: r.published_date || new Date().toISOString(),
      snippet: (r.content || '').slice(0, 300)
    };
  });
}
