const frames = {
  talk: [
    {
      image: "assets/talk-voice.jpg",
      width: 2000,
      height: 1400,
      alt: "TalkWTF 桌面界面，展示日常语音转文字与 Voice to Agent 入口",
      title: "语音转文字与 Voice to Agent",
      caption: "既可日常语音转文字上屏，也可按下热键直接把需求交给本地 Agent 执行。"
    },
    {
      image: "assets/talk-pair.jpg",
      width: 1080,
      height: 946,
      alt: "TalkWTF 连接本地 Agent 界面，支持 Codex、Claude Code、OpenCode 与 Cursor",
      title: "接入本地 Agent",
      caption: "支持接入 Codex、Claude Code、OpenCode、Cursor 等本地工具，让语音直接融入日常工作流。"
    }
  ],
  inventory: [
    {
      image: "assets/inventory-orders.png",
      width: 1120,
      height: 302,
      alt: "多仓库存查询系统实站脱敏截图，展示跨仓合计库存筛查与订单状态筛选",
      title: "可满足订单筛查",
      caption: "按各分仓真实库存口径筛查可履约订单，替代人工在商城与库存后台之间反复核对（订单明细已脱敏）。"
    },
    {
      image: "assets/inventory-stocktake.png",
      width: 1120,
      height: 320,
      alt: "多仓库存查询系统盘点界面，支持按仓库、库位和货架筛选盘点范围",
      title: "分仓盘点视图",
      caption: "按仓库、库位与货架划定盘点范围，保持系统账面与实际货位一致（敏感仓库信息已脱敏）。"
    }
  ],
  creator: [
    {
      image: "assets/creator-desk.png",
      width: 1920,
      height: 1230,
      alt: "Creator OPS 工作台总览，展示状态统计、运行记录与人工待办队列",
      title: "运营总览与待办",
      caption: "把私信动态、合作阶段进度与需要人工拍板的改期/退款集中到同一屏处理。"
    },
    {
      image: "assets/creator-handoff.png",
      width: 960,
      height: 570,
      alt: "Creator OPS 人工待办详情，展示转交原因、前序对话与处理动作",
      title: "高风险人工拍板",
      caption: "遇到退款、临时改期或合作条件例外，自动带上原因与完整原对话转交人工，不用重新翻聊天记录。"
    },
    {
      image: "assets/creator-library.png",
      width: 960,
      height: 441,
      alt: "Creator OPS 知识库目录，集中管理结构化合作规则与回复规范",
      title: "12 份规则知识库",
      caption: "把原本靠人脑硬记的合作政策、门店菜单、预约时段与英文回复规范整理成 12 份结构化 Markdown 文件。"
    },
    {
      image: "assets/creator-rules.png",
      width: 960,
      height: 327,
      alt: "Creator OPS 人工介入规则正文，明确哪些事项自动处理、哪些转交真人",
      title: "边界与转交规则",
      caption: "清楚划分确定性规则可回复的范围与必须由真人拍板的边界（如退款、改期、身份与资格异常）。"
    },
    {
      image: "assets/creator-records.png",
      width: 960,
      height: 1068,
      alt: "Creator OPS 运行记录，按红人会话追踪处理阶段与时间",
      title: "9 步状态追踪",
      caption: "把非结构化私信收口成结构化状态记录，一眼区分待回复、排期中、待履约和需人工跟进。"
    },
    {
      image: "assets/creator-discovery.png",
      width: 1920,
      height: 1230,
      alt: "Creator OPS 红人库视图，按平台、粉丝规模与匹配度管理合作对象",
      title: "KOL CRM 与筛选",
      caption: "把红人资料、历史沟通与合作进度收进统一列表，不再在私信、群聊和表格之间来回复制。"
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

// Resume PDF link check: opens the file directly once uploaded to assets/resume.pdf;
// if not uploaded yet, shows a clean notice instead of a dead 404 screen.
function showResumeNotice() {
  const existing = document.querySelector(".resume-notice");
  if (existing) existing.remove();
  const box = document.createElement("div");
  box.className = "resume-notice";
  box.setAttribute("role", "status");
  box.innerHTML =
    '<div>简历 PDF 尚未上传到站点目录。如需完整简历，请直接发邮件至 <a href="mailto:ryanlonn555@gmail.com">ryanlonn555@gmail.com</a>。</div>' +
    '<button type="button" aria-label="关闭提示">×</button>';
  box.querySelector("button").addEventListener("click", () => box.remove());
  document.body.append(box);
  window.setTimeout(() => box.remove(), 6500);
}

for (const link of document.querySelectorAll("[data-resume-link]")) {
  link.addEventListener("click", async (event) => {
    const href = link.getAttribute("href");
    if (!href) return;
    event.preventDefault();
    try {
      const res = await fetch(href, { method: "HEAD" });
      if (res.ok) {
        window.location.href = href;
        return;
      }
    } catch {
      // Fall through to graceful notice
    }
    showResumeNotice();
  });
}

// Navigation remains usable without JavaScript; highlight the current section when available.
if ("IntersectionObserver" in window) {
  const links = [...document.querySelectorAll('.site-head nav a[href^="#"]')];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) => {
            const active = link.hash === "#" + entry.target.id;
            link.classList.toggle("active-nav", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      });
    },
    { rootMargin: "-15% 0px -60% 0px" }
  );
  links.forEach((link) => {
    const section = document.querySelector(link.hash);
    if (section) observer.observe(section);
  });
}

// One-click email copy inside Contact section
for (const btn of document.querySelectorAll("[data-copy-email]")) {
  btn.addEventListener("click", async () => {
    const email = btn.getAttribute("data-copy-email");
    if (!email) return;
    const original = btn.textContent;
    try {
      await navigator.clipboard.writeText(email);
      btn.textContent = "已复制邮箱 ✓";
    } catch {
      btn.textContent = email;
    }
    window.setTimeout(() => {
      btn.textContent = original;
    }, 2200);
  });
}

// In-page WeChat QR modal: keeps user on the page with Esc, backdrop, and close button
const qrModal = document.getElementById("wechat-modal");
if (qrModal) {
  let lastTrigger = null;
  const closeBtn = qrModal.querySelector(".qr-modal-close");
  const openModal = (trigger) => {
    lastTrigger = trigger || document.activeElement;
    qrModal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  };
  const closeModal = () => {
    if (qrModal.hidden) return;
    qrModal.hidden = true;
    document.body.style.overflow = "";
    lastTrigger?.focus();
  };
  for (const trigger of document.querySelectorAll("[data-open-qr]")) {
    trigger.addEventListener("click", () => openModal(trigger));
  }
  for (const closer of qrModal.querySelectorAll("[data-close-qr]")) {
    closer.addEventListener("click", closeModal);
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !qrModal.hidden) closeModal();
  });
}


