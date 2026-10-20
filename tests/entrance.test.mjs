import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as content from '../dist/content.js';

test('cold load and Home re-entry share one entrance; interrupted Academy exits cannot win later',async()=>{
 const nodes=new Map(),timers=new Map(),frames=new Map();let now=0,id=0,loaded,planet;
 class Node{
  constructor(){this.attrs={};this.dataset={};this.events={};this.children=[];this.hidden=false;this.style={setProperty(){}};this.classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>this.classes.add(x)),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),contains:x=>this.classes.has(x),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x)};}
  addEventListener(n,fn){(this.events[n]??=[]).push(fn);}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k];}
  removeAttribute(k){delete this.attrs[k];}
  querySelector(s){return get(s);}
  querySelectorAll(s){return this===get('#navigation')&&['a','[data-nav]'].includes(s)?links:[];}
  replaceChildren(){this.children=[];}
  focus(){}
  decode(){return Promise.resolve();}
 }
 const get=s=>{if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s);};
 const links=Object.keys(content.sections).map(view=>{const n=new Node();n.dataset.nav=view;n.attrs.href='#'+view;return n;});
 const body=get('body');body.dataset.view='home';const html=get('html');html.classes.add('is-booting');
 const document={body,documentElement:html,readyState:'loading',fonts:{ready:Promise.resolve()},querySelector:get,addEventListener(){}};
 class FakePlanet{
  constructor(){planet=this;this.loaded=new Promise(resolve=>{loaded=()=>{this.ready=true;resolve();};});this.paused=false;this.reveals=0;this.departures=0;this.pointer={};}
  setState(state){this.state=state;}
  reveal(){this.reveals++;}
  depart(){this.departures++;}
  trackPointer(){}
  hint(){}
  setPaused(v){this.paused=v;}
 }
 class FakePointer{hide(){}}
 const location={hash:'#home'},windowEvents={};
 const window={addEventListener:(name,fn)=>{windowEvents[name]=fn;},scrollTo(){}};
 const context={...content,Planet:FakePlanet,PointerField:FakePointer,document,window,location,matchMedia:()=>({matches:false,addEventListener(){}}),performance:{now:()=>now},Date,URLSearchParams,requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key),setTimeout:(fn,delay)=>{timers.set(++id,{at:now+delay,fn});return id;},clearTimeout:key=>timers.delete(key)};
 const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 vm.runInNewContext(source,context);
 const frame=()=>{const queue=[...frames.values()];frames.clear();queue.forEach(fn=>fn(now));};
 const advance=ms=>{now+=ms;for(const [key,t]of [...timers])if(t.at<=now){timers.delete(key);t.fn();}frame();};
 const navigate=hash=>{location.hash=hash;windowEvents.hashchange();};
 assert(html.classes.has('is-booting'));assert.equal(planet.reveals,0);
 loaded();await new Promise(resolve=>setImmediate(resolve));frame();
 assert(!html.classes.has('is-booting'));assert.equal(planet.reveals,1);assert(get('#home-scene').classes.has('home-enter'));
 navigate('#academy');assert.equal(planet.departures,1);assert.equal(body.dataset.view,'home');
 advance(459);assert.equal(body.dataset.view,'home');advance(1);assert.equal(body.dataset.view,'academy');assert.equal(get('#globe-wrap').attrs['aria-hidden'],'true');
 navigate('#home');advance(110);assert.equal(body.dataset.view,'home');assert.equal(planet.reveals,2);
 navigate('#academy');advance(100);navigate('#home');advance(110);advance(500);
 assert.equal(body.dataset.view,'home');assert.equal(planet.reveals,3);
 navigate('#contact');advance(110);assert.equal(body.dataset.view,'contact');assert(get('#content').innerHTML.includes('Talk to ARCWORC.'));assert(!get('#content').innerHTML.includes('Talk to<br>'));
 // Clicking the active Home link also replays the same sequence exactly once.
 navigate('#home');advance(110);const count=planet.reveals;
 links[0].events.click[0]();advance(110);assert.equal(planet.reveals,count+1);
});
