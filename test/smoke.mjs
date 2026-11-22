import { existsSync, readFileSync } from "node:fs";

const pages = ["index.html", "talkwtf.html", "creator-ops.html", "inventory.html"];
const html = Object.fromEntries(pages.map((file) => [file, readFileSync(file, "utf8")]));
const css = readFileSync("style.css", "utf8");
const js = readFileSync("site.js", "utf8");
const all = Object.values(html).join("\n") + "\n" + js;
let failed = 0;

function assert(condition, message) {
  if (condition) console.log("ok", message);
  else {
    failed += 1;
    console.error("FAIL", message);
  }
}

for (const id of ["work", "experience", "about", "decisions"]) {
  assert(html["index.html"].includes(`id="${id}"`), "anchor #" + id);
}
for (const href of ["./ #work".replace(" ", ""), "./#experience", "./#about", "talkwtf.html", "creator-ops.html", "inventory.html", "https://github.com/rywlon", "https://github.com/rywlon/TalkWTF"]) {
  assert(all.includes(href), "link " + href);
}
for (const phrase of ["赋能", "闭环", "可验证的交付", "按热键送出", "分拣下一条", "一次过完", "重放这一次", "data-talk", "data-creator", "data-inventory", "演示数据", "pill", "btn-hot", "300+", "1000+", "已验收", "节省工时", "开发了库存", "实现了跨仓"]) {
  assert(!all.includes(phrase), "absent " + phrase);
}
for (const phrase of ["holdingQty", "Handy", "SwiftUI", "Instagram", "Cin7", "以前", "现在", "Yuki House", "OZS", "16", "32", "fn+option_right+right", "2026-11 回顾整理", "不等于", "跨仓自动发货没有做成"]) {
  assert(all.includes(phrase), "present " + phrase);
}
assert((all.match(/2026-11 回顾整理/g) || []).length >= 2, "retrospective label on home and inventory");
const radii = css.match(/border-radius\s*:\s*[^;]+/g) || [];
assert(radii.length > 0, "radius declared");
for (const radius of radii) assert(/border-radius\s*:\s*0\s*$/.test(radius), "square " + radius);
assert(css.includes("prefers-reduced-motion"), "css reduced motion");
assert(existsSync(".nojekyll"), "nojekyll");
for (const asset of ["assets/talk-voice.jpg", "assets/talk-pair.jpg", "assets/creator-overview.jpg", "assets/creator-handoff.jpg", "assets/inventory-orders.png", "assets/inventory-stocktake.png"]) {
  assert(existsSync(asset), asset);
}
const buttons = all.match(/<button\b[^>]*>/g) || [];
assert(buttons.length === 6, "only gallery buttons, got " + buttons.length);
for (const button of buttons) assert(/type="button"/.test(button) && /data-slide=/.test(button), "gallery button " + button.slice(0, 80));

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("smoke passed");
