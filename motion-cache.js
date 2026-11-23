/* Pre-baked alpha sprite atlases and Gaussian LUT for sub-millisecond ASCII rendering. */
(() => {
 const TILE_W=24,TILE_H=28;
 const atlases=new Map();
 const EXP_STEPS=128,EXP_MAX=2.5;
 const expLut=new Float32Array(EXP_STEPS+1);
 for(let i=0;i<=EXP_STEPS;i++) expLut[i]=Math.exp(-(i/EXP_STEPS)*EXP_MAX);

 const getSetAtlas=(color,chars)=>{
  const key=color+'|'+chars;
  let atlas=atlases.get(key);
  if(!atlas){
   const len=chars.length;
   atlas=document.createElement('canvas');
   atlas.width=len*TILE_W;
   atlas.height=TILE_H;
   const c=atlas.getContext('2d');
   c.scale(2,2);
   c.font='700 10px SFMono-Regular, Consolas, monospace';
   c.fillStyle=color;
   for(let i=1;i<len;i++){
    c.globalAlpha=0.35+(i/len)*0.55;
    c.fillText(chars[i],i*12+1,11);
   }
   atlases.set(key,atlas);
  }
  return atlas;
 };

 window.portfolioMotion={
  scrolling:false,
  TILE_W,
  TILE_H,
  EXP_SCALE:EXP_STEPS/EXP_MAX,
  expLut,
  getSetAtlas
 };
})();
