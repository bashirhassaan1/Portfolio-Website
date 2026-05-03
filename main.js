import { initParticleWave } from './js/particle-wave.js';

/** Single observer on .work-grid: bump lazy work images ahead of viewport; defer writes to one rAF tick. */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.querySelector('.work-grid');
    if (!grid || !('IntersectionObserver' in window)) return;
    function bumpLazy() {
      grid.querySelectorAll('.work-card-img').forEach(function (img) {
        if (img.loading === 'lazy') {
          img.loading = 'eager';
          if ('fetchPriority' in img) img.fetchPriority = 'high';
        }
      });
    }
    var io = new IntersectionObserver(
      function (entries) {
        var hit = entries.some(function (entry) {
          return entry.target === grid && entry.isIntersecting;
        });
        if (!hit) return;
        requestAnimationFrame(function () {
          bumpLazy();
          io.disconnect();
        });
      },
      { root: null, rootMargin: '200px 0px', threshold: 0 },
    );
    io.observe(grid);
  });
})();

(function () {
  const nav       = document.getElementById('main-nav');
  const hamburger = document.getElementById('nav-hamburger');
  const links     = document.getElementById('nav-links');

  function openMenu() {
    nav.classList.add('nav-open');
    hamburger.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    nav.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
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
