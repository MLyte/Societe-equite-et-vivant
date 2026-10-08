import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = 4175;
const root = dirname(fileURLToPath(import.meta.url));
const page = join(root, 'ping-pong.html');
const token = randomBytes(24).toString('hex');
let busy = false;
const contextFiles = [
  '.blueprint/context.md',
  '.blueprint/ai-instructions.md',
  '.blueprint/style-guide.md',
  '.blueprint/decisions.md'
];
const toolFailure = /helper_unknown_error|setup refresh had errors|Failed to create unified exec process/i;

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 65536) throw Error('Fiche trop longue.');
  }
  return JSON.parse(body || '{}');
}

function parseJsonAnswer(answer) {
  const clean = answer.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(clean);
}

function validCard(card) {
  if (!card || typeof card !== 'object' || !['decision', 'application'].includes(card.kind)) return false;
  if (![card.id, card.title, card.summary, card.reason, card.recommendation].every(value => typeof value === 'string' && value.trim())) return false;
  if (!Array.isArray(card.files) || !card.files.length || card.files.length > 3 || !card.files.every(file => /^docs\/[a-z0-9-]+\.md$/.test(file))) return false;
  if (card.kind === 'decision' && (!Array.isArray(card.options) || card.options.length < 2 || card.options.length > 3 || !card.options.every(option => ['id', 'label', 'detail'].every(key => typeof option[key] === 'string' && option[key].trim())) || !card.options.some(option => option.id === card.recommendation))) return false;
  return true;
}

function runCodex(prompt, sandbox) {
  const outputFile = join(tmpdir(), 'sev-atelier-' + randomUUID() + '.txt');
  const args = ['exec', '--ephemeral', '--sandbox', sandbox, '--output-last-message', outputFile, '-'];
  return new Promise((resolve, reject) => {
    const child = spawn('codex.exe', args, { cwd: root, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let errorOutput = '';
    let settled = false;
    const timer = setTimeout(() => {
      child.kill();
      finish(Error('Codex a dépassé huit minutes.'));
    }, 480000);
    function finish(error, answer) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unlink(outputFile).catch(() => {});
      if (error) reject(error);
      else resolve(answer);
    }
    child.on('error', finish);
    child.stderr.on('data', chunk => { errorOutput = (errorOutput + chunk.toString()).slice(-3000); });
    child.stdout.resume();
    child.on('close', async code => {
      if (settled) return;
      try {
        const answer = await readFile(outputFile, 'utf8');
        if (code !== 0) finish(Error('Codex a échoué : ' + errorOutput.slice(-500)));
        else finish(null, answer);
      } catch {
        finish(Error('Codex n’a pas produit de réponse. ' + errorOutput.slice(-500)));
      }
    });
    child.stdin.end(prompt);
  });
}

async function runWithRetry(prompt, sandbox, safeToRetry = async () => true) {
  let answer;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { answer = await runCodex(prompt, sandbox); }
    catch (error) {
      if (!toolFailure.test(error.message) || attempt === 2) throw error;
      if (!await safeToRetry()) throw Error('Codex a rencontré une erreur après une modification partielle. Vérifiez le diff avant de relancer.');
      continue;
    }
    if (!toolFailure.test(answer)) return answer;
    if (!await safeToRetry()) return answer;
    if (attempt === 2) throw Error('Codex ne peut toujours pas accéder aux fichiers après trois essais. Aucun résultat n’a été validé.');
  }
  return answer;
}

async function localContext(files) {
  const names = [...contextFiles, ...files];
  const contents = await Promise.all(names.map(async name => {
    const content = await readFile(join(root, name), 'utf8');
    return `\n--- DÉBUT ${name} ---\n${content}\n--- FIN ${name} ---`;
  }));
  return '\n\nFichiers locaux lus par le serveur avant cette analyse :\n' + contents.join('\n');
}

async function fileHash(file) {
  try { return createHash('sha256').update(await readFile(join(root, file))).digest('hex'); }
  catch { return null; }
}

function scanPrompt(existing) {
  return `Société, équité et vivant — prochain cycle de ping-pong.
Lis .blueprint/context.md, .blueprint/ai-instructions.md, .blueprint/style-guide.md et .blueprint/decisions.md, puis seulement les chapitres pertinents. N'altère aucun fichier.
Cherche un seul point concret et utile à résoudre. Vérifie d'abord si une décision existante répond déjà au point. Consulte le propriétaire uniquement pour un arbitrage de valeur réellement ouvert.
Évite les dossiers déjà traités : ${existing.join(', ') || 'aucun'}.
Réponds uniquement par un objet JSON valide sans bloc de code, avec : id, title, kind ('decision' ou 'application'), summary, files (1 à 3 chemins docs/*.md), recommendation, reason. Pour kind='decision', ajoute options : tableau de 2 ou 3 objets {id,label,detail}, et recommendation doit être l'id de l'option recommandée. Pour kind='application', recommendation est une proposition textuelle et reason explique pourquoi aucune consultation n'est nécessaire. Distingue faits, hypothèses et valeurs. Aucun chiffre nouveau sans source.`;
}

