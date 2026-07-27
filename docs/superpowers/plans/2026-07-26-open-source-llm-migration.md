# Open-Source LLM Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Gemini calls in `server.ts` (`/api/search`) and `scripts/refresh-beats.js` with Groq (open-weight LLM inference) and Tavily (search grounding), per `docs/superpowers/specs/2026-07-26-open-source-llm-migration-design.md`.

**Architecture:** A new shared module `lib/ai-providers.js` wraps both external APIs behind two plain functions, `callGroq` and `searchTavily`, called via the Node 20+ global `fetch` (no new SDK dependencies). Both `server.ts` (bundled via esbuild/TS) and `scripts/refresh-beats.js` (run directly by `node`, no build step) import this same file — matching the existing pattern where both already import `schema/build-prompt.js` and `schema/validate-synthesis.js` the same way.

**Tech Stack:** Node.js (global `fetch`), Groq chat completions API (`https://api.groq.com/openai/v1/chat/completions`, OpenAI-compatible, JSON mode), Tavily search API (`https://api.tavily.com/search`).

## Global Constraints

- Model: `llama-3.3-70b-versatile` (Groq).
- Env vars: `GROQ_API_KEY` (both call sites), `TAVILY_API_KEY` (`/api/search` only) — replace `GEMINI_API_KEY` everywhere in scope.
- Never write a real API key into any committed file. `render.yaml` keeps secrets as `sync: false`; local testing uses an untracked `.env` (already covered by `.gitignore`'s `.env*` rule).
- `worker/index.js` and `worker/wrangler.toml` are out of scope — do not modify. They are not wired into the current deployment.
- `schema/build-prompt.js`'s Gemini-mentioning comment is out of scope — cosmetic only, not worth a task.
- This project has no test framework configured (no jest/vitest/mocha in `package.json`). Verification steps below use `node -e` one-liners and `npm run build`/`npm run lint` with an expected-output check, in place of automated test files — this matches the design spec's own "Testing plan" section, which is manual-smoke-test based.
- Base branch: `main` (already includes PR #1, #2, #3 — Pages/Render setup). Work on a new branch, e.g. `feat/groq-tavily-migration`.

---

### Task 1: Shared Groq + Tavily provider module

**Files:**
- Create: `lib/ai-providers.js`

**Interfaces:**
- Produces: `callGroq(prompt: string, systemInstruction: string): Promise<string>` — returns the raw JSON text from Groq's response. Throws if `GROQ_API_KEY` is unset or the API call fails.
- Produces: `searchTavily(query: string): Promise<Array<{id: string, outlet: string, title: string, url: string, published_at: string, snippet: string}>>` — throws if `TAVILY_API_KEY` is unset or the API call fails. Returns `[]` (not a throw) if Tavily returns zero results.

- [ ] **Step 1: Create `lib/ai-providers.js`**

```js
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
```

- [ ] **Step 2: Verify the missing-key guard without needing real API keys**

Run: `cd /path/to/Newsreader && node -e "import('./lib/ai-providers.js').then(async m => { try { await m.callGroq('x','y'); console.log('FAIL: did not throw'); } catch (e) { console.log('OK:', e.message); } })"`

Expected: `OK: GROQ_API_KEY environment variable is not configured`

Run: `node -e "import('./lib/ai-providers.js').then(async m => { try { await m.searchTavily('x'); console.log('FAIL: did not throw'); } catch (e) { console.log('OK:', e.message); } })"`

Expected: `OK: TAVILY_API_KEY environment variable is not configured`

- [ ] **Step 3: Commit**

```bash
git add lib/ai-providers.js
git commit -m "feat: add shared Groq + Tavily provider module"
```

---

### Task 2: Migrate `/api/search` in `server.ts` to Groq + Tavily

**Files:**
- Modify: `server.ts:1-8` (imports)
- Modify: `server.ts:28-40` (remove `getGenAI`)
- Modify: `server.ts:172-272` (`/api/search` route body)

**Interfaces:**
- Consumes: `callGroq(prompt, systemInstruction)`, `searchTavily(query)` from Task 1's `lib/ai-providers.js`.
- Consumes (unchanged): `buildSynthesisPrompt(topicOrBeat, articlesList)` and `validateSynthesis(data)` from `schema/*.js`.

- [ ] **Step 1: Replace the Gemini import with the new provider module**

In `server.ts`, replace:

```ts
import { GoogleGenAI } from '@google/genai';
```

with:

```ts
import { callGroq, searchTavily } from './lib/ai-providers.js';
```

- [ ] **Step 2: Remove the `getGenAI` helper**

Delete this block from inside `startServer()`:

```ts
  // Shared Gemini client lazy initialization helper
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
  };
```

- [ ] **Step 3: Rewrite the `/api/search` route body**

Replace the entire `app.post('/api/search', ...)` handler with:

```ts
  // API 4: Live Search Synthesis Producer
  app.post('/api/search', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      console.log(`[Live Search Producer] Processing query: "${query}"`);

      // Step 1: Live web search grounding via Tavily
      let sourcesList = await searchTavily(query);

      // Ensure fallback sources if Tavily returns nothing
      if (sourcesList.length === 0) {
        sourcesList = [
          { id: 'src_reuters_live', outlet: 'Reuters', title: `Reuters Coverage: ${query}`, url: 'https://www.reuters.com', published_at: new Date().toISOString(), snippet: '' },
          { id: 'src_ap_live', outlet: 'Associated Press', title: `AP News Brief: ${query}`, url: 'https://apnews.com', published_at: new Date().toISOString(), snippet: '' },
          { id: 'src_bloomberg_live', outlet: 'Bloomberg', title: `Bloomberg Analysis: ${query}`, url: 'https://www.bloomberg.com', published_at: new Date().toISOString(), snippet: '' }
        ];
      }

      // Step 2: Pass grounding insights into schema prompt builder
      const prompt = buildSynthesisPrompt(query, sourcesList);

      const rawJson = await callGroq(
        prompt,
        'You are an objective news synthesis engine. You MUST output strictly valid JSON matching the schema contract. Ensure transparent per-sentence citations and highlight explicit points of disagreement between sources. Never include political bias/leaning tags on source outlet names.'
      );
      let parsed = JSON.parse(rawJson);
      parsed.search_query = query;
      parsed.synthesized_at = new Date().toISOString();

      // Ensure sources match
      if (!parsed.sources || parsed.sources.length === 0) {
        parsed.sources = sourcesList;
      }

      // Step 3: Validate against shared contract schema
      const validation = validateSynthesis(parsed);
      if (!validation.valid) {
        console.warn('[Live Search Producer] Validation errors:', validation.errors);
      }

      res.json(parsed);
    } catch (err: any) {
      console.error('[Live Search Producer Error]:', err);
      res.status(500).json({
        error: 'Live synthesis failed',
        message: err.message
      });
    }
  });
```

- [ ] **Step 4: Type-check**

Run: `npm run lint`
Expected: exits 0, no `tsc` errors (in particular, no leftover reference to `GoogleGenAI` or `getGenAI`).

- [ ] **Step 5: Build and verify the missing-key error path end-to-end**

```bash
npm run build
PORT=8099 NODE_ENV=production node dist/server.mjs &
sleep 1
node -e 'fetch("http://localhost:8099/api/search", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({query:"test"}) }).then(async r => { console.log(r.status, JSON.stringify(await r.json())); })'
kill %1
```

Expected: `500 {"error":"Live synthesis failed","message":"TAVILY_API_KEY environment variable is not configured"}` (Tavily is called first, so its error surfaces before Groq's).

- [ ] **Step 6: Commit**

```bash
git add server.ts
git commit -m "feat: migrate /api/search from Gemini to Groq + Tavily"
```

---

### Task 3: Migrate `scripts/refresh-beats.js` to Groq

**Files:**
- Modify: `scripts/refresh-beats.js`

**Interfaces:**
- Consumes: `callGroq(prompt, systemInstruction)` from Task 1's `lib/ai-providers.js`.

- [ ] **Step 1: Replace the Gemini import and client setup**

Replace:

```js
import { GoogleGenAI } from '@google/genai';
```

with:

```js
import { callGroq } from '../lib/ai-providers.js';
```

- [ ] **Step 2: Replace the API key check and client construction**

Replace:

```js
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY environment variable is missing.');
    process.exit(1);
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
```

with:

```js
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY environment variable is missing.');
    process.exit(1);
  }
```

- [ ] **Step 3: Replace the per-beat generation call**

Replace:

```js
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'Output strictly valid JSON matching the provided schema. Surface explicit source disagreements and transparent per-sentence citations.'
        }
      });

      const rawText = response.text;
      const parsed = JSON.parse(rawText);
```

with:

```js
    try {
      const rawText = await callGroq(
        prompt,
        'Output strictly valid JSON matching the provided schema. Surface explicit source disagreements and transparent per-sentence citations.'
      );
      const parsed = JSON.parse(rawText);
```

- [ ] **Step 4: Verify the fail-fast path without a real key**

Run: `env -u GROQ_API_KEY node scripts/refresh-beats.js; echo "exit code: $?"`

Expected: prints `📰 Starting News Synthesis Scheduled Producer...` then `❌ GROQ_API_KEY environment variable is missing.` and `exit code: 1`.

- [ ] **Step 5: Commit**

```bash
git add scripts/refresh-beats.js
git commit -m "feat: migrate refresh-beats producer from Gemini to Groq"
```

---

### Task 4: Update config, workflow, and package files

**Files:**
- Modify: `render.yaml`
- Modify: `.github/workflows/refresh-beats.yml`
- Modify: `package.json`
- Modify: `metadata.json`
- Modify: `src/components/WorkflowInspector.tsx:13-53`

**Interfaces:** None (config-only; no code interfaces produced or consumed).

- [ ] **Step 1: Update `render.yaml`**

Replace:

```yaml
      - key: GEMINI_API_KEY
        sync: false
```

with:

```yaml
      - key: GROQ_API_KEY
        sync: false
      - key: TAVILY_API_KEY
        sync: false
```

- [ ] **Step 2: Update `.github/workflows/refresh-beats.yml`**

Replace:

```yaml
      - name: Run beat synthesis producer script
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          FORCE_BEAT: ${{ github.event.inputs.force_beat }}
        run: node scripts/refresh-beats.js
```

with:

```yaml
      - name: Run beat synthesis producer script
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          FORCE_BEAT: ${{ github.event.inputs.force_beat }}
        run: node scripts/refresh-beats.js
```

- [ ] **Step 3: Remove the `@google/genai` dependency**

Run: `npm uninstall @google/genai`

Expected: `package.json` dependencies no longer list `@google/genai`; `package-lock.json` is updated (both are modified files after this command — no manual edit needed).

- [ ] **Step 4: Update `metadata.json`**

Replace:

```json
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
```

with:

```json
  "majorCapabilities": []
```

- [ ] **Step 5: Update `WorkflowInspector.tsx`'s embedded example strings**

In `src/components/WorkflowInspector.tsx`, within the `workflowYml` template string, replace:

```
      - run: node scripts/refresh-beats.js
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
```

with:

```
      - run: node scripts/refresh-beats.js
        env:
          GROQ_API_KEY: \${{ secrets.GROQ_API_KEY }}
```

Within the `workerJs` template string, replace:

```
      const apiKey = env.GEMINI_API_KEY;
```

with:

```
      const apiKey = env.GROQ_API_KEY;
```

- [ ] **Step 6: Verify no remaining Gemini references in the in-scope files**

Run: `grep -rn -i "gemini\|genai" server.ts scripts/refresh-beats.js render.yaml .github/workflows/refresh-beats.yml package.json metadata.json src/components/WorkflowInspector.tsx`

Expected: no output (empty match), confirming all in-scope references are gone. (`worker/index.js`, `worker/wrangler.toml`, and `schema/build-prompt.js`'s comment are intentionally excluded from this grep since they're out of scope.)

- [ ] **Step 7: Build and type-check**

```bash
npm run build
npm run lint
```

Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add render.yaml .github/workflows/refresh-beats.yml package.json package-lock.json metadata.json src/components/WorkflowInspector.tsx
git commit -m "chore: swap GEMINI_API_KEY for GROQ_API_KEY/TAVILY_API_KEY across config"
```

---

### Task 5: End-to-end verification, push, and PR

**Files:** None (verification and delivery only).

**Interfaces:** None.

- [ ] **Step 1: Full local rebuild**

```bash
npm run build
npm run lint
```

Expected: both exit 0.

- [ ] **Step 2: Live smoke test (requires real `GROQ_API_KEY` and `TAVILY_API_KEY`)**

If both keys are available (e.g. in a local untracked `.env`, loaded via `export $(cat .env | xargs)` or similar — never printed or committed):

```bash
NODE_ENV=production node dist/server.mjs &
sleep 1
node -e 'fetch("http://localhost:3000/api/search", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({query:"AI regulation"}) }).then(async r => { const j = await r.json(); console.log(r.status, JSON.stringify(j).slice(0, 500)); })'
kill %1
```

Expected: `200`, and the printed JSON includes `headline`, `sources`, `consensus` fields matching the shared schema contract (same shape `validateSynthesis` checks).

If keys are not available at implementation time, skip this step and note it explicitly to the user as still-needed manual verification after they set the keys in Render.

- [ ] **Step 3: Push and open PR**

```bash
git push -u origin feat/groq-tavily-migration
gh pr create --title "Migrate live search and beat synthesis from Gemini to Groq + Tavily" --body "$(cat <<'EOF'
## Summary
Implements docs/superpowers/specs/2026-07-26-open-source-llm-migration-design.md.

- /api/search (server.ts): Gemini + built-in Google Search grounding -> Tavily search + Groq (llama-3.3-70b-versatile) synthesis.
- scripts/refresh-beats.js: Gemini -> Groq for scheduled beat synthesis.
- New shared lib/ai-providers.js used by both call sites.
- render.yaml, refresh-beats.yml, package.json, metadata.json, WorkflowInspector.tsx updated accordingly.
- worker/index.js intentionally left untouched (not part of the active deployment).

## Test plan
- [x] npm run build / npm run lint pass
- [x] Missing-key error paths verified for both callGroq and searchTavily
- [ ] Live smoke test with real GROQ_API_KEY + TAVILY_API_KEY (see PR description checklist below)

## Manual steps after merge
1. Set GROQ_API_KEY and TAVILY_API_KEY in the Render dashboard (render.yaml already declares them as sync: false).
2. Set GROQ_API_KEY as a GitHub Actions secret for refresh-beats.yml.
3. Re-run "Refresh News Beats" workflow_dispatch and confirm it completes without the old GEMINI_API_KEY error.
EOF
)"
```

- [ ] **Step 4: Report the PR URL to the user**

No further action — merging is the user's call, matching how PRs #1-#3 were handled in this project (reviewed, then explicitly merged on request).
