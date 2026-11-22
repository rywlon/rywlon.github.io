"""Check all local references and fragments without a browser or dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
class Document(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.ids, self.refs, self.images = path, set(), [], []
        self.feed(path.read_text())
    def handle_starttag(self, tag, items):
        attrs = dict(items)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'duplicate id: {self.path}: {attrs["id"]}'
            self.ids.add(attrs['id'])
        for attr in ['href', 'src', 'aria-controls']:
            if attr in attrs:
                self.refs.append((attr, attrs[attr]))
        if tag == 'img':
            assert attrs.get('alt'), f'missing image description in {self.path}'
            assert attrs.get('width') and attrs.get('height'), f'missing dimensions in {self.path}'
            self.images.append(attrs['src'])

docs = {p.resolve(): Document(p) for p in ROOT.glob('*.html')}
checked = 0
for path, doc in docs.items():
    for attr, ref in doc.refs:
        if attr == 'aria-controls':
            assert ref in doc.ids, f'missing controlled panel: {ref}'
            continue
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            assert url.scheme == 'https', f'insecure external reference: {ref}'
            continue
        target = (path.parent / unquote(url.path)).resolve() if url.path else path
        if target.is_dir():
            target = target / 'index.html'
        assert target.is_relative_to(ROOT), f'resource outside public root: {ref}'
        assert target.is_file(), f'broken reference in {path.name}: {ref}'
        if url.fragment and target in docs:
            assert url.fragment in docs[target].ids, f'broken fragment: {path.name} -> {ref}'
        checked += 1
print(f'PASS: {len(docs)} HTML pages; {checked} local references and anchors; image descriptions and dimensions; unique IDs.')
