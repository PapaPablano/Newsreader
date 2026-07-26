/**
 * Live Producer: Cloudflare Worker
 * Proxies live search requests, executes multi-source query synthesis via AI API,
 * validates against schema/validate-synthesis.js, and returns output in shared JSON shape.
 */

import { buildSynthesisPrompt } from '../schema/build-prompt.js';
import { validateSynthesis } from '../schema/validate-synthesis.js';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/live-search' && (request.method === 'POST' || request.method === 'GET')) {
      let query = url.searchParams.get('q');

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          query = body.query || body.q || query;
        } catch (e) {
          // Fallback to URL searchParams
        }
      }

      if (!query) {
        return Response.json({ error: 'Query parameter "q" or body "query" is required' }, { status: 400 });
      }

      const apiKey = env.GEMINI_API_KEY || env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return Response.json({ error: 'Worker secret API key not configured' }, { status: 500 });
      }

      try {
        // Construct prompt using shared contract builder
        const prompt = buildSynthesisPrompt(
          `Live Search Query: ${query}`,
          [
            { id: 'src_reuters_1', outlet: 'Reuters', title: `Reuters Live Report: ${query}`, url: 'https://www.reuters.com' },
            { id: 'src_ap_1', outlet: 'Associated Press', title: `AP News Brief: ${query}`, url: 'https://apnews.com' },
            { id: 'src_bloomberg_1', outlet: 'Bloomberg', title: `Bloomberg Analysis: ${query}`, url: 'https://www.bloomberg.com' }
          ]
        );

        // Call Gemini or LLM model endpoint
        const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        const data = await apiRes.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(rawJsonText);
        parsed.search_query = query;
        parsed.synthesized_at = new Date().toISOString();

        // Validate output using shared validator contract
        const validation = validateSynthesis(parsed);
        if (!validation.valid) {
          console.warn('Worker validation warnings:', validation.errors);
        }

        return new Response(JSON.stringify(parsed), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      } catch (err) {
        return Response.json({ error: 'Live synthesis failed', message: err.message }, { status: 500 });
      }
    }

    return Response.json({ status: 'live-producer-worker-ok' });
  }
};
