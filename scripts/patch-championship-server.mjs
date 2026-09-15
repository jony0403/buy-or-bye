import fs from 'node:fs';

const p = 'analyzer-server.mjs';
let t = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const headerOld = `#!/usr/bin/env node
/** 로컬 가격 분석 페이지 + Gemini API 프록시 (API 키는 클라이언트가 헤더로 전달) */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.ANALYZER_PORT) || 3920;
const ANALYZER_DIR = path.join(__dirname, 'analyzer');
const EXTENSION_ICONS_DIR = path.join(__dirname, 'extension', 'icons');
const PROMPTS_DIR = path.join(__dirname, 'prompts');
`;

const headerNew = `#!/usr/bin/env node
/** 분석 페이지 + Gemini API 프록시 (클라이언트 헤더 또는 GEMINI_API_KEY) */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || process.env.ANALYZER_PORT) || 3920;
const HOST = String(process.env.HOST || process.env.ANALYZER_HOST || '0.0.0.0').trim() || '0.0.0.0';
const SERVER_GEMINI_KEY = String(process.env.GEMINI_API_KEY || '').trim();
const DEMO_MODE = process.env.DEMO_MODE === '1' || process.env.DEMO_MODE === 'true' || Boolean(SERVER_GEMINI_KEY);
const DEMO_DAILY_LIMIT = Math.max(5, Number(process.env.DEMO_DAILY_LIMIT) || 40);
const PUBLIC_ANALYZER_ORIGIN = String(process.env.PUBLIC_ANALYZER_ORIGIN || '').trim().replace(/\\/$/, '');
const ANALYZER_DIR = path.join(__dirname, 'analyzer');
const EXTENSION_ICONS_DIR = path.join(__dirname, 'extension', 'icons');
const PROMPTS_DIR = path.join(__dirname, 'prompts');
const DEMO_DIR = path.join(__dirname, 'demo');
const DOWNLOADS_DIR = path.join(__dirname, 'public', 'downloads');
const DEMO_SERVER_KEY_TOKEN = '__SERVER_DEMO__';

/** IP별 일일 Gemini 호출 카운트 (데모 남용 방지) */
const demoRateBuckets = new Map();
`;

if (!t.includes(headerOld)) throw new Error('headerOld not found');
t = t.replace(headerOld, headerNew);

const corsOld = `function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Gemini-Key, X-Gemini-Model, Authorization'
  );
}
`;

const corsNew = `function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Gemini-Key, X-Gemini-Model, Authorization'
  );
}

function resolveRequestApiKey(req) {
  const header =
    String(req.headers['x-gemini-key'] || '').trim() ||
    String(req.headers.authorization || '')
      .replace(/^Bearer\\s+/i, '')
      .trim();
  if (header && header !== DEMO_SERVER_KEY_TOKEN) return header;
  return SERVER_GEMINI_KEY;
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function consumeDemoRateLimit(req) {
  if (!DEMO_MODE) return { ok: true };
  const day = new Date().toISOString().slice(0, 10);
  const key = \`\${day}:\${clientIp(req)}\`;
  const used = Number(demoRateBuckets.get(key) || 0);
  if (used >= DEMO_DAILY_LIMIT) {
    return {
      ok: false,
      error: \`데모 API 일일 한도(\${DEMO_DAILY_LIMIT}회)를 초과했습니다. 잠시 후 다시 시도하거나 캐시 폴백을 사용하세요.\`,
    };
  }
  demoRateBuckets.set(key, used + 1);
  return { ok: true, remaining: DEMO_DAILY_LIMIT - used - 1 };
}

function isSafeDemoId(id) {
  return /^[a-z0-9][a-z0-9-]{1,64}$/i.test(String(id || '').trim());
}

async function readDemoJson(relPath) {
  const abs = path.join(DEMO_DIR, relPath);
  if (!abs.startsWith(DEMO_DIR)) throw new Error('invalid demo path');
  return JSON.parse(await fs.readFile(abs, 'utf8'));
}
`;

if (!t.includes(corsOld)) throw new Error('corsOld not found');
t = t.replace(corsOld, corsNew);

