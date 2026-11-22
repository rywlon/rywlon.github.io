const frames = {
  talk: [
    {
      image: "assets/talk-voice.jpg",
      width: 2000,
      height: 1400,
      alt: "新版 TalkWTF 显示已配对的 Codex 和独立快捷键",
      title: "Voice to Agent",
      caption: "将独立热键绑定到已配对的会话。"
    },
    {
      image: "assets/talk-pair.jpg",
      width: 1080,
      height: 946,
      alt: "新版 TalkWTF 的连接选择界面，列出 Codex、Claude Code、OpenCode 和 Cursor",
      title: "连接 Agent",
      caption: "选择客户端后，TalkWTF 会生成一段配对提示词。"
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
      caption: "先看运行状态，再查看需要人工处理的事项。"
    },
    {
      image: "assets/creator-handoff.jpg",
      width: 1272,
      height: 716,
      alt: "Creator OPS 退款申请详情，显示转交原因和两条合成私信",
      title: "人工待办",
      caption: "退款请求附带转交原因和相关对话。"
    }
  ]
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

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

function initTalk(root) {
  const lines = ["把按钮文案改成继续", "失败的时候不要自动重发", "给配对失败补一句说明"];
  const send = root.querySelector("[data-talk-send]");
  const fail = root.querySelector("[data-talk-fail]");
  const retry = root.querySelector("[data-talk-retry]");
  const transcript = root.querySelector("[data-transcript]");
  const status = root.querySelector("[data-status]");
  const meter = root.querySelector("[data-meter]");
  const codex = root.querySelector("[data-route='codex']");
  const codexState = root.querySelector("[data-codex-state]");
  let index = 0;
  let held = "";
  let busy = false;

  const setCodex = (state) => {
    codex.dataset.state = state;
    codexState.textContent = state === "sent" ? "已收到" : state === "recording" ? "听写中" : "等待";
  };

  const deliver = async (text, manual) => {
    if (busy) return;
    busy = true;
    send.disabled = true;
    retry.hidden = true;
    root.dataset.state = "recording";
    setCodex("recording");
    meter.hidden = false;
    const bar = meter.querySelector("span");
    if (bar) {
      bar.style.animation = "none";
      void bar.offsetWidth;
      bar.style.animation = "";
    }
    status.textContent = "正在听…";
    transcript.textContent = "转写：正在听";
    await wait(reduceMotion ? 0 : 650);
    meter.hidden = true;
    transcript.textContent = "转写：「" + text + "」";
    const shouldFail = fail.getAttribute("aria-pressed") === "true" && !manual;
    if (shouldFail) {
      held = text;
      root.dataset.state = "failed";
      setCodex("idle");
      status.textContent = "「" + text + "」没送到。转写还在，没有自动重发。";
      retry.hidden = false;
      retry.classList.add("btn-hot");
      send.classList.remove("btn-hot");
    } else {
      held = "";
      root.dataset.state = "sent";
      setCodex("sent");
      status.textContent = "已把「" + text + "」送到 Codex。当前窗口没有被切走。";
      send.disabled = false;
      send.classList.add("btn-hot");
      retry.classList.remove("btn-hot");
      index = (index + 1) % lines.length;
    }
    busy = false;
  };

  send.addEventListener("click", () => {
    if (!held) deliver(lines[index], false);
  });
  retry.addEventListener("click", () => {
    if (held) deliver(held, true);
  });
  fail.addEventListener("click", () => {
    const on = fail.getAttribute("aria-pressed") === "true";
    fail.setAttribute("aria-pressed", String(!on));
  });
  root.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea, select, a")) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.toLowerCase() !== "r") return;
    event.preventDefault();
    if (held) deliver(held, true);
    else deliver(lines[index], false);
  });
}

