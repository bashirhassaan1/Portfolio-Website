import { initParticleWave } from './js/particle-wave.js';

(function () {
  const nav       = document.getElementById('main-nav');
  const hamburger = document.getElementById('nav-hamburger');
  const links     = document.getElementById('nav-links');
  let scrollBackdropPending = false;
  /** One rAF-bound update per scroll frame; disables nav backdrop-blur once scrolled — cheaper when work imagery passes under the bar */
  function updateNavBackdrop() {
    scrollBackdropPending = false;
    const solid = window.scrollY > 72 || nav.classList.contains('nav-open');
    nav.classList.toggle('nav-solid', solid);
  }
  window.addEventListener(
    'scroll',
    () => {
      if (scrollBackdropPending) return;
      scrollBackdropPending = true;
      requestAnimationFrame(updateNavBackdrop);
    },
    { passive: true },
  );

  function openMenu() {
    nav.classList.add('nav-open');
    hamburger.setAttribute('aria-expanded', 'true');
    updateNavBackdrop();
  }
  function closeMenu() {
    nav.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
    updateNavBackdrop();
  }
  function toggleMenu() {
    nav.classList.contains('nav-open') ? closeMenu() : openMenu();
  }

  hamburger.addEventListener('click', toggleMenu);

  // Close when any nav link is clicked
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // Close when clicking outside the nav
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) closeMenu();
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  updateNavBackdrop();
})();

// Hero — cyan → violet
initParticleWave('particle-canvas');

// Services — warm gold → pink
initParticleWave('particle-canvas-services', {
  colorFn: (nx, ny, n) => {
    const t = (n + 1) / 2;
    const r = 255;
    const g = Math.round((0.55 + nx * 0.25) * 255);
    const b = Math.round((0.30 + ny * 0.40) * 255);
    const a = (0.38 + t * 0.55).toFixed(2);
    return `rgba(${r},${g},${b},${a})`;
  },
});
