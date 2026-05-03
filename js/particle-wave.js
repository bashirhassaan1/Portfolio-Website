// particle-wave.js — Pure Canvas 2D, zero external dependencies

// ── Perlin noise ────────────────────────────────────────────────────────────
const _P = (() => {
  const src = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [src[i], src[j]] = [src[j], src[i]];
  }
  return [...src, ...src];
})();

function _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function _lerp(a, b, t) { return a + t * (b - a); }
function _grad(h, x, y, z) {
  const hh = h & 15;
  const u = hh < 8 ? x : y;
  const v = hh < 4 ? y : (hh === 12 || hh === 14) ? x : z;
  return ((hh & 1) ? -u : u) + ((hh & 2) ? -v : v);
}
function perlin(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = _fade(x), v = _fade(y), w = _fade(z);
  const A  = _P[X]   + Y, AA = _P[A]   + Z, AB = _P[A+1] + Z;
  const B  = _P[X+1] + Y, BA = _P[B]   + Z, BB = _P[B+1] + Z;
  return _lerp(
    _lerp(_lerp(_grad(_P[AA],   x,   y,   z), _grad(_P[BA],   x-1, y,   z), u),
          _lerp(_grad(_P[AB],   x,   y-1, z), _grad(_P[BB],   x-1, y-1, z), u), v),
    _lerp(_lerp(_grad(_P[AA+1], x,   y,   z-1), _grad(_P[BA+1], x-1, y,   z-1), u),
          _lerp(_grad(_P[AB+1], x,   y-1, z-1), _grad(_P[BB+1], x-1, y-1, z-1), u), v),
    w
  );
}

// ── Public API ───────────────────────────────────────────────────────────────
export function initParticleWave(canvasId, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) { console.warn('[ParticleWave] canvas not found:', canvasId); return; }

  // #region agent log
  const _dbg = (hypothesisId, loc, msg, data) => {
    fetch('http://127.0.0.1:7422/ingest/3cfd1a34-c5b0-478c-9a3d-d6b428fd9bdb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e95c6'},body:JSON.stringify({sessionId:'3e95c6',runId:'post-fix',hypothesisId,location:loc,message:msg,data,timestamp:Date.now()})}).catch(()=>{});
  };
  // #endregion agent log

  const ctx = canvas.getContext('2d');

  // Tuneable constants
  const SPACING       = options.spacing       ?? 26;   // px between grid points
  const POINT_R       = options.pointR        ?? 1.6;  // dot radius in px
  const NOISE_XY      = options.noiseXY       ?? 0.008;
  const NOISE_Z_SPEED = options.noiseZSpeed   ?? 0.00042;
  const LIFT_AMP      = options.liftAmp       ?? 30;   // max vertical wave displacement px
  const MOUSE_R       = options.mouseRadius   ?? 115;  // px influence radius
  const MOUSE_STR     = options.mouseStrength ?? 58;   // px push strength

  // colorFn(nx, ny, n) → CSS color string
  //   nx, ny : normalised position 0-1
  //   n      : perlin value  -1..+1
  const colorFn = options.colorFn ?? ((nx, ny, n) => {
    const t  = (n + 1) / 2;                   // 0..1
    const r  = Math.round((0.18 + nx * 0.45) * 255);
    const g  = Math.round((0.72 - nx * 0.28 + t * 0.15) * 255);
    const b  = 255;
    const a  = (0.45 + t * 0.55).toFixed(2);
    return `rgba(${r},${g},${b},${a})`;
  });

  const pauseWhenHidden = options.pauseWhenHidden !== false;

  const mouse  = { x: -99999, y: -99999 };
  let particles = [];
  let time      = 0;
  let animId    = null;

  /** When off-screen (section not intersecting viewport), skip draw to save main-thread work while scrolling elsewhere. */
  let visibleToUser = true;
  if (pauseWhenHidden && typeof IntersectionObserver !== 'undefined') {
    const containerForViz = canvas.parentElement;
    if (containerForViz) {
      const vizIo = new IntersectionObserver(entries => {
        entries.forEach(e => _dbg('H3', `particle-wave.js:${canvasId}:vizIo`, 'visibility', { intersecting: e.isIntersecting, ratio: e.intersectionRatio }));
        visibleToUser = entries.some(e => e.isIntersecting);
      }, { threshold: 0, rootMargin: '0px' });
      vizIo.observe(containerForViz);
    }
  }

  // ── Grid ─────────────────────────────────────────────────────────────────
  function buildGrid() {
    particles = [];
    const cols = Math.ceil(canvas.width  / SPACING) + 1;
    const rows = Math.ceil(canvas.height / SPACING) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        particles.push({ ox: c * SPACING, oy: r * SPACING });
      }
    }
  }

  // ── Resize ───────────────────────────────────────────────────────────────
  let resizeCount = 0;
  let lastResizeTs = 0;
  function resize() {
    const el = canvas.parentElement;
    const w  = el.clientWidth  || window.innerWidth;
    const h  = el.clientHeight || window.innerHeight;
    if (!w || !h) return;
    resizeCount++;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : 0;
    const delta = lastResizeTs ? nowMs - lastResizeTs : 0;
    lastResizeTs = nowMs;
    _dbg('H2', `particle-wave.js:${canvasId}:resize`, 'canvas resize/buildGrid', { w, h, resizeCount, msSincePrev: delta });
    canvas.width  = w;
    canvas.height = h;
    buildGrid();
    if (!animId) startAnim();
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  function startAnim() {
    function frame() {
      animId = requestAnimationFrame(frame);
      if (pauseWhenHidden && !visibleToUser) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += NOISE_Z_SPEED;

      for (const pt of particles) {
        const n  = perlin(pt.ox * NOISE_XY, pt.oy * NOISE_XY, time * 300);
        const lift = n * LIFT_AMP;

        const dx   = pt.ox - mouse.x;
        const dy   = pt.oy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let px = 0, py = 0;
        if (dist > 0 && dist < MOUSE_R) {
          const f = (1 - dist / MOUSE_R) * MOUSE_STR;
          px = (dx / dist) * f;
          py = (dy / dist) * f;
        }

        const x  = pt.ox + px;
        const y  = pt.oy + lift + py;
        const nx = pt.ox / canvas.width;
        const ny = pt.oy / canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, POINT_R, 0, Math.PI * 2);
        ctx.fillStyle = colorFn(nx, ny, n);
        ctx.fill();
      }
    }
    frame();
  }

  // ── Mouse tracking ────────────────────────────────────────────────────────
  const container = canvas.parentElement;
  container.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  container.addEventListener('mouseleave', () => { mouse.x = -99999; mouse.y = -99999; });

  // ── ResizeObserver — coalesce to one buildGrid per paint (avoids burst churn while layout settles) ─────────
  let resizeRaf = null;
  function scheduleResize() {
    if (resizeRaf != null) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      resize();
    });
  }
  const ro = new ResizeObserver(scheduleResize);
  ro.observe(container);
  window.addEventListener('resize', scheduleResize);
  resize();
}
