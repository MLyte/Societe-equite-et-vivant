import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { renderVitrine, renderPage, sourceUrl, countPageWords, estimateReadingTime } from './vitrine.mjs';
import { deploy, deploymentConfig } from './deploy.mjs';

const source = readFileSync(new URL('./vitrine.md', import.meta.url), 'utf8');
const template = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
test('Le HTML contient les sept sections, les sources et la date éditoriale sans JavaScript', () => {
  const content = renderVitrine(source);
  const html = renderPage(template, source);
  assert.equal(content.sections.length, 7);
  assert.match(html, /id="ia"/);
  assert.match(content.sections[3].intro, /sans biais/);
  assert.match(content.sections[2].cards, /autorité humaine/);
  assert.ok(countPageWords(html) >= 650 && countPageWords(html) <= 1400);
  assert.equal((html.match(/<article /g) ?? []).length, 12);
  assert.equal((html.match(/class="explanation explanation-why"/g) ?? []).length, 14);
  assert.equal((html.match(/class="explanation explanation-how"/g) ?? []).length, 14);
  assert.doesNotMatch(content.sections[0].context, /explanation-|(?:Pourquoi|Comment|Quoi)&nbsp;\?/);
  assert.doesNotMatch(content.sections[0].intro, /Le projet naît|Repenser les décisions|Le modèle reste à éprouver/);
  assert.match(content.sections[5].intro, /Le projet naît/);
  assert.doesNotMatch(content.sections[6].intro, /explanation-/);
  assert.ok(html.includes(`datetime="${content.date}"`));
  assert.match(html, /github.com\/MLyte\/Societe-equite-et-vivant\/blob\/main\/docs\//);
  assert.doesNotMatch(html, /\{\{/);
  assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /Mathieu|Luyten|MLyte/i);
  const surveySource = source.match(/\[OCDE\]\((https:\/\/www\.oecd\.org\/[^)]+)\)/)?.[1];
  assert.ok(surveySource);
  assert.equal(sourceUrl(surveySource), surveySource);
  assert.ok(html.includes(`href="${surveySource}"`));
});
test('Une modification éditoriale change la page générée, pas sa structure', () => {
  const updated = source.replace(/last_updated: .+/, 'last_updated: "2001-01-01"').replace(/^## .+$/m, '## Une autre présentation du projet');
  const html = renderPage(template, updated);
  assert.match(html, /Une autre présentation du projet/);
  assert.match(html, /datetime="2001-01-01"/);
});

test('Le budget compte toute la page, y compris les contributions et inspirations', () => {
  const html = renderPage(template, source);
  const moreWords = 'texte '.repeat(800);
  assert.throws(() => renderPage(template, source.replace('Vos compétences', `${moreWords}Vos compétences`)), /Longueur de la page/);
  assert.throws(() => renderPage(template, source.replace('Garantir une vie digne,', `${moreWords}Garantir une vie digne,`)), /Longueur de la page/);
  assert.equal(countPageWords(html.replace('</main>', '<p>Deux mots</p></main>')), countPageWords(html) + 2);
  assert.equal(countPageWords(html.replace('</main>', '<!-- commentaire ignoré --><svg><title>Icône ignorée</title></svg></main>')), countPageWords(html));
  assert.equal(countPageWords(html.replace('</footer>', '<p>Footer hors budget</p></footer>')), countPageWords(html));
  assert.throws(() => countPageWords('<p>Sans contenu principal</p>'), /principal/);
});

test('La durée distingue le survol du texte complet et suit le contenu généré', () => {
  const content = `<nav>Hors calcul</nav><main><h1>Un <strong>titre</strong></h1><p><strong>Deux mots</strong></p><p><em>Une citation</em></p><p>${'texte '.repeat(600)}</p><p class="reading-time" id="hero-reading-time">Estimation à ignorer</p><svg><title>Icône</title></svg></main><footer>Crédit</footer>`;
  const reading = estimateReadingTime(content);
  assert.deepEqual(reading, { quickWords: 6, fullWords: 606, quickMinutes: 1, fullMinutes: 4 });
  const moreHighlights = content.replace('<p>texte ', '<p><strong>texte ').replace('</p><p class="reading-time"', '</strong></p><p class="reading-time"');
  assert.equal(estimateReadingTime(moreHighlights).quickMinutes, 3);
  assert.equal(estimateReadingTime(moreHighlights).fullMinutes, reading.fullMinutes);
  const html = renderPage(template, source);
  const current = estimateReadingTime(html);
  assert.ok(html.includes(`Lecture rapide&nbsp;: ≈&nbsp;${current.quickMinutes}&nbsp;min`));
  assert.ok(html.includes(`Lecture complète&nbsp;: ≈&nbsp;${current.fullMinutes}&nbsp;min`));
});

test('Le parcours de contribution sépare navigation interne, signalement et guide français', () => {
  const { sections } = renderVitrine(source);
  assert.equal(sourceUrl('#approfondir'), '#approfondir');
  assert.throws(() => sourceUrl('#absent'), /Source/);
  assert.match(sections[4].contribution, /href="#approfondir"/);
  assert.doesNotMatch(sections[4].contribution, /target="_blank"|github\.com/);
  assert.match(sections[6].intro, /href="https:\/\/github\.com\/MLyte\/Societe-equite-et-vivant\/issues\/new" target="_blank" rel="noopener noreferrer"/);
  assert.match(sections[6].intro, /href="https:\/\/github\.com\/MLyte\/Societe-equite-et-vivant\/blob\/main\/CONTRIBUTING.md" target="_blank"/);
  const actions = [...sections[6].intro.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(actions.length, 2);
  for (const [, action] of actions) {
    assert.match(action.replace(/<!--[\s\S]*?-->/g, '').trim(), /^<svg\b[\s\S]*<\/svg>\s*<span>[^<]+<\/span><svg\b[\s\S]*<\/svg>$/);
  }
  const guide = readFileSync(new URL('./CONTRIBUTING.md', import.meta.url), 'utf8');
  assert.match(guide, /^# Contribuer au projet/);
  assert.match(guide, /sans modifier les fichiers/);
});

test('Le Quoi est facultatif, suit le Comment et reste lisible sans JavaScript', () => {
  const whatLine = /^\*\*Quoi[ \u00a0\u202f]\?\*\*[^\r\n]*\r?\n/gm;
  const html = renderPage(template, source);
  assert.equal((html.match(/class="explanation explanation-what"/g) ?? []).length, 5);
  assert.match(html, /<p class="explanation explanation-what"><strong>Quoi&nbsp;\?<\/strong>/);
  assert.doesNotMatch(renderPage(template, source.replace(whatLine, '')), /explanation-what/);

  const firstWhat = source.match(whatLine)[0];
  assert.throws(() => renderVitrine(source.replace(firstWhat, '**Quoi\u00a0?**\n')), /réponse/);
  assert.throws(() => renderVitrine(source.replace(firstWhat, firstWhat + '\n' + firstWhat)), /ordre/);
  const reordered = source.replace(firstWhat, '').replace(/^(\*\*Comment[ \u00a0\u202f]\?\*\*)/m, () => firstWhat + '\n**Comment\u00a0?**');
  assert.throws(() => renderVitrine(reordered), /ordre/);
});
test('La typographie lie la ponctuation aux mots sans modifier les liens, le code ou les entités', () => {
  const original = renderPage(template, source);
  const updated = source
    .replace(/^## .+$/m, '## Comprendre : pourquoi ?')
    .replace(/^### .+$/m, '### Un titre !')
    .replace(/^\*\*Pourquoi[ \u00a0\u202f]\?\*\* .+$/m, '**Pourquoi\u00a0?** **Dignité** : oui ; liberté ! `x : y` &amp; droits&nbsp;? **55 %** et 30 % ; `x % y`')
    .replace(/\*\*Comment[ \u00a0\u202f]\?\*\*/, '**Comment&nbsp;?**');
  const html = renderPage(template, updated);
  assert.match(html, /Comprendre&nbsp;: pourquoi&nbsp;\?/);
  assert.match(html, /Un titre&nbsp;!/);
  assert.match(html, /<strong>Dignité<\/strong>&nbsp;: oui&nbsp;; liberté&nbsp;!/);
  assert.match(html, /<code>x : y<\/code> &amp; droits&nbsp;\?/);
  assert.match(html, /<strong>55&nbsp;%<\/strong> et 30&nbsp;%&nbsp;; <code>x % y<\/code>/);
  assert.match(html, /Photo&nbsp;:/);
  assert.equal((html.match(/class="explanation explanation-why"/g) ?? []).length, 14);
  assert.equal((html.match(/class="explanation explanation-how"/g) ?? []).length, 14);
  assert.doesNotMatch(html, /&amp;nbsp;/);
  assert.deepEqual([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), [...original.matchAll(/href="([^"]+)"/g)].map((m) => m[1]));
});
test('Sources, ancres, HTML et structure invalides arrêtent la génération', () => {
  assert.throws(() => renderVitrine(source.replace('docs/01-vision.md', 'docs/absent.md')), /Source/);
  assert.throws(() => sourceUrl('README.md#inexistant'), /Ancre/);
  assert.throws(() => sourceUrl('../private.md'), /Source/);
  assert.throws(() => sourceUrl('javascript:alert(1)'), /Source/);
  assert.throws(() => sourceUrl('https://www.oecd.org.example.com/publications/'), /Source/);
  assert.throws(() => renderVitrine(source.replace('## Construisons la suite', '## Autre')), /sections/);
  assert.throws(() => renderVitrine(source + '\n<script>alert(1)</script>'), /HTML/);
  assert.throws(() => renderVitrine(source.replace(/last_updated: .+/, 'last_updated: "2026-02-31"')), /Date/);
  assert.throws(() => renderVitrine(source.replace(/\*\*Pourquoi[ \u00a0\u202f]\?\*\*/, '**Raison ?**')), /Pourquoi/);
  assert.throws(() => renderVitrine(source.replace(/\*\*Comment[ \u00a0\u202f]\?\*\* .+/, '**Comment ?**')), /réponse/);
});
test('Les textes et boutons respectent un contraste de 4,5:1 sur leurs fonds', () => {
  const luminance = (hex) => hex.match(/\w{2}/g).map((c) => parseInt(c, 16) / 255).map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
  const css = readFileSync(new URL('./vitrine.css', import.meta.url), 'utf8');
  const readColor = (token) => {
    const color = css.match(new RegExp(`--color-${token}: #([\\da-f]{6});`, 'i'))?.[1];
    assert.ok(color, `Couleur manquante : ${token}`);
    return color;
  };
  for (const token of ['ink', 'ink-hover', 'sage', 'sage-hover', 'copper', 'copper-hover', 'muted']) {
    assert.ok(1.05 / (luminance(readColor(token)) + .05) >= 4.5, token);
  }
  for (const [text, background] of [['sage', 'sage-soft'], ['copper', 'copper-soft'], ['sage', 'copper-soft'], ['ink', 'copper-soft'], ['muted', 'copper-soft']]) {
    assert.ok((luminance(readColor(background)) + .05) / (luminance(readColor(text)) + .05) >= 4.5, `${text} sur ${background}`);
  }
});
const env = { DEPLOY_HOST: 'sftp.example.com', DEPLOY_USER: 'test', DEPLOY_PASSWORD: 'fixture', DEPLOY_REMOTE_DIR: '/www/societe-equite-vivant', DEPLOY_HOST_SHA256: 'a'.repeat(64) };
test('Le transfert vérifie la clé SSH et refuse une destination générale ou traversante', () => {
  assert.equal(deploymentConfig(env).access.hostVerifier('a'.repeat(64)), true);
  assert.equal(deploymentConfig(env).access.hostVerifier('b'.repeat(64)), false);
  for (const directory of ['/', '/www', '/www/../societe-equite-vivant']) assert.throws(() => deploymentConfig({ ...env, DEPLOY_REMOTE_DIR: directory }));
  assert.throws(() => deploymentConfig({}));
});
test('Les assets précèdent le remplacement ; un échec conserve l’ancienne entrée', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'vitrine-test-'));
  try {
    await mkdir(join(directory, 'assets'));
    await writeFile(join(directory, 'assets', 'app-test.css'), 'body{}');
    await writeFile(join(directory, 'index.html'), '<section id="approfondir">Test</section>');
    const calls = [];
    const client = { connect: async () => {}, mkdir: async () => {}, put: async (_, dest) => calls.push(dest), posixRename: async () => calls.push('rename'), end: async () => {} };
    await deploy({ env, directory, client });
    assert.deepEqual(calls, ['/www/societe-equite-vivant/assets/app-test.css', '/www/societe-equite-vivant/index.next.html', 'rename']);
    calls.length = 0;
    client.put = async () => { throw new Error('Transfert interrompu'); };
    await assert.rejects(deploy({ env, directory, client }), /Transfert/);
    assert.deepEqual(calls, []);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('Le workflow exige les tests et la compilation avant publication, jamais depuis une PR', () => {
  const workflow = parse(readFileSync(new URL('./.github/workflows/vitrine.yml', import.meta.url), 'utf8'));
  assert.equal(workflow.jobs.publish.needs, 'build');
  assert.match(workflow.jobs.publish.if, /github.event_name != 'pull_request'/);
  const steps = workflow.jobs.build.steps.map((s) => s.run).filter(Boolean);
  assert.deepEqual(steps, ['npm ci', 'npm test', 'npm run build']);
});
