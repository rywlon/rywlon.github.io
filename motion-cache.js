/* Cache raster glyphs; let scroll compositing take priority over ambient redraw. */
(() => {
 const cache=new Map();
 let timer;
 const motion={scrolling:false,glyph(ctx,char,x,y){
   const color=ctx.fillStyle,key=color+'|'+char;
   let tile=cache.get(key);
   if(!tile){
     tile=document.createElement('canvas');tile.width=24;tile.height=28;
     const c=tile.getContext('2d');c.scale(2,2);c.font='700 10px SFMono-Regular, Consolas, monospace';c.fillStyle=color;c.fillText(char,1,11);cache.set(key,tile);
   }
   ctx.drawImage(tile,x-1,y-11,12,14);
 }};
 window.portfolioMotion=motion;
 addEventListener('scroll',()=>{motion.scrolling=true;clearTimeout(timer);timer=setTimeout(()=>{motion.scrolling=false;},160);},{passive:true});
})();