const apiKeyOld = `      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\\s+/i, '')) ||
        '';
`;
const apiKeyNew = `      const apiKey = resolveRequestApiKey(req);
`;
const matches = t.split(apiKeyOld).length - 1;
if (matches < 10) throw new Error('apiKey pattern matches=' + matches);
t = t.split(apiKeyOld).join(apiKeyNew);

const optionsAnchor = `  if (req.method === 'OPTIONS') {
    corsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/verify-gemini') {
`;

const optionsInsert = `  if (req.method === 'OPTIONS') {
    corsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (
    req.method === 'POST' &&
    url.pathname.startsWith('/api/') &&
    url.pathname !== '/api/verify-gemini' &&
    !url.pathname.startsWith('/api/demo')
  ) {
    const rateKey = resolveRequestApiKey(req);
    if (SERVER_GEMINI_KEY && rateKey === SERVER_GEMINI_KEY) {
      const limited = consumeDemoRateLimit(req);
      if (!limited.ok) {
        json(res, 429, { error: limited.error, demoFallbackSuggested: true });
        return;
      }
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/demo/status') {
    json(res, 200, {
      demoMode: DEMO_MODE,
      serverKey: Boolean(SERVER_GEMINI_KEY),
      dailyLimit: DEMO_DAILY_LIMIT,
      publicOrigin: PUBLIC_ANALYZER_ORIGIN || null,
      extensionDownloadUrl: '/downloads/buy-or-bye-extension.zip',
      serverKeyToken: DEMO_SERVER_KEY_TOKEN,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/demo/scenarios') {
    try {
      const index = await readDemoJson('index.json');
      json(res, 200, index);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/demo/scenarios/')) {
    try {
      const id = decodeURIComponent(url.pathname.slice('/api/demo/scenarios/'.length));
      if (!isSafeDemoId(id)) {
        json(res, 400, { error: '잘못된 데모 id입니다.' });
        return;
      }
      const scenario = await readDemoJson(path.join('scenarios', \`\${id}.json\`));
      json(res, 200, scenario);
    } catch {
      json(res, 404, { error: '데모 시나리오를 찾지 못했습니다.' });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/demo/cache/')) {
    try {
      const id = decodeURIComponent(url.pathname.slice('/api/demo/cache/'.length));
      if (!isSafeDemoId(id)) {
        json(res, 400, { error: '잘못된 데모 id입니다.' });
        return;
      }
      const cache = await readDemoJson(path.join('cache', \`\${id}.json\`));
      json(res, 200, cache);
    } catch {
      json(res, 404, { error: '데모 캐시를 찾지 못했습니다.' });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/downloads/buy-or-bye-extension.zip') {
    try {
      const zipPath = path.join(DOWNLOADS_DIR, 'buy-or-bye-extension.zip');
      const buf = await fs.readFile(zipPath);
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="buy-or-bye-extension.zip"',
        'Cache-Control': 'no-store',
      });
      res.end(buf);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('확장 ZIP이 없습니다. npm run pack:extension 후 다시 시도하세요.');
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/verify-gemini') {
`;

if (!t.includes(optionsAnchor)) throw new Error('optionsAnchor not found');
t = t.replace(optionsAnchor, optionsInsert);

const listenOld = `server.listen(PORT, '127.0.0.1', () => {
  console.log(\`Buy or Bye · 중고매물 살까말까: http://127.0.0.1:\${PORT}/\`);
  console.log('종료: Ctrl+C');
});
`;
const listenNew = `server.listen(PORT, HOST, () => {
  console.log(\`Buy or Bye · 중고매물 살까말까: http://127.0.0.1:\${PORT}/\`);
  console.log(\`bind: \${HOST}:\${PORT}\`);
  if (DEMO_MODE) console.log(\`demo mode: on (server key \${SERVER_GEMINI_KEY ? 'ready' : 'missing'})\`);
  if (PUBLIC_ANALYZER_ORIGIN) console.log(\`public origin: \${PUBLIC_ANALYZER_ORIGIN}\`);
  console.log('종료: Ctrl+C');
});
`;
if (!t.includes(listenOld)) throw new Error('listenOld not found');
t = t.replace(listenOld, listenNew);

fs.writeFileSync(p, t.replace(/\n/g, '\r\n'), 'utf8');
console.log('patched analyzer-server.mjs ok; apiKey replacements=', matches);
