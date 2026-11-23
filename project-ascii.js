/* Pattern math ported from c9d626a: triage, converge and sync. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-project-ascii]').forEach(field => {
    const canvas = document.createElement('canvas');
    canvas.className = 'project-ascii';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    field.prepend(canvas);
    const mode = field.dataset.projectAscii;
    let w=0, h=0, frame=0, last=0, phase=0, visible=false;
    const pointer={x:-1,y:-1,active:false};
    const ink=getComputedStyle(field).color;
      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        const cell = w < 500 ? 9 : 10;
        const rows = Math.ceil(h / 11);
        const cols = Math.ceil(w / cell);
        ctx.font = '700 10px SFMono-Regular, Consolas, monospace';
        ctx.fillStyle = ink;

        const charsConverge = ' .:+*#%@';
        const charsTriage = ' .:-=>#§@';
        const charsSync = ' .:|+x#█@';

        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const x = i / cols;
            const y = j / rows;
            let density = 0;

            if (mode === 'converge') {
              // 4 scattered input streams converging into 1 tight rule stream on the right
              const spread = Math.max(0.08, 1 - x * 0.82);
              for (let k = 0; k < 4; k++) {
                const baseCenter = 0.5 + ((k - 1.5) * 0.24) * spread;
                const wave = 0.11 * spread * Math.sin(x * 7 + k * 1.7 - phase * 1.4);
                const center = baseCenter + wave;
                density = Math.max(density, Math.exp(-Math.pow((y - center) / (0.042 + (1 - spread) * 0.015), 2)));
              }
            } else if (mode === 'triage') {
              // Straight rule highway on top, exception pulses branching down after x > 0.35
              const topRule = 0.32 + 0.02 * Math.sin(x * 14 - phase * 2.2);
              density = Math.exp(-Math.pow((y - topRule) / 0.045, 2));
              if (x > 0.28) {
                const branchT = (x - 0.28) / 0.72;
                const branchCenter = 0.32 + branchT * 0.42 + 0.06 * Math.sin(branchT * 9 - phase * 1.8);
                const branchDensity = Math.exp(-Math.pow((y - branchCenter) / 0.048, 2));
                density = Math.max(density, branchDensity * 0.95);
              }
            } else {
              // Sync mode: Ableton-style quantized step tracks & harmonic bars
              const trackIndex = Math.floor(y * 5);
              const trackCenter = (trackIndex + 0.5) / 5;
              const quantX = Math.floor(x * 16) / 16;
              const stepWave = Math.sin(quantX * 10 + trackIndex * 1.9 - phase * 1.6);
              const barDist = Math.abs(y - trackCenter);
              if (barDist < 0.055 && stepWave > -0.2) {
                density = Math.min(1, (stepWave + 0.3) * 0.85);
              }
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
            const set = mode === 'triage' ? charsTriage : mode === 'sync' ? charsSync : charsConverge;
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
      if (now-last >= 65) {
        phase += last ? Math.min((now-last)/1000,.1)*.35 : 0;
        last=now; draw();
      }
      frame=requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); frame=0; last=0;
      if (reduce.matches) { pointer.active=false; phase=0; draw(); }
      else if (visible && !document.hidden) frame=requestAnimationFrame(tick);
    };
    new ResizeObserver(() => {
      const r=field.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
      w=r.width;h=r.height;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);draw();
    }).observe(field);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(field);
    field.addEventListener('pointermove',e=>{
      if(reduce.matches)return;
      const r=field.getBoundingClientRect();
      pointer.x=(e.clientX-r.left)/r.width;pointer.y=(e.clientY-r.top)/r.height;
      pointer.active=e.pointerType==='mouse';
    });
    field.addEventListener('pointerleave',()=>{pointer.active=false;});
    document.addEventListener('visibilitychange',sync);
    reduce.addEventListener('change',sync);
  });
})();
