import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = name => readFileSync(name, 'utf8');
const home = read('index.html');

// Core section anchors & 3 project summaries
for (const id of ['work', 'approach', 'experience', 'about', 'contact']) {
  assert.ok(home.includes(`id="${id}"`), `Missing #${id}`);
}
assert.equal((home.match(/class="project-summary"/g) || []).length, 3);

// Strict 01 -> 02 -> 03 order on homepage
const idx01 = home.indexOf('id="project-inventory"');
const idx02 = home.indexOf('id="project-creator"');
const idx03 = home.indexOf('id="project-talkwtf"');
assert.ok(idx01 > 0 && idx02 > idx01 && idx03 > idx02, 'Projects must be ordered 01 inventory -> 02 creator -> 03 talkwtf');

// Hero checks: no duplicate buttons, no "先蹲现场", no "团队协作交付" in hero index, TalkWTF mentions speech-to-text
const heroSection = home.slice(home.indexOf('<section class="hero'), home.indexOf('</section>'));
assert.ok(!heroSection.includes('hero-actions'), 'Hero must not have duplicate action buttons');
assert.ok(!heroSection.includes('先蹲现场'), 'Hero must not contain 先蹲现场');
assert.ok(!heroSection.includes('团队协作交付'), 'Hero index must not show 团队协作交付');
assert.ok(heroSection.includes('语音转文字'), 'Hero index must describe TalkWTF as 语音转文字');

// Reading-intro checks: no awkward slogan or buttons
const introSection = home.slice(home.indexOf('<section class="reading-intro'), home.indexOf('<section class="work-section'));
assert.ok(!introSection.includes('class="button"'), 'reading-intro must not have buttons');
assert.ok(!introSection.includes('软件差在哪'), 'reading-intro must not contain old slogan');

// About section must NOT contain email, WeChat QR, or duplicate resume button
const aboutSection = home.slice(home.indexOf('<section class="about-section'), home.indexOf('<div class="site-closing">'));
assert.ok(!aboutSection.includes('wechat-qr.jpg'), 'WeChat QR must be in #contact, not #about');
assert.ok(!aboutSection.includes('mailto:'), 'Email must be in #contact, not #about');
assert.ok(!aboutSection.includes('resume.pdf'), 'Resume button should not be duplicated in #about');

// Contact + Footer checks (single back-to-top, hidden WeChat QR modal instead of exposed white box)
const closingSection = home.slice(home.indexOf('<div class="site-closing">'));
const contactOnly = closingSection.slice(0, closingSection.indexOf('<footer'));
const footerOnly = closingSection.slice(closingSection.indexOf('<footer'));
assert.ok(contactOnly.includes('data-open-qr'), 'WeChat modal trigger must be in #contact');
assert.ok(!contactOnly.includes('wechat-qr.jpg'), 'White QR image must be hidden in modal, not exposed on crimson #contact');
assert.ok(home.includes('id="wechat-modal"') && home.includes('assets/wechat-qr.jpg'), 'In-page WeChat QR modal must exist');
assert.ok(contactOnly.includes('mailto:ryanlonn555@gmail.com'), 'Email must be in #contact');
assert.ok(!contactOnly.includes('resume.pdf'), 'Resume link should not be duplicated inside #contact');
assert.equal((footerOnly.match(/href="#main"/g) || []).length, 1, 'Footer must have only 1 back-to-top link');

// Unified hover grammar: zero translateX text floating in cover.css and home.css
assert.ok(!read('cover.css').includes('translateX('), 'cover.css must not float links horizontally');
assert.ok(!read('home.css').includes('translateX('), 'home.css must not float links horizontally');

// Huiwen Mincho detail buttons on all 3 projects
assert.equal((home.match(/case-link-huiwen/g) || []).length, 3, 'Exactly 3 project cards must use Huiwen Mincho detail button');

// Homepage must NOT expose Cin7 / Shopify or banned buzzwords
for (const forbidden of ['Cin7', 'Shopify', '赋能', '闭环', '抓手', '链路', '打通', '演进', '脱胎于', '人机分工', '痛点', '验收', '核对输出', 'WORK IN PRACTICE', 'TEXTMODE STUDY']) {
  assert.ok(!home.includes(forbidden), `Homepage contains forbidden term: ${forbidden}`);
}

// Homepage includes Resume PDF placeholder & TalkWTF GitHub repo link
assert.ok(home.includes('assets/resume.pdf'), 'Missing Resume PDF entry on homepage');
assert.ok(home.includes('https://github.com/rywlon/TalkWTF'), 'Missing TalkWTF GitHub link on homepage');

// Case study checks
for (const name of ['inventory', 'creator-ops', 'talkwtf']) {
  const html = read(`${name}.html`);
  assert.ok(html.includes('class="case-intro"'), `${name}: missing plain-language introduction`);
  assert.ok(html.includes('index.html#project-'), `${name}: missing return link`);
  assert.equal((html.match(/data-slide=/g) || []).length, name === 'creator-ops' ? 6 : 2);
  for (const banned of ['赋能', '闭环', '抓手', '链路', '打通', '演进', '脱胎于', '人机分工', '痛点', '验收', '核对输出', 'WORK IN PRACTICE', 'TEXTMODE STUDY']) {
    assert.ok(!html.includes(banned), `${name}.html contains banned term: ${banned}`);
  }
}

assert.ok(read('talkwtf.html').includes('语音转文字'));
assert.ok(read('talkwtf.html').includes('https://github.com/rywlon/TalkWTF'));
assert.ok(read('creator-ops.html').includes('12 份结构化 Markdown'));
assert.ok(read('inventory.html').includes('团队协作交付'));
assert.ok(existsSync('.nojekyll'));
console.log('PASS: all second-round refinements, hero, manifesto, Huiwen CTA, contact/footer, and case studies verified.');
