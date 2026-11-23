/* One ambient field; all other motion is finite or input-driven. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const field = document.querySelector('.textmode-field');
  if (field) {
    const canvas = document.createElement('canvas');
    canvas.className = 'ascii-live'; canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      field.append(canvas);
      let w = 0, h = 0, frame = 0, last = 0, phase = 0, visible = true;
      const pointer = { x: -1, y: -1, active: false };
      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        const cell = w < 500 ? 9 : 10;
        const rows = Math.ceil(h / 11);
        const cols = Math.ceil(w / cell);
        ctx.font = '700 10px SFMono-Regular, Consolas, monospace';
        ctx.fillStyle = '#ffffff';

        const charsConverge = ' .:+*#%@';

        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const x = i / cols;
            const y = j / rows;
            let density = 0;

              // 4 scattered input streams converging into 1 tight rule stream on the right
              const spread = Math.max(0.08, 1 - x * 0.82);
              for (let k = 0; k < 4; k++) {
                const baseCenter = 0.5 + ((k - 1.5) * 0.24) * spread;
                const wave = 0.11 * spread * Math.sin(x * 7 + k * 1.7 - phase * 1.4);
                const center = baseCenter + wave;
                density = Math.max(density, Math.exp(-Math.pow((y - center) / (0.042 + (1 - spread) * 0.015), 2)));
              }

            // Cursor magnetic modulation (Ableton XY pad feel)
            if (pointer.active) {
              const dx = x - pointer.x;
              const dy = (y - pointer.y) * (h / Math.max(w, 1)) * 1.8;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 0.22) {
                const boost = Math.cos((dist / 0.22) * Math.PI * 0.5);
                density = Math.min(1, density + boost * 0.65);
              }
            }

            const pulse = 0.8 + 0.2 * Math.sin(x * 13 - phase * 1.9 + y * 5);
            const set = charsConverge;
            const idx = Math.min(set.length - 1, Math.floor(density * pulse * set.length));
            const char = set[idx];

            if (char && char !== ' ') {
              ctx.globalAlpha = 0.35 + (idx / set.length) * 0.55;
              window.portfolioMotion.glyph(ctx, char, i * cell, j * 11 + 10);
            }
          }
        }
      };

      const tick = now => {
        if (window.portfolioMotion?.scrolling) { last=0; frame=requestAnimationFrame(tick); return; }
        frame = 0;
        if (last && now - last < 45) {
          frame = requestAnimationFrame(tick);
          return;
        }
        phase += last ? Math.min((now - last) / 1000, 0.1) * 0.55 : 0;
        last = now;
        draw();
        frame = requestAnimationFrame(tick);
      };

      const sync = () => {
        cancelAnimationFrame(frame); frame = 0; last = 0;
        const staticMode = reduce.matches;
        field.classList.toggle('field-live', !staticMode);
        if (!staticMode && visible && !document.hidden) frame = requestAnimationFrame(tick);
      };
      const resize = () => {
        const r = field.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
        w = r.width; h = r.height; canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
        ctx.setTransform(dpr,0,0,dpr,0,0); draw();
      };
      field.addEventListener('pointermove', event => {
        const rect = field.getBoundingClientRect();
        pointer.x = (event.clientX - rect.left) / Math.max(rect.width, 1);
        pointer.y = (event.clientY - rect.top) / Math.max(rect.height, 1);
        pointer.active = event.pointerType === 'mouse';
      });
      field.addEventListener('pointerleave', () => { pointer.active = false; });
      new ResizeObserver(resize).observe(field);
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(field);
      document.addEventListener('visibilitychange', sync); reduce.addEventListener('change', sync);
      resize(); sync();
    }
  }
  const targets = document.querySelectorAll('.project-visual,.section-heading,.steps article,.about-title,.case-cover,.case-section h2');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) if(e.isIntersecting) {
        if (!reduce.matches) e.target.animate([{transform:'translateY(28px)',opacity:.55},{transform:'translateY(0)',opacity:1}], {duration:750,easing:'cubic-bezier(.16,1,.3,1)'});
        observer.unobserve(e.target);
      }
    }, {threshold:.08});
    targets.forEach(el=>observer.observe(el));
    reduce.addEventListener('change',()=>{if(reduce.matches)document.getAnimations().forEach(a=>a.cancel());});
  }
})();
