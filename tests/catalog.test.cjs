const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('})();','globalThis.app={CATALOG,I,STORES,ORDER,SLOTS,defaults,validState,newBatch,rate,choose,alternatives,offersSorted,cardHTML,renderCatalog,get state(){return state},get P(){return P}};})();');
function boot(saved){
  const nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',hidden:false,classList:{add(){},remove(){}},addEventListener(){},scrollIntoView(){}});return nodes.get(id)};
  let stored=saved;
  const context={console,Intl,Math,JSON,Set,Number,String,Array,Object,parseInt,parseFloat,isNaN,setTimeout:()=>1,clearTimeout(){},localStorage:{getItem:()=>stored,setItem:(k,v)=>{stored=v}},document:{querySelector:node,querySelectorAll:()=>[],addEventListener(){}},window:{matchMedia:()=>({matches:false})}};
  vm.createContext(context); vm.runInContext(source,context);return context.app;
}
let app=boot();
assert.equal(app.CATALOG.length,51);
assert(app.CATALOG.every(it=>it.l==='f'));
assert.equal(new Set(app.CATALOG.map(it=>it.id)).size,51);
for(const style of app.ORDER){
  assert(app.CATALOG.some(it=>(it.s[style]||0)>=.5),style+' coverage');
  for(const level of ['po','eq','mu']){
    app.P.estilos=[style]; app.P.sorpresa=level;
    for(let n=0;n<5;n++){
      app.newBatch(false);
      assert.equal(app.state.outfits.length,5);
      assert.equal(app.state.outfits.filter(o=>o.kind==='sorpresa').length,level==='mu'?2:1);
      for(const o of app.state.outfits){
        for(const sl of app.SLOTS){assert(sl.optional&&!o.items[sl.k]||app.I[o.items[sl.k]]&&sl.cats.includes(app.I[o.items[sl.k]].c));}
        assert(app.cardHTML(o,0).includes('assets/products/'));
      }
    }
  }
}
app=boot();
app.rate(0,5); assert.equal(app.state.stats.ratings,1);
app.rate(0,1); assert.equal(app.state.stats.ratings,1); assert.equal(app.state.outfits[0].rating,1);
const alts=app.alternatives(0,'top');assert.equal(alts.top.length,3);
app.choose(0,'top',alts.top[0].id);assert.equal(app.state.stats.swaps,1);
assert.equal(app.state.outfits[0].items.top,alts.top[0].id);
assert(app.validState(app.state));
assert(boot(JSON.stringify(app.state)).validState(app.state));
for(const saved of ['bad json','{"v":1}',JSON.stringify({...app.defaults(),profile:{}})])assert.equal(boot(saved).state.outfits.length,5);
for(const it of app.CATALOG){const offers=app.offersSorted(it);assert(offers.length>=3);for(let i=1;i<offers.length;i++){assert(offers[i-1].ok||!offers[i].ok);if(offers[i-1].ok===offers[i].ok)assert(offers[i-1].price<=offers[i].price);}}
const stale=app.defaults();stale.outfits=app.state.outfits;stale.outfits[0].items.top='missing';assert.equal(boot(JSON.stringify(stale)).state.outfits.length,5);
console.log('Passed: 195 batches, 13 styles, surprise levels, women-only catalog, feedback, swaps, offer sorting, persistence and corrupt-state recovery.');
const exported=JSON.parse(fs.readFileSync('assets/catalog.json','utf8'));
assert.equal(exported.products.length,app.CATALOG.length);
for(const product of exported.products){assert.equal(product.collection,'mujer');assert.equal(product.purchaseUrl,null);assert.equal(product.image,app.I[product.id].image);assert.equal(product.referencePrice,app.I[product.id].p);}
if(process.argv.includes('--assets')){
  for(const product of exported.products){assert(fs.existsSync(product.image),'Missing photo: '+product.id);assert(fs.statSync(product.image).size>1000);}
  console.log('Passed: all 51 photo files exist and the exported catalog matches the app.');
}
