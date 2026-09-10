import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked, Renderer } from 'marked';
import { parse } from 'yaml';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const categoryIcons = [
  [],
  ['hourglass', 'leaf', 'hand-coins', 'telescope'],
  ['users', 'microscope', 'brain-circuit', 'landmark', 'scale'],
  [],
  ['calculator', 'route', 'flask-conical'],
  [],
  [],
];
const iconSvg = (name) => readFileSync(require.resolve(`lucide-static/icons/${name}.svg`), 'utf8')
  .replace('<svg', '<svg aria-hidden="true" focusable="false"')
  .replace('stroke-width="2"', 'stroke-width="1.75"');
const categorySvgs = categoryIcons.map((icons) => icons.map(iconSvg));
const linkIconSvg = (name) => iconSvg(name)
  .replace('class="', 'class="link-icon ')
  .replace('width="24"', 'width="16"').replace('height="24"', 'height="16"')
  .replace(/\r?\n\s*/g, ' ').replace(/>\s+</g, '><').trim();
const externalLinkSvg = linkIconSvg('external-link');
const internalLinkSvg = linkIconSvg('arrow-down');
// GitHub mark: Primer Octicons, MIT — https://github.com/primer/octicons
const githubSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656"/></svg>';

export const root = fileURLToPath(new URL('.', import.meta.url));
export const repository = 'https://github.com/MLyte/Societe-equite-et-vivant';
const externalSources = new Set([
  'https://www.ilo.org/fr/publications/intelligence-artificielle-generative-et-emploi-revision-2025',
  'https://www.nature.com/articles/s41586-024-08252-9',
  'https://theshiftproject.org/qui-sommes-nous/',
  'https://doughnuteconomics.org/doughnut',
  'https://futuregenerations.wales/do/get-in-touch/faqs/',
  'https://consul.democracy-international.org/the-future-of-european-democracy?projekt_phase_id=2',
  'https://www.oecd.org/en/publications/oecd-survey-on-drivers-of-trust-in-public-institutions-2026-results_9eb63fec-en/full-report/political-voice-barriers-to-participation-and-implications-for-trust-in-government_08533950.html',
  'https://energy.ec.europa.eu/topics/markets-and-consumers/energy-consumers-and-prosumers/energy-poverty_en',
  'https://www.unep.org/resources/emissions-gap-report-2025',
  'https://www.unep.org/fr/resources/rapport-2025-sur-lecart-entre-les-besoins-et-les-perspectives-en-matiere-de-reduction-des',
  'https://www.cbd.int/doc/publications/gbo/gbo3-final-en.pdf#page=5',
  'https://www.cbd.int/article/2020-the-year-that-was',
  'https://corporate.exxonmobil.com/news/news-releases/2026/0130-exxonmobil-announces-2025-results',
  'https://www.saudiexchange.sa/Resources/fsPdf/27472_1541_2026-03-10_08-08-09_en.pdf#page=1',
  'https://chevroncorp.gcs-web.com/news-releases/news-release-details/chevron-reports-fourth-quarter-2025-results',
  'https://www.ipcc.ch/report/ar6/syr/summary-for-policymakers/',
  'https://www.wfp.org/stories/funding-cuts-six-critical-wfp-operations-risk',
  'https://www.whitehouse.gov/presidential-actions/2025/01/putting-america-first-in-international-environmental-agreements/',
  'https://treaties.un.org/doc/Publication/CN/2025/CN.71.2025-Frn.pdf',
  'https://www.bundeswahlleiterin.de/en/info/presse/mitteilungen/bundestagswahl-2025/29_25_endgueltiges-ergebnis.html',
  'https://commission.europa.eu/document/download/524bd8d4-33ba-4802-891f-d8959831ed5a_en?filename=2025+Rule+of+Law+Report+-+Country+Chapter+Hungary.pdf',
  'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:52025SC0912',
]);
// Photos d’illustration sous licence Unsplash : https://unsplash.com/license.
// Les lieux et personnes photographiés n’identifient pas les cas cités dans le texte.
const currentStatePhotos = [
  { file: 'constat-foret-unsplash.webp', width: 900, height: 1350, alt: 'Des arbres morts se dressent dans une forêt sous un ciel bleu.', author: 'Rob Wingate', id: '2x7gFGkMwME' },
  { file: 'constat-raffinerie-unsplash.webp', width: 1100, height: 733, alt: 'Tours et installations d’une raffinerie de pétrole.', author: 'Ali Mucci', id: 'gZbjx2K7s9I' },
  { file: 'constat-travail-unsplash.webp', width: 1100, height: 733, alt: 'Des mains travaillent sur le clavier d’un ordinateur portable.', author: 'Alicia Christin Gerald', id: '45ry4Md83aw' },
  { file: 'constat-recherche-unsplash.webp', width: 1100, height: 733, alt: 'La Terre et ses formations nuageuses vues depuis l’espace.', author: 'NASA', id: 'yZygONrUBe8' },
  { file: 'constat-politique-unsplash.webp', width: 1100, height: 619, alt: 'Le dôme du Capitole des États-Unis et un drapeau américain, à Washington.', author: 'Ian Hutchinson', id: 'P8rgDtEFn7s' },
];
export const sectionIds = ['presentation', 'propositions', 'decisions', 'ia', 'limites', 'demarche', 'approfondir'];
const titles = [null, 'Ce que le projet propose', 'Comment les décisions seraient prises', 'Une IA pour éclairer le long terme', 'Les prochaines étapes de conception', 'D’où vient cette démarche', 'Construisons la suite'];
export const escapeHtml = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const nonBreakingPunctuation = (text) => text.replace(/[ \t\u00a0\u202f]+(?=[;:!?%])/g, '&nbsp;');

