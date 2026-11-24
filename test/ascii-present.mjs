import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
let worker,raf,logicalTop=0,paints=[],listeners={};
const field={matches:()=>true,dataset:{},prepend(){},classList:{add(){}},addEventListener(){},parentElement:null};
const surface={style:{},append(c){this.canvas=c},getBoundingClientRect:()=>({left:0,right:1000,top:logicalTop,bottom:logicalTop+1200,width:1000,height:1200})};
const canvas={style:{},dataset:{},setAttribute(){},getContext:()=>({transferFromImageBitmap(bitmap){paints.push({top:canvas.style.top,bitmap})}})};
const win={Worker:class{constructor(){worker=this}postMessage(){}},addEventListener(){}};
const sandbox={window:win,Worker:win.Worker,HTMLCanvasElement:{prototype:{transferControlToOffscreen(){}}},document:{hidden:false,body:{},querySelectorAll:()=>[field],createElement:n=>n==='canvas'?canvas:surface,addEventListener(){}},matchMedia:()=>({matches:false,addEventListener(){}}),getComputedStyle:()=>({color:'#fff',overflow:'visible'}),innerWidth:1000,innerHeight:600,devicePixelRatio:2,requestAnimationFrame:fn=>(raf=fn,1),cancelAnimationFrame(){},IntersectionObserver:class{observe(){}},ResizeObserver:class{observe(){}},addEventListener(name,fn){listeners[name]=fn;},Map};
vm.runInNewContext(fs.readFileSync(new URL('../ascii-controller.js',import.meta.url),'utf8'),sandbox);
raf(0);assert.equal(canvas.style.top,undefined);
const first={tile:{left:0,top:0,w:1024,h:728},bitmap:{id:1,close(){}}};worker.onmessage({data:{type:'image',id:0,...first}});worker.onmessage({data:{type:'done'}});raf(16);assert.equal(paints[0].top,'0px');
logicalTop=-300;listeners.scroll();raf(24);assert.equal(canvas.style.top,'0px'); // New geometry must not move the old pixels before replacement arrives.
worker.onmessage({data:{type:'image',id:0,tile:{...first.tile,top:224},bitmap:{id:2,close(){}}}});raf(32);
assert.equal(paints[1].top,'224px');assert.equal(paints[1].bitmap.id,2);
console.log('PASS tile origin and replacement bitmap are presented together; layout alone never moves old pixels.');
