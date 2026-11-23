/* Ableton Live inspired interactive ASCII signal synthesizer & spatial collage parallax */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const field = document.querySelector('.textmode-field');

  if (field) {
    const canvas = document.createElement('canvas');
    canvas.className = 'ascii-live';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');

    if (ctx) {
      field.append(canvas);
      let w = 0, h = 0, frame = 0, last = 0, phase = 0, visible = true, paused = false;
      let mode = field.dataset.asciiMode || 'converge';
      let pointer = { x: -1, y: -1, active: false };

      const patchCaptions = {
        converge: 'FIELD NOTES / 01 CONVERGE：多路散乱的业务输入逐步汇合为确定性执行路径',
        triage: 'FIELD NOTES / 02 TRIAGE：常规咨询走上方直线规则，异常脉冲向下分叉交由人工拍板',
        sync: 'FIELD NOTES / 03 SYNC：多仓库存口径与定向语音热键的离散波段相位锁定'
      };

      const fieldColors = {
        converge: '#b6a0e8',
        triage: '#d5ef64',
        sync: '#f49a63'
      };

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        const cell = w < 500 ? 9 : 10;
        const rows = Math.ceil(h / 11);
        const cols = Math.ceil(w / cell);
        ctx.font = '700 10px SFMono-Regular, Consolas, monospace';
        ctx.fillStyle = '#171715';

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
              ctx.fillText(char, i * cell, j * 11 + 10);
            }
          }
        }
      };

      const tick = now => {
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
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
        const staticMode = reduce.matches || paused;
        field.classList.toggle('field-live', !reduce.matches);
        if (paused) draw();
        if (!staticMode && visible && !document.hidden) {
          frame = requestAnimationFrame(tick);
        }
      };

      const resize = () => {
        const r = field.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio || 1, 2);
        w = r.width;
        h = r.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
      };

      // Interactive pointer modulation
      field.addEventListener('pointermove', e => {
        const r = field.getBoundingClientRect();
        pointer.x = (e.clientX - r.left) / Math.max(r.width, 1);
        pointer.y = (e.clientY - r.top) / Math.max(r.height, 1);
        pointer.active = true;
        if (paused || reduce.matches) draw();
      });
      field.addEventListener('pointerleave', () => {
        pointer.active = false;
        if (paused || reduce.matches) draw();
      });

      // Patch mode switcher buttons
      const patchBtns = field.querySelectorAll('[data-patch]');
      const captionEl = field.querySelector('[data-patch-caption]');
      patchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          mode = btn.dataset.patch;
          field.dataset.asciiMode = mode;
          field.style.backgroundColor = fieldColors[mode] || '#b6a0e8';
          patchBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
          if (captionEl && patchCaptions[mode]) {
            captionEl.textContent = patchCaptions[mode];
          }
          draw();
        });
      });

      // Pause / Resume button
      const pauseBtn = field.querySelector('[data-patch-toggle]');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          paused = !paused;
          pauseBtn.setAttribute('aria-pressed', String(paused));
          pauseBtn.textContent = paused ? 'RESUME' : 'PAUSE';
          sync();
        });
      }

      new ResizeObserver(resize).observe(field);
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        sync();
      }).observe(field);
      document.addEventListener('visibilitychange', sync);
      reduce.addEventListener('change', sync);
      resize();
      sync();
    }
  }

  // Ableton Live subtle offset parallax for overlapping cards on desktop
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  if (parallaxItems.length && ' requestAnimationFrame' in window || parallaxItems.length) {
    let ticking = false;
    const updateParallax = () => {
      ticking = false;
      if (reduce.matches || window.innerWidth <= 760) {
        parallaxItems.forEach(el => el.style.setProperty('--parallax-y', '0px'));
        return;
      }
      const vh = window.innerHeight;
      for (const el of parallaxItems) {
        const rect = el.getBoundingClientRect();
        const centerOffset = (rect.top + rect.height * 0.5 - vh * 0.5) / vh;
        const speed = parseFloat(el.dataset.parallax || '0');
        const shift = Math.max(-26, Math.min(26, -centerOffset * speed * 130));
        el.style.setProperty('--parallax-y', `${shift.toFixed(1)}px`);
      }
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', updateParallax, { passive: true });
    updateParallax();
  }

  // Entrance reveal for blocks
  const targets = document.querySelectorAll('.project-visual,.ableton-mini-card,.swatch-card,.section-heading,.steps article,.about-title,.case-cover,.case-section h2');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          if (!reduce.matches && e.target.animate) {
            e.target.animate(
              [{ transform: 'translateY(22px)', opacity: 0.6 }, { transform: 'translateY(0)', opacity: 1 }],
              { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' }
            );
          }
          observer.unobserve(e.target);
        }
      }
    }, { threshold: 0.08 });
    targets.forEach(el => observer.observe(el));
    reduce.addEventListener('change', () => {
      if (reduce.matches && document.getAnimations) {
        document.getAnimations().forEach(a => a.cancel());
      }
    });
  }
})();