export function sourceUrl(href) {
  if (href.startsWith('#') && [...sectionIds, 'constat'].includes(href.slice(1))) return href;
  if (externalSources.has(href)) return href;
  if (href.startsWith(`${repository}/`) || href === repository) return href;
  const [path, anchor] = href.split('#');
  const full = resolve(root, path);
  const rel = relative(root, full);
  if (!path || isAbsolute(path) || rel.startsWith('..') || !/^(docs\/[^/]+\.md|README\.md|CONTRIBUTING\.md)$/.test(path) || !existsSync(full)) {
    throw new Error(`Source absente ou non autorisée : ${href}`);
  }
  if (anchor) {
    const headings = readFileSync(full, 'utf8').match(/^#{1,6} .+$/gm) ?? [];
    const anchors = headings.map((h) => h.replace(/^#+ /, '').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/ /g, '-'));
    if (!anchors.includes(anchor)) throw new Error(`Ancre source absente : ${href}`);
  }
  return `${repository}/blob/main/${path}${anchor ? `#${anchor}` : ''}`;
}

const markdown = new Marked({
  renderer: {
    html() { throw new Error('HTML brut non autorisé dans les synthèses.'); },
    image() { throw new Error('Images non prévues dans les synthèses.'); },
    text(token) {
      if (token.tokens) return this.parser.parseInline(token.tokens);
      return nonBreakingPunctuation(Renderer.prototype.text.call(this, token));
    },
    paragraph({ tokens }) {
      const label = tokens[0]?.type === 'strong' ? tokens[0].text.replace(/&nbsp;|[\u00a0\u202f]/g, ' ') : null;
      const kind = { 'Pourquoi ?': 'why', 'Comment ?': 'how', 'Quoi ?': 'what' }[label];
      return `<p${kind ? ` class="explanation explanation-${kind}"` : ''}>${this.parser.parseInline(tokens)}</p>\n`;
    },
    link({ href, tokens }) {
      const destination = sourceUrl(href);
      const internal = destination.startsWith('#');
      return `<a class="source-link" href="${escapeHtml(destination)}"${internal ? '' : ' target="_blank" rel="noopener noreferrer"'}>${internal ? internalLinkSvg : externalLinkSvg}&nbsp;<span>${this.parser.parseInline(tokens)}</span></a>`;
    },
  },
});

const decorateActionLinks = (html) => html.replace(/(<a\b[^>]*>)([\s\S]*?)<\/a>/g,
  (_, opening, content) => {
    const githubMark = opening.includes(`href="${repository}`) ? githubSvg : '';
    return `${opening}${content.replace('</svg>&nbsp;', '</svg>')}${githubMark}</a>`;
  });

export function renderVitrine(source = readFileSync(resolve(root, 'vitrine.md'), 'utf8')) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatter) throw new Error('Métadonnées éditoriales absentes.');
  const metadata = parse(frontmatter[1]);
  const date = metadata.last_updated;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Date éditoriale invalide.');
  if (!metadata.version || metadata.status !== 'draft' || metadata.confidence !== 'hypothesis') throw new Error('Statut ou version éditoriale invalide.');
  const body = source.slice(frontmatter[0].length).replace(/<!--[\s\S]*?-->/g, '').trim();
  const sections = body.split(/^## /m).filter(Boolean).map((part) => {
    const [title, ...lines] = part.split(/\r?\n/);
    const blocks = lines.join('\n').trim().split(/^### /m);
    return { title, intro: blocks.shift(), cards: blocks.map((block) => {
      const [title, ...lines] = block.split('\n');
      return { title, body: lines.join('\n') };
    }) };
  });
  if (sections.length !== 8 || sections[1].title !== 'Constat actuel' || sections[1].cards.length !== 5) throw new Error('La section Constat actuel doit suivre la présentation avec cinq repères sourcés.');
  const [currentState] = sections.splice(1, 1);
  if (currentState.cards.some((card) => !/\[[^\]]+\]\([^)]+\)/.test(card.body))) throw new Error('Chaque constat doit citer sa source.');
  const currentCards = currentState.cards.map((card, index) => {
    const blocks = card.body.trim().split(/\n\s*\n/);
    if (![2, 3].includes(blocks.length) || !blocks.at(-1).startsWith('[')) throw new Error('Chaque constat doit contenir une explication, une note facultative puis ses sources.');
    const note = blocks.length === 3 ? `<p class="constat-note"><small>${markdown.parseInline(blocks[1])}</small></p>` : '';
    const photo = currentStatePhotos[index];
    return `<article class="constat-card bg-white border rounded-xl"><figure class="constat-photo"><img src="./assets/${photo.file}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async"><figcaption><a href="https://unsplash.com/photos/${photo.id}" target="_blank" rel="noopener noreferrer" aria-label="Source de la photo d’illustration : ${escapeHtml(photo.author)} / Unsplash">${externalLinkSvg}<span>Source</span></a></figcaption></figure><div class="constat-content"><h3 class="constat-lead">${nonBreakingPunctuation(escapeHtml(card.title)).replace(/\bPAM\b/g, '<button type="button" class="acronym-trigger" title="Programme alimentaire mondial" aria-label="PAM : Programme alimentaire mondial">PAM</button>')}</h3><div class="constat-explanation">${markdown.parse(blocks[0])}${note}</div><footer class="constat-sources">${markdown.parse(blocks.at(-1))}</footer></div></article>`;
  }).join('');
  const constat = `<div class="section-heading"><p class="section-index">00 / Les repères</p><h2 id="constat-title">Constat actuel</h2>${markdown.parse(currentState.intro)}</div><div class="constat-grid grid">${currentCards}</div>`;
  if (sections.length !== 7 || sections.some((s, i) => titles[i] && s.title !== titles[i])) throw new Error('Les sept sections éditoriales doivent conserver leur ordre.');
  const expectedCards = [0, 4, 5, 0, 3, 0, 0];
  if (sections.some((s, i) => s.cards.length !== expectedCards[i])) throw new Error('Structure des blocs éditoriaux invalide.');
  for (const section of sections) {
    const blocks = section.cards.length ? section.cards.map((card) => card.body) : [section.intro];
    if (blocks.some((block) => !/\[[^\]]+\]\([^)]+\)/.test(block))) throw new Error('Chaque synthèse doit citer sa source.');
    if (section === sections[0]) continue;
    for (const block of blocks) {
      const questions = [...block.matchAll(/^\*\*(Pourquoi|Comment|Quoi)(?:[ \u00a0\u202f]|&nbsp;)\?\*\*([^\r\n]*)$/gm)];
      if ([sections[5], sections[6]].includes(section) && !questions.length) continue;
      const order = questions.map((match) => match[1]).join(',');
      if (!['Pourquoi,Comment', 'Pourquoi,Comment,Quoi'].includes(order) || questions.some((match) => !/^[ \t]+\S/.test(match[2]))) {
        throw new Error('Chaque synthèse doit contenir un Pourquoi ? puis un Comment ?, et éventuellement un Quoi ?, dans cet ordre, avec une réponse.');
      }
    }
  }
  const rendered = sections.map((s, sectionIndex) => ({
    title: nonBreakingPunctuation(escapeHtml(s.title)),
    intro: markdown.parse(s.intro),
    cards: s.cards.map((c, i) => `<article class="content-card"><span class="category-icon" aria-hidden="true">${categorySvgs[sectionIndex][i]}</span><div><h3>${nonBreakingPunctuation(escapeHtml(c.title))}</h3>${markdown.parse(c.body)}</div></article>`).join('\n'),
  }));
  if (typeof metadata.contribution !== 'string' || !metadata.contribution.trim()) throw new Error('Appel à contribution absent.');
  rendered[4].contribution = decorateActionLinks(markdown.parse(metadata.contribution))
    .replace('<p>', `<p class="contribution-heading"><span class="category-icon" aria-hidden="true">${iconSvg('users-round')}</span>`);
  rendered[6].intro = decorateActionLinks(rendered[6].intro);
  const leadEnd = rendered[0].intro.indexOf('</p>') + 4;
  rendered[0].lead = rendered[0].intro.slice(0, leadEnd);
  rendered[0].context = rendered[0].intro.slice(leadEnd);
  const formattedDate = new Intl.DateTimeFormat('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
  return { sections: rendered, constat, date, formattedDate };
}