function initCreator(root) {
  const inbox = root.querySelector("[data-inbox]");
  const auto = root.querySelector("[data-auto]");
  const human = root.querySelector("[data-human]");
  const detail = root.querySelector("[data-detail]");
  const status = root.querySelector("[data-status]");
  const items = [...root.querySelectorAll(".msg")];
  const rules = {
    consult: { dest: auto, name: "咨询", outcome: "按知识库回复。不承诺退款，也不改档期。" },
    book: { dest: auto, name: "预约", outcome: "按可约时间回复。" },
    refund: { dest: human, name: "退款", outcome: "退款要人决定。待办附上原话。" },
    schedule: { dest: human, name: "档期", outcome: "档期冲突要人看。待办附上原话。" }
  };

  const paintEmpty = () => {
    for (const list of [inbox, auto, human]) list.dataset.empty = list.querySelector(".msg") ? "false" : "true";
  };

  const show = (msg) => {
    const rule = rules[msg.dataset.kind];
    detail.replaceChildren();
    const title = document.createElement("p");
    title.className = "detail-title";
    title.textContent = msg.dataset.from + " · " + rule.name;
    const body = document.createElement("p");
    body.textContent = rule.outcome;
    detail.append(title, body);
    for (const line of (msg.dataset.lines || "").split("|")) {
      const quote = document.createElement("blockquote");
      quote.textContent = line;
      detail.append(quote);
    }
    for (const item of items) item.querySelector("button").setAttribute("aria-pressed", String(item === msg));
  };

  const move = (list) => {
    const nodes = list.filter((el) => el.parentElement === inbox);
    if (!nodes.length) {
      status.textContent = "收件箱已经空了。";
      return;
    }
    const first = new Map(nodes.map((el) => [el, el.getBoundingClientRect()]));
    for (const el of nodes) rules[el.dataset.kind].dest.appendChild(el);
    paintEmpty();
    if (!reduceMotion) {
      for (const el of nodes) {
        const start = first.get(el);
        const end = el.getBoundingClientRect();
        const dx = start.left - end.left;
        const dy = start.top - end.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        el.animate(
          [{ transform: "translate(" + dx + "px, " + dy + "px)" }, { transform: "translate(0, 0)" }],
          { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" }
        );
      }
    }
    const humanCount = nodes.filter((el) => rules[el.dataset.kind].dest === human).length;
    status.textContent = "分拣了 " + nodes.length + " 条：" + (nodes.length - humanCount) + " 条按规则回复，" + humanCount + " 条进人工待办。";
    show(nodes[nodes.length - 1]);
  };

  root.querySelector("[data-sort-one]").addEventListener("click", () => {
    const next = inbox.querySelector(".msg");
    if (next) move([next]);
    else status.textContent = "收件箱已经空了。";
  });
  root.querySelector("[data-sort-all]").addEventListener("click", () => move(items));
  root.querySelector("[data-reset]").addEventListener("click", () => {
    for (const el of items) inbox.appendChild(el);
    paintEmpty();
    detail.replaceChildren();
    status.textContent = "已回到未分拣。这些对话是演示数据。";
    for (const item of items) item.querySelector("button").setAttribute("aria-pressed", "false");
  });
  for (const el of items) el.querySelector("button").addEventListener("click", () => show(el));
  paintEmpty();
}

function initInventory(root) {
  const rows = [...root.querySelectorAll(".sku")];
  const query = root.querySelector("[data-q]");
  const note = root.querySelector("[data-filter-note]");
  const replayNote = root.querySelector("[data-replay-note]");
  const steps = [...root.querySelectorAll("[data-step]")];
  const transfer = root.querySelector("[data-transfer]");
  const originals = rows.map((row) => ({
    el: row,
    east: row.dataset.east,
    west: row.dataset.west,
    transit: row.dataset.transit
  }));

  const sync = (row) => {
    const east = Number(row.dataset.east);
    const west = Number(row.dataset.west);
    const transit = Number(row.dataset.transit);
    row.querySelector("[data-field='east']").textContent = String(east);
    row.querySelector("[data-field='west']").textContent = String(west);
    row.querySelector("[data-field='transit']").textContent = String(transit);
    row.querySelector("[data-field='sum']").textContent = String(east + west);
  };

  const currentMode = () => root.querySelector("[data-filter][aria-pressed='true']").dataset.filter;

  const apply = () => {
    const text = query.value.trim().toLowerCase();
    const mode = currentMode();
    for (const row of rows) {
      const east = Number(row.dataset.east);
      const west = Number(row.dataset.west);
      const branchQty = row.dataset.branch === "east" ? east : west;
      const textOk = !text || row.dataset.search.includes(text);
      const ruleOk = mode === "branch" ? branchQty > 0 : east + west > 0;
      row.hidden = !(textOk && ruleOk);
    }
    const visibleRows = rows.filter((row) => !row.hidden);
    const textHits = rows.filter((row) => !text || row.dataset.search.includes(text));
    if (!visibleRows.length && text && textHits.length) note.textContent = "有对得上的演示行，但按当前规则发不了。";
    else if (!visibleRows.length) note.textContent = "没有匹配的演示行。";
    else if (text) note.textContent = "演示数据里有 " + visibleRows.length + " 行对得上。";
    else if (mode === "branch") note.textContent = "SO-1042 橡木茶几全仓还有 4，订单在东仓，东仓可用是 0，所以发不了。脚凳的订单在西仓，西仓可用是 0，同样不在这张表里。";
    else note.textContent = "全仓合计大于 0 就算可售。三行都能卖，不代表所属仓库发得出。";
  };

  rows.forEach(sync);
  query.addEventListener("input", apply);
  for (const button of root.querySelectorAll("[data-filter]")) {
    button.addEventListener("click", () => {
      for (const other of root.querySelectorAll("[data-filter]")) other.setAttribute("aria-pressed", String(other === button));
      apply();
    });
  }

  let playing = false;
  root.querySelector("[data-replay]").addEventListener("click", async () => {
    if (playing) return;
    playing = true;
    const notes = [
      "请求里写入 holdingQty = 1。",
      "接口返回创建成功。",
      "再查同一条记录，读回 holdingQty = 0。表上的可用量没有变。"
    ];
    for (const step of steps) delete step.dataset.state;
    for (let i = 0; i < steps.length; i += 1) {
      steps[i].dataset.state = "on";
      replayNote.textContent = notes[i];
      if (i < steps.length - 1) await wait(reduceMotion ? 0 : 450);
    }
    replayNote.textContent = "和当时的记录一致：写入 1，读回 0。调整接口没有把货改成在途。";
    playing = false;
  });

  transfer.addEventListener("click", () => {
    const row = root.querySelector("[data-sku='SF-3S']");
    if (row.dataset.moved === "true") return;
    row.dataset.east = String(Number(row.dataset.east) - 1);
    row.dataset.transit = String(Number(row.dataset.transit) + 1);
    row.dataset.moved = "true";
    sync(row);
    apply();
    transfer.disabled = true;
    transfer.textContent = "东仓已拨出 1 件";
    replayNote.textContent = "调货单把东仓可用 1 件转成在途。这是演示重放，没有连接 Cin7。";
  });

  root.querySelector("[data-stock-reset]").addEventListener("click", () => {
    for (const item of originals) {
      item.el.dataset.east = item.east;
      item.el.dataset.west = item.west;
      item.el.dataset.transit = item.transit;
      delete item.el.dataset.moved;
      sync(item.el);
    }
    transfer.disabled = false;
    transfer.textContent = "按调货单从东仓拨 1 件";
    query.value = "";
    for (const button of root.querySelectorAll("[data-filter]")) button.setAttribute("aria-pressed", String(button.dataset.filter === "sum"));
    for (const step of steps) delete step.dataset.state;
    replayNote.textContent = "还没有重放。";
    apply();
  });
  apply();
}

for (const gallery of document.querySelectorAll("[data-gallery]")) initGallery(gallery);
for (const talk of document.querySelectorAll("[data-talk]")) initTalk(talk);
for (const creator of document.querySelectorAll("[data-creator]")) initCreator(creator);
for (const inventory of document.querySelectorAll("[data-inventory]")) initInventory(inventory);
