import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sections,parseRoute,renderView,contactLink,escapeHTML} from '../dist/content.js';
import {project,angleDelta,regionSelected} from '../dist/globe.js';
const root=new URL('../dist/',import.meta.url);
test('all selected-view destinations render useful content and valid local assets',()=>{
 for(const view of Object.keys(sections).filter(v=>v!=='home')){
  const html=renderView(parseRoute('#'+view));assert.match(html,/<h1 /,view);
  for(const [,path]of html.matchAll(/src="([^"]+)"/g))assert(fs.existsSync(new URL(path,root)),path);
 }
 for(const route of ['roster/pa-ngu','presents/gungano-live','presents/soma','presents/pamoja','brands/gungano','brands/lynnk','brands/dogon','brands/academy'])assert.match(renderView(parseRoute('#'+route)),/back-link/);
});
test('booking and Academy handoffs retain context, including punctuation',()=>{
 for(const [topic,extra]of [['Artist booking & management',{artist:'PA NGU'}],['Academy programme interest',{course:'DJ Skills & Performance'}]]){
  const route=parseRoute(contactLink(topic,extra));assert.equal(route.view,'contact');assert.equal(route.params.get('topic'),topic);for(const [k,v]of Object.entries(extra))assert.equal(route.params.get(k),v);
 }
 assert.equal(parseRoute('#does-not-exist').view,'home');assert.equal(escapeHTML('<script>'),'&lt;script&gt;');
});
test('globe rotation points the selected coordinates toward the viewer',()=>{
 for(const [lon,lat]of [[20,2],[29.8,-17],[8,8],[38,0],[25,-27]]){
  const p=project(lon,lat,lon,lat);assert(Math.abs(p.x)<1e-10);assert(Math.abs(p.y)<1e-10);assert(Math.abs(p.z-1)<1e-10);
 }
 assert.equal(angleDelta(179,-179),2);assert.equal(angleDelta(-179,179),-2);
});
test('map includes all four regions and highlights only their intended scope',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('assets/world.json',root),'utf8'));
 assert(data.points.length>9000);
 for(const code of ['NGA','KEN','ZWE','ZAF']){const c=data.countries.find(c=>c.code===code);assert(c);assert(regionSelected(c,'network'));}
 assert(!regionSelected({code:'USA',continent:'North America'},'africa'));
 assert(!regionSelected({code:'USA',continent:'North America'},'network'));
 assert(regionSelected({code:'USA',continent:'North America'},'world'));
});

test('roster uses a solo portrait and a complete, extensible artist record',async()=>{
 const {artists,renderPins,services}=await import('../dist/content.js');
 const a=artists['pa-ngu'];assert(a.portrait.includes('portrait'));assert(a.pin.includes('performance-pin'));assert(fs.existsSync(new URL(a.pin,root)));assert(a.links.length>=10);assert(fs.existsSync(new URL(a.epk,root)));
 const html=renderView(parseRoute('#roster/pa-ngu'));assert.match(html,/Bookings & promoter information/);assert.match(html,/Download artist EPK/);assert(!html.includes('pa-ngu-live.webp'));
 const pins=renderPins(parseRoute('#presents/gungano-live'));assert.equal((pins.match(/class="globe-pin/g)||[]).length,4);assert(pins.includes('region=NGA'));assert(renderPins(parseRoute('#roster')).includes('PA NGU artist profile'));
 for(const s of services)assert(s.scope.length>=4&&s.result.length>50);
});

test('Presents separates planned event regions and stock atmosphere from artist imagery',async()=>{
 const {renderPins,events}=await import('../dist/content.js');
 for(const slug of Object.keys(events)){
  const route=parseRoute('#presents/'+slug+'?region=NGA');
  const html=renderView(route),pins=renderPins(route);
  assert(!/src="[^"]*pa-ngu/.test(html+pins),'Presents must use event imagery');
  assert.match(html,/Stock photography for inspiration/);
  assert.match(html,/Dates and venues will follow once confirmed/);
  assert.match(html,/Nigeria/);
  for(const [,path]of (html+pins).matchAll(/src="([^"]+)"/g))assert(fs.existsSync(new URL(path,root)),path);
 }
 assert.match(renderView(parseRoute('#presents/soma')),/do not provide or guarantee entry/);
});

test('Academy programmes open full detail before enquiry and preserve course context',async()=>{
 const {programmes,brands}=await import('../dist/content.js');
 const overview=renderView(parseRoute('#academy'));
 assert.equal(programmes.length,6);
 for(const p of programmes){
  assert(overview.includes('#academy/'+p.slug));
  const html=renderView(parseRoute('#academy/'+p.slug));
  assert.match(html,/What you can explore/);assert.match(html,/Put it into practice/);
  assert.match(html,/disabled>Download guide/);assert(!/download[^>]*href/.test(html));
  assert(html.includes(escapeHTML(contactLink('Academy programme interest',{course:p.name}))));
 }
 assert.match(renderView(parseRoute('#academy/music-production')),/FL Studio and Ableton Live/);
 assert.equal(brands.marketplace.external,'https://www.lynnk.pro');
 assert.match(brands.lynnk.copy,/record-label management/i);
});
