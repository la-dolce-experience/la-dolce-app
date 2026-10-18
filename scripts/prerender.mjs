// Pré-renderiza a página inicial depois do build (npm run build).
// - dist/index.html passa a ter o HTML da página e o conteúdo usado (JSON), que o navegador hidrata;
// - dist/app.html fica com a casca vazia, servida nas demais rotas (painel, 404) pelo vercel.json.
// Se o banco não responder, a página inicial continua sendo montada no navegador, como antes.
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = path.resolve('dist');
const ssrDir = path.resolve('dist-ssr');
const TIMEOUT_MS = 20_000;
const ROOT = '<div id="root"></div>';

const template = await readFile(path.join(dist, 'index.html'), 'utf8');
await writeFile(path.join(dist, 'app.html'), template);

try {
  const { prerender } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`sem resposta do banco em ${TIMEOUT_MS / 1000} s`)), TIMEOUT_MS).unref(),
  );
  const result = await Promise.race([prerender(), timeout]);
  if (!result) throw new Error('Supabase não configurado');
  if (!template.includes(ROOT)) throw new Error(`marcador ${ROOT} não encontrado no index.html`);

  // "<" escapado: o JSON não consegue fechar a tag <script> antes da hora.
  const json = JSON.stringify(result.content).replace(/</g, '\u003c');
  const html = template.replace(
    ROOT,
    `<div id="root">${result.html}</div>\n    <script id="conteudo-inicial" type="application/json">${json}</script>`,
  );
  await writeFile(path.join(dist, 'index.html'), html);
  console.log(`Página inicial pré-renderizada (${Math.round(Buffer.byteLength(html) / 1024)} KB).`);
} catch (e) {
  console.warn(`Pré-renderização ignorada: ${e.message}. A página inicial será montada no navegador.`);
} finally {
  await rm(ssrDir, { recursive: true, force: true });
}
