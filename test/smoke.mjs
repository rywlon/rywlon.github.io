import { existsSync, readFileSync } from "node:fs";

const pages = ["index.html", "talkwtf.html", "creator-ops.html", "inventory.html"];
const html = Object.fromEntries(pages.map((file) => [file, readFileSync(file, "utf8")]));
const css = readFileSync("style.css", "utf8");
const js = readFileSync("site.js", "utf8");
const all = Object.values(html).join("\n");
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
for (const phrase of ["赋能", "闭环", "可验证的交付", "把口头诉求", "三个产品判断", "350"]) {
  assert(!all.includes(phrase), "absent " + phrase);
}
for (const phrase of ["holdingQty", "Handy", "SwiftUI", "Rust", "Instagram", "Cin7", "Shopify", "Yuki House", "OZS", "演示", "16", "32"]) {
  assert(all.includes(phrase), "present " + phrase);
}
assert(css.includes("prefers-reduced-motion"), "css reduced motion");
assert(js.includes("prefers-reduced-motion"), "js reduced motion");
assert(js.includes("matchMedia"), "js media query");
assert(existsSync(".nojekyll"), "nojekyll");
for (const asset of ["assets/talk-voice.jpg", "assets/talk-pair.jpg", "assets/creator-overview.jpg", "assets/creator-handoff.jpg", "assets/inventory-orders.png", "assets/inventory-stocktake.png", "assets/fonts/fraunces-600.woff2", "favicon.svg"]) {
  assert(existsSync(asset), asset);
}
assert(!/src="https?:/.test(all), "no external script src");
const buttons = all.match(/<button\b[^>]*>/g) || [];
assert(buttons.length > 10, "buttons exist");
for (const button of buttons) assert(/type="button"/.test(button), "typed " + button.slice(0, 90));
for (const page of pages) assert(html[page].includes('lang="zh-CN"'), page + " lang");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("smoke passed");
