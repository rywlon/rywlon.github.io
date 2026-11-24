importScripts('ascii-gpu.js?v=3');
/* Direct text rendering off the main thread; pattern math retained from 6eecfce. */
const fields=new Map();
const atlasChars=' .:-=>#§@|+x█*%';
const gpuCanvas=new OffscreenCanvas(1,1);
const sharedGPU=createAsciiGPU(gpuCanvas,atlasChars,'#ffffff');
let gpuWidth=0,gpuHeight=0,gpuDpr=0;
const expScale=128/2.5,expLut=new Float32Array(129);
for(let i=0;i<=128;i++)expLut[i]=Math.exp(-i/expScale);
let hidden=false,reduced=false;
let surfaceResizes=0;
function render(f){
 const {ctx,gpu,w,h,tile,rows,cols,cell,mode,phase,pointer,clip,ink,sinY5,cosY5}=f;
 if(!w||!h||!clip||clip.right<=clip.left||clip.bottom<=clip.top)return;
 const set=mode==='triage'?' .:-=>#§@':mode==='sync'?' .:|+x#█@':' .:+*#%@',setLen=set.length;
 let cells=0,glyphs=0;
 if(gpu){if(gpuWidth!==tile.w||gpuHeight!==tile.h||gpuDpr!==f.dpr){gpuWidth=tile.w;gpuHeight=tile.h;surfaceResizes++;gpuDpr=f.dpr;gpuCanvas.width=Math.round(tile.w*f.dpr);gpuCanvas.height=Math.round(tile.h*f.dpr);gpu.resize(tile.w,tile.h,f.dpr);}gpu.setInk(ink);gpu.begin();}else{ctx.clearRect(0,0,tile.w,tile.h);ctx.font='700 10px SFMono-Regular, Consolas, monospace';ctx.fillStyle=ink;}
      const aspect = (h / Math.max(w, 1)) * 1.8;
      const ptrActive = pointer.active;
      const ptrX = ptrActive ? (pointer.x) / Math.max(w, 1) : -1;
      const ptrY = ptrActive ? (pointer.y) / Math.max(h, 1) : -1;
      const ptrValid = ptrActive && ptrX >= -0.22 && ptrX <= 1.22 && ptrY >= -0.22 && ptrY <= 1.22;

      for (let i = Math.max(0,Math.floor(clip.left/cell)); i < Math.min(cols,Math.ceil(clip.right/cell)); i++) {
        const x = i / cols;
        const pulseBase = x * 13 - phase * 1.9;
        const sinPB = Math.sin(pulseBase);
        const cosPB = Math.cos(pulseBase);

        const dx = ptrValid ? x - ptrX : 1;
        const dxSq = dx * dx;
        const ptrNearCol = ptrValid && dxSq < 0.0484;
        const drawX = i * cell - 1;

        let spread = 0, invSigmaSq = 0, cutoffSq = 0, c0 = 0, c1 = 0, c2 = 0, c3 = 0;
        let topRule = 0, lowerRule = 0, hasBranch = false, branchCenter = 0;
        let quantX = 0;

        if (mode === 'converge') {
          spread = Math.max(0.08, 1 - x * 0.82);
          const sigma = 0.042 + (1 - spread) * 0.015;
          invSigmaSq = 1 / (sigma * sigma);
          cutoffSq = 2.35 * sigma * sigma;
          c0 = 0.5 - 0.36 * spread + 0.11 * spread * Math.sin(x * 7 - phase * 1.4);
          c1 = 0.5 - 0.12 * spread + 0.11 * spread * Math.sin(x * 7 + 1.7 - phase * 1.4);
          c2 = 0.5 + 0.12 * spread + 0.11 * spread * Math.sin(x * 7 + 3.4 - phase * 1.4);
          c3 = 0.5 + 0.36 * spread + 0.11 * spread * Math.sin(x * 7 + 5.1 - phase * 1.4);
        } else if (mode === 'triage') {
          topRule = 0.26 + 0.025 * Math.sin(x * 14 - phase * 2.2);
          lowerRule = 0.78 + 0.03 * Math.cos(x * 11 - phase * 1.9);
          if (x > 0.22) {
            hasBranch = true;
            const branchT = (x - 0.22) / 0.78;
            branchCenter = 0.26 + branchT * 0.54 + 0.06 * Math.sin(branchT * 9 - phase * 1.8);
          }
        } else {
          quantX = Math.floor(x * 16) / 16;
        }

        for (let j = Math.max(0,Math.floor(clip.top/11)-1); j < Math.min(rows,Math.ceil(clip.bottom/11)+1); j++) {
          cells++;
          const y = j / rows;
          let density = 0;

          if (mode === 'converge') {
            let minDistSq = 9;
            let d = y - c0; if (d * d < minDistSq) minDistSq = d * d;
            d = y - c1; if (d * d < minDistSq) minDistSq = d * d;
            d = y - c2; if (d * d < minDistSq) minDistSq = d * d;
            d = y - c3; if (d * d < minDistSq) minDistSq = d * d;
            if (minDistSq < cutoffSq) density = expLut[(minDistSq * invSigmaSq * expScale) | 0];
          } else if (mode === 'triage') {
            const dt = y - topRule;
            if (dt * dt < 0.0048) density = expLut[((dt * dt / 0.002025) * expScale) | 0];
            const dl = y - lowerRule;
            if (dl * dl < 0.0054) {
              const v = expLut[((dl * dl / 0.002304) * expScale) | 0] * 0.9;
              if (v > density) density = v;
            }
            if (hasBranch) {
              const db = y - branchCenter;
              if (db * db < 0.0064) {
                const v = expLut[((db * db / 0.002704) * expScale) | 0] * 0.95;
                if (v > density) density = v;
              }
            }
          } else {
            const trackIndex = (y * 5) | 0;
            const trackCenter = (trackIndex + 0.5) / 5;
            const barDist = Math.abs(y - trackCenter);
            if (barDist < 0.055) {
              const stepWave = Math.sin(quantX * 10 + trackIndex * 1.9 - phase * 1.6);
              if (stepWave > -0.2) density = Math.min(1, (stepWave + 0.3) * 0.85);
            }
          }

          if (ptrNearCol) {
            const dy = (y - ptrY) * aspect;
            const distSq = dxSq + dy * dy;
            if (distSq < 0.0484) {
              const boost = 1 - (distSq / 0.0484);
              density = Math.min(1, density + boost * 0.65);
            }
          }

          if (density < 0.12) continue;

          const pulse = 0.8 + 0.2 * (sinPB * cosY5[j] + cosPB * sinY5[j]);
          const idx = Math.min(setLen - 1, (density * pulse * setLen) | 0);
          if (idx > 0) {
            const alpha=0.35+(idx/setLen)*0.55;
            if(gpu)gpu.glyph(i*cell-tile.left,j*11+10-tile.top,atlasChars.indexOf(set[idx]),alpha);
            else{ctx.globalAlpha=alpha;ctx.fillText(set[idx],i*cell-tile.left,j*11+10-tile.top);}glyphs++;
          }
        }
      }

 if(gpu)gpu.end();
 const bitmap=(gpu?gpuCanvas:f.canvas).transferToImageBitmap();
 postMessage({type:'image',id:f.id,tile:{...tile},bitmap},[bitmap]);
 f.frames++;f.cells=cells;f.glyphs=glyphs;
}
function run(now=performance.now()){
 if(hidden||reduced)return;
 for(const f of fields.values())if(f.visible){
  f.phase+=f.last?Math.min((now-f.last)/1000,.1)*f.speed:0;f.last=now;render(f);
 }else f.last=0;
}
onmessage=({data:m})=>{
 if(m.type==='frame'){run(m.now);postMessage({type:'done'});return;}
 if(m.type==='init'){
  const chars=m.mode==='triage'?' .:-=>#§@':m.mode==='sync'?' .:|+x#█@':' .:+*#%@';
  const gpu=sharedGPU,canvas=new OffscreenCanvas(1,1);
  fields.set(m.id,{...m,canvas,gpu,ctx:gpu?null:canvas.getContext('2d'),phase:0,last:0,frames:0,pointer:{active:false,x:0,y:0},visible:false});return;
 }
 if(m.type==='state'){
  hidden=m.hidden;reduced=m.reduced;
  for(const f of fields.values()){f.last=0;if(reduced&&f.visible)render(f);}
  return;
 }
 if(m.type==='layout'){
  for(const v of m.fields){const f=fields.get(v.id);if(!f)continue;
   if(v.w===undefined){f.visible=false;f.last=0;continue;}
   const resized=f.w!==v.w||f.h!==v.h||f.dpr!==v.dpr;
   const outputResized=!f.tile||f.tile.w!==v.tile.w||f.tile.h!==v.tile.h||f.dpr!==v.dpr;
   Object.assign(f,v);
   if(outputResized){f.canvas.width=Math.round(f.tile.w*f.dpr);f.canvas.height=Math.round(f.tile.h*f.dpr);if(!f.gpu)f.ctx.setTransform(f.dpr,0,0,f.dpr,0,0);}
   if(resized){
    f.cell=f.w<500?9:10;f.rows=Math.ceil(f.h/11);f.cols=Math.ceil(f.w/f.cell);
    f.sinY5=Float32Array.from({length:f.rows},(_,j)=>Math.sin(j/f.rows*5));
    f.cosY5=Float32Array.from({length:f.rows},(_,j)=>Math.cos(j/f.rows*5));
   }
   if(reduced&&f.visible)render(f);
  }return;
 }
 if(m.type==='pointer'){const f=fields.get(m.id);if(f)f.pointer=m.pointer;return;}
 if(m.type==='stats')postMessage({type:'stats',fields:[...fields.values()].map(f=>({id:f.id,backend:f.gpu?'webgl2':'canvas2d',gpu:f.gpu?.inspect(),surfaceResizes,tile:f.tile,frames:f.frames,cells:f.cells,glyphs:f.glyphs,totalCells:f.rows*f.cols,visible:f.visible,phase:f.phase}))});
};
