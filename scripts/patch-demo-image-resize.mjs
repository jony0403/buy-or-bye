import fs from 'node:fs';

let t = fs.readFileSync('analyzer-server.mjs', 'utf8').replace(/\r\n/g, '\n');
const old = `  if (local) {
    const buf = await fs.readFile(local);
    if (buf.length > MAX_IMAGE_BYTES) throw new Error('이미지 용량 초과');
    const ext = path.extname(local).toLowerCase();
    const mime =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
    return {
      inline_data: {
        mime_type: mime,
        data: buf.toString('base64'),
      },
    };
  }`;
const neu = `  if (local) {
    let buf = await fs.readFile(local);
    if (buf.length > MAX_IMAGE_BYTES) {
      buf = await sharp(buf, { animated: false }).rotate().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    }
    if (buf.length > MAX_IMAGE_BYTES) {
      buf = await sharp(buf).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    }
    if (buf.length > MAX_IMAGE_BYTES) throw new Error('이미지 용량 초과');
    const mime = buf[0] === 0xff && buf[1] === 0xd8 ? 'image/jpeg' : 'image/png';
    return {
      inline_data: {
        mime_type: mime,
        data: buf.toString('base64'),
      },
    };
  }`;
if (!t.includes(old)) throw new Error('local block missing');
t = t.replace(old, neu);
fs.writeFileSync('analyzer-server.mjs', t.replace(/\n/g, '\r\n'));
console.log('ok resize');
