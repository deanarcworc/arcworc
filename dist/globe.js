const RAD=Math.PI/180;
export function project(lon,lat,centerLon=20,centerLat=2){const a=lat*RAD,b=centerLat*RAD,d=(lon-centerLon)*RAD;const ca=Math.cos(a);return {x:ca*Math.sin(d),y:Math.cos(b)*Math.sin(a)-Math.sin(b)*ca*Math.cos(d),z:Math.sin(b)*Math.sin(a)+Math.cos(b)*ca*Math.cos(d)};}
export function angleDelta(a,b){return ((b-a+540)%360)-180;}
export function regionSelected(country,region){return region==='world'||(region==='africa'&&country.continent==='Africa')||(region==='network'&&['NGA','KEN','ZWE','ZAF'].includes(country.code))||country.code===region;}
export function morphPoint(x,y,index,progress,cx,cy,r){
 const t=Math.max(0,Math.min(1,progress)),ease=t*t*t*(t*(t*6-15)+10);
 const angle=index*2.399963+(1-ease)*1.8;
 const spread=r*(.45+(index%29)/29*.85),sx=cx+Math.cos(angle)*spread,sy=cy+Math.sin(angle)*spread*.28;
 return {x:sx+(x-sx)*ease,y:sy+(y-sy)*ease};
}
export function contactPoint(x,y,index,progress,cx,cy,r){
 const scatter=(1-Math.max(0,Math.min(1,progress)))**3,angle=index*2.399963;
 return {x:x+Math.cos(angle)*r*.24*scatter,y:y+Math.sin(angle)*r*.24*scatter};
}
export class Planet{
 constructor(canvas,{reduced=false}={}){
  this.loaded=new Promise(resolve=>{this.resolveLoaded=resolve;});
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.reduced=reduced;this.paused=reduced;this.active=true;this.visible=true;this.region='africa';this.lon=20;this.lat=2;this.targetLon=20;this.targetLat=2;this.pointer={x:-999,y:-999,active:false};this.drag=null;this.tick=0;this.hoverBoost=0;this.assembly=0;this.dirty=true;this.last=0;this.lastRender=0;this.points=[];this.countries=[];this.emphasis=[];this.dpr=Math.min(window.devicePixelRatio||1,1.7);
  if(!this.ctx){this.fallback();return;}
  if('ResizeObserver'in window){this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);}else window.addEventListener('resize',()=>this.resize());
  this.resize();this.bind();this.load();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
 }
 async load(){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);try{const response=await fetch('assets/world.json',{signal:controller.signal});if(!response.ok)throw Error('Map unavailable');const data=await response.json();this.countries=data.countries;this.emphasis=this.countries.map(c=>Number(regionSelected(c,this.region)));this.points=data.points.map(([lon,lat,country])=>({sinLon:Math.sin(lon*RAD),cosLon:Math.cos(lon*RAD),sinLat:Math.sin(lat*RAD),cosLat:Math.cos(lat*RAD),country}));this.dirty=true;this.ready=true;if(this.ctx&&this.active)this.draw();this.resolveLoaded?.();this.onReady?.();}catch{this.fallback();}finally{clearTimeout(timeout);}}
 fallback(){this.failed=true;this.active=false;if(this.ctx)this.ctx.clearRect(0,0,this.width*this.dpr,this.height*this.dpr);this.canvas.style.background="url('assets/globe-africa.svg') center/contain no-repeat";if(!this.ctx)this.canvas.setAttribute('aria-label','A red globe facing Africa.');this.resolveLoaded?.();this.onReady?.();}
 resize(){const rect=this.canvas.getBoundingClientRect();this.width=rect.width||600;this.height=rect.height||600;
  // CSS resizing must not repeatedly erase/reallocate the drawing buffer.
  if(!this.bufferReady){const side=Math.round(Math.max(this.width,640)*this.dpr);this.canvas.width=side;this.canvas.height=side;this.bufferReady=true;}this.dirty=true;}
 trackPointer(e){const bounds=this.canvas.getBoundingClientRect();this.pointer.x=e.clientX-bounds.left;this.pointer.y=e.clientY-bounds.top;const dx=this.pointer.x-this.width/2,dy=this.pointer.y-this.height*.48;this.pointer.active=dx*dx+dy*dy<(Math.min(this.width,this.height)*.365)**2;this.dirty=true;}
 bind(){
  this.canvas.addEventListener('pointermove',e=>{const r=this.canvas.getBoundingClientRect();this.pointer.x=e.clientX-r.left;this.pointer.y=e.clientY-r.top;const dx=this.pointer.x-this.width/2,dy=this.pointer.y-this.height/2;this.pointer.active=dx*dx+dy*dy<(this.width*.37)**2;this.canvas.style.cursor=this.pointer.active?(this.drag?'grabbing':'grab'):'default';if(this.drag){this.targetLon=this.drag.lon-(e.clientX-this.drag.x)*.3;this.targetLat=Math.max(-55,Math.min(55,this.drag.lat+(e.clientY-this.drag.y)*.21));}this.dirty=true;});
  this.canvas.addEventListener('pointerleave',()=>{this.pointer.active=false;this.dirty=true;});
  this.canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||!this.pointer.active)return;this.drag={x:e.clientX,y:e.clientY,lon:this.targetLon,lat:this.targetLat};this.canvas.classList.add('dragging');this.canvas.setPointerCapture(e.pointerId);});
  const release=e=>{this.drag=null;this.canvas.classList.remove('dragging');if(this.canvas.hasPointerCapture?.(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);};
  this.canvas.addEventListener('pointerup',release);this.canvas.addEventListener('pointercancel',release);
  document.addEventListener('visibilitychange',()=>{this.visible=!document.hidden;this.dirty=true;});
 }
 setState(state){this.departing=false;this.region=state.region;this.targetLon=state.lon;this.targetLat=state.lat;this.active=!this.failed&&state.title!=='Academy';if(this.reduced||this.paused){this.lon=this.targetLon;this.lat=this.targetLat;}this.canvas.setAttribute('aria-label',`Red globe: ${state.place}. Hover reveals responsive particles; mouse dragging rotates the globe.`);this.dirty=true;}
 reveal(kind='home'){this.transitionKind=kind;this.duration=kind==='contact'?.42:.9;this.assembly=this.reduced||this.paused?1:0;this.dirty=true;if(this.ready&&this.active)this.draw();}
 depart(){this.departing=true;this.dirty=true;}
 setPaused(value){this.paused=value;if(value){this.lon=this.targetLon;this.lat=this.targetLat;}this.dirty=true;}
 setReduced(value){this.reduced=value;this.setPaused(value);}
 hint(value){this.hoverBoost=value?1:0;this.dirty=true;}
 frame(time){this.raf=requestAnimationFrame(this.frame);const dt=this.last?Math.min((time-this.last)/1000,.05):.016;this.last=time;if(!this.visible||!this.active)return;if(time-this.lastRender<(this.drag||this.pointer?.active||this.assembly<1?16:30))return;const elapsed=this.lastRender?Math.min((time-this.lastRender)/1000,.08):.033;const running=!this.paused&&!this.reduced;if(!running&&!this.dirty)return;this.lastRender=time;
  if(running){this.tick+=elapsed;const ease=1-Math.exp(-elapsed*18);this.lon+=angleDelta(this.lon,this.targetLon)*ease;this.lat+=(this.targetLat-this.lat)*ease;}
  else{this.lon=this.targetLon;this.lat=this.targetLat;}
  let morphing=false;this.emphasis=this.countries.map((c,i)=>{const target=Number(regionSelected(c,this.region)),current=this.emphasis[i]??target;const value=this.reduced||this.paused?target:current+(target-current)*(1-Math.exp(-elapsed*13));if(Math.abs(target-value)>.002)morphing=true;return Math.abs(target-value)<.002?target:value;});
  this.assembly=this.departing?Math.max(0,this.assembly-elapsed/.46):Math.min(1,this.assembly+elapsed/(this.duration||.9));this.draw();this.dirty=this.assembly<1||morphing;
 }
 draw(){
  const ctx=this.ctx,w=this.width,h=this.height,cx=w*.5,cy=h*.48,r=Math.min(w,h)*.365;
  ctx.setTransform(this.canvas.width/w,0,0,this.canvas.height/h,0,0);ctx.clearRect(0,0,w,h);
  const formed=this.reduced||this.paused?1:this.assembly;const material=this.transitionKind==='contact'?1:Math.max(0,Math.min(1,(formed-.2)/.65));ctx.globalAlpha=material;
  const moving=!this.paused&&!this.reduced;const offset=moving?Math.sin(this.tick*.58)*19:0;const pointerTilt=moving&&this.pointer.active&&!this.drag?(this.pointer.x-cx)/w*3.2:0;
  const lon=this.lon+offset+pointerTilt,lat=this.lat+(moving?Math.sin(this.tick*.5)*1.7:0);
  const paintProjection=(lo,la)=>{const p=project(lo,la,lon,lat);return {x:cx+p.x*r,y:cy-p.y*r,z:p.z};};
  // Sparse orbital paths are drawn behind the globe; the sphere naturally masks them.
  const orbits=[{rx:r*1.34,ry:r*.37,angle:-.34},{rx:r*1.22,ry:r*.55,angle:.39}];
  orbits.forEach((o,i)=>{ctx.save();ctx.translate(cx,cy);ctx.rotate(o.angle);ctx.beginPath();ctx.ellipse(0,0,o.rx,o.ry,0,0,Math.PI*2);ctx.strokeStyle=`rgba(245,243,239,${.36+this.hoverBoost*.18})`;ctx.lineWidth=.65;ctx.stroke();const t=this.tick*(i?-.52:.44)+i*2.2;ctx.beginPath();ctx.arc(Math.cos(t)*o.rx,Math.sin(t)*o.ry,2,0,Math.PI*2);ctx.fillStyle='#f5f3ef';ctx.fill();ctx.restore();});
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  const gradient=ctx.createRadialGradient(cx-r*.42,cy-r*.48,r*.08,cx+r*.15,cy+r*.25,r*1.35);gradient.addColorStop(0,'#ff5a42');gradient.addColorStop(.42,'#fa3827');gradient.addColorStop(.78,'#c32618');gradient.addColorStop(1,'#5c110b');ctx.fillStyle=gradient;ctx.fillRect(cx-r,cy-r,r*2,r*2);
  // A fine geodesic grid provides surface structure without obscuring the land map.
  ctx.strokeStyle='rgba(38,38,38,.14)';ctx.lineWidth=.55;
  const line=coords=>{ctx.beginPath();let pen=false;for(const [lo,la]of coords){const p=paintProjection(lo,la);if(p.z>0){if(!pen)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);pen=true;}else pen=false;}ctx.stroke();};
  for(let la=-60;la<=60;la+=30){const coords=[];for(let lo=-180;lo<=180;lo+=4)coords.push([lo,la]);line(coords);}
  for(let lo=-180;lo<180;lo+=30){const coords=[];for(let la=-88;la<=88;la+=3)coords.push([lo,la]);line(coords);}
  const centerLon=lon*RAD,centerLat=lat*RAD,sl=Math.sin(centerLon),cl=Math.cos(centerLon),sa=Math.sin(centerLat),ca=Math.cos(centerLat);
  ctx.restore();ctx.globalAlpha=(.25+.75*formed)*(this.departing?formed:1);
  const dots=Array.from({length:17},()=>[]);
  for(const [index,p] of this.points.entries()){const deltaCos=p.cosLon*cl+p.sinLon*sl;const z=sa*p.sinLat+ca*p.cosLat*deltaCos;if(z<=.015)continue;let x=cx+p.cosLat*(p.sinLon*cl-p.cosLon*sl)*r;let y=cy-(ca*p.sinLat-sa*p.cosLat*deltaCos)*r;
   const bucket=Math.round((this.emphasis[p.country]??0)*16);
   const morph=this.transitionKind==='contact'?contactPoint(x,y,index,formed,cx,cy,r):morphPoint(x,y,index,formed,cx,cy,r);x=morph.x;y=morph.y;
   dots[bucket].push([x,y,Math.max(.45,Math.min(w,h)*.0024*(.5+.5*z))]);}
  dots.forEach((points,i)=>{const t=i/16;ctx.beginPath();for(const [x,y,size]of points){ctx.moveTo(x+size,y);ctx.arc(x,y,size,0,Math.PI*2);}ctx.fillStyle=`rgba(${Math.round(38+207*t)},${Math.round(38+205*t)},${Math.round(38+201*t)},${.88-.11*t})`;ctx.fill();});
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.globalAlpha=material;
  // Country outlines make small selected countries such as Zimbabwe legible.
  if(['ZWE','ZAF','NGA','KEN','network'].includes(this.region)){ctx.strokeStyle='rgba(245,243,239,.8)';ctx.lineWidth=.75;for(const country of this.countries){if(regionSelected(country,this.region))country.rings.forEach(line);}}
  const shade=ctx.createRadialGradient(cx-r*.2,cy-r*.3,r*.6,cx,cy,r*1.08);shade.addColorStop(0,'rgba(38,38,38,0)');shade.addColorStop(1,'rgba(38,38,38,.28)');ctx.fillStyle=shade;ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.restore();
  ctx.globalAlpha=material;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='rgba(250,56,39,.75)';ctx.lineWidth=.8;ctx.stroke();
  // One short foreground orbit segment links the world to its surrounding space.
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.34);ctx.beginPath();ctx.ellipse(0,0,r*1.34,r*.37,0,.15,1.3);ctx.strokeStyle='rgba(245,243,239,.5)';ctx.lineWidth=.6;ctx.stroke();ctx.restore();
  ctx.globalAlpha=1;
  if(this.onProject)this.onProject(paintProjection,{width:w,height:h,radius:r});
 }
}
