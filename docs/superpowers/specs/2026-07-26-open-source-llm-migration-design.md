# Open-Source LLM Migration Design

**Date:** 2026-07-26
**Status:** Approved

## Purpose

Replace Gemini-specific API calls in the actively-deployed code path with open-weight-model equivalents, so the app no longer depends on Google's Gemini API.

## Scope

**In scope** (actively deployed):
- `server.ts` — `/api/search` live search synthesis route (Render)
- `scripts/refresh-beats.js` — scheduled beat synthesis producer (`refresh-beats.yml` GitHub Action)
- Supporting config: `render.yaml`, `.github/workflows/refresh-beats.yml`, `package.json`, `metadata.json`
- `src/components/WorkflowInspector.tsx` — cosmetic update to embedded example-code strings shown in the UI

**Out of scope:**
- `worker/index.js` / `worker/wrangler.toml` — a Cloudflare Worker implementation of live search that calls the Gemini REST API directly. It is not wired into the current Render/Pages deployment (no active `wrangler deploy` step, not referenced by any workflow). Left untouched; can be revisited separately if it's ever activated.
- `schema/build-prompt.js` — only contains a comment mentioning Gemini; the prompt-building logic itself is already provider-agnostic. Comment left as-is (harmless, low-value edit).

## Architecture

Two separate concerns previously bundled into one Gemini call are now split:

1. **Language model** — [Groq](https://groq.com), hosted inference for open-weight models via an OpenAI-compatible REST API (`https://api.groq.com/openai/v1/chat/completions`). Model: `llama-3.3-70b-versatile`, using JSON mode (`response_format: { type: "json_object" }`).
2. **Live web search grounding** (search route only) — [Tavily](https://tavily.com) search API (`https://api.tavily.com/search`), purpose-built for LLM/RAG grounding use cases.

Both are called via plain `fetch` — no new SDK dependencies added, matching the existing raw-REST pattern already used in `worker/index.js` for Gemini.

### Data flow: `/api/search` (server.ts)

Before: `query → Gemini (generateContent + googleSearch tool) → parsed JSON`

After:
1. `query → Tavily search API → web results (title, url, snippet, domain)`
2. Map results into the existing `sources` array shape (the domain→outlet-name mapping already in `server.ts` is provider-agnostic, reused unchanged).
3. `buildSynthesisPrompt(query, sources)` — unchanged, already provider-agnostic.
4. `prompt → Groq chat completions (JSON mode) → raw JSON text`
5. `JSON.parse` → `validateSynthesis` → response — unchanged.

### Data flow: `scripts/refresh-beats.js`

Before: `RSS content → Gemini (generateContent) → parsed JSON`
After: `RSS content → Groq chat completions (JSON mode) → parsed JSON`

No search grounding involved here — the script already works from pre-fetched RSS feed content, so this is a straight LLM-call substitution using the same prompt/validate pipeline.

## Environment variables

| Old | New | Used by |
|---|---|---|
| `GEMINI_API_KEY` | `GROQ_API_KEY` | server.ts (`/api/search`), scripts/refresh-beats.js |
| — | `TAVILY_API_KEY` | server.ts (`/api/search`) only |

Both follow the existing lazy-init-and-throw pattern (`getGenAI()` today) — missing key throws a clear error at call time, not at server startup.

`render.yaml`: `GEMINI_API_KEY` entry replaced with `GROQ_API_KEY` and `TAVILY_API_KEY`, both `sync: false` (entered directly in the Render dashboard, never committed).

`.github/workflows/refresh-beats.yml`: `GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}` → `GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}`. No Tavily secret needed here (no live search in this workflow).

## File-by-file changes

- **`server.ts`**
  - Remove `import { GoogleGenAI } from '@google/genai'` and `getGenAI()`.
  - Add `callGroq(prompt: string): Promise<string>` — POSTs to Groq's chat completions endpoint, returns the raw JSON text from the response.
  - Add `searchTavily(query: string): Promise<TavilySource[]>` — POSTs to Tavily's search endpoint, maps results into the existing outlet/source shape.
  - `/api/search` handler: replace the grounding + `generateContent` calls with `searchTavily` → `buildSynthesisPrompt` → `callGroq`. Error handling (try/catch → 500 with message) stays the same shape.

- **`scripts/refresh-beats.js`**
  - Replace `GoogleGenAI` client and `models.generateContent` call with a local `callGroq`-style `fetch` call (duplicated rather than shared, since this script runs standalone in CI outside the Express app's module graph).

- **`render.yaml`** — env var swap described above.

- **`.github/workflows/refresh-beats.yml`** — env var swap described above.

- **`package.json`** — remove `@google/genai` dependency (nothing left depends on it once both call sites are swapped).

- **`src/components/WorkflowInspector.tsx`** — update the embedded example-code template strings (`workflowYml`, `workerJs`) to reference `GROQ_API_KEY` instead of `GEMINI_API_KEY`. Display-only, no behavioral effect.

- **`metadata.json`** — remove `"MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"` from `majorCapabilities` (this is an AI-Studio-specific descriptor tied to Gemini; no longer accurate once the server no longer calls Gemini).

## Error handling

Unchanged shape from the current implementation:
- Missing `GROQ_API_KEY` / `TAVILY_API_KEY` → thrown at call time, caught by the route's existing try/catch, returned as `500` with a message.
- Tavily returning zero results → existing fallback-sources logic (already present for the "no grounding chunks" case) reused as-is.
- Groq response not valid JSON → existing `JSON.parse` try/catch path, same 500 response shape as today.

## Testing plan

- `npm run build` and `npm run lint` (tsc --noEmit) must pass.
- Local smoke test of `/api/search` against real Tavily + Groq API keys, confirming the response validates against `validateSynthesis` and matches the existing response shape.
- `scripts/refresh-beats.js` is not easily smoke-tested standalone (needs live RSS data + CI context) — verified by type/logic review instead, mirroring the structure of the already-tested `server.ts` change.

## Rollout

Same manual-step pattern as the Render deploy PR: after merge, the user sets `GROQ_API_KEY` and `TAVILY_API_KEY` directly in the Render dashboard and as a GitHub Actions secret (`GROQ_API_KEY`) for `refresh-beats.yml`. Neither key is ever written to a committed file.
