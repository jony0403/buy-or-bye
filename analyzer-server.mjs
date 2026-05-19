#!/usr/bin/env node
/** 로컬 가격 분석 페이지 서버 (확장 프로그램 브릿지용) */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.ANALYZER_PORT) || 3920;
const ANALYZER_DIR = path.join(__dirname, 'analyzer');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.join(ANALYZER_DIR, filePath);
  if (!abs.startsWith(ANALYZER_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const buf = await fs.readFile(abs);
    const ext = path.extname(abs);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`가격 분석 페이지: http://127.0.0.1:${PORT}/`);
  console.log('종료: Ctrl+C');
});
