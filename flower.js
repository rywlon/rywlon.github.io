/* Original procedural botanical sculpture. No third-party graphics or models. */
(() => {
  const canvas = document.querySelector('.ascii-flower');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const points = [];
  const add = (x,y,z,tone=0,kind=0) => points.push({x,y,z,tone,kind});
  const stem = y => ({x: Math.sin(y*2.5)*.10, z:Math.sin(y*3)*.06});
  // Slender woody stem, with collars at branching nodes.
  for(let y=-1.05;y<.55;y+=.012){const c=stem(y);for(let a=0;a<6;a++){const t=a*Math.PI/3;add(c.x+.018*Math.cos(t),y,c.z+.018*Math.sin(t),.6,1);}}
  for(const [y,side] of [[-.64,1],[-.24,-1],[.12,1]]){
    const c=stem(y);
    for(let a=0;a<40;a++){const t=a*Math.PI/20;add(c.x+.039*Math.cos(t),y,c.z+.039*Math.sin(t),.8,1);}
    for(let t=0;t<1;t+=.018){
      const x=c.x+side*.45*t, yy=y+.26*t, z=c.z+.12*Math.sin(t*2);
      add(x,yy,z,.7,1);
      // Leaf blades with a prominent central vein.
      if(t>.32)for(let v=-1;v<=1;v+=.14){const w=.12*Math.sin((t-.32)/.68*Math.PI);add(x+v*w*.4,yy+v*w,z+v*w,.35+Math.abs(v)*.2,2);}
    }
  }
  // Five nested whorls of cupped, individually curved petals.
  for(let layer=0;layer<5;layer++){
    const count=layer<2?9:7, radius=.49-layer*.075;
    for(let k=0;k<count;k++){
      const angle=k*Math.PI*2/count+layer*.52;
      for(let u=.035;u<=1;u+=.037)for(let v=-1;v<=1;v+=.075){
        const width=Math.sin(Math.PI*u)*(.30-layer*.025);
        const a=angle+v*width;
        const r=radius*u;
        const cup=.18*Math.sin(u*Math.PI)-.06*u*u+layer*.045;
        add(Math.cos(a)*r,.60+cup,Math.sin(a)*r, .12+.65*Math.abs(v)+.12*Math.cos(angle*2),0);
      }
    }
  }
  for(let i=0;i<160;i++){const a=i*2.39996,r=.065*Math.sqrt(i/160);add(Math.cos(a)*r,.79+.02*Math.sin(i),Math.sin(a)*r,1,3);}
  let width=0,height=0,frame=0,angle=.55,visible=true,last=0;
  const resize=()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);draw();};
  function draw(){
    ctx.clearRect(0,0,width,height);
    if(!width)return;
    const scale=Math.min(width/1.55,height/2.25), grid=width<500?5:5.5;
    const cells=new Map();
    for(const p of points){
      const ca=Math.cos(angle),sa=Math.sin(angle);
      let x=p.x*ca+p.z*sa,z=-p.x*sa+p.z*ca,y=p.y;
      // View slightly down into the bloom, then lean the entire branch.
      const yy=y*.84-z*.54;z=y*.54+z*.84;y=yy;
      const xx=x*.91-y*.414;y=x*.414+y*.91;x=xx;
      const persp=3.8/(3.8-z);
      const sx=width*.5+x*scale*persp, sy=height*.49-y*scale*persp;
      const gx=Math.round(sx/grid),gy=Math.round(sy/(grid*1.18)),key=gx+','+gy;
      if(!cells.has(key)||cells.get(key).z<z)cells.set(key,{x:gx*grid,y:gy*grid*1.18,z,p});
    }
    ctx.font=`${grid*1.55}px "SFMono-Regular",Consolas,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    for(const c of cells.values()){
      const shade=Math.max(0,Math.min(1,.20+c.z*.25+c.p.tone*.55));
      ctx.fillStyle=c.p.kind===3?'#c5352d':`rgba(24,24,27,${.3+shade*.65})`;
      const chars=c.p.kind===1?'|/x#':' .:+*ox%#@';
      ctx.fillText(chars[Math.min(chars.length-1,Math.floor(shade*chars.length))],c.x,c.y);
    }
  }
  function tick(now){frame=0;if(!visible||document.hidden||reduced.matches){last=0;return;}if(now-last>40){angle+=last?Math.min(now-last,100)*.00012:0;draw();last=now;}frame=requestAnimationFrame(tick);}
  const start=()=>{cancelAnimationFrame(frame);last=0;draw();if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);};
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();}).observe(canvas);
  document.addEventListener('visibilitychange',start);reduced.addEventListener('change',start);
})();
