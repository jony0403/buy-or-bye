import fs from 'node:fs';

let t = fs.readFileSync('analyzer-server.mjs', 'utf8').replace(/\r\n/g, '\n');

const orphanHint = 'parts Gemini user message parts:';
let orphanStart = t.indexOf(orphanHint);
if (orphanStart < 0) {
  orphanStart = t.indexOf('const m = String(model || DEFAULT_GEMINI_MODEL)');
}
if (orphanStart < 0) {
  console.log('no orphan found');
  process.exit(0);
}

// Start after the previous function's closing brace
let start = t.lastIndexOf('\n}\n', orphanStart);
if (start < 0) start = orphanStart;
else start = start + 3;

const bodyMarker = t.indexOf('const m = String(model || DEFAULT_GEMINI_MODEL)', orphanStart >= 0 ? Math.max(0, orphanStart - 50) : 0);
if (bodyMarker < 0) throw new Error('Google generate body not found');
const brace = t.lastIndexOf('{', bodyMarker);
let depth = 0;
let i = brace;
for (; i < t.length; i++) {
  const c = t[i];
  if (c === '{') depth++;
  else if (c === '}') {
    depth--;
    if (depth === 0) {
      i++;
      break;
    }
  }
}
while (t[i] === '\n') i++;

console.log('remove from', start, 'to', i, 'len', i - start);
console.log('head', JSON.stringify(t.slice(start, start + 70)));
console.log('tail', JSON.stringify(t.slice(i - 30, i + 50)));

t = t.slice(0, start) + t.slice(i);

if (t.includes(':generateContent')) throw new Error('generateContent still present');
if (!t.includes('return openaiGenerateFromParts')) throw new Error('openai wrapper missing');
if ((t.match(/async function geminiGenerateFromParts/g) || []).length !== 1) {
  throw new Error('unexpected geminiGenerateFromParts count');
}

fs.writeFileSync('analyzer-server.mjs', t.replace(/\n/g, '\r\n'), 'utf8');
console.log('cleaned analyzer-server.mjs');
