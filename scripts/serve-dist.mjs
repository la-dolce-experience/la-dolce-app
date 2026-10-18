// Servidor estático para testes E2E: serve dist/ com os mesmos headers e o
// fallback de SPA definidos em vercel.json, para validar o build de produção.
//
// Diferenças em relação à produção (necessárias para rodar localmente em http):
// - remove "upgrade-insecure-requests" e HSTS;
// - acrescenta à CSP a origem do Supabase local (E2E_SUPABASE_ORIGIN).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const port = Number(process.env.PORT || 4173);
const extraOrigin = process.env.E2E_SUPABASE_ORIGIN || 'http://127.0.0.1:54321';
const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.json': 'application/json',
};

function toRegex(source) {
  // Converte o padrão do Vercel ("/admin(.*)") em RegExp.
  return new RegExp(`^${source}$`);
}

function headersFor(urlPath) {
  const out = {};
  for (const rule of vercel.headers) {
    if (!toRegex(rule.source).test(urlPath)) continue;
    for (const { key, value } of rule.headers) out[key] = value;
  }
  if (out['Content-Security-Policy']) {
    out['Content-Security-Policy'] = out['Content-Security-Policy']
      .replace('; upgrade-insecure-requests', '')
      .replace('connect-src', `connect-src ${extraOrigin}`)
      .replace('img-src', `img-src ${extraOrigin}`);
  }
  delete out['Strict-Transport-Security'];
  return out;
}

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(root, urlPath);
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
  } catch {
    file = path.join(root, 'app.html'); // rewrite de SPA (a casca vazia; index.html é a página inicial pré-renderizada)
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
      ...headersFor(urlPath),
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`dist em http://localhost:${port}`));
