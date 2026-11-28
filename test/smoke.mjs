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
assert.ok(home.includes('https://github.com/lonzhijun/TalkWTF'), 'Missing TalkWTF GitHub link on homepage');

// Case study checks: Ableton Live-style GenRyu Moon switcher + in-page lightbox
const expectedTabs = { 'inventory': 6, 'creator-ops': 6, 'talkwtf': 4 };
for (const name of ['inventory', 'creator-ops', 'talkwtf']) {
  const html = read(`${name}.html`);
  assert.ok(html.includes('data-case-switcher'), `${name}: missing interactive directory switcher`);
  assert.ok(html.includes('index.html#project-'), `${name}: missing return link`);
  assert.ok(html.includes('id="img-lightbox"'), `${name}: missing in-page image lightbox`);
  assert.equal((html.match(/role="tab"/g) || []).length, expectedTabs[name], `${name}: unexpected tab count`);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, expectedTabs[name], `${name}: unexpected panel count`);
  for (const banned of ['赋能', '闭环', '抓手', '链路', '打通', '演进', '脱胎于', '人机分工', '痛点', '验收', '核对输出', 'WORK IN PRACTICE', 'TEXTMODE STUDY']) {
    assert.ok(!html.includes(banned), `${name}.html contains banned term: ${banned}`);
  }
}

// Unified Apple-inspired Selected work on homepage (zero color blocks, unified 01/02/03 structure) + new optimized WebP assets
assert.equal((home.match(/class="project project-[a-z]+ work-item"/g) || []).length, 3, 'All 3 Selected work projects must share the unified work-item layout');
assert.ok(!home.includes('ableton-showcase'), 'Homepage must not use separate Project 01 Ableton showcase UI');
assert.ok(!home.includes('ableton-card'), 'Homepage must not have green color-block card');
assert.ok(!home.includes('data-project-ascii="triage"'), 'Homepage Selected work must not overlay ASCII color blocks');
assert.ok(!home.includes('data-project-ascii="sync"'), 'Homepage Selected work must not overlay ASCII color blocks');
assert.ok(read('editorial.css').includes('.live-panel.live-panel-ableton[hidden]'), 'editorial.css must preserve [hidden] display:none for inventory tabpanels');
assert.ok(read('server.js').includes('max-age=86400'), 'server.js must cache static images and fonts');

const expectedOpts = [
  'inv-search.webp', 'inv-aging.webp', 'inv-loading.webp', 'inv-showroom.webp', 'inv-box.webp', 'inv-pricing.webp',
  'creator-home.webp', 'creator-scenarios.webp', 'creator-tone.webp', 'creator-duty.webp', 'creator-templates.webp', 'creator-handoff.webp',
  'talk-overview.webp', 'talk-connect.webp', 'talk-polish.webp', 'talk-models.webp'
];
for (const opt of expectedOpts) {
  assert.ok(existsSync(`assets/opt/${opt}`), `Missing optimized WebP asset: assets/opt/${opt}`);
  assert.ok(existsSync(`assets/opt/sm/${opt}`), `Missing responsive 760w WebP asset: assets/opt/sm/${opt}`);
  assert.ok(existsSync(`assets/opt/full/${opt}`), `Missing full-res lightbox WebP asset: assets/opt/full/${opt}`);
}
assert.ok(existsSync('assets/opt/wechat-qr.webp'), 'Missing optimized WeChat QR WebP');

const invHtml = read('inventory.html');
const creatorHtml = read('creator-ops.html');
const talkHtml = read('talkwtf.html');
const siteJs = read('site.js');
const serverJs = read('server.js');

assert.ok(serverJs.includes('immutable'), 'server.js must send immutable caching for versioned image assets');
assert.ok(serverJs.includes('createBrotliCompress'), 'server.js must support Brotli compression');

for (const [pageName, content] of [['index.html', home], ['inventory.html', invHtml], ['creator-ops.html', creatorHtml], ['talkwtf.html', talkHtml]]) {
  assert.ok(content.includes('rel="preload" as="image"'), `${pageName} missing LCP image preload`);
  assert.ok(content.includes('srcset='), `${pageName} missing responsive srcset`);
}

for (const page of ['inventory.html', 'creator-ops.html', 'talkwtf.html']) {
  assert.ok(read(page).includes('case-one-screen'), `${page} missing single-screen layout class`);
}

// Verify zero references to old project screenshots across all pages and site.js
const oldAssetRefs = [
  '01-aging-report_1f272c41.png',
  '02-pricing-calculator_1c00c4a6.png',
  '03-inventory-search_a392fd9e.png',
  '04-box-management_9de33eaf.png',
  'assets/creator-desk.png',
  'assets/creator-library.png',
  'assets/creator-records.png',
  'assets/creator-discovery.png',
  'assets/creator-handoff.png',
  'assets/talk-voice.jpg',
  'assets/talk-pair.jpg',
  'assets/inventory-orders.png',
  'assets/inventory-stocktake.png',
  'assets/opt/creator-desk.webp',
  'assets/opt/talk-voice.webp',
  'assets/opt/talk-pair.webp'
];
for (const [file, content] of [['index.html', home], ['inventory.html', invHtml], ['creator-ops.html', creatorHtml], ['talkwtf.html', talkHtml], ['site.js', siteJs]]) {
  for (const oldRef of oldAssetRefs) {
    assert.ok(!content.includes(oldRef), `${file} still references old asset: ${oldRef}`);
  }
}

// Verify all referenced local data-zoom-src assets exist on disk
const allPages = home + invHtml + creatorHtml + talkHtml;
for (const match of allPages.matchAll(/data-zoom-src="([^"?]+)/g)) {
  const rel = match[1].startsWith('/') ? `public${match[1]}` : match[1];
  assert.ok(existsSync(rel), `Missing referenced lightbox asset on disk: ${rel}`);
}

assert.ok(talkHtml.includes('语音转文字'));
assert.ok(talkHtml.includes('https://github.com/lonzhijun/TalkWTF'));
assert.ok(creatorHtml.includes('43 份知识库'));
assert.ok(invHtml.includes('团队协作交付'));
assert.ok(existsSync('.nojekyll'));
console.log('PASS: Responsive 760w/1400w WebP srcset, full-res WebP lightbox, LCP preload, Brotli/immutable caching, and zero old image references verified.');
