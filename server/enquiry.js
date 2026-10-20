// Sends only to the two verified ARCWORC inboxes, through the isolated notify subdomain.
const origins = new Set(['https://arcworc.com','https://www.arcworc.com','https://arcworc-preview.pages.dev']);
export function allowedOrigin(origin){return origins.has(origin)||/^https:\/\/[a-z0-9-]+\.arcworc-preview\.pages\.dev$/.test(origin||'');}
const topics = new Set(['Artist booking & management','Music curation & programming','Events & live experiences','Branding & creative production','Websites & digital experiences','Consultancy & new ventures','Academy programme interest','General enquiry']);
const json=(status,message)=>Response.json({message},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function validateEnquiry(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Please check your enquiry.');
 const limits={name:150,email:254,company:200,topic:100,date:10,venue:200,message:6000,website:200};
 const clean={};for(const [key,max]of Object.entries(limits)){const value=data[key]??'';if(typeof value!=='string'||value.length>max)throw Error('Please shorten your enquiry and try again.');clean[key]=value.trim();}
 if(!clean.name||!clean.message||!topics.has(clean.topic)||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(clean.email)||/[\r\n]/.test(clean.email+clean.name))throw Error('Please check your name, email, topic and message.');
 if(clean.date&&!/^\d{4}-\d{2}-\d{2}$/.test(clean.date))throw Error('Please check the event date.');
 return clean;
}
export function recipientFor(topic){return topic==='Artist booking & management'?'clint@arcworc.com':'dean@arcworc.com';}
async function readBody(request){
 if(Number(request.headers.get('content-length'))>12000)throw Error('too-large');
 const reader=request.body?.getReader();if(!reader)throw Error('invalid-body');let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();throw Error('too-large');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handleEnquiry(request,env){
 if(new URL(request.url).pathname!=='/api/enquiry')return json(404,'Not found.');
 if(request.method!=='POST')return json(405,'Use the enquiry form.');
 if(!allowedOrigin(request.headers.get('origin')))return json(403,'Please send your enquiry from the ARCWORC website.');
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json(415,'Please use the enquiry form.');
 if(env.DELIVERY_ENABLED!=='true'||!env.EMAIL||!env.ENQUIRY_LIMIT)return json(503,'Direct delivery is being connected. Please email ARCWORC directly.');
 let enquiry;try{enquiry=validateEnquiry(await readBody(request));}catch(e){return json(e.message==='too-large'?413:400,e.message==='too-large'?'Please shorten your enquiry.':'Please check your enquiry fields.');}
 if(enquiry.website)return json(400,'Unable to submit this enquiry.');
 try{
  const {success}=await env.ENQUIRY_LIMIT.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!success)return json(429,'Please wait a minute before trying again.');
  const to=recipientFor(enquiry.topic);
  const text=`Name: ${enquiry.name}\nEmail: ${enquiry.email}\nOrganisation: ${enquiry.company||'Not provided'}\nRegarding: ${enquiry.topic}\nEvent date: ${enquiry.date||'Not provided'}\nVenue / city: ${enquiry.venue||'Not provided'}\n\n${enquiry.message}`;
  await env.EMAIL.send({to,from:{email:'website@notify.arcworc.com',name:'ARCWORC enquiries'},replyTo:enquiry.email,subject:`ARCWORC: ${enquiry.topic}`,text,html:`<pre>${text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</pre>`});
  return json(200,'Your enquiry has been accepted for delivery. Thank you for connecting with ARCWORC.');
 }catch{console.error(JSON.stringify({event:'enquiry_delivery_failed'}));return json(502,'We could not send this enquiry. Your details remain in the form. Please try again or email ARCWORC directly.');}
}
export default {async fetch(request,env){
 const origin=request.headers.get('origin');
 const response=request.method==='OPTIONS'&&new URL(request.url).pathname==='/api/enquiry'?(allowedOrigin(origin)?new Response(null,{status:204}):json(403,'Origin not allowed.')):await handleEnquiry(request,env);
 if(allowedOrigin(origin)){response.headers.set('Access-Control-Allow-Origin',origin);response.headers.set('Access-Control-Allow-Methods','POST, OPTIONS');response.headers.set('Access-Control-Allow-Headers','Content-Type');response.headers.set('Vary','Origin');}
 return response;
}};
