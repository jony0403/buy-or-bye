const importRes = await fetch('http://127.0.0.1:3920/api/import-listing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://m.bunjang.co.kr/products/431892354' }),
});
const importJson = await importRes.json();
console.log('IMPORT', importRes.status, JSON.stringify(importJson).slice(0, 400));

const compsRes = await fetch('http://127.0.0.1:3920/api/collect-comps', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ queries: ['iphone 16 256GB'], forItemKey: 'smoke:api' }),
});
const compsJson = await compsRes.json();
console.log(
  'COMPS',
  compsRes.status,
  compsJson.ok,
  {
    bunjang: compsJson.comps?.bunjang?.count,
    daangn: compsJson.comps?.daangn?.count,
  },
  compsJson.error || ''
);
