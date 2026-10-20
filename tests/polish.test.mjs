import test from 'node:test';
import assert from 'node:assert/strict';
import {Planet} from '../dist/globe.js';
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
 const pointer=Object.assign(Object.create(PointerField.prototype),{inside:false,motion:{matches:false},alpha:.005,last:0,raf:1,canvas:{style:{}}});
 pointer.frame(1000);assert.equal(pointer.raf,0);assert.equal(pointer.alpha,0);assert.equal(pointer.canvas.style.opacity,'0');
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
