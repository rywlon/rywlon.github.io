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
      let w = 0, h = 0, pageLeft = 0, pageTop = 0, rows = 0, cols = 0, cell = 10;
      let frame = 0, last = 0, phase = 0, visible = true;
      let sinY5 = new Float32Array(0), cosY5 = new Float32Array(0);
      const pointer = { clientX: -1, clientY: -1, active: false };
      const charsConverge = ' .:+*#%@';
      const setLen = charsConverge.length;

      const draw = () => {
        if (!w || !h) return;
        const pm = window.portfolioMotion;
        if (!pm) return;
        const atlas = pm.getSetAtlas('#ffffff', charsConverge);
        const expLut = pm.expLut;
        const expScale = pm.EXP_SCALE;

        ctx.clearRect(0, 0, w, h);

        const aspect = (h / Math.max(w, 1)) * 1.8;
        const ptrActive = pointer.active;
        const ptrX = ptrActive ? (pointer.clientX - pageLeft) / Math.max(w, 1) : -1;
        const ptrY = ptrActive ? (pointer.clientY - (pageTop - window.scrollY)) / Math.max(h, 1) : -1;
        const ptrValid = ptrActive && ptrX >= -0.22 && ptrX <= 1.22 && ptrY >= -0.22 && ptrY <= 1.22;

        for (let i = 0; i < cols; i++) {
          const x = i / cols;
          const spread = Math.max(0.08, 1 - x * 0.82);
          const sigma = 0.042 + (1 - spread) * 0.015;
          const invSigmaSq = 1 / (sigma * sigma);
          const cutoffSq = 2.35 * sigma * sigma;

          const c0 = 0.5 - 0.36 * spread + 0.11 * spread * Math.sin(x * 7 - phase * 1.4);
          const c1 = 0.5 - 0.12 * spread + 0.11 * spread * Math.sin(x * 7 + 1.7 - phase * 1.4);
          const c2 = 0.5 + 0.12 * spread + 0.11 * spread * Math.sin(x * 7 + 3.4 - phase * 1.4);
          const c3 = 0.5 + 0.36 * spread + 0.11 * spread * Math.sin(x * 7 + 5.1 - phase * 1.4);

          const pulseBase = x * 13 - phase * 1.9;
          const sinPB = Math.sin(pulseBase);
          const cosPB = Math.cos(pulseBase);

          const dx = ptrValid ? x - ptrX : 1;
          const dxSq = dx * dx;
          const ptrNearCol = ptrValid && dxSq < 0.0484;
          const drawX = i * cell - 1;

          for (let j = 0; j < rows; j++) {
            const y = j / rows;
            let minDistSq = 9;
            let d = y - c0; if (d * d < minDistSq) minDistSq = d * d;
            d = y - c1; if (d * d < minDistSq) minDistSq = d * d;
            d = y - c2; if (d * d < minDistSq) minDistSq = d * d;
            d = y - c3; if (d * d < minDistSq) minDistSq = d * d;

            let density = minDistSq < cutoffSq ? expLut[(minDistSq * invSigmaSq * expScale) | 0] : 0;

            if (ptrNearCol) {
              const dy = (y - ptrY) * aspect;
              const distSq = dxSq + dy * dy;
              if (distSq < 0.0484) {
                const boost = 1 - (distSq / 0.0484);
                density = Math.min(1, density + boost * 0.65);
              }
            }

            if (density < 0.125) continue;

            const pulse = 0.8 + 0.2 * (sinPB * cosY5[j] + cosPB * sinY5[j]);
            const idx = Math.min(setLen - 1, (density * pulse * setLen) | 0);
            if (idx > 0) {
              ctx.drawImage(atlas, idx * 24, 0, 24, 28, drawX, j * 11 - 1, 12, 14);
            }
          }
        }
      };

      const tick = now => {
        frame = 0;
        if (last && now - last < 48) {
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
        const r = field.getBoundingClientRect();
        w = Math.round(r.width); h = Math.round(r.height);
        pageLeft = r.left + window.scrollX;
        pageTop = r.top + window.scrollY;
        cell = w < 500 ? 9 : 10;
        rows = Math.ceil(h / 11);
        cols = Math.ceil(w / cell);
        sinY5 = new Float32Array(rows);
        cosY5 = new Float32Array(rows);
        for (let j = 0; j < rows; j++) {
          const y5 = (j / Math.max(rows, 1)) * 5;
          sinY5[j] = Math.sin(y5);
          cosY5[j] = Math.cos(y5);
        }
        canvas.width = w; canvas.height = h;
        draw();
      };
      field.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse') return;
        pointer.clientX = event.clientX;
        pointer.clientY = event.clientY;
        pointer.active = true;
      }, { passive: true });
      field.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
      addEventListener('resize', resize, { passive: true });
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
