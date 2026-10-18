import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createApp,validateItems,decodePhoto,buildPrompt} from '../server.mjs';
const catalog=JSON.parse(await readFile(new URL('../assets/catalog.json',import.meta.url),'utf8'));
const products=new Map(catalog.products.map(p=>[p.id,p]));
const items={outer:'o01',top:'t19',bottom:'b02',feet:'f01',bag:'g01',belt:'c01'};
const webp=await readFile(new URL('../assets/models/studio-model.webp',import.meta.url));
async function start(t,options={}){
  const server=await createApp(options);
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  return 'http://127.0.0.1:'+server.address().port;
}
const post=(base,payload,headers={})=>fetch(base+'/api/tryon',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload)});

test('Catalog validation rejects mismatched categories and unknown IDs',()=>{
  assert.equal(validateItems(items,products).length,6);
  assert.equal(validateItems({...items,belt:null},products).length,5);
  assert.throws(()=>validateItems({...items,top:'f01'},products));
  assert.throws(()=>validateItems({...items,bag:'../../.env'},products));
  assert.throws(()=>validateItems({...items,extra:'t01'},products));
  const prompt=buildPrompt(validateItems(items,products));
  for(const item of validateItems(items,products))assert(prompt.includes(item.name));
});
test('Photo decoding validates content and does not accept arbitrary URLs',()=>{
  assert(decodePhoto('data:image/webp;base64,'+webp.toString('base64')).bytes.equals(webp));
  assert.throws(()=>decodePhoto('https://example.com/photo.jpg'));
  assert.throws(()=>decodePhoto('data:image/png;base64,'+webp.toString('base64')));
  assert.throws(()=>decodePhoto('data:image/jpeg;base64,aGVsbG8='));
});
test('Without credentials, examples work and generation is unavailable without making an upstream call',async t=>{
  let calls=0;const base=await start(t,{apiKey:'',fetchImpl:async()=>{calls++;throw Error('Unexpected call');}});
  const status=await (await fetch(base+'/api/tryon/status')).json();assert.equal(status.available,false);
  assert.equal((await fetch(base+'/')).status,200);
  assert.equal((await fetch(base+'/assets/models/studio-model.webp')).status,200);
  assert.equal((await post(base,{items,photo:null,consent:true})).status,503);
  assert.equal(calls,0);
});
test('Consent, origin and static access are enforced before generation',async t=>{
  let calls=0;const base=await start(t,{apiKey:'test-key',fetchImpl:async()=>{calls++;throw Error('Unexpected call');}});
  assert.equal((await post(base,{items,photo:null,consent:false})).status,400);
  assert.equal((await post(base,{items,photo:null,consent:true},{Origin:'https://example.com'})).status,403);
  assert.equal((await post(base,{items:{...items,top:'missing'},consent:true})).status,400);
  for(const route of ['/.env','/.git/config','/server.mjs','/assets/../.env','/output/originals/studio-model.png'])assert.equal((await fetch(base+route)).status,404);
  assert.equal(calls,0);
});
test('Generation sends the correct 6 or 7 reference images and returns only the generated image',async t=>{
  const calls=[];const base=await start(t,{apiKey:'test-key',fetchImpl:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({data:[{b64_json:webp.toString('base64')}]}),{status:200});}});
  for(const belt of ['c01',null]){
    const response=await post(base,{items:{...items,belt},photo:'data:image/webp;base64,'+webp.toString('base64'),consent:true});
    assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
    const result=await response.json();assert.equal(result.image,'data:image/webp;base64,'+webp.toString('base64'));assert.equal(result.generated,true);assert(!JSON.stringify(result).includes('test-key'));
    const call=calls.at(-1);assert.equal(call.url,'https://api.openai.com/v1/images/edits');
    assert.equal(call.options.headers.Authorization,'Bearer test-key');assert.equal(call.options.body.get('model'),'gpt-image-2');
    const refs=call.options.body.getAll('image[]');assert.equal(refs.length,belt?7:6);assert.equal(refs[0].name,'person.webp');assert.equal(refs[1].name,'o01.webp');assert.equal(refs[5].name,'g01.webp');
  }
});
test('Provider failures are reported without leaking upstream details or credentials',async t=>{
  const base=await start(t,{apiKey:'test-key',fetchImpl:async()=>new Response('private upstream error',{status:401})});
  const response=await post(base,{items,photo:null,consent:true});assert.equal(response.status,502);
  const text=await response.text();assert(!text.includes('private'));assert(!text.includes('test-key'));
});
test('Only one paid generation can run at a time',async t=>{
  let release,started;const began=new Promise(resolve=>started=resolve);
  const base=await start(t,{apiKey:'test-key',fetchImpl:async()=>{started();await new Promise(resolve=>release=resolve);return new Response(JSON.stringify({data:[{b64_json:webp.toString('base64')}]}));}});
  const first=post(base,{items,photo:null,consent:true});await began;
  const second=await post(base,{items,photo:null,consent:true});assert.equal(second.status,429);
  release();assert.equal((await first).status,200);
});
