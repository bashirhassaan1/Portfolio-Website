import { initParticleWave } from './js/particle-wave.js';

/** Single observer on .work-grid: promote lazy images one per frame to avoid clustered decode stalls. */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.querySelector('.work-grid');
    if (!grid || !('IntersectionObserver' in window)) return;
    var ioRef = null;
    /** Spread lazy→eager across consecutive rAF ticks so the browser rarely decodes multiple full-res assets in one slice. */
    function bumpLazy() {
      var t0 = typeof performance !== 'undefined' ? performance.now() : 0;
      var lazies = [];
      grid.querySelectorAll('.work-card-img').forEach(function (img) {
        if (img.loading === 'lazy') lazies.push(img);
      });
      var n = lazies.length;
      function finish(bumped) {
        var t1 = typeof performance !== 'undefined' ? performance.now() : 0;
        // #region agent log
        fetch('http://127.0.0.1:7422/ingest/3cfd1a34-c5b0-478c-9a3d-d6b428fd9bdb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e95c6'},body:JSON.stringify({sessionId:'3e95c6',runId:'post-fix',hypothesisId:'H1',location:'main.js:bumpLazy',message:'bumpLazy complete',data:{bumped,durMs:t1-t0},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
        if (ioRef) ioRef.disconnect();
      }
      if (n === 0) {
        finish(0);
        return;
      }
      var idx = 0;
      function step() {
        if (idx >= n) {
          finish(n);
          return;
        }
        var img = lazies[idx];
        img.loading = 'eager';
        if ('fetchPriority' in img) img.fetchPriority = idx === 0 ? 'high' : 'low';
        idx += 1;
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    ioRef = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // #region agent log
          fetch('http://127.0.0.1:7422/ingest/3cfd1a34-c5b0-478c-9a3d-d6b428fd9bdb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e95c6'},body:JSON.stringify({sessionId:'3e95c6',runId:'post-fix',hypothesisId:'H4',location:'main.js:io',message:'work-grid IO entry',data:{isIntersecting:entry.isIntersecting,intersectionRatio:entry.intersectionRatio},timestamp:Date.now()})}).catch(()=>{});
          // #endregion agent log
        });
        var hit = entries.some(function (entry) {
          return entry.target === grid && entry.isIntersecting;
        });
        if (!hit) return;
        var rafBefore = typeof performance !== 'undefined' ? performance.now() : 0;
        requestAnimationFrame(function () {
          var rafLag = typeof performance !== 'undefined' ? performance.now() - rafBefore : 0;
          // #region agent log
          fetch('http://127.0.0.1:7422/ingest/3cfd1a34-c5b0-478c-9a3d-d6b428fd9bdb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e95c6'},body:JSON.stringify({sessionId:'3e95c6',runId:'post-fix',hypothesisId:'H1',location:'main.js:io rAF start',message:'about to bumpLazy after rAF',data:{rafLagMs:rafLag},timestamp:Date.now()})}).catch(()=>{});
          // #endregion agent log
          bumpLazy();
        });
      },
      { root: null, rootMargin: '200px 0px', threshold: 0 },
    );
    ioRef.observe(grid);
    grid.querySelectorAll('.work-card-img').forEach(function (img, idx) {
      img.addEventListener(
        'load',
        function () {
          // #region agent log
          fetch('http://127.0.0.1:7422/ingest/3cfd1a34-c5b0-478c-9a3d-d6b428fd9bdb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e95c6'},body:JSON.stringify({sessionId:'3e95c6',runId:'post-fix',hypothesisId:'H1',location:'main.js:img load',message:'work img loaded',data:{idx,loading:img.loading,naturalW:img.naturalWidth,file:(img.src||'').replace(/^.*\/([^/]+)$/,'$1')},timestamp:Date.now()})}).catch(()=>{});
          // #endregion agent log
        },
        { once: true },
      );
    });
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
