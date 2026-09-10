import { HSCollapse } from 'preline/non-auto';

// Une aide disponible au survol, au clavier et au toucher, hors des cartes rognées.
document.querySelectorAll('.acronym-trigger').forEach((trigger, index) => {
  const tooltip = document.createElement('span');
  tooltip.id = `acronym-tooltip-${index}`;
  tooltip.className = 'acronym-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.textContent = trigger.title;
  tooltip.hidden = true;
  document.body.append(tooltip);
  trigger.removeAttribute('title');
  trigger.setAttribute('aria-describedby', tooltip.id);
  let closeTimer;
  const close = () => { clearTimeout(closeTimer); tooltip.hidden = true; };
  const open = () => {
    clearTimeout(closeTimer);
    tooltip.hidden = false;
    const anchor = trigger.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(12, Math.min(anchor.left + (anchor.width - box.width) / 2, document.documentElement.clientWidth - box.width - 12))}px`;
    tooltip.style.top = `${anchor.top >= box.height + 20 ? anchor.top - box.height - 8 : anchor.bottom + 8}px`;
  };
  const deferClose = () => {
    closeTimer = setTimeout(() => {
      if (document.activeElement !== trigger) close();
    }, 150);
  };
  trigger.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') open(); });
  trigger.addEventListener('pointerleave', deferClose);
  trigger.addEventListener('focus', open);
  trigger.addEventListener('blur', close);
  trigger.addEventListener('click', open);
  tooltip.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  tooltip.addEventListener('pointerleave', deferClose);
  document.addEventListener('pointerdown', (event) => {
    if (!trigger.contains(event.target) && !tooltip.contains(event.target)) close();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  window.addEventListener('resize', close);
  window.addEventListener('scroll', close, { passive: true });
});

// Progressive enhancement: links remain visible when JavaScript is unavailable.
const toggle = document.querySelector('#menu-toggle');
const navigation = document.querySelector('#navigation');
const mobile = matchMedia('(max-width: 1023px)');
const collapse = new HSCollapse(toggle);
toggle.hidden = false;
const resetMenu = () => {
  navigation.style.height = '';
  navigation.classList.remove('open');
  navigation.classList.toggle('hidden', mobile.matches);
  toggle.classList.remove('open');
  toggle.setAttribute('aria-expanded', String(!mobile.matches));
};
resetMenu();
mobile.addEventListener('change', resetMenu);
navigation.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (link && mobile.matches) {
    collapse.hide();
    if (link.hash) {
      const section = document.querySelector(link.hash);
      section?.setAttribute('tabindex', '-1');
      section?.focus({ preventScroll: true });
    }
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobile.matches && toggle.getAttribute('aria-expanded') === 'true') {
    collapse.hide();
    toggle.focus();
  }
});

// Le sommaire suit la lecture ; les ancres restent dégagées du header sticky.
const header = document.querySelector('.site-header');
const sectionNavigation = document.querySelector('.section-nav');
const wideDesktop = matchMedia('(min-width: 1600px)');
const sectionLinks = [...sectionNavigation.querySelectorAll('a[href^="#"]')];
const linkedSections = sectionLinks.map((link) => document.querySelector(link.hash));
let navigationFrame;
let activeSection = -1;
const updateSectionNavigation = () => {
  navigationFrame = null;
  const readingLine = header.getBoundingClientRect().height + 32;
  const showSectionNavigation = wideDesktop.matches && linkedSections[0].getBoundingClientRect().bottom <= readingLine;
  document.body.classList.toggle('has-section-nav', showSectionNavigation);
  if (!showSectionNavigation) return;
  let current = 0;
  linkedSections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= readingLine) current = index;
  });
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = linkedSections.length - 1;
  if (current === activeSection) return;
  activeSection = current;
  sectionLinks.forEach((link, index) => {
    if (index === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};
const scheduleSectionNavigation = () => {
  if (navigationFrame == null) navigationFrame = requestAnimationFrame(updateSectionNavigation);
};
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
  scheduleSectionNavigation();
}).observe(header);
window.addEventListener('scroll', scheduleSectionNavigation, { passive: true });
window.addEventListener('resize', scheduleSectionNavigation);
wideDesktop.addEventListener('change', scheduleSectionNavigation);
scheduleSectionNavigation();

// La boucle ne charge et ne tourne que lorsqu’elle peut être vue.
const film = document.querySelector('#hemicycle-film');
const filmToggle = document.querySelector('.film-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const filmSources = {
  mobile: new URL('./assets/habitable-loop-mobile.mp4', import.meta.url).href,
  desktop: new URL('./assets/habitable-loop.mp4', import.meta.url).href,
};
let filmInView = false;
let filmPausedByUser = false;

const updateFilmControl = () => {
  filmToggle.hidden = reducedMotion.matches || !film.getAttribute('src') || Boolean(film.error);
  filmToggle.setAttribute('aria-label', film.paused ? 'Lire l’animation' : 'Mettre l’animation en pause');
  filmToggle.setAttribute('aria-pressed', String(filmPausedByUser));
  filmToggle.querySelector('.film-pause-icon').toggleAttribute('hidden', film.paused);
  filmToggle.querySelector('.film-play-icon').toggleAttribute('hidden', !film.paused);
};
const updateFilmPlayback = () => {
  if (reducedMotion.matches || !filmInView || document.hidden || filmPausedByUser) {
    film.pause();
    updateFilmControl();
    return;
  }
  if (!film.getAttribute('src')) {
    film.src = matchMedia('(max-width: 767px)').matches ? filmSources.mobile : filmSources.desktop;
  }
  film.play().catch(updateFilmControl);
};
film.muted = true;
film.addEventListener('play', updateFilmControl);
film.addEventListener('pause', updateFilmControl);
film.addEventListener('error', updateFilmControl);
filmToggle.addEventListener('click', () => {
  filmPausedByUser = !film.paused;
  updateFilmPlayback();
});
reducedMotion.addEventListener('change', updateFilmPlayback);
document.addEventListener('visibilitychange', updateFilmPlayback);
new IntersectionObserver(([entry]) => {
  filmInView = entry.isIntersecting;
  updateFilmPlayback();
}, { threshold: 0 }).observe(film);