function applyPrompt(card) {
  const choice = card.kind === 'decision'
    ? `Choix du propriétaire : ${card.choice} — ${card.options.find(option => option.id === card.choice).label}.\nPrécision : ${card.note || 'aucune'}.`
    : `Le cadre existe déjà. Vérifie seulement s'il manque une application concrète.\nPrécision : ${card.note || 'aucune'}.`;
  return `Société, équité et vivant — intégration locale d'un dossier approuvé depuis l'atelier.
Sujet : ${card.title}
Contexte : ${card.summary}
${choice}
Fichiers cibles : ${card.files.join(', ')}
Les contenus actuels des fichiers requis sont fournis ci-dessous. Utilise-les même si l'outil shell échoue. Respecte AGENTS.md et les décisions antérieures. Pour un choix du propriétaire, intègre-le dans les fichiers cibles avec le plus petit diff cohérent. Pour un cadre déjà établi, ne modifie que si une lacune concrète apparaît. Incrémente la version de chaque Markdown substantiellement modifié. Vérifie le diff et les contradictions éventuelles. N'ajoute ni dossier ni publication.
Si un outil échoue et empêche la vérification ou l'écriture nécessaire, indique outcome='blocked' ; ne présente jamais l'absence de modification comme une vérification réussie.
Réponds uniquement par un objet JSON valide : {"outcome":"applied|already_covered|blocked","report":"compte rendu en français avec fichiers, raison et limites"}. 'already_covered' est réservé à une vérification réelle des contenus fournis.`;
}

createServer(async (request, response) => {
  if (request.method === 'POST' && ['/api/scan', '/api/apply'].includes(request.url)) {
    if (request.headers['x-atelier-token'] !== token || request.headers.origin !== `http://127.0.0.1:${port}`) {
      sendJson(response, 403, { error: 'Accès local refusé.' });
      return;
    }
    if (busy) {
      sendJson(response, 409, { error: 'Une analyse Codex est déjà en cours.' });
      return;
    }
    busy = true;
    try {
      const body = await readBody(request);
      if (request.url === '/api/scan') {
        const existing = Array.isArray(body.existing) ? body.existing.filter(value => typeof value === 'string').slice(0, 30) : [];
        const card = parseJsonAnswer(await runWithRetry(scanPrompt(existing), 'read-only'));
        if (!validCard(card)) throw Error('Codex a produit une fiche incomplète. Relancez l’analyse.');
        sendJson(response, 200, { card });
      } else {
        const card = body.card;
        if (!validCard(card) || (card.kind === 'decision' && !card.options.some(option => option.id === card.choice))) {
          sendJson(response, 400, { error: 'Fiche ou choix invalide.' });
          return;
        }
        const before = await Promise.all(card.files.map(fileHash));
        if (before.some(hash => !hash)) throw Error('Un fichier cible est introuvable.');
        const prompt = applyPrompt(card) + await localContext(card.files);
        const answer = await runWithRetry(prompt, 'workspace-write', async () => {
          const current = await Promise.all(card.files.map(fileHash));
          return current.every((hash, index) => hash === before[index]);
        });
        const after = await Promise.all(card.files.map(fileHash));
        const changedFiles = card.files.filter((_, index) => before[index] !== after[index]);
        let parsed;
        try { parsed = parseJsonAnswer(answer); } catch { parsed = null; }
        const outcome = toolFailure.test(answer) ? 'blocked'
          : changedFiles.length ? 'applied'
          : parsed?.outcome === 'already_covered' && card.kind === 'application' ? 'already_covered'
          : 'blocked';
        const report = typeof parsed?.report === 'string' ? parsed.report : answer.trim();
        sendJson(response, 200, { outcome, report, changedFiles });
      }
    } catch (error) {
      sendJson(response, 500, { error: error.message || 'Erreur Codex.' });
    } finally { busy = false; }
    return;
  }
  if (request.method !== 'GET' || !['/', '/ping-pong.html'].includes(request.url)) {
    response.writeHead(404);
    response.end();
    return;
  }

  try {
    const html = (await readFile(page, 'utf8')).replace('__ATELIER_TOKEN__', token);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'",
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(html);
  } catch {
    response.writeHead(500);
    response.end('Page locale indisponible.');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Atelier local : http://127.0.0.1:${port}/`);
});
