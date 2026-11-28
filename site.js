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

// Ableton Live-style interactive chapter directory switcher on detail pages
for (const switcher of document.querySelectorAll("[data-case-switcher]")) {
  const tabs = [...switcher.querySelectorAll('[role="tab"]')];
  const panels = [...switcher.querySelectorAll('[role="tabpanel"]')];
  const prevBtn = switcher.querySelector("[data-step-prev]");
  const nextBtn = switcher.querySelector("[data-step-next]");
  const counter = switcher.querySelector("[data-step-counter]");
  let activeIndex = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));

  const activate = (index, shouldFocus = false) => {
    if (index < 0 || index >= tabs.length) return;
    activeIndex = index;
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && shouldFocus) tab.focus();
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === tabs.length - 1;
    if (counter) {
      const pad = (n) => String(n).padStart(2, "0");
      counter.textContent = `${pad(index + 1)} / ${pad(tabs.length)}`;
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activate(i));
    tab.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        activate((i + 1) % tabs.length, true);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        activate((i - 1 + tabs.length) % tabs.length, true);
      } else if (event.key === "Home") {
        event.preventDefault();
        activate(0, true);
      } else if (event.key === "End") {
        event.preventDefault();
        activate(tabs.length - 1, true);
      }
    });
  });

  if (prevBtn) prevBtn.addEventListener("click", () => activate(activeIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => activate(activeIndex + 1));
  activate(activeIndex);
}

// Image cache warmer with decode() so switching tabs or opening lightbox never flickers
const warmedImages = new Set();
const warmSingleImage = (url) => {
  if (!url || warmedImages.has(url)) return;
  warmedImages.add(url);
  const preload = new Image();
  preload.decoding = "async";
  preload.src = url;
  if (typeof preload.decode === "function") {
    preload.decode().catch(() => {});
  }
};

const warmImageCache = (urls, immediate = false) => {
  const unique = [...new Set(urls.filter((u) => u && !warmedImages.has(u)))];
  if (!unique.length) return;
  const run = () => {
    for (const url of unique) warmSingleImage(url);
  };
  if (immediate) {
    run();
  } else if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 900 });
  } else {
    window.setTimeout(run, 180);
  }
};

// In-page image lightbox for project & case study screenshots (instant preview -> seamless hi-res swap)
const imgLightbox = document.getElementById("img-lightbox");
let openLightboxFromData = null;

if (imgLightbox) {
  const lbImg = imgLightbox.querySelector("[data-lightbox-img]");
  const lbCaption = imgLightbox.querySelector("[data-lightbox-caption]");
  const lbClose = imgLightbox.querySelector(".img-lightbox-close");
  let lastZoomTrigger = null;
  let activeZoomToken = 0;

  openLightboxFromData = ({ src, previewSrc, alt, caption, trigger }) => {
    if (!src || !lbImg) return;
    lastZoomTrigger = trigger || document.activeElement;
    const token = ++activeZoomToken;

    lbImg.alt = alt || "";
    if (lbCaption) lbCaption.textContent = caption || alt || "";
    imgLightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose?.focus();

    // Immediately show already-cached preview so the lightbox never flashes blank
    if (previewSrc && previewSrc !== src) {
      lbImg.src = previewSrc;
      lbImg.classList.add("is-upgrading");
      const hiRes = new Image();
      hiRes.decoding = "async";
      hiRes.src = src;
      const applyHiRes = () => {
        if (token !== activeZoomToken || imgLightbox.hidden) return;
        lbImg.src = src;
        lbImg.classList.remove("is-upgrading");
      };
      if (hiRes.complete && hiRes.naturalWidth > 0) {
        applyHiRes();
      } else if (typeof hiRes.decode === "function") {
        hiRes.decode().then(applyHiRes).catch(applyHiRes);
      } else {
        hiRes.addEventListener("load", applyHiRes, { once: true });
        hiRes.addEventListener("error", () => lbImg.classList.remove("is-upgrading"), { once: true });
      }
    } else {
      lbImg.classList.remove("is-upgrading");
      lbImg.src = src;
    }
  };

  const closeLightbox = () => {
    if (imgLightbox.hidden) return;
    activeZoomToken++;
    imgLightbox.hidden = true;
    lbImg?.classList.remove("is-upgrading");
    document.body.style.overflow = "";
    lastZoomTrigger?.focus();
  };

  for (const trigger of document.querySelectorAll("[data-zoom-src]")) {
    const zoomUrl = trigger.getAttribute("data-zoom-src");
    const prefetchZoom = () => warmSingleImage(zoomUrl);
    trigger.addEventListener("pointerenter", prefetchZoom, { once: true, passive: true });
    trigger.addEventListener("focusin", prefetchZoom, { once: true });
    trigger.addEventListener("click", () => {
      const panel = trigger.closest('[role="tabpanel"]');
      const inlineImg = trigger.querySelector("img") || panel?.querySelector("img");
      const previewSrc = inlineImg?.currentSrc || inlineImg?.getAttribute("src") || "";
      openLightboxFromData({
        src: zoomUrl,
        previewSrc,
        alt: trigger.getAttribute("data-zoom-alt") || "",
        caption: trigger.getAttribute("data-zoom-caption") || trigger.getAttribute("data-zoom-alt") || "",
        trigger
      });
    });
  }
  for (const closer of imgLightbox.querySelectorAll("[data-close-lightbox]")) {
    closer.addEventListener("click", closeLightbox);
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !imgLightbox.hidden) closeLightbox();
  });
}

// Immediately warm sibling hidden tab images on detail pages during idle time (don't wait for slow font window.load)
const hiddenTabImgs = [...document.querySelectorAll('[data-case-switcher] [role="tabpanel"][hidden] img')]
  .map((el) => el.getAttribute("src"));
if (hiddenTabImgs.length) {
  warmImageCache(hiddenTabImgs);
}

// Homepage: warm below-the-fold project cards & detail lead screenshot on hover/focus intent
const workCards = [...document.querySelectorAll(".work-item[data-prefetch-lead]")];
if (workCards.length) {
  const belowFoldImgs = [...document.querySelectorAll('.work-item img[loading="lazy"]')]
    .map((el) => el.getAttribute("src"));
  warmImageCache(belowFoldImgs);
  for (const card of workCards) {
    const leadUrl = card.getAttribute("data-prefetch-lead");
    const warmLead = () => warmSingleImage(leadUrl);
    card.addEventListener("pointerenter", warmLead, { once: true, passive: true });
    card.addEventListener("focusin", warmLead, { once: true });
  }
}





