/* Unified RAF loop synchronizing Lenis smooth scroll and compositor parallax in the same frame. */
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let smooth,rafId=0;
 const chapters=[...document.querySelectorAll('.hero,.reading-intro,.project-creator,.project-inventory,.project-talk,.contact')].map(section=>({
  section,
  isHero:section.classList.contains('hero'),
  top:0,
  height:1,
  lastProgress:NaN,
  targets:[
   [section.querySelector('.ascii-live,.project-creator>.project-ascii'),240],
   [section.querySelector('.chapter-dots'),260],
   [section.querySelector('h1,.contact>.chapter-dots+div'),-180],
   [section.querySelector('figcaption'),-85],
   [section.querySelector('.creator-visual,.inventory-visual,.talk-visual'),-65],
   [section.querySelector('.hero-copy'),-35],
   [section.querySelector('.project-info,.contact>div:last-child'),-130]
  ].filter(([el])=>Boolean(el))
 }));
 let lastW=0,lastH=0;
 const measure=()=>{
  const sy=window.scrollY;
  for(const item of chapters){
   const r=item.section.getBoundingClientRect();
   item.top=r.top+sy;
   item.height=r.height||1;
   item.lastProgress=NaN;
  }
 };
 const draw=sy=>{
  const vh=window.innerHeight||800;
  const isReduced=reduce.matches;
  for(const item of chapters){
   const {isHero,top,height,targets}=item;
   let progress;
   if(isHero){
    progress=Math.max(0,Math.min(1.3,sy/Math.max(height,1)));
   }else{
    const centerOffset=(sy+vh*0.5)-(top+height*0.5);
    progress=Math.max(-1.3,Math.min(1.3,centerOffset/Math.max(height*0.7,vh*0.7)));
   }
   const amount=isReduced?0:progress;
   if(Math.abs(amount-item.lastProgress)<0.0005) continue;
   item.lastProgress=amount;
   for(let i=0;i<targets.length;i++){
    const [el,mult]=targets[i];
    el.style.transform=isReduced?'':`translate3d(0,${(amount*mult).toFixed(2)}px,0)`;
   }
  }
 };
 const tick=now=>{
  if(smooth){
   smooth.raf(now);
   draw(smooth.scroll);
   rafId=requestAnimationFrame(tick);
  }
 };
 const configureScroll=()=>{
  if(rafId){cancelAnimationFrame(rafId);rafId=0;}
  smooth?.destroy();smooth=undefined;
  if(!reduce.matches && window.Lenis){
   smooth=new Lenis({autoRaf:false,lerp:.095,smoothWheel:true,syncTouch:false,anchors:true,overscroll:false});
   rafId=requestAnimationFrame(tick);
  }
 };
 configureScroll();
 reduce.addEventListener('change',()=>{configureScroll();measure();draw(window.scrollY);});
 measure();draw(window.scrollY);
 addEventListener('load',()=>{measure();draw(smooth?smooth.scroll:window.scrollY);});
 addEventListener('scroll',()=>{if(!smooth)draw(window.scrollY);},{passive:true});
 addEventListener('resize',()=>{
  if(window.innerWidth!==lastW||window.innerHeight!==lastH){
   lastW=window.innerWidth;lastH=window.innerHeight;
   measure();draw(smooth?smooth.scroll:window.scrollY);
  }
 },{passive:true});
})();