export function countPageWords(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!main) throw new Error('Contenu principal absent.');
  const text = main
    .replace(/<!--[\s\S]*?-->|<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;|&apos;/gi, '’')
    .replace(/&(?:[a-z]+|#\d+|#x[\da-f]+);/gi, ' ');
  return text.trim().split(/\s+/u).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

export function estimateReadingTime(html) {
  // Repères éditoriaux approximatifs, pas une vitesse garantie pour chaque lecteur.
  const withoutEstimate = html.replace(/<p\b(?=[^>]*\bid="hero-reading-time")[^>]*>[\s\S]*?<\/p>/gi, '');
  const fullWords = countPageWords(withoutEstimate);
  const main = withoutEstimate.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)[1]
    .replace(/<!--[\s\S]*?-->|<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ');
  // Un titre contenant du gras ne doit être compté qu'une fois.
  const highlights = [...main.matchAll(/<(h[1-6]|strong|em)\b[^>]*>[\s\S]*?<\/\1>/gi)].map((match) => match[0]);
  const quickWords = countPageWords(`<main>${highlights.join(' ')}</main>`);
  return {
    quickWords,
    fullWords,
    quickMinutes: Math.max(1, Math.ceil(quickWords / 250)),
    fullMinutes: Math.max(1, Math.ceil(fullWords / 200)),
  };
}

export function renderPage(template, source = readFileSync(resolve(root, 'vitrine.md'), 'utf8')) {
  const content = renderVitrine(source);
  // Ces références complètent le parcours éditorial sans modifier ses sept sections.
  const references = parse(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]).inspirations;
  if (!references || references.cards?.length !== 4) throw new Error('Quatre références sont attendues.');
  const referenceText = (value) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error('Texte de référence absent.');
    return nonBreakingPunctuation(escapeHtml(value)).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  };
  const referenceLogos = ['logo-shift-project.svg', null, 'logo-future-generations.png', 'logo-democracy-international.svg'];
  // SVG intégré pour conserver un drapeau visible, y compris sans police emoji.
  const englishFlag = '<svg class="language-flag" xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 60 30" preserveAspectRatio="none" role="img" aria-label="Page en anglais" focusable="false"><title>Page en anglais</title><path fill="#012169" d="M0 0h60v30H0z"/><path stroke="#fff" stroke-width="6" d="m0 0 60 30M60 0 0 30"/><path stroke="#C8102E" stroke-width="2" d="m0 0 60 30M60 0 0 30"/><path stroke="#fff" stroke-width="10" d="M30 0v30M0 15h60"/><path stroke="#C8102E" stroke-width="6" d="M30 0v30M0 15h60"/></svg>';
  if (references.cards.some((card) => !['fr', 'en'].includes(card.language))) throw new Error('Langue de référence absente ou non prise en charge.');
  const inspirations = `<div class="page-width"><p class="section-index">07 / Les inspirations et initiatives</p><h2 id="inspirations-title">${referenceText(references.title)}</h2><p class="inspirations-intro">${referenceText(references.intro)}</p><ul class="inspirations-grid grid md:grid-cols-2">${references.cards.map((card, i) => `<li class="inspiration-card p-6 bg-white border rounded-xl"><div class="inspiration-logo" aria-hidden="true">${referenceLogos[i] ? `<img src="./assets/${referenceLogos[i]}" alt="" loading="lazy" decoding="async">` : `<span class="inspiration-name">Doughnut Economics</span>`}</div><p class="inspiration-category">${referenceText(card.category)}</p><h3>${referenceText(card.title)}</h3><p>${referenceText(card.text)}</p><a class="source-link" href="${escapeHtml(sourceUrl(card.url))}" hreflang="${card.language}" target="_blank" rel="noopener noreferrer">${externalLinkSvg}&nbsp;<span>${referenceText(card.link)}${card.language === 'en' ? `&nbsp;${englishFlag}` : ''}</span></a></li>`).join('')}</ul><p class="inspirations-reserve">${referenceText(references.reserve)}</p></div>`;
  let html = template.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    if (key === 'inspirations') return inspirations;
    if (key === 'constat') return content.constat;
    if (key === 'externalLinkIcon') return externalLinkSvg;
    if (key === 'date') return content.date;
    if (key === 'formattedDate') return content.formattedDate;
    if (key === 'readingQuick' || key === 'readingFull') return `{{${key}}}`;
    const [index, field] = key.split('.');
    const value = content.sections[Number(index)]?.[field];
    if (typeof value !== 'string') throw new Error(`Emplacement inconnu : ${key}`);
    return value;
  });
  const reading = estimateReadingTime(html);
  html = html.replaceAll('{{readingQuick}}', String(reading.quickMinutes)).replaceAll('{{readingFull}}', String(reading.fullMinutes));
  const words = countPageWords(html);
  if (words < 650 || words > 2200) throw new Error(`Longueur de la page : ${words} mots (650–2200 attendus, blocs complémentaires compris).`);
  return html;
}
