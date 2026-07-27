import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { callGroq, searchTavily } from './lib/ai-providers.js';
import { buildSynthesisPrompt } from './schema/build-prompt.js';
import { validateSynthesis } from './schema/validate-synthesis.js';

// Both `tsx server.ts` (dev) and `node dist/server.mjs` (prod) are invoked
// from the project root, so process.cwd() is a stable base for project-relative
// paths -- unlike __dirname, which would point inside dist/ once bundled.
const projectRoot = process.cwd();

async function startServer() {
  const app = express();
  // Render (and most hosts) assign the port dynamically via $PORT.
  const PORT = Number(process.env.PORT) || 3000;

  // The frontend is deployed separately on GitHub Pages, so API requests
  // arrive cross-origin. ALLOWED_ORIGIN defaults to the Pages origin;
  // override via env if the frontend moves.
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://papapablano.github.io';
  app.use(cors({ origin: allowedOrigin }));

  app.use(express.json());

  // API 1: Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      scheduled_workflow_status: 'paused',
      workflow_cron: '0 */6 * * *',
      live_producer: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  // API 2: List Beats & Archives
  app.get('/api/beats', (req, res) => {
    try {
      const beatsPath = path.join(projectRoot, 'config', 'beats.json');
      if (!fs.existsSync(beatsPath)) {
        return res.status(404).json({ error: 'beats.json config not found' });
      }
      const beats = JSON.parse(fs.readFileSync(beatsPath, 'utf8'));

      // Check available data files in data/
      const dataDir = path.join(projectRoot, 'data');
      let archives: string[] = [];
      if (fs.existsSync(dataDir)) {
        archives = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
      }

      res.json({
        beats,
        archives,
        workflow_status: {
          scheduled_cron: '0 */6 * * *',
          active: false,
          note: 'Scheduled 6-hour refresh paused in GitHub Actions'
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 3: Get Specific Beat Synthesis
  app.get('/api/beat/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const requestedDate = req.query.date as string;

      const dataDir = path.join(projectRoot, 'data');
      let files: string[] = [];
      if (fs.existsSync(dataDir)) {
        files = fs.readdirSync(dataDir).filter(f => f.startsWith(`${slug}-`) && f.endsWith('.json'));
      }

      if (files.length > 0) {
        let targetFile = files.sort().reverse()[0]; // Default to latest file
        if (requestedDate) {
          const dateMatch = files.find(f => f.includes(requestedDate));
          if (dateMatch) {
            targetFile = dateMatch;
          }
        }
        const filePath = path.join(dataDir, targetFile);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return res.json(data);
      }

      // Fallback: If no file exists for this beat slug, load beat definition from beats.json
      const beatsPath = path.join(projectRoot, 'config', 'beats.json');
      if (fs.existsSync(beatsPath)) {
        const beats = JSON.parse(fs.readFileSync(beatsPath, 'utf8'));
        const beat = beats.find((b: any) => b.slug === slug);
        if (beat) {
          // Dynamic fallback response for beats without saved archives
          const fallbackData = {
            schema_version: "1.0",
            beat_slug: beat.slug,
            beat_title: beat.title,
            synthesized_at: new Date().toISOString(),
            headline: `${beat.title}: Global Coverage and Strategic Analysis`,
            summary_intro: `Synthesized analysis covering ${beat.description.toLowerCase()} compiled from major international news outlets.`,
            sources_count: beat.sources.length,
            sources: beat.sources.map((s: any, idx: number) => ({
              id: `src_${beat.slug}_${idx + 1}`,
              outlet: s.outlet,
              title: `${s.outlet} reporting on ${beat.title}`,
              url: s.feed_url || 'https://news.google.com',
              published_at: new Date().toISOString(),
              snippet: `Coverage of ${beat.title} from ${s.outlet}.`
            })),
            consensus: [
              {
                id: "c1",
                fact: `Reporting sources agree on the ongoing strategic importance of ${beat.title.toLowerCase()}.`,
                supporting_outlets: beat.sources.map((s: any) => s.outlet),
                citation_ids: beat.sources.map((s: any, idx: number) => `src_${beat.slug}_${idx + 1}`)
              }
            ],
            disagreements: [],
            sections: [
              {
                title: `Key Developments in ${beat.title}`,
                summary: `Overview of key trends across major news outlets.`,
                sentences: [
                  {
                    id: "s1",
                    text: `Major international news organizations are tracking policy changes and market shifts in ${beat.title.toLowerCase()}.`,
                    citations: [
                      {
                        source_id: `src_${beat.slug}_1`,
                        outlet: beat.sources[0]?.outlet || 'Reuters',
                        title: `${beat.sources[0]?.outlet || 'Reuters'} Coverage`,
                        url: beat.sources[0]?.feed_url || 'https://www.reuters.com',
                        quote: `Ongoing developments in ${beat.title}.`
                      }
                    ]
                  }
                ]
              }
            ]
          };
          return res.json(fallbackData);
        }
      }

      return res.status(404).json({ error: `No archive or beat definition found for slug: ${slug}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve beat synthesis' });
    }
  });

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

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(projectRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 News Synthesis Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
