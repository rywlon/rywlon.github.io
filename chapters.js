/* Damped wheel scrolling with independently drifting decorative layers. */
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let smooth;
 const configureScroll=()=>{
  smooth?.destroy();smooth=undefined;
  if(!reduce.matches && window.Lenis) smooth=new Lenis({autoRaf:true,lerp:.075,smoothWheel:true,syncTouch:false,anchors:true,overscroll:false});
 };
 configureScroll();reduce.addEventListener('change',configureScroll);
 const chapters=[...document.querySelectorAll('.hero,.contact')].map(section=>({section,top:0,height:1}));
 const measure=()=>{for(const item of chapters){const r=item.section.getBoundingClientRect();item.top=r.top+scrollY;item.height=r.height||1;}};
 measure();new ResizeObserver(()=>{measure();update();}).observe(document.body);
 let frame=0;
 const draw=()=>{
  frame=0;
  for(const {section,top,height} of chapters){
   const progress=Math.max(-1,Math.min(1,(scrollY-top)/height));
   const amount=reduce.matches?0:progress;
   section.style.setProperty('--dots-drift',`${amount*100}px`);
   section.style.setProperty('--field-drift',`${amount*55}px`);
   section.style.setProperty('--title-drift',`${amount*-22}px`);
  }
 };
 const update=()=>{if(!frame)frame=requestAnimationFrame(draw);};
 addEventListener('scroll',update,{passive:true});addEventListener('resize',()=>{measure();update();});
 reduce.addEventListener('change',update);draw();
})();
