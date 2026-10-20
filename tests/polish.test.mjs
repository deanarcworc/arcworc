import test from 'node:test';
import assert from 'node:assert/strict';
import {Planet,morphPoint} from '../dist/globe.js';
import {particleColour,PointerField} from '../dist/pointer-field.js';
import {brands,renderView,parseRoute} from '../dist/content.js';

test('hover particles stay red on cream/charcoal and white over red, with no opaque disc',()=>{
 assert.equal(particleColour(250,56,39),'#f5f3ef');
 assert.equal(particleColour(125,29,18),'#f5f3ef');
 assert.equal(particleColour(245,243,239),'#fa3827');
 assert.equal(particleColour(38,38,38),'#fa3827');
 assert.equal(particleColour(250,56,39,0),'#fa3827');
});

test('Services highlights morph in both directions, settling quickly without a one-frame jump',()=>{
 const previous=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=()=>1;
 try{
  const planet=Object.assign(Object.create(Planet.prototype),{visible:true,active:true,last:0,lastRender:0,paused:false,reduced:false,dirty:true,tick:0,lon:20,lat:2,targetLon:20,targetLat:2,assembly:1,region:'world',countries:[{code:'ZWE',continent:'Africa'},{code:'USA',continent:'North America'}],emphasis:[1,0],draw(){}});
  planet.frame(1000);assert(planet.emphasis[1]>0&&planet.emphasis[1]<.6);
  for(let t=1034;t<1400;t+=34)planet.frame(t);
  assert(planet.emphasis[1]>.98);
  planet.region='africa';planet.frame(1408);assert(planet.emphasis[1]>.4&&planet.emphasis[1]<.98);
  for(let t=1442;t<1800;t+=34)planet.frame(t);
  assert(planet.emphasis[1]<.02);assert.equal(planet.emphasis[0],1);
  planet.reduced=true;planet.region='world';planet.dirty=true;planet.frame(1850);assert.equal(planet.emphasis[1],1);
 }finally{globalThis.requestAnimationFrame=previous;}
});

test('leaving the stage stops the hover animation after its short fade',()=>{
 const previous=globalThis.document;globalThis.document={body:{dataset:{view:'home'}}};
 try{const pointer=Object.assign(Object.create(PointerField.prototype),{inside:false,motion:{matches:false},alpha:.005,last:0,raf:1,canvas:{style:{}}});
 pointer.frame(1000);assert.equal(pointer.raf,0);assert.equal(pointer.alpha,0);assert.equal(pointer.canvas.style.opacity,'0');}finally{globalThis.document=previous;}
});

test('every brand has detail and a contextual next step, with Academy enquiry on its overview',()=>{
 const overview=renderView(parseRoute('#brands'));
 for(const [slug,brand]of Object.entries(brands)){
  assert(overview.includes(brand.copy));assert(overview.includes('#brands/'+slug));
  const detail=renderView(parseRoute('#brands/'+slug));
  assert(detail.includes(brand.more));assert(detail.includes('brand='+encodeURIComponent(brand.name).replaceAll('%20','+')));
 }
 const academy=renderView(parseRoute('#brands/academy'));
 assert(academy.includes('href="#academy"'));assert(academy.includes('Enquire about learning'));
 assert(renderView(parseRoute('#academy')).includes('Enquire about the Academy'));
});


test('the hover field stops immediately on every non-Home route, including interrupted transitions',()=>{
 const previousDocument=globalThis.document,previousCancel=globalThis.cancelAnimationFrame;
 globalThis.cancelAnimationFrame=()=>{};
 try{for(const view of ['about','roster','services','brands','academy','contact']){
  globalThis.document={body:{dataset:{view}}};let removed=false;
  const pointer=Object.assign(Object.create(PointerField.prototype),{inside:true,motion:{matches:false},alpha:1,raf:123,canvas:{style:{}},stage:{querySelector:()=>({classList:{remove:()=>removed=true}})}});
  pointer.frame(1000);assert.equal(pointer.alpha,0);assert.equal(pointer.raf,0);assert.equal(pointer.canvas.style.opacity,'0');assert(removed);
 }}finally{globalThis.document=previousDocument;globalThis.cancelAnimationFrame=previousCancel;}
});

test('the entrance changes dot geometry from orbital ribbons into exact map positions',()=>{
 for(const [x,y,i]of [[210,180,12],[95,240,98],[350,320,409]]){
  const start=morphPoint(x,y,i,0,220,220,150),mid=morphPoint(x,y,i,.8,220,220,150),end=morphPoint(x,y,i,1,220,220,150);
  assert(Math.hypot(start.x-x,start.y-y)>1);assert(Math.hypot(mid.x-x,mid.y-y)<Math.hypot(start.x-x,start.y-y));
  assert(Math.abs(end.x-x)<1e-10);assert(Math.abs(end.y-y)<1e-10);
 }
});

test('particle drawing samples the artwork alpha and clips the final dots to it',()=>{
 const previousDocument=globalThis.document,previousRaf=globalThis.requestAnimationFrame;
 globalThis.document={body:{dataset:{view:'home'}}};globalThis.requestAnimationFrame=()=>1;
 try{
  const pixels=new Uint8ClampedArray(220*220*4);for(let y=95;y<125;y++)for(let x=95;x<125;x++){const i=(y*220+x)*4;pixels[i]=250;pixels[i+1]=56;pixels[i+2]=39;pixels[i+3]=255;}
  const arcs=[],ops=[];const ctx={clearRect(){},beginPath(){},arc(x,y,r){arcs.push({x,y,r});},fill(){},drawImage(){ops.push(this.globalCompositeOperation);}};
  const pointer=Object.assign(Object.create(PointerField.prototype),{stage:{getBoundingClientRect:()=>({left:0,top:0}),querySelector:()=>null},planet:{ready:false,paused:true},motion:{matches:false},size:220,x:110,y:110,tx:110,ty:110,alpha:1,inside:true,last:0,time:0,canvas:{style:{}},ctx,probe:{},sample:{clearRect(){},getImageData:()=>({data:pixels})}});
  pointer.frame(1000);assert(arcs.length>0);assert(arcs.every(p=>p.x>=94.5&&p.x<=125&&p.y>=94.5&&p.y<=125));assert(arcs.every(p=>p.r<1.4));assert.deepEqual(ops,['destination-in']);assert.equal(ctx.globalCompositeOperation,'source-over');
 }finally{globalThis.document=previousDocument;globalThis.requestAnimationFrame=previousRaf;}
});
