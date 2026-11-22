const frames = {
  talk: [
    {
      image: "assets/talk-voice.jpg",
      width: 2000,
      height: 1400,
      alt: "新版 TalkWTF 显示已配对的 Codex 和独立快捷键",
      title: "Voice to Agent",
      caption: "已配对的 Codex，快捷键单独绑在这个会话上。"
    },
    {
      image: "assets/talk-pair.jpg",
      width: 1080,
      height: 946,
      alt: "新版 TalkWTF 的连接选择界面，列出 Codex、Claude Code、OpenCode 和 Cursor",
      title: "连接 Agent",
      caption: "选择客户端后，TalkWTF 生成一段配对提示词。"
    }
  ],
  inventory: [
    {
      image: "assets/inventory-orders.png",
      width: 1120,
      height: 302,
      alt: "可满足订单界面，显示跨仓库存筛查和订单阶段筛选，订单明细已隐藏",
      title: "可满足订单",
      caption: "按跨仓合计库存筛查订单，再按订单阶段缩小范围。截图隐藏了订单明细。"
    },
    {
      image: "assets/inventory-stocktake.png",
      width: 1120,
      height: 320,
      alt: "库存盘点界面，可以按仓库、库位和货架缩小盘点范围",
      title: "库存盘点",
      caption: "按仓库、库位和货架划定盘点范围。截图隐藏了实际仓库和库位。"
    }
  ],
  creator: [
    {
      "image": "assets/creator-desk.png",
      "width": 1920,
      "height": 1230,
      "alt": "Creator OPS 值班总览，显示值班状态、四项统计和人工待办",
      "title": "值班总览",
      "caption": "值班状态和今日私信统计集中显示，下方列出需要真人决定的事项。"
    },
    {
      "image": "assets/creator-handoff.png",
      "width": 960,
      "height": 570,
      "alt": "退款待办详情，展示转交原因、相关对话和处理按钮",
      "title": "人工待办",
      "caption": "打开退款待办，可以同时看到转交原因和创作者的原话。"
    },
    {
      "image": "assets/creator-library.png",
      "width": 960,
      "height": 441,
      "alt": "知识库目录，包含回复规则与合作说明",
      "title": "知识库",
      "caption": "从同一个入口查阅回复规则和合作说明。"
    },
    {
      "image": "assets/creator-rules.png",
      "width": 960,
      "height": 327,
      "alt": "转交规则正文，列出退款、身份疑问与合作资格例外",
      "title": "转交规则",
      "caption": "运营人员可以查阅哪些咨询由助手回复，哪些情况需要移交真人。"
    },
    {
      "image": "assets/creator-records.png",
      "width": 960,
      "height": 1068,
      "alt": "运行记录，按创作者列出处理状态和时间",
      "title": "运行记录",
      "caption": "按会话查看处理状态，区分已处理、等待对方和需人工跟进的事项。"
    },
    {
      "image": "assets/creator-discovery.png",
      "width": 1920,
      "height": 1230,
      "alt": "发现红人页面，按行展示演示创作者、平台、粉丝数和匹配分数",
      "title": "发现红人",
      "caption": "在演示创作者库中按平台或联系方式筛选，查看匹配分数，挑选短名单。"
    }
  ]
};

function initGallery(gallery) {
  const set = frames[gallery.dataset.gallery];
  if (!set) return;
  const image = gallery.querySelector("img");
  const full = gallery.querySelector(".gallery-full");
  const caption = gallery.querySelector("figcaption");
  const buttons = [...gallery.querySelectorAll("[data-slide]")];
  const show = (index) => {
    const frame = set[index];
    if (!frame || !image) return;
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    image.src = frame.image;
    image.width = frame.width;
    image.height = frame.height;
    image.alt = frame.alt;
    if (full) {
      full.href = frame.image;
      full.setAttribute("aria-label", "打开" + frame.title + "原图");
    }
    if (caption) caption.textContent = frame.caption;
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => show(Number(button.dataset.slide)));
  });
  gallery.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const current = Math.max(0, buttons.findIndex((button) => button.getAttribute("aria-pressed") === "true"));
    const next = event.key === "ArrowRight" ? (current + 1) % buttons.length : (current - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
    show(next);
    event.preventDefault();
  });
}

for (const gallery of document.querySelectorAll("[data-gallery]")) initGallery(gallery);

// Navigation remains usable without JavaScript; highlight the current section when available.
if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('.site-head nav a[href^="#"]')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) links.forEach(link => {
        const active = link.hash === '#' + entry.target.id;
        link.classList.toggle('active-nav', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-15% 0px -60% 0px'});
  links.forEach(link => {const section = document.querySelector(link.hash); if(section) observer.observe(section)});
}

// Spatial enhancement: native scrolling, event-driven rendering, no animation loop at rest.
(() => {
  const home = document.querySelector('.spatial-home');
  if (!home) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1000px) and (pointer: fine)');
  const hero = document.querySelector('.hero-scene');
  const stage = document.querySelector('.workflow-space');
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let scheduled = false;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const render = () => {
    scheduled = false;
    const enabled = !motion.matches && desktop.matches;
    const y = window.scrollY;
    const range = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--read-progress', String(range > 0 ? clamp(y / range, 0, 1) : 0));
    hero.style.setProperty('--scene-y', enabled ? `${clamp(y * .12, 0, 95)}px` : '0px');
    hero.style.setProperty('--near-y', enabled ? `${clamp(y * -.07, -55, 0)}px` : '0px');
    hero.style.setProperty('--front-y', enabled ? `${clamp(y * -.13, -100, 0)}px` : '0px');
    const rect = stage.getBoundingClientRect();
    stage.style.setProperty('--spread', enabled ? String(clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1) * 2 - 1) : '0');
  };
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(render); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  motion.addEventListener('change', schedule);
  desktop.addEventListener('change', schedule);
  render();
  document.querySelectorAll('.project-visual').forEach(card => {
    let frame = 0;
    const reset = () => {cancelAnimationFrame(frame); card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');};
    card.addEventListener('pointermove', event => {
      if (!desktop.matches || motion.matches || event.pointerType === 'touch') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = clamp((event.clientX - r.left) / r.width, 0, 1);
        const y = clamp((event.clientY - r.top) / r.height, 0, 1);
        card.style.setProperty('--tilt-x', `${(0.5-y)*7}deg`);
        card.style.setProperty('--tilt-y', `${(x-0.5)*9}deg`);
        card.style.setProperty('--light-x', `${x*100}%`);
        card.style.setProperty('--light-y', `${y*100}%`);
      });
    }, { passive: true });
    card.addEventListener('pointerleave', reset);
    motion.addEventListener('change', reset);
    desktop.addEventListener('change', reset);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        if (!motion.matches) entry.target.classList.add('depth-enter');
        observer.unobserve(entry.target);
      }
    }, { threshold: .12 });
    document.querySelectorAll('.project-info,.about-content,.steps article').forEach(el => observer.observe(el));
  }
})();
