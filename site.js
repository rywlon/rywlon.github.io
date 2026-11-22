const examples = {
  voice: '“把设置页的连接流程简化一下。”',
  route: '已投递至「产品设计」会话 · 示例回执',
  routine: '自动回复 · 已按菜单说明护理时长',
  handoff: '已转人工 · 退款需要门店确认',
};

for (const demo of document.querySelectorAll('[data-demo]')) {
  const buttons = [...demo.querySelectorAll('[data-step]')];
  const output = demo.querySelector('[data-output]');

  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const item of buttons) {
        item.setAttribute('aria-pressed', String(item === button));
      }
      output.textContent = examples[button.dataset.step];
      demo.dataset.active = button.dataset.step;
    });
  }
}
