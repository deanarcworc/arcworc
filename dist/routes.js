import {sections,artists,brands,events,programmes,parseRoute} from './content.js?v=20261020-6';
const paths={home:'/',about:'/about',roster:'/artists',presents:'/work',services:'/services',brands:'/ecosystem',academy:'/academy',contact:'/contact'};
export function routeUrl(route){return paths[route.view]+(route.detail?'/'+encodeURIComponent(route.detail):'')+(route.params?.size?'?'+route.params.toString():'');}
export function routeFromPath(path='/',search=''){
 const clean=path.replace(/\.html$/,'').replace(/\/$/,'')||'/';const [root,detail]=clean.slice(1).split('/');
 const view=Object.keys(paths).find(k=>paths[k]==='/'+root)||'home';return parseRoute('#'+view+(detail?'/'+detail:'')+(search?'?'+search.replace(/^\?/,''):''));
}
export function knownPath(path){const root=path.replace(/\.html$/,'').replace(/\/$/,'').split('/')[1]||'';return root===''||Object.values(paths).includes('/'+root);}
export function cleanLinks(html){return html.replace(/href="#([^"]*)"/g,(whole,value)=>value==='reading'?whole:'href="'+routeUrl(parseRoute('#'+value.replaceAll('&amp;','&'))).replaceAll('&','&amp;')+'"');}
export function pageMeta(route){
 let name=sections[route.view]?.title||'Home';
 if(route.view==='roster'&&artists[route.detail])name=artists[route.detail].name+' · DJ & Producer';
 if(route.view==='brands'&&brands[route.detail])name=brands[route.detail].name;
 if(route.view==='presents'&&events[route.detail])name=events[route.detail].name;
 if(route.view==='academy'&&route.detail)name=programmes.find(p=>p.slug===route.detail)?.name||'Academy';
 const descriptions={home:'ARCWORC connects artist bookings, music curation, live experiences, branding and creative education. Independent creative agency based in Cape Town.',about:'Meet ARCWORC, an independent creative ecosystem based in Cape Town, connecting music, talent, live experiences, brands and creative ideas.',roster:'Explore the ARCWORC artist roster, including PA NGU. Artist profiles, music, live performance information and DJ booking enquiries.',presents:'Discover ARCWORC Presents: GUNGANO Live, SOMA and PAMOJA. Music-led experiences and developing partnerships across Africa.',services:'Artist bookings, venue music programming, events, branding, websites and creative consultancy from ARCWORC in Cape Town.',brands:'Explore the ARCWORC ecosystem: GUNGANO Records, LYNNK Marketplace, LYNNK ENGINE, DOGON and ARCWORC Academy.',academy:'Explore planned ARCWORC Academy pathways in DJ performance, music production, sound engineering, artist development and music business.',contact:'Contact ARCWORC for artist bookings, venue music curation, creative briefs, partnerships and Academy enquiries.'};
 const description=route.view==='roster'&&artists[route.detail]?artists[route.detail].intro:route.view==='brands'&&brands[route.detail]?brands[route.detail].copy:descriptions[route.view]||descriptions.home;
 return {title:route.view==='home'?'ARCWORC | Creative Agency, Artist Bookings & Music in Cape Town':name+' | ARCWORC',description,canonical:'https://arcworc.com'+routeUrl({...route,params:new URLSearchParams()})};
}
