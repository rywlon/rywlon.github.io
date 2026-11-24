/* Batched WebGL2 glyphs: one instanced draw per visible field, crisp DPR atlas. */
function createAsciiGPU(canvas,chars,ink){
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true});
 if(!gl)return null;
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,`#version 300 es
 precision highp float;
 layout(location=0) in vec4 instance;
 layout(location=1) in vec2 corner;
 uniform vec2 size;
 uniform float count;
 out vec2 uv;out float opacity;
 void main(){

 vec2 pixel=instance.xy+corner*vec2(12.,14.);
 gl_Position=vec4(pixel.x/size.x*2.-1.,1.-pixel.y/size.y*2.,0.,1.);
 uv=vec2((instance.z+corner.x)/count,corner.y);opacity=instance.w;
 }`));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`#version 300 es
 precision highp float;
 uniform sampler2D atlas;uniform vec3 ink;
 in vec2 uv;in float opacity;out vec4 color;
 void main(){float a=texture(atlas,uv).a*opacity;color=vec4(ink*a,a);}`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 const buffer=gl.createBuffer(),texture=gl.createTexture();
 gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,4,gl.FLOAT,false,16,0);gl.vertexAttribDivisor(0,1);
 const corners=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,corners);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,1,1,0,0,1,1,0,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,0,0);
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const colorCanvas=new OffscreenCanvas(1,1),cc=colorCanvas.getContext('2d');cc.fillStyle=ink;cc.fillRect(0,0,1,1);const rgb=cc.getImageData(0,0,1,1).data;
 gl.uniform3f(gl.getUniformLocation(program,'ink'),rgb[0]/255,rgb[1]/255,rgb[2]/255);gl.uniform1f(gl.getUniformLocation(program,'count'),chars.length);gl.uniform1i(gl.getUniformLocation(program,'atlas'),0);
 let data=new Float32Array(4096),used=0,ratio=0,capacity=0;
 return {
  resize(w,h,dpr){
   gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(gl.getUniformLocation(program,'size'),w,h);
   if(ratio!==dpr){ratio=dpr;const scale=Math.max(2,Math.ceil(dpr));const a=new OffscreenCanvas(chars.length*12*scale,14*scale),c=a.getContext('2d');c.scale(scale,scale);c.font='700 10px SFMono-Regular, Consolas, monospace';c.fillStyle='#fff';for(let i=1;i<chars.length;i++)c.fillText(chars[i],i*12+1,11);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,a);}
  },
  setInk(ink){cc.clearRect(0,0,1,1);cc.fillStyle=ink;cc.fillRect(0,0,1,1);const c=cc.getImageData(0,0,1,1).data;gl.uniform3f(gl.getUniformLocation(program,'ink'),c[0]/255,c[1]/255,c[2]/255);},
  inspect(){return {error:gl.getError(),lost:gl.isContextLost(),used};},
  begin(){used=0;},
  glyph(x,y,index,alpha){if(used+4>data.length){const next=new Float32Array(data.length*2);next.set(data);data=next;}data[used++]=x-1;data[used++]=y-11;data[used++]=index;data[used++]=alpha;},
  end(){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);if(!used)return;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);if(capacity<data.byteLength){capacity=data.byteLength;gl.bufferData(gl.ARRAY_BUFFER,capacity,gl.DYNAMIC_DRAW);}gl.bufferSubData(gl.ARRAY_BUFFER,0,data.subarray(0,used));gl.drawArraysInstanced(gl.TRIANGLES,0,6,used/4);}
 };
}
