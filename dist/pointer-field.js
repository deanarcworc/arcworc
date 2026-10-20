// Home-only interaction, clipped to the actual wordmark glyphs and globe disc.
// The canvas has no opaque backdrop and never paints into the surrounding page.
export function particleColour(r,g,b,a=255){
 return a>100&&r>g*1.35&&r>b*1.35?'#f5f3ef':'#fa3827';
}
export class PointerField{
 constructor(stage,planet,motion){
  this.stage=stage;this.planet=planet;this.motion=motion;this.size=220;
  this.canvas=document.createElement('canvas');this.canvas.className='pointer-field';this.canvas.setAttribute('aria-hidden','true');
  this.canvas.width=this.canvas.height=this.size;this.ctx=this.canvas.getContext('2d');
  this.probe=document.createElement('canvas');this.probe.width=this.probe.height=this.size;this.sample=this.probe.getContext('2d',{willReadFrequently:true});
  if(!this.ctx||!this.sample)return;
  stage.append(this.canvas);this.x=this.y=this.tx=this.ty=0;this.alpha=0;this.inside=false;this.raf=0;this.time=0;this.last=0;
  stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||motion.matches||document.body.dataset.view!=='home')return;const r=stage.getBoundingClientRect();this.tx=e.clientX-r.left;this.ty=e.clientY-r.top;if(!this.inside&&this.alpha===0){this.x=this.tx;this.y=this.ty;}this.inside=true;this.start();},{passive:true});
  stage.addEventListener('pointerleave',()=>this.hide());
  motion.addEventListener('change',()=>{this.inside=false;this.start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.inside=false;cancelAnimationFrame(this.raf);this.raf=0;this.alpha=0;this.canvas.style.opacity='0';}else this.last=0;});
 }
 hide(){cancelAnimationFrame(this.raf);this.raf=0;this.inside=false;this.alpha=0;this.canvas.style.opacity='0';this.stage.querySelector('.hero-wordmark')?.classList.remove('is-active');}
 start(){if(!this.raf&&!document.hidden){this.last=0;this.raf=requestAnimationFrame(t=>this.frame(t));}}
 frame(now){
  if(document.body.dataset.view!=='home'||this.motion.matches){this.hide();return;}
  const dt=this.last?Math.min((now-this.last)/1000,.05):1/60;
  this.last=now;this.raf=0;const visible=this.inside&&!this.motion.matches;
  this.alpha+=(Number(visible)-this.alpha)*(1-Math.exp(-dt*16));
  if(!visible&&this.alpha<.01){this.alpha=0;this.canvas.style.opacity='0';return;}
  const ease=1-Math.exp(-dt*28);this.x+=(this.tx-this.x)*ease;this.y+=(this.ty-this.y)*ease;
  if(!this.planet.paused)this.time+=dt;
  const half=this.size/2,left=this.x-half,top=this.y-half;
  this.canvas.style.transform=`translate3d(${left}px,${top}px,0)`;this.canvas.style.opacity=String(this.alpha);
  const origin=this.stage.getBoundingClientRect(),sample=this.sample;sample.clearRect(0,0,this.size,this.size);
  const paint=source=>{const r=source.getBoundingClientRect();if(r.width&&r.height)sample.drawImage(source,r.left-origin.left-left,r.top-origin.top-top,r.width,r.height);};
  if(this.planet.ready){
   const r=this.planet.canvas.getBoundingClientRect(),cx=r.left-origin.left-left+r.width*.5,cy=r.top-origin.top-top+r.height*.48;
   sample.save();sample.beginPath();sample.arc(cx,cy,Math.min(r.width,r.height)*.365,0,Math.PI*2);sample.clip();paint(this.planet.canvas);sample.restore();
  }
  let backdrop;try{backdrop=sample.getImageData(0,0,this.size,this.size).data;}catch{backdrop=null;}
  const wordmark=this.stage.querySelector('.wordmark-fill');
  if(wordmark?.complete&&wordmark.naturalWidth){
   paint(wordmark);const r=wordmark.getBoundingClientRect(),mark=wordmark.parentElement;
   mark.style.setProperty('--mx',`${this.x+origin.left-r.left}px`);mark.style.setProperty('--my',`${this.y+origin.top-r.top}px`);mark.classList.add('is-active');
  }
  let pixels;try{pixels=sample.getImageData(0,0,this.size,this.size).data;}catch{pixels=null;}
  const ctx=this.ctx;ctx.clearRect(0,0,this.size,this.size);
  // The soft boundary is made of dots, never an opaque disc or a ring.
  for(let row=-16;row<=16;row++)for(let col=-16;col<=16;col++){
   const dx=col*6,dy=row*6,distance=Math.hypot(dx,dy);if(distance>94)continue;
   const edge=Math.max(0,1-distance/98),phase=this.time*2.4+col*.65+row*.43;
   const x=half+dx+Math.sin(phase)*2.6*edge,y=half+dy+Math.cos(phase*.85)*2.6*edge;
   const i=(Math.round(y)*this.size+Math.round(x))*4;
   if(!pixels||pixels[i+3]<30)continue;
   ctx.fillStyle=backdrop?particleColour(backdrop[i],backdrop[i+1],backdrop[i+2],backdrop[i+3]):'#fa3827';
   ctx.globalAlpha=Math.min(.9,edge*2)*(.6+.4*Math.sin(phase)**2);
   const size=.7+edge*(.5+Math.sin(phase)*.15);
   ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-in';ctx.drawImage(this.probe,0,0);ctx.globalCompositeOperation='source-over';this.raf=requestAnimationFrame(t=>this.frame(t));
 }
}
