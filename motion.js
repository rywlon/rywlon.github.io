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
      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        const cell = w < 500 ? 9 : 10, rows = Math.ceil(h / 11), cols = Math.ceil(w / cell);
        ctx.font = '10px monospace'; ctx.fillStyle = '#171715'; ctx.globalAlpha = .52;
        const chars = ' .:+*#%@';
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const x = i / cols, y = j / rows; let density = 0;
            for (let k = 0; k < 4; k++) {
              const center = .15 + k * .23 + .12 * Math.sin(x * 6.5 + k * 1.6 - phase);
              density = Math.max(density, Math.exp(-Math.pow((y - center) / .045, 2)));
            }
            const pulse = .78 + .22 * Math.sin(x * 12 - phase * 1.7 + y * 4);
            const char = chars[Math.min(7, Math.floor(density * pulse * 8))];
            if (char !== ' ') ctx.fillText(char, i * cell, j * 11 + 10);
          }
        }
      };
      const tick = now => {
        frame = 0;
        if (last && now - last < 50) { frame = requestAnimationFrame(tick); return; }
        phase += last ? Math.min((now - last) / 1000, .1) * .25 : 0;
        last = now; draw(); frame = requestAnimationFrame(tick);
      };
      const sync = () => {
        cancelAnimationFrame(frame); frame = 0; last = 0;
        const staticMode = reduce.matches;
        field.classList.toggle('field-live', !staticMode);
        if (!staticMode && visible && !document.hidden) frame = requestAnimationFrame(tick);
      };
      const resize = () => {
        const r = field.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
        w = r.width; h = r.height; canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
        ctx.setTransform(dpr,0,0,dpr,0,0); draw();
      };
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
