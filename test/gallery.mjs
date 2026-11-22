// DOM contract tests only: no browser engine or browser automation.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const galleries = ['talk', 'creator', 'inventory'].map(name => {
  const image = {};
  const full = {setAttribute(k,v) {this[k] = v;}};
  const caption = {};
  const buttons = [0,1].map(index => ({
    dataset: {slide: String(index)}, attrs: {'aria-pressed': String(index === 0)},
    setAttribute(k,v) {this.attrs[k] = v;}, getAttribute(k) {return this.attrs[k];},
    addEventListener(k,v) {this[k] = v;}, focus() {this.focused = true;}
  }));
  return {
    dataset: {gallery: name}, image, full, caption, buttons,
    querySelector(s) {return s === 'img' ? image : s === '.gallery-full' ? full : caption;},
    querySelectorAll() {return buttons;},
    addEventListener(k,v) {this[k] = v;}
  };
});
vm.runInNewContext(readFileSync('site.js','utf8'), {
  document: {querySelectorAll() {return galleries;}}
});
for (const gallery of galleries) {
  gallery.buttons[1].click();
  assert.equal(gallery.buttons[1].attrs['aria-pressed'], 'true');
  assert.equal(gallery.buttons[0].attrs['aria-pressed'], 'false');
  assert.equal(gallery.full.href, gallery.image.src);
  assert.ok(gallery.image.alt && gallery.image.width && gallery.image.height);
  assert.ok(gallery.caption.textContent);
  let prevented = false;
  gallery.keydown({key: 'ArrowRight', preventDefault() {prevented = true;}});
  assert.ok(prevented && gallery.buttons[0].focused);
  assert.equal(gallery.buttons[0].attrs['aria-pressed'], 'true');
  gallery.keydown({key: 'ArrowLeft', preventDefault() {}});
  assert.equal(gallery.buttons[1].attrs['aria-pressed'], 'true');
  console.log('PASS: '+gallery.dataset.gallery+' gallery click, keys, wrap, image, caption, full-size link.');
}
