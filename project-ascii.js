/* Pattern math ported from c9d626a: triage, converge and sync. */
(() => {
  if(window.asciiWorkers)return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-project-ascii]').forEach(field => {
    const canvas = document.createElement('canvas');
    canvas.className = 'project-ascii';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    field.prepend(canvas);
    const mode = field.dataset.projectAscii;
    let w=0, h=0, pageLeft=0, pageTop=0, rows=0, cols=0, cell=10;
    let frame=0, last=0, phase=0, visible=false;
    let sinY5=new Float32Array(0), cosY5=new Float32Array(0);
    const pointer={clientX:-1,clientY:-1,active:false};
    const ink=getComputedStyle(field).color;
    const charsConverge = ' .:+*#%@';
    const charsTriage = ' .:-=>#§@';
    const charsSync = ' .:|+x#█@';
    const set = mode === 'triage' ? charsTriage : mode === 'sync' ? charsSync : charsConverge;
    const setLen = set.length;

    const draw = () => {
      if (!w || !h) return;
      const pm = window.portfolioMotion;
      if (!pm) return;
      ctx.font = '700 10px SFMono-Regular, Consolas, monospace';
      ctx.fillStyle = ink;
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
        const pulseBase = x * 13 - phase * 1.9;
        const sinPB = Math.sin(pulseBase);
        const cosPB = Math.cos(pulseBase);

        const dx = ptrValid ? x - ptrX : 1;
        const dxSq = dx * dx;
        const ptrNearCol = ptrValid && dxSq < 0.0484;
        const drawX = i * cell - 1;

        let spread = 0, invSigmaSq = 0, cutoffSq = 0, c0 = 0, c1 = 0, c2 = 0, c3 = 0;
        let topRule = 0, lowerRule = 0, hasBranch = false, branchCenter = 0;
        let quantX = 0;

        if (mode === 'converge') {
          spread = Math.max(0.08, 1 - x * 0.82);
          const sigma = 0.042 + (1 - spread) * 0.015;
          invSigmaSq = 1 / (sigma * sigma);
          cutoffSq = 2.35 * sigma * sigma;
          c0 = 0.5 - 0.36 * spread + 0.11 * spread * Math.sin(x * 7 - phase * 1.4);
          c1 = 0.5 - 0.12 * spread + 0.11 * spread * Math.sin(x * 7 + 1.7 - phase * 1.4);
          c2 = 0.5 + 0.12 * spread + 0.11 * spread * Math.sin(x * 7 + 3.4 - phase * 1.4);
          c3 = 0.5 + 0.36 * spread + 0.11 * spread * Math.sin(x * 7 + 5.1 - phase * 1.4);
        } else if (mode === 'triage') {
          topRule = 0.26 + 0.025 * Math.sin(x * 14 - phase * 2.2);
          lowerRule = 0.78 + 0.03 * Math.cos(x * 11 - phase * 1.9);
          if (x > 0.22) {
            hasBranch = true;
            const branchT = (x - 0.22) / 0.78;
            branchCenter = 0.26 + branchT * 0.54 + 0.06 * Math.sin(branchT * 9 - phase * 1.8);
          }
        } else {
          quantX = Math.floor(x * 16) / 16;
        }

        for (let j = 0; j < rows; j++) {
          const y = j / rows;
          let density = 0;

          if (mode === 'converge') {
            let minDistSq = 9;
            let d = y - c0; if (d * d < minDistSq) minDistSq = d * d;
            d = y - c1; if (d * d < minDistSq) minDistSq = d * d;
            d = y - c2; if (d * d < minDistSq) minDistSq = d * d;
            d = y - c3; if (d * d < minDistSq) minDistSq = d * d;
            if (minDistSq < cutoffSq) density = expLut[(minDistSq * invSigmaSq * expScale) | 0];
          } else if (mode === 'triage') {
            const dt = y - topRule;
            if (dt * dt < 0.0048) density = expLut[((dt * dt / 0.002025) * expScale) | 0];
            const dl = y - lowerRule;
            if (dl * dl < 0.0054) {
              const v = expLut[((dl * dl / 0.002304) * expScale) | 0] * 0.9;
              if (v > density) density = v;
            }
            if (hasBranch) {
              const db = y - branchCenter;
              if (db * db < 0.0064) {
                const v = expLut[((db * db / 0.002704) * expScale) | 0] * 0.95;
                if (v > density) density = v;
              }
            }
          } else {
            const trackIndex = (y * 5) | 0;
            const trackCenter = (trackIndex + 0.5) / 5;
            const barDist = Math.abs(y - trackCenter);
            if (barDist < 0.055) {
              const stepWave = Math.sin(quantX * 10 + trackIndex * 1.9 - phase * 1.6);
              if (stepWave > -0.2) density = Math.min(1, (stepWave + 0.3) * 0.85);
            }
          }

          if (ptrNearCol) {
            const dy = (y - ptrY) * aspect;
            const distSq = dxSq + dy * dy;
            if (distSq < 0.0484) {
              const boost = 1 - (distSq / 0.0484);
              density = Math.min(1, density + boost * 0.65);
            }
          }

          if (density < 0.12) continue;

          const pulse = 0.8 + 0.2 * (sinPB * cosY5[j] + cosPB * sinY5[j]);
          const idx = Math.min(setLen - 1, (density * pulse * setLen) | 0);
          if (idx > 0) {
            ctx.globalAlpha = 0.35 + (idx / setLen) * 0.55;
              ctx.fillText(set[idx], i * cell, j * 11 + 10);
          }
        }
      }
    };

    const tick = now => {
      if (now-last >= 50) {
        phase += last ? Math.min((now-last)/1000,.1)*.45 : 0;
        last=now; draw();
      }
      frame=requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); frame=0; last=0;
      if (reduce.matches) { pointer.active=false; phase=0; draw(); }
      else if (visible && !document.hidden) frame=requestAnimationFrame(tick);
    };
    const resize = () => {
      const r=field.getBoundingClientRect();
      w=Math.round(r.width);h=Math.round(r.height);
      pageLeft=r.left+window.scrollX;
      pageTop=r.top+window.scrollY;
      cell=w<500?9:10;
      rows=Math.ceil(h/11);
      cols=Math.ceil(w/cell);
      sinY5=new Float32Array(rows);
      cosY5=new Float32Array(rows);
      for(let j=0;j<rows;j++){
        const y5=(j/Math.max(rows,1))*5;
        sinY5[j]=Math.sin(y5);
        cosY5[j]=Math.cos(y5);
      }
      const dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      draw();
    };
    resize();
    addEventListener('resize',resize,{passive:true});
    addEventListener('load',resize,{passive:true});
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(field);
    field.addEventListener('pointermove',e=>{
      if(reduce.matches||e.pointerType!=='mouse')return;
      pointer.clientX=e.clientX;pointer.clientY=e.clientY;
      pointer.active=true;
    },{passive:true});
    field.addEventListener('pointerleave',()=>{pointer.active=false;},{passive:true});
    document.addEventListener('visibilitychange',sync);
    reduce.addEventListener('change',sync);
  });
})();
