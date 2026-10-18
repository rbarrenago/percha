const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const html=fs.readFileSync('index.html','utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('})();','globalThis.app={TRYON,TRYON_EXAMPLES,SLOTS,showTryonExamples,modelResult,modelStage,tryonKey,outfitKey,generateTryon,changePerson,removeModelPhoto,loadModelPhoto,choose,alternatives,get state(){return state}};})();');
function boot(request){
  const nodes=new Map();const revoked=[];const stored=[];
  const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',hidden:false,open:false,classList:{add(){},remove(){}},addEventListener(){},removeAttribute(){},close(){this.open=false;}});return nodes.get(id);};
  const context={console,Intl,Math,JSON,Set,Number,String,Array,Object,Map,parseInt,parseFloat,isNaN,AbortController,AbortSignal,setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem:(key,value)=>stored.push(value)},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:url=>revoked.push(url)},Image:class{set src(value){queueMicrotask(()=>{this.naturalWidth=1000;this.naturalHeight=1500;this.onload();});}},document:{querySelector:node,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,/9j/AAAAAAAAAAAA'})},window:{matchMedia:()=>({matches:false})}};
  vm.createContext(context);vm.runInContext(source,context);
  // Inject a fake provider only after startup: no real network access occurs in these tests.
  context.fetch=request||(async()=>{throw Error('Unexpected request');});
  return {app:context.app,revoked,nodes,stored};
}
const fakeImage='data:image/webp;base64,UklGRgAAAABXRUJQ';
test('Five showcase images match their exact product sets and are invalidated by a garment swap',()=>{
  const {app}=boot();assert.equal(app.state.outfits.length,5);
  for(const outfit of app.state.outfits)assert(app.modelResult(outfit));
  const alternatives=app.alternatives(0,'top');app.choose(0,'top',alternatives.top[0].id);
  assert.equal(app.modelResult(app.state.outfits[0]),null);
  assert(app.modelStage(app.state.outfits[0],0).includes('Aún sin esta combinación'));
  for(let i=1;i<5;i++)assert(app.modelResult(app.state.outfits[i]));
});
test('Personal photos can never use a studio example image',()=>{
  const {app}=boot();app.TRYON.photo='data:image/jpeg;base64,/9j/AAAAAAAAAAAA';app.changePerson('personal');
  for(const outfit of app.state.outfits)assert.equal(app.modelResult(outfit),null);
  assert.equal(app.TRYON.consent,false);
});
test('Unavailable service or missing consent prevents all image-service calls',async()=>{
  let calls=0;const {app}=boot(async()=>{calls++;});
  await app.generateTryon(0);app.TRYON.available=true;await app.generateTryon(0);assert.equal(calls,0);
});
test('A generated image is bound to the exact person and products; changing products removes it',async()=>{
  const payloads=[];const {app}=boot(async(url,options)=>{payloads.push(JSON.parse(options.body));return {ok:true,json:async()=>({image:fakeImage})};});
  app.TRYON.available=true;app.TRYON.consent=true;await app.generateTryon(0);
  assert.equal(payloads.length,1);assert.equal(payloads[0].photo,null);assert.equal(payloads[0].consent,true);
  assert.equal(app.modelResult(app.state.outfits[0]).src,fakeImage);
  app.choose(0,'feet',app.alternatives(0,'feet').top[0].id);assert.equal(app.modelResult(app.state.outfits[0]),null);
});
test('Late responses cannot reappear after changing the model or removing a photo',async()=>{
  let release;const {app}=boot(()=>new Promise(resolve=>release=()=>resolve({ok:true,json:async()=>({image:fakeImage})})));
  app.TRYON.available=true;app.TRYON.consent=true;
  const pending=app.generateTryon(0);app.TRYON.photo='data:image/jpeg;base64,/9j/AAAAAAAAAAAA';app.changePerson('personal');
  release();await pending;assert.equal(app.TRYON.cache.size,0);assert.equal(app.TRYON.job,null);
  app.TRYON.cache.set('old',fakeImage);app.removeModelPhoto();assert.equal(app.TRYON.photo,null);assert.equal(app.TRYON.cache.size,0);assert.equal(app.TRYON.consent,false);
});
test('Photo upload validates files, prepares a session-only image, and always revokes the temporary URL',async()=>{
  const {app,revoked,stored}=boot();
  await app.loadModelPhoto({type:'image/gif',size:100,name:'bad.gif'});assert.equal(app.TRYON.photo,null);assert(app.TRYON.photoError);
  await app.loadModelPhoto({type:'image/jpeg',size:13*1024*1024,name:'big.jpg'});assert.equal(app.TRYON.photo,null);
  await app.loadModelPhoto({type:'image/jpeg',size:10000,name:'sample.jpg'});assert(app.TRYON.photo.startsWith('data:image/jpeg;'));
  assert.equal(app.TRYON.person,'personal');assert.equal(app.TRYON.consent,false);assert.equal(app.TRYON.photoLoading,false);assert.deepEqual(revoked,['blob:test']);assert(stored.every(value=>!value.includes('data:image/')&&!value.includes('sample.jpg')));
});
test('Generation failures leave no stale pending job and expose a retryable error',async()=>{
  const {app}=boot(async()=>({ok:false,json:async()=>({error:'Servicio no disponible'})}));
  app.TRYON.available=true;app.TRYON.consent=true;await app.generateTryon(0);
  assert.equal(app.TRYON.job,null);assert.equal(app.TRYON.errors.get(app.tryonKey(app.state.outfits[0])),'Servicio no disponible');
});
if(process.argv.includes('--assets')){
  const examples=JSON.parse(fs.readFileSync('assets/tryon-examples.json','utf8')).examples;
  assert.equal(examples.length,5);
  for(const example of examples){assert(fs.existsSync(example.image),'Missing try-on example '+example.slug);assert([5,6].includes(Object.values(example.items).filter(Boolean).length));}
  assert(fs.existsSync('assets/models/studio-model.webp'));
}
