import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const read = name => readFileSync(name, 'utf8');
const home = read('index.html');
for (const id of ['work', 'approach', 'experience', 'about']) assert.ok(home.includes(`id="${id}"`), `Missing #${id}`);
assert.equal((home.match(/class="project-summary"/g) || []).length, 3);
for (const name of ['creator-ops', 'inventory', 'talkwtf']) {
  const html = read(`${name}.html`);
  assert.ok(html.includes('class="case-intro"'), `${name}: missing plain-language introduction`);
  assert.ok(html.includes('href="index.html#work"'), `${name}: missing return link`);
  assert.equal((html.match(/data-slide=/g) || []).length, name === 'creator-ops' ? 6 : 2);
}
assert.ok(read('inventory.html').includes('不是开发整套库存系统'));
assert.ok(read('creator-ops.html').includes('自动发送尚未接入这个控制台'));
assert.ok(read('talkwtf.html').includes('完整联调尚未完成'));
assert.ok(read('spatial.css').includes('prefers-reduced-motion'));
assert.ok(existsSync('.nojekyll'));
console.log('PASS: navigation, summaries, gallery controls, role/status boundaries and reduced-motion support.');
