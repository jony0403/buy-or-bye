import fs from 'node:fs';

let h = fs.readFileSync('analyzer/index.html', 'utf8');
h = h.replace(/style\.css\?v=[^"']+/, 'style.css?v=20260916-overlay1');
h = h.replace(/app\.js\?v=[^"']+/, 'app.js?v=20260916-overlay1');
fs.writeFileSync('analyzer/index.html', h);

const marker = '/* —— overlay1: product image loading + tighter defect ring —— */';
let css = fs.readFileSync('analyzer/style.css', 'utf8');
if (!css.includes(marker)) {
  css += `
${marker}
.product-summary-img-wrap {
  position: relative;
  width: 112px;
  height: 112px;
  border-radius: 14px;
  overflow: hidden;
  flex: 0 0 auto;
}
.product-summary-img-wrap .product-summary-img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  opacity: 1;
  transition: opacity 0.18s ease;
}
.product-summary-img-wrap.is-loading .product-summary-img {
  opacity: 0;
}
.product-image-skeleton {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: 14px;
  border: 1px solid rgba(229, 232, 237, 0.95);
  background:
    linear-gradient(110deg, #f3f4f6 20%, #ffffff 40%, #eef1f5 60%, #f3f4f6 80%);
  background-size: 220% 100%;
  animation: productImageShimmer 1.1s ease-in-out infinite;
}
.product-summary-img-wrap:not(.is-loading) .product-image-skeleton {
  display: none;
}
@keyframes productImageShimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
.image-defect-marker__dot {
  border-radius: 50% !important;
  transform: translate(-50%, -50%) !important;
}
body.theme-dark .product-image-skeleton {
  border-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(110deg, #1f2937 20%, #334155 40%, #1f2937 60%, #111827 80%);
  background-size: 220% 100%;
}
`;
  fs.writeFileSync('analyzer/style.css', css);
}
console.log('ok', /overlay1/.test(h), css.includes(marker));
