import { HSCollapse } from 'preline/non-auto';

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
