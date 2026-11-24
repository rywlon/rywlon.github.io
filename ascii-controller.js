/* Transfer canvases before any context is created; keep DOM and scroll work small. */
(() => {
 if(!window.Worker||!HTMLCanvasElement.prototype.transferControlToOffscreen)return;
 let worker;
 try{worker=new Worker('ascii-worker.js?v=6');}catch{return;}
 window.asciiWorkers=true;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const items=[...document.querySelectorAll('.textmode-field,[data-project-ascii]')].map((field,id)=>{
  const hero=field.matches('.textmode-field'),canvas=document.createElement('canvas'),surface=document.createElement('div');
  surface.className=hero?'ascii-live':'project-ascii';surface.style.overflow='hidden';canvas.style.cssText='position:absolute;display:block;pointer-events:none';canvas.setAttribute('aria-hidden','true');
  surface.append(canvas);field.prepend(surface);if(hero)field.classList.add('field-live');
  const output=canvas.getContext('bitmaprenderer');
  worker.postMessage({type:'init',id,mode:hero?'converge':field.dataset.projectAscii,ink:hero?'#ffffff':getComputedStyle(field).color,speed:hero?.55:.45});
  const clips=[];
  for(let e=field;e&&e!==document.body;e=e.parentElement){if(/hidden|clip|auto|scroll/.test(getComputedStyle(e).overflow))clips.push(e);}
  const item={id,field,canvas,output,surface,clips,active:true,pointer:null,tileKey:null};
  field.addEventListener('pointermove',e=>{
   if(reduce.matches||e.pointerType!=='mouse')return;
   const r=surface.getBoundingClientRect();item.pointer={active:true,x:e.clientX-r.left,y:e.clientY-r.top};
  },{passive:true});
  field.addEventListener('pointerleave',()=>{item.pointer={active:false,x:0,y:0};});
  return item;
 });
 let pending=true,frameId=0,busy=false;
 const images=new Map();
 function update(){
  pending=false;const batch=[];
  for(const item of items){
   if(!item.active){batch.push({id:item.id,visible:false});continue;}
   const r=item.surface.getBoundingClientRect();let left=Math.max(0,r.left),right=Math.min(innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
   for(const e of item.clips){const c=e.getBoundingClientRect();left=Math.max(left,c.left);right=Math.min(right,c.right);top=Math.max(top,c.top);bottom=Math.min(bottom,c.bottom);}
   const tile={left:Math.floor(Math.max(0,left-r.left-8)/8)*8,top:Math.floor(Math.max(0,top-r.top-48)/32)*32,w:innerWidth+24,h:innerHeight+128};
   batch.push({id:item.id,tile,w:Math.round(r.width),h:Math.round(r.height),dpr:Math.min(devicePixelRatio||1,2),visible:right>left&&bottom>top,clip:{left:left-r.left,right:right-r.left,top:top-r.top,bottom:bottom-r.top}});
  }
  worker.postMessage({type:'layout',fields:batch});
 }
 // One outstanding draw: never enqueue frames the browser cannot present.
 function tick(now){
  frameId=0;
  if(document.hidden)return;
  if(pending)update();
  // Bitmap and its tile origin become visible together in this browser frame.
  for(const [id,image] of images){
   const item=items[id],tile=image.tile;
   const key=[tile.left,tile.top,tile.w,tile.h].join(',');
   if(key!==item.tileKey){item.tileKey=key;Object.assign(item.canvas.style,{left:tile.left+'px',top:tile.top+'px',width:tile.w+'px',height:tile.h+'px'});}
   item.output.transferFromImageBitmap(image.bitmap);
   item.canvas.dataset.presentedTop=tile.top;
  }
  images.clear();
  if(!reduce.matches&&!busy&&items.some(i=>i.active)){
   for(const item of items)if(item.pointer){worker.postMessage({type:'pointer',id:item.id,pointer:item.pointer});item.pointer=null;}
   busy=true;worker.postMessage({type:'frame',now});
  }
  if(!reduce.matches)frameId=requestAnimationFrame(tick);
 }
 function request(){pending=true;if(!frameId&&!document.hidden)frameId=requestAnimationFrame(tick);}
 const observer=new IntersectionObserver(entries=>{for(const e of entries){items.find(i=>i.field===e.target).active=e.isIntersecting;}request();},{rootMargin:'100px'});
 items.forEach(i=>observer.observe(i.field));
 const resize=new ResizeObserver(request);items.forEach(i=>resize.observe(i.surface));
 function state(){if(frameId){cancelAnimationFrame(frameId);frameId=0;}worker.postMessage({type:'state',hidden:document.hidden,reduced:reduce.matches});request();}
 addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});addEventListener('load',request);document.addEventListener('visibilitychange',state);reduce.addEventListener('change',state);
 // Read-only diagnostics for verifying worker activity and viewport culling.
 worker.onmessage=({data})=>{if(data.type==='stats')window.asciiWorkerStats=data.fields;else if(data.type==='done')busy=false;else if(data.type==='image'){const old=images.get(data.id);old?.bitmap.close();images.set(data.id,data);if(!frameId&&!document.hidden)frameId=requestAnimationFrame(tick);}};
 window.inspectAsciiWorker=()=>worker.postMessage({type:'stats'});
 state();
})();
