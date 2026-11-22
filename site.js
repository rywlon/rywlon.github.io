const frames = {
  "talk": [
    {
      "image": "assets/talk-voice.jpg",
      "width": 2000,
      "height": 1400,
      "alt": "新版 TalkWTF 显示已配对的 Codex 和独立快捷键",
      "title": "Voice to Agent",
      "caption": "将独立热键绑定到已配对的会话。"
    },
    {
      "image": "assets/talk-pair.jpg",
      "width": 1080,
      "height": 946,
      "alt": "新版 TalkWTF 的连接选择界面，列出 Codex、Claude Code、OpenCode 和 Cursor",
      "title": "连接 Agent",
      "caption": "选择客户端后，TalkWTF 会生成一段配对提示词。"
    }
  ],
  "creator": [
    {
      "image": "assets/creator-overview.jpg",
      "width": 1272,
      "height": 856,
      "alt": "Creator OPS 值班总览，显示运行状态、私信统计及人工待办",
      "title": "值班总览",
      "caption": "先看运行状态，再查看需要人工处理的事项。"
    },
    {
      "image": "assets/creator-handoff.jpg",
      "width": 1272,
      "height": 716,
      "alt": "Creator OPS 退款申请详情，显示转交原因和两条合成私信",
      "title": "人工待办",
      "caption": "退款请求附带转交原因和相关对话。"
    }
  ]
};

for (const gallery of document.querySelectorAll('[data-gallery]')) {
  const image = gallery.querySelector('img');
  const fullImage = gallery.querySelector('.gallery-full');
  const caption = gallery.querySelector('figcaption');
  const controls = gallery.querySelectorAll('[data-slide]');
  for (const button of controls) {
    button.addEventListener('click', () => {
      const frame = frames[gallery.dataset.gallery][Number(button.dataset.slide)];
      for (const control of controls) {
        control.setAttribute('aria-pressed', String(control === button));
      }
      image.src = frame.image;
      image.width = frame.width;
      image.height = frame.height;
      image.alt = frame.alt;
      fullImage.href = frame.image;
      fullImage.setAttribute('aria-label', '打开' + frame.title + '原图');
      caption.textContent = frame.caption;
    });
  }
}
