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
      image: "assets/creator-overview.jpg",
      width: 1272,
      height: 856,
      alt: "Creator OPS 值班总览，显示运行状态、私信统计及人工待办",
      title: "值班总览",
      caption: "上面看运行状态，下面只列需要人处理的事项。图中账号和对话是原型数据。"
    },
    {
      image: "assets/creator-handoff.jpg",
      width: 1272,
      height: 716,
      alt: "Creator OPS 退款申请详情，显示转交原因和两条合成私信",
      title: "人工待办",
      caption: "退款待办带上转交原因和相关对话。图中对话是原型数据。"
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
