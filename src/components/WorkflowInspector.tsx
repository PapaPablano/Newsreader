import React, { useState } from 'react';
import { GitBranch, Server, Cloud, Code, PauseCircle, Terminal, Copy, Check } from 'lucide-react';

export const WorkflowInspector: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const workflowYml = `name: Refresh News Beats (Scheduled Producer)

on:
  # Scheduled producer cron (Every 6 hours)
  # NOTE: Currently disabled to avoid burning API credits on 6-hour cron.
  # Re-enable by running: gh workflow enable "Refresh News Beats"
  # schedule:
  #   - cron: "0 */6 * * *"
  workflow_dispatch:

jobs:
  refresh-and-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: node scripts/refresh-beats.js
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
      - run: |
          git add data/
          git diff --staged --quiet || (git commit -m "chore: automated news beat synthesis [skip ci]" && git push)`;

  const workerJs = `// Cloudflare Worker Live Producer
import { buildSynthesisPrompt } from '../schema/build-prompt.js';
import { validateSynthesis } from '../schema/validate-synthesis.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/live-search') {
      const apiKey = env.GEMINI_API_KEY;
      const prompt = buildSynthesisPrompt(query, sources);
      const res = await callAI(prompt, apiKey);
      const validation = validateSynthesis(res);
      return Response.json(res);
    }
  }
};`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-[#2D2D2A]">
      
      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F1EA] text-[#5A5A40] text-xs font-mono border border-[#DEDAD0] mb-3">
          <GitBranch className="w-3.5 h-3.5" />
          <span>System Architecture & Shared Contract</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#2D2D2A]">
          Three-Piece Architecture Specifications
        </h2>
        <p className="text-xs sm:text-sm text-[#6B695F] mt-1 font-sans">
          Detailed inspection of the static frontend, scheduled producer workflow, live Cloudflare producer, and shared JSON schema contract.
        </p>
      </div>

      {/* 3 Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* Piece 1: Static Front-End */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DA] rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-[#2D2D2A] px-2 py-0.5 rounded bg-[#F4F1EA] border border-[#E5E2DA]">
              Piece 1
            </span>
            <Server className="w-4 h-4 text-[#8C8A7D]" />
          </div>
          <h3 className="text-sm font-semibold font-serif text-[#2D2D2A]">
            Static Front-End
          </h3>
          <p className="text-xs text-[#6B695F] leading-relaxed font-sans">
            Plain ES modules served by GitHub Pages (<code className="text-[#5A5A40]">index.html</code>, <code className="text-[#5A5A40]">data/</code>, <code className="text-[#5A5A40]">js/</code>). Renders archive beats & live searches identically via shared schema contract.
          </p>
        </div>

        {/* Piece 2: Scheduled Producer */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DA] rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-[#8C6239] px-2 py-0.5 rounded bg-[#FAF3E8] border border-[#E3CBB3]">
              Piece 2
            </span>
            <div className="flex items-center gap-1 text-[#8C6239] text-xs font-mono">
              <PauseCircle className="w-4 h-4" />
              <span>Paused</span>
            </div>
          </div>
          <h3 className="text-sm font-semibold font-serif text-[#2D2D2A]">
            Scheduled Producer
          </h3>
          <p className="text-xs text-[#6B695F] leading-relaxed font-sans">
            GitHub Actions workflow (<code className="text-[#5A5A40]">.github/workflows/refresh-beats.yml</code>, cron <code className="text-[#5A5A40]">0 */6 * * *</code>) executing <code className="text-[#5A5A40]">scripts/refresh-beats.js</code>. Currently paused to conserve API credits.
          </p>
        </div>

        {/* Piece 3: Live Producer */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DA] rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-[#2D4A2D] px-2 py-0.5 rounded bg-[#EBF0EB] border border-[#C5D6C5]">
              Piece 3
            </span>
            <Cloud className="w-4 h-4 text-[#2D4A2D]" />
          </div>
          <h3 className="text-sm font-semibold font-serif text-[#2D2D2A]">
            Live Search Producer
          </h3>
          <p className="text-xs text-[#6B695F] leading-relaxed font-sans">
            Cloudflare Worker (<code className="text-[#5A5A40]">worker/index.js</code>) & Express backend route (<code className="text-[#5A5A40]">/api/search</code>) holding secret key and returning ad-hoc searches in identical JSON schema shape.
          </p>
        </div>

      </div>

      {/* Code Snippet Tabs */}
      <div className="space-y-6">
        
        {/* GitHub Actions Workflow Box */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DA] rounded-2xl overflow-hidden shadow-2xs">
          <div className="bg-[#F4F1EA] px-4 py-3 border-b border-[#E5E2DA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#5A5A40]" />
              <span className="text-xs font-mono font-semibold text-[#2D2D2A]">
                .github/workflows/refresh-beats.yml
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF3E8] text-[#8C6239] border border-[#E3CBB3]">
                Cron Paused
              </span>
            </div>
            <button
              onClick={() => handleCopy(workflowYml, 'yml')}
              className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#5A5A40] text-xs flex items-center gap-1 transition-colors border border-[#E5E2DA] cursor-pointer"
            >
              {copiedCode === 'yml' ? <Check className="w-3.5 h-3.5 text-[#2D4A2D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy YML</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-[#2D2D2A] bg-[#F9F8F6] overflow-x-auto leading-relaxed">
            <code>{workflowYml}</code>
          </pre>
        </div>

        {/* Worker Code Box */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DA] rounded-2xl overflow-hidden shadow-2xs">
          <div className="bg-[#F4F1EA] px-4 py-3 border-b border-[#E5E2DA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[#5A5A40]" />
              <span className="text-xs font-mono font-semibold text-[#2D2D2A]">
                worker/index.js (Cloudflare Live Producer)
              </span>
            </div>
            <button
              onClick={() => handleCopy(workerJs, 'worker')}
              className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#5A5A40] text-xs flex items-center gap-1 transition-colors border border-[#E5E2DA] cursor-pointer"
            >
              {copiedCode === 'worker' ? <Check className="w-3.5 h-3.5 text-[#2D4A2D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy JS</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-[#2D2D2A] bg-[#F9F8F6] overflow-x-auto leading-relaxed">
            <code>{workerJs}</code>
          </pre>
        </div>

      </div>

    </div>
  );
};
