import fs from 'node:fs';

const cssPath = 'analyzer/style.css';
const extraPath = 'analyzer/championship-demo.css';
let css = fs.readFileSync(cssPath, 'utf8');
const extra = fs.readFileSync(extraPath, 'utf8');
if (!css.includes('Championship demo landing')) {
  css = css.replace(/\s*$/, `\n${extra}\n`);
  fs.writeFileSync(cssPath, css);
}
console.log('style.css updated');
