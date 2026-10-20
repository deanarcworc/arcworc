import {routeUrl,routeFromPath,knownPath,cleanLinks,pageMeta} from './routes.js?v=20261020-6';
import {pinOrder,pinExitDuration} from './pin-motion.js?v=20261020-6';
import {decodeWordmark,decodedEdge} from './wordmark-decode.js?v=20261020-6';
import {Planet} from './globe.js?v=20261020-6';
import {PointerField} from './pointer-field.js?v=20261020-6';
import {sections,network,parseRoute,renderView,renderPins,artists} from './content.js?v=20261020-6';
const $=s=>document.querySelector(s);
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
const mobilePinQuery=matchMedia('(max-width:900px)');
$('#globe-wrap').classList.add('arriving');
const planet=new Planet($('#globe'),{reduced:motionQuery.matches});
const pointerField=new PointerField($('#stage'),planet,motionQuery);
$('#globe-wrap').addEventListener('animationend',e=>{if(e.animationName==='planet-reveal')e.currentTarget.classList.remove('launching','reappearing');});
$('#stage').addEventListener('pointermove',e=>{if(e.pointerType!=='touch')planet.trackPointer(e);},{passive:true});
$('#stage').addEventListener('pointerleave',()=>{planet.pointer.active=false;planet.dirty=true;});
function revealPlanet(kind='home'){
 const wrap=$('#globe-wrap');wrap.classList.remove('arriving','launching','reappearing');
 if(motionQuery.matches||document.body.dataset.view==='academy')return;
 planet.reveal(kind);void wrap.offsetWidth;wrap.classList.add('launching');
}
// One entrance sequence owns map, type and interface timing, including cold loads.
let booted=false,morphFrame=0;
let route=location.hash?parseRoute(location.hash):routeFromPath(location.pathname,location.search),renderToken=0,renderTimer=0;let pinNodes=[];
const wordmarkImage=$('.wordmark-fill');
const wordmarkReady=typeof wordmarkImage.decode==='function'?wordmarkImage.decode().catch(()=>{}):Promise.resolve();
function stopWordmarkMorph(){cancelAnimationFrame(morphFrame);morphFrame=0;$('#interactive-wordmark').classList.remove('is-decoding','wordmark-enter');navigation?.querySelectorAll('a').forEach((link,i)=>{link.querySelector('.nav-number').textContent=String(i).padStart(2,'0');});}
function revealWordmarkEntry(token){
 if(token!==renderToken)return;
 stopWordmarkMorph();const mark=$('#interactive-wordmark');mark.classList.remove('wordmark-pending','wordmark-enter');
 if(motionQuery.matches)return;
 void mark.offsetWidth;mark.classList.add('wordmark-enter');
 mark.classList.add('is-decoding');mark.style.setProperty('--decoded-edge','0%');
 const start=performance.now(),numbers=Array.from(navigation.querySelectorAll('a'),link=>link.querySelector('.nav-number')),glyphs=mark.querySelectorAll('[data-decode-letter]');
 const frame=now=>{
  if(token!==renderToken)return;
  const elapsed=now-start,states=decodeWordmark(elapsed),t=Math.min(1,elapsed/650),ease=1-(1-t)**3;
  numbers.forEach((node,i)=>node.textContent=String(Math.round(i*ease)).padStart(2,'0'));
  glyphs.forEach((node,i)=>{node.textContent=states[i].settled?'':states[i].letter;});
  mark.style.setProperty('--decoded-edge',decodedEdge(states)+'%');
  if(states.every(s=>s.settled)){mark.classList.remove('is-decoding','wordmark-enter');morphFrame=0;}else morphFrame=requestAnimationFrame(frame);
 };
 morphFrame=requestAnimationFrame(frame);
}
const warmedImages=new Map();
const viewImages={roster:[artists['pa-ngu'].pin,artists['pa-ngu'].portrait],presents:['assets/event-crowd-pin.webp','assets/event-room-pin.webp']};
function warmImages(view,detail=''){
 const sources=[...(viewImages[view]||[])];
 if(view==='presents'&&detail)sources.push('assets/event-crowd.webp','assets/event-room.webp');
 for(const src of sources){if(warmedImages.has(src))continue;const img=new window.Image();img.decoding='async';img.fetchPriority='low';img.src=src;warmedImages.set(src,img);}
}
// Small next-view assets warm only after the critical landing resources have loaded.
function warmNextViews(){const connection=navigator.connection;if(connection?.saveData||/2g/.test(connection?.effectiveType||''))return;
 const start=()=>{warmImages('roster');warmImages('presents');};
 if('requestIdleCallback'in window)window.requestIdleCallback(start,{timeout:1800});else setTimeout(start,300);
}
if(document.readyState==='complete')warmNextViews();else window.addEventListener('load',warmNextViews,{once:true});
const menu=$('#menu-toggle'),navigation=$('#navigation'),reading=$('#reading'),home=$('#home-scene'),content=$('#content');
function closeMenu(){navigation.classList.remove('open');menu.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');$('#stage').inert=false;}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open);document.body.classList.toggle('menu-open',open);$('#stage').inert=open;if(open)navigation.querySelector('a')?.focus();});
document.addEventListener('keydown',e=>{if(!navigation.classList.contains('open'))return;if(e.key==='Escape'){closeMenu();menu.focus();}if(e.key==='Tab'){const controls=[menu,...navigation.querySelectorAll('a')];const i=controls.indexOf(document.activeElement);if(e.shiftKey&&(i<=0)){e.preventDefault();controls.at(-1).focus();}else if(!e.shiftKey&&i===controls.length-1){e.preventDefault();menu.focus();}}});
$('.skip').addEventListener('click',e=>{e.preventDefault();(reading.hidden?$('#stage'):reading).focus();});
function setGlobe(state){planet.setState(state);$('#globe-place').textContent=state.place;}
function mountContact(){const form=$('#contact-form');if(!form)return;const select=$('#topic'),message=$('#message');const p=route.params;
 const requested=p.get('topic');if(requested&&Array.from(select.options).some(o=>o.value===requested))select.value=requested;
 if(p.get('artist'))message.value=`I would like to enquire about booking ${p.get('artist')}.\n\nEvent details:\n`;
 if(p.get('brand'))message.value=`I would like to find out more about ${p.get('brand')}.\n\n`;
 if(p.get('course'))message.value=`I’m interested in ${p.get('course')}. Please keep me informed as the Academy programmes develop.\n\n`;
 if(p.get('experience'))message.value=`I would like to discuss ${p.get('experience')}.\n\n`;
 const bookingFields=()=>{$('#booking-fields').hidden=!['Artist booking & management','Events & live experiences'].includes(select.value);};select.addEventListener('change',bookingFields);bookingFields();
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(form.dataset.sending==='true'||!form.reportValidity())return;
  const data=new FormData(form),payload=Object.fromEntries(data),address=select.value==='Artist booking & management'?'clint@arcworc.com':'dean@arcworc.com';
  const subject=`ARCWORC: ${data.get('topic')}`;
  const body=`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nOrganisation: ${data.get('company')||'Not provided'}\nRegarding: ${data.get('topic')}\nEvent date: ${data.get('date')||'Not provided'}\nVenue / city: ${data.get('venue')||'Not provided'}\n\n${data.get('message')}`;
  $('#email-copy').value=`To: ${address}\nSubject: ${subject}\n\n${body}`;
  const fallback=$('#direct-email');fallback.href=`mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const fallbackPanel=$('#email-fallback');let deliveryMessage='We could not send your enquiry.';
  const status=$('#form-status'),button=form.querySelector('[type="submit"]');status.hidden=false;status.textContent='Sending your enquiry…';$('#email-fallback').hidden=true;button.disabled=true;form.dataset.sending='true';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const endpoint=location.hostname.endsWith('.pages.dev')?'https://arcworc-enquiries.dogon-studio-team.workers.dev/api/enquiry':'/api/enquiry';
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   const result=await response.json().catch(()=>({message:'The delivery service is temporarily unavailable.'}));if(!response.ok){deliveryMessage=result.message||deliveryMessage;throw Error('delivery');}
   status.textContent=`Thank you. Your enquiry has been accepted for delivery to ${address}. You can reply to our response by email.`;
  }catch(error){status.textContent=error.name==='AbortError'?'Delivery could not be confirmed. Your details are still here. Please email us directly below.':`${deliveryMessage} Your details are still here. You can email us directly below.`;fallbackPanel.hidden=false;}
  finally{clearTimeout(timeout);button.disabled=false;form.dataset.sending='false';}
 });
 $('#copy-enquiry').addEventListener('click',async e=>{const button=e.currentTarget,field=$('#email-copy');try{await navigator.clipboard.writeText(field.value);button.firstChild.textContent='Enquiry copied ';}catch{field.focus();field.select();$('#form-status').textContent='Select and copy the prepared enquiry into your email app.';}});
}
function mountView(){mountContact();content.querySelectorAll('a[href^="#"]').forEach(link=>{const warm=()=>{const destination=parseRoute(link.getAttribute('href'));warmImages(destination.view,destination.detail);};link.addEventListener('pointerenter',warm,{once:true});link.addEventListener('focus',warm,{once:true});link.addEventListener('pointerdown',warm,{once:true,passive:true});});content.querySelectorAll('.service-list details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)content.querySelectorAll('.service-list details').forEach(other=>{if(other!==detail)other.open=false;});}));content.querySelectorAll('[data-country]').forEach(button=>button.addEventListener('click',()=>{const country=network[button.dataset.country];content.querySelectorAll('[data-country]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));setGlobe({...sections.presents,region:button.dataset.country,place:country.name,lon:country.lon,lat:country.lat});}));}
function navigate({initial=false}={}){
 const next=location.hash?parseRoute(location.hash):routeFromPath(location.pathname,location.search);route=next;warmImages(route.view,route.detail);
 const base=sections[route.view],region=route.view==='presents'?network[route.params.get('region')]:null;
 const state=region?{...base,region:route.params.get('region'),place:region.name,lon:region.lon,lat:region.lat}:base;
 const token=++renderToken;pointerField.hide();stopWordmarkMorph();clearTimeout(renderTimer);closeMenu();
 navigation.querySelectorAll('[data-nav]').forEach(link=>{if(link.dataset.nav===route.view)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 const meta=pageMeta(next);document.title=meta.title;
 document.querySelector('meta[name="description"]')?.setAttribute('content',meta.description);document.querySelector('link[rel="canonical"]')?.setAttribute('href',meta.canonical);
 for(const [key,value]of Object.entries({'og:title':meta.title,'og:description':meta.description,'og:url':meta.canonical}))document.querySelector(`meta[property="${key}"]`)?.setAttribute('content',value);
 if(location.hash)window.history?.replaceState?.(null,'',routeUrl(next));
 $('#globe-wrap').classList.remove('departing');
 const exitTime=!initial&&!motionQuery.matches?pinExitDuration(pinNodes.length):0;
 $('#globe-pins').classList.toggle('pins-exit',exitTime>0);
 if(!initial)$('#stage').classList.add('is-changing');
 if(!initial&&next.view==='academy'&&document.body.dataset.view!=='academy'){planet.depart();$('#globe-wrap').classList.add('departing');}
 const apply=()=>{
  if(token!==renderToken)return;
  const wasAcademy=document.body.dataset.view==='academy';$('#globe-pins').style.setProperty('--pin-base',wasAcademy||initial?'.65s':'.32s');
  $('#globe-wrap').classList.remove('departing');
  const hiddenGlobe=route.view==='academy';$('#globe-wrap').inert=hiddenGlobe;$('#globe-wrap').setAttribute('aria-hidden',String(hiddenGlobe));
  if(hiddenGlobe)$('#globe-wrap').classList.remove('launching','reappearing');
  document.body.dataset.view=route.view;setGlobe(state);
  $('#globe-pins').innerHTML=cleanLinks(renderPins(route));pinNodes=Array.from($('#globe-pins').querySelectorAll('.globe-pin'));pinNodes.forEach(pin=>pin.style.setProperty('--pin-order',pinOrder(pin.dataset.country)));
  if(route.view==='presents'){const wires=document.createElementNS('http://www.w3.org/2000/svg','svg');wires.classList.add('pin-wires');wires.setAttribute('aria-hidden','true');wires.innerHTML=pinNodes.map(pin=>`<g data-wire="${pin.dataset.country}"><line/><circle r="2"/></g>`).join('');$('#globe-pins').prepend(wires);for(const pin of pinNodes){pin.wire=wires.querySelector(`[data-wire="${pin.dataset.country}"]`);pin.wire.style.setProperty('--pin-order',pinOrder(pin.dataset.country));}}
  $('#globe-pins').classList.remove('pin-enter','pins-exit');
  if(route.view==='home'){
   home.hidden=false;reading.hidden=true;content.replaceChildren();home.classList.remove('home-enter');
   if(!initial){window.scrollTo({top:0,behavior:'instant'});$('#stage').focus({preventScroll:true});}
  }else{
   home.hidden=true;reading.hidden=false;reading.classList.remove('entering');content.innerHTML=cleanLinks(renderView(route));reading.scrollTop=0;mountView();
  }
  $('#stage').classList.remove('is-changing');
  if(route.view==='contact'&&(planet.ready||planet.failed))revealPlanet('contact');
  else if((wasAcademy||route.view==='home')&&route.view!=='academy'&&(planet.ready||planet.failed))revealPlanet();
  requestAnimationFrame(()=>{
   if(token!==renderToken)return;
   if(route.view==='home'){home.classList.add('home-enter');revealWordmarkEntry(token);}else{Array.from(content.children).forEach((node,i)=>node.style.setProperty('--item',Math.min(i,6)));reading.classList.add('entering');}
   $('#globe-pins').classList.add('pin-enter');
   if(!initial&&route.view!=='home'){content.querySelector('h1')?.focus({preventScroll:true});if(matchMedia('(max-width:900px)').matches)window.scrollTo({top:0,behavior:'instant'});}
  });
  if(!initial)$('#route-status').textContent=`${state.title}${route.detail?' — details':''}`;
 };
 if(initial||motionQuery.matches)apply();else renderTimer=setTimeout(apply,Math.max(exitTime,next.view==='academy'?460:next.view==='contact'?60:110));
}
planet.onProject=project=>{
 const offsets=mobilePinQuery.matches?{NGA:[-33,0],KEN:[35,2],ZWE:[21,65],ZAF:[-45,70]}:{NGA:[-35,-10],KEN:[42,5],ZWE:[12,88],ZAF:[-62,93]};
 for(const pin of pinNodes){
  const p=project(Number(pin.dataset.lon),Number(pin.dataset.lat)),visible=p.z>.18;
  pin.dataset.visible=String(visible);pin.setAttribute('aria-hidden',String(!visible));pin.tabIndex=visible?0:-1;
  if(visible){pin.style.left=p.x.toFixed(1)+'px';pin.style.top=p.y.toFixed(1)+'px';}
  if(pin.wire){pin.wire.style.opacity=visible?'1':'0';pin.wire.style.visibility=visible?'visible':'hidden';if(visible){const [dx,dy]=offsets[pin.dataset.country];const line=pin.wire.querySelector('line'),dot=pin.wire.querySelector('circle');for(const [a,v]of Object.entries({x1:p.x,y1:p.y,x2:p.x+dx,y2:p.y+dy-16}))line.setAttribute(a,v.toFixed(1));dot.setAttribute('cx',p.x.toFixed(1));dot.setAttribute('cy',p.y.toFixed(1));}}
 }
};
window.addEventListener('hashchange',()=>{if(booted)navigate();});
// Selecting the already active Home link still recenters the planet on Africa.
navigation.querySelectorAll('a').forEach(link=>{link.addEventListener('click',()=>{if(link.getAttribute('href')===location.hash){if(booted)navigate();}});link.addEventListener('pointerenter',()=>{planet.hint(true);warmImages(link.dataset.nav);});link.addEventListener('pointerleave',()=>planet.hint(false));link.addEventListener('focus',()=>{planet.hint(true);warmImages(link.dataset.nav);});link.addEventListener('pointerdown',()=>warmImages(link.dataset.nav),{passive:true});link.addEventListener('blur',()=>planet.hint(false));});
window.addEventListener('popstate',()=>{if(booted)navigate();});
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest?.('a[href]');if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
 const href=link.getAttribute('href');if(href==='#reading')return;
 let nextRoute;
 if(href.startsWith('#')){if(!Object.hasOwn(sections,href.slice(1).split(/[/?]/)[0]))return;nextRoute=parseRoute(href);}
 else{const url=new URL(href,location.href);if(url.origin!==location.origin||!knownPath(url.pathname))return;nextRoute=routeFromPath(url.pathname,url.search);}
 event.preventDefault();const url=routeUrl(nextRoute);if(url!==location.pathname+location.search)window.history.pushState(null,'',url);if(booted)navigate();
});
$('#globe-reset').addEventListener('click',()=>{setGlobe(sections[route.view]);content.querySelectorAll('[data-country]').forEach(b=>b.setAttribute('aria-pressed','false'));});
const motionButton=$('#motion-toggle');function updateMotionButton(){motionButton.setAttribute('aria-pressed',String(planet.paused));motionButton.querySelector('.motion-icon').textContent=planet.paused?'▷':'Ⅱ';motionButton.querySelector('.motion-label').textContent=planet.paused?'Resume motion':'Pause motion';motionButton.setAttribute('aria-label',planet.paused?'Resume globe motion':'Pause globe motion');}
motionButton.addEventListener('click',()=>{if(planet.reduced&&planet.paused)planet.reduced=false;planet.setPaused(!planet.paused);updateMotionButton();});motionQuery.addEventListener('change',e=>{planet.setReduced(e.matches);updateMotionButton();});
$('#year').textContent=new Date().getFullYear();updateMotionButton();
navigation.querySelectorAll('a').forEach((link,i)=>link.style.setProperty('--order',i));
Promise.all([planet.loaded,wordmarkReady,document.fonts?.ready||Promise.resolve()]).then(()=>{
 booted=true;document.documentElement.classList.remove('is-booting');$('.site-frame').classList.add('site-intro');navigate({initial:true});
});
