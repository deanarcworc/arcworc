import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {routeUrl,routeFromPath,cleanLinks,pageMeta} from '../dist/routes.js';
import {parseRoute,contactLink} from '../dist/content.js';
import {pinOrder,pinExitDuration} from '../dist/pin-motion.js';
const dist=new URL('../dist/',import.meta.url);

test('pin choreography uses the requested geographic order and a faster exit',()=>{
 assert.deepEqual(['NGA','KEN','ZWE','ZAF'].sort((a,b)=>pinOrder(a)-pinOrder(b)),['ZAF','ZWE','KEN','NGA']);
 assert.equal(pinExitDuration(0),0);assert.equal(pinExitDuration(1),130);assert.equal(pinExitDuration(4),235);assert(pinExitDuration(4)<320);
});
test('clean URLs preserve detail and enquiry context, including old hash links',()=>{
 for(const hash of ['#home','#roster/pa-ngu','#presents/gungano-live?region=ZWE','#academy/music-production',contactLink('Artist booking & management',{artist:'PA NGU'})]){
  const original=parseRoute(hash),url=new URL(routeUrl(original),'https://arcworc.com'),roundTrip=routeFromPath(url.pathname,url.search);
  assert.equal(roundTrip.view,original.view);assert.equal(roundTrip.detail,original.detail);assert.equal(roundTrip.params.toString(),original.params.toString());
 }
 assert.equal(cleanLinks('<a href="#roster/pa-ngu">Profile</a>'),'<a href="/artists/pa-ngu">Profile</a>');
 assert.equal(pageMeta(parseRoute('#roster/pa-ngu')).canonical,'https://arcworc.com/artists/pa-ngu');
});
test('all sitemap pages contain their content and crawlable links without redirect stubs',()=>{
 const xml=fs.readFileSync(new URL('sitemap.xml',dist),'utf8'),urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]));
 assert.equal(urls.length,23);assert.equal(new Set(urls.map(u=>u.href)).size,23);
 for(const url of urls){
  const file=new URL(url.pathname==='/'?'index.html':url.pathname.slice(1)+'.html',dist),html=fs.readFileSync(file,'utf8');
  assert(html.includes('<link rel="canonical" href="'+url.href+'">'),url.href);assert(html.includes('<h1'),url.href);assert(!html.includes('http-equiv="refresh"'));assert(!html.includes('content="noindex"'));
  assert(html.includes('<base href="/">'));assert(html.includes('application/ld+json'));assert(html.includes('og:image'));
  for(const [,href]of html.matchAll(/href="(\/[^"]*)"/g)){
   const target=new URL(href.replaceAll('&amp;','&'),'https://arcworc.com'),p=target.pathname;
   if(p==='/')continue;
   assert(fs.existsSync(new URL(p.slice(1),dist))||fs.existsSync(new URL(p.slice(1)+'.html',dist)),href+' linked from '+url.href);
  }
 }
 const about=fs.readFileSync(new URL('about.html',dist),'utf8');assert(about.includes('Artist representation connects career direction'));
 assert(fs.readFileSync(new URL('robots.txt',dist),'utf8').includes('Sitemap: https://arcworc.com/sitemap.xml'));
});
test('smaller map retains every dot and country with only sub-pixel precision changes',()=>{
 const original=JSON.parse(fs.readFileSync(new URL('assets/world.json',dist))),optimized=JSON.parse(fs.readFileSync(new URL('assets/world-render-v1.json',dist)));
 assert.equal(optimized.points.length,original.points.length);assert.equal(optimized.countries.length,original.countries.length);
 original.points.forEach((p,i)=>{const q=optimized.points[i];assert.equal(q[2],p[2]);assert(Math.abs(q[0]-p[0])<=.005001);assert(Math.abs(q[1]-p[1])<=.005001);});
});
