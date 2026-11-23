from pathlib import Path
import math, html
root=Path(__file__).resolve().parents[1]
# Original static textmode field: deterministic character density, no external art.
rows=[]
for j in range(43):
 row=[]
 for i in range(176):
  x=i/175;y=j/42;wave=0
  for k in range(4):
   cy=.17+k*.22+(.18*(1-x)+.035)*math.sin(x*math.pi*2.3+k*1.65)
   wave=max(wave,math.exp(-((y-cy)/(.032+.045*(1-x)))**2))
  d=(math.sin(i*127.1+j*311.7)*43758.5453)%1
  strength=wave*(.72+.28*math.sin(x*8+y*6))
  chars=' .:+*#%@'
  ch=chars[min(7,int(strength*7.8))] if strength>d*.35 else ' '
  row.append(ch)
 rows.append('<text y="%s">%s</text>'%(16+j*8,''.join('<tspan x="%s">%s</tspan>'%(i*8,html.escape(ch)) for i,ch in enumerate(row) if ch!=' ')))
svg='<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="360" viewBox="0 0 1400 360"><rect width="1400" height="360" fill="#171715"/><g fill="#f4f1e9" font-family="monospace" font-size="10" xml:space="preserve">'+''.join(rows)+'</g></svg>'
(root/'assets/input-field.svg').write_text(svg)
# Project-specific procedural vector studies.
for kind in ['creator','inventory','talk']:
 els=[]
 if kind=='creator':
  for i in range(35):
   y=20+i*13; end=100+(i%3)*155
   els.append(f'<path d="M0 {y} C190 {y},180 {end},650 {end}"/>')
 elif kind=='inventory':
  for i in range(32):
   d=i*13
   els.append(f'<path d="M{d} 0V450 M0 {d}H650"/>')
  els.append('<path d="M90 50H400V360H90Z M245 150H555V440H245Z" stroke-width="5"/>')
 else:
  for i in range(75):
   x=i*9; h=20+130*abs(math.sin(i*.19))*abs(math.sin(i*.043+1))
   els.append(f'<path d="M{x} {225-h}V{225+h}"/>')
 (root/f'assets/{kind}-pattern.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 450"><g fill="none" stroke="#171715" stroke-opacity=".18" stroke-width="1">'+''.join(els)+'</g></svg>')
