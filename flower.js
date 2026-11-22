/* Original sampled 3D flower surfaces, lit by their normals and rasterized into ASCII. */
(() => {
 const canvas=document.querySelector('.ascii-flower');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const points=[];
 function add(x,y,z,light,kind=0){points.push({x,y,z,light,kind});}
 // Flower faces the viewer. Each petal has a raised rim, curled tip and central fold.
 for(let layer=0;layer<5;layer++){
  const count=layer<2?10:8,R=.31-layer*.045,base=layer*.032;
  for(let k=0;k<count;k++){
   const a=k*Math.PI*2/count+layer*.41;
   const surface=(u,v)=>{
    const r=.025+R*u;
    const w=R*.48*Math.pow(Math.sin(Math.PI*u),.65)*v;
    const z=base+.065*Math.sin(Math.PI*u)+.045*v*v*Math.sin(Math.PI*u)-.026*u*u+ .008*Math.cos(v*5)*u;
    return {x:Math.cos(a)*r-Math.sin(a)*w,y:Math.sin(a)*r+Math.cos(a)*w,z};
   };
   for(let u=.015;u<.995;u+=.012)for(let v=-.99;v<1;v+=.035){
    const p=surface(u,v),q=surface(u+.002,v),r=surface(u,v+.002);
    const ux=q.x-p.x,uy=q.y-p.y,uz=q.z-p.z,vx=r.x-p.x,vy=r.y-p.y,vz=r.z-p.z;
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    if(nz<0){nx=-nx;ny=-ny;nz=-nz;}const len=Math.hypot(nx,ny,nz)||1;
    const light=Math.max(0,(-nx*.45+ny*.55+nz*.7)/len);
    add(p.x,p.y,p.z,light,Math.abs(v)>.92?4:0);
   }
  }
 }
 for(let i=0;i<350;i++){const a=i*2.39996,r=.019*Math.sqrt(i/350);add(Math.cos(a)*r,Math.sin(a)*r,.20+Math.sqrt(.0013-r*r)*.5,.5,3);}
 let width=0,height=0,angle=0,visible=true,frame=0,last=0;
 const branch=[];
 // World coordinates follow a long diagonal stem, independent of the bloom rotation.
 const spine=t=>({x:.10+.65*t,y:.88-.57*t+.055*Math.sin(t*Math.PI),z:.025*Math.sin(t*6)});
 for(let t=0;t<=1;t+=.002){const p=spine(t);for(let j=0;j<6;j++){const a=j*Math.PI/3;branch.push({...p,x:p.x+.0025*Math.cos(a),y:p.y+.003*Math.sin(a),kind:1,light:.3+j*.1});}}
 for(const [t,side] of [[.24,-1],[.47,1],[.68,-1]]){
  const p=spine(t);
  for(let u=0;u<=1;u+=.009){const x=p.x+.13*u,y=p.y+side*.14*u-.04*u;
   branch.push({x,y,z:.025,kind:1,light:.6});
   for(let v=-1;v<=1;v+=.08){const w=.035*Math.sin(u*Math.PI);branch.push({x:x+v*w,y:y+v*w*.6,z:.035*Math.sin(u*Math.PI)*(1-v*v),kind:2,light:.25+.5*Math.abs(v)});}
  }
  for(let a=0;a<Math.PI*2;a+=.12)branch.push({x:p.x+.007*Math.cos(a),y:p.y+.007*Math.sin(a),z:.03,kind:1,light:.8});
 }
 function draw(){
  if(!width)return;ctx.clearRect(0,0,width,height);
  const mobile=width<700,grid=mobile?3.1:3.7,scale=Math.min(width*.53,height*.90),cells=new Map();
  const put=(x,y,z,light,kind)=>{const gx=Math.round(x/grid),gy=Math.round(y/(grid*1.22)),key=gx+gy*10000;const old=cells.get(key);if(!old||old.z<z)cells.set(key,{x:gx*grid,y:gy*grid*1.22,z,light,kind});};
  for(const p of branch)put(p.x*width,p.y*height,p.z,p.light,p.kind);
  // A slow oblique turn keeps the open flower visible rather than showing its underside.
  const turn=.38*Math.sin(angle),roll=-.28+.10*Math.sin(angle*.7),ca=Math.cos(turn),sa=Math.sin(turn);
  for(const p of points){let x=p.x*ca+p.z*sa,z=-p.x*sa+p.z*ca,y=p.y;const xx=x*Math.cos(roll)-y*Math.sin(roll);y=x*Math.sin(roll)+y*Math.cos(roll);x=xx;put(width*.75+x*scale,height*.33-y*scale,z+.2,p.light,p.kind);}
  ctx.font=`${grid*1.58}px "SFMono-Regular",Consolas,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
  for(const p of cells.values()){
   const density=Math.min(.98,Math.max(.08,1-p.light*.8));
   const chars=p.kind===1?'/:xX#':' .,:;irsXA253hMHGS#9B&@';
   ctx.fillStyle=p.kind===3?'#b72e28':`rgba(23,23,26,${p.kind===4?.8:.32+density*.63})`;
   ctx.fillText(chars[Math.floor(density*(chars.length-1))],p.x,p.y);
  }
 }
 const resize=()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);draw();};
 function tick(now){frame=0;if(!visible||document.hidden||reduced.matches){last=0;return;}if(now-last>50){angle+=last?Math.min(now-last,100)*.00018:0;draw();last=now;}frame=requestAnimationFrame(tick);}
 const start=()=>{cancelAnimationFrame(frame);last=0;draw();if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);};
 new ResizeObserver(resize).observe(canvas);new IntersectionObserver(e=>{visible=e[0].isIntersecting;start();}).observe(canvas);document.addEventListener('visibilitychange',start);reduced.addEventListener('change',start);
})();
