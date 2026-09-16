import fs from 'node:fs';
let h = fs.readFileSync('analyzer/index.html', 'utf8');
h = h.replace(/style\.css\?v=[^"']+/, 'style.css?v=20260916-imgfix3');
h = h.replace(/app\.js\?v=[^"']+/, 'app.js?v=20260916-imgfix3');
fs.writeFileSync('analyzer/index.html', h);
console.log('bust', /imgfix3/.test(h));
