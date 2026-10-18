import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const SLOTS={outer:['abrigo','chaqueta'],top:['camiseta','camisa','jersey'],bottom:['abajo'],feet:['zapatos','botas','zapatillas'],bag:['bolso'],belt:['cinturon']};
const MAX_BODY=12*1024*1024;
class RequestError extends Error {constructor(status,message){super(message);this.status=status;}}
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};

export function validateItems(items,catalog){
  if(!items||typeof items!=='object'||Array.isArray(items)||Object.keys(items).some(k=>!Object.hasOwn(SLOTS,k)))throw new RequestError(400,'La combinación no es válida.');
  return Object.entries(SLOTS).flatMap(([slot,categories])=>{
    const id=items[slot];
    if(slot==='belt'&&(id===null||id===undefined||id===''))return [];
    const item=typeof id==='string'?catalog.get(id):null;
    if(!item||item.collection!=='mujer'||!categories.includes(item.category))throw new RequestError(400,'Alguna prenda ya no está en el catálogo o no pertenece a su categoría.');
    return [{slot,...item}];
  });
}
export function decodePhoto(photo){
  if(typeof photo!=='string')throw new RequestError(400,'La foto no es válida.');
  const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo);
  if(!match||match[2].length%4!==0)throw new RequestError(400,'Usa una foto JPG, PNG o WebP.');
  const bytes=Buffer.from(match[2],'base64');
  if(bytes.length<12||bytes.length>8*1024*1024)throw new RequestError(400,'La foto es demasiado grande o no es válida.');
  const valid=match[1]==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:match[1]==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  if(!valid)throw new RequestError(400,'El contenido de la foto no corresponde a su formato.');
  return {bytes,type:'image/'+match[1],extension:match[1]==='jpeg'?'jpg':match[1]};
}
export function buildPrompt(items){
  const list=items.map((it,i)=>`Image ${i+2}: ${it.name} (${it.slot}).`).join('\n');
  return `Create one photorealistic full-body fashion try-on photograph. Image 1 is the adult person to dress; preserve their identity, face, skin tone, hair, body shape, proportions, pose, background and camera framing. The other images are product references:\n${list}\nReplace existing clothes with ALL referenced products. Reproduce their colors, design, materials and distinctive details faithfully. Dress the person in the top, bottom and footwear; wear the outer layer open enough to reveal the top. Carry the handbag naturally, making only small hand or arm adjustments if needed. ${items.some(it=>it.slot==='belt')?'Wear the referenced belt visibly at the waist.':'Do not add a belt.'} Realistic fabric drape, lighting, shadows and occlusion; do not simply paste rectangular product images. Keep the entire head and both shoes visible. Do not change the person to a different model or alter their body size. No extra products, jewelry, text, labels, watermark, collage or inset pictures. This is a visual styling approximation, not a guarantee of garment fit.`;
}
async function bodyJSON(req){
  let total=0;const parts=[];
  for await(const part of req){total+=part.length;if(total>MAX_BODY)throw new RequestError(413,'La foto es demasiado grande.');parts.push(part);}
  try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw new RequestError(400,'La solicitud no es válida.');}
}
export async function createApp({root=ROOT,apiKey=process.env.OPENAI_API_KEY||'',fetchImpl=globalThis.fetch}={}){
  const data=JSON.parse(await readFile(path.join(root,'assets/catalog.json'),'utf8'));
  const catalog=new Map(data.products.map(p=>[p.id,p]));let active=false;
  return http.createServer(async(req,res)=>{
    try{
      if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||''))throw new RequestError(403,'Servidor de demostración local.');
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/api/tryon/status'&&req.method==='GET')return json(res,200,{available:Boolean(apiKey),provider:'OpenAI',model:'gpt-image-2'});
      if(url.pathname==='/api/tryon'&&req.method==='POST'){
        if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new RequestError(415,'El formato de la solicitud no es válido.');
        if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)throw new RequestError(403,'La solicitud debe proceder de esta aplicación.');
        const body=await bodyJSON(req);
        const items=validateItems(body.items,catalog);
        if(body.consent!==true)throw new RequestError(400,'Confirma el envío de la foto y las prendas al servicio de imágenes.');
        const person=body.photo===null||body.photo===undefined?{bytes:await readFile(path.join(root,'assets/models/studio-model.webp')),type:'image/webp',extension:'webp'}:decodePhoto(body.photo);
        if(!apiKey)throw new RequestError(503,'El servicio de imágenes todavía no está activado. Las cinco pruebas de ejemplo siguen disponibles.');
        if(active)throw new RequestError(429,'Hay una prueba en curso. Espera a que termine antes de generar otra.');
        active=true;
        const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),240000);
        res.on('close',()=>{if(!res.writableEnded)controller.abort();});
        try{
          const form=new FormData();
          form.set('model','gpt-image-2');form.set('prompt',buildPrompt(items));form.set('n','1');form.set('size','1024x1536');form.set('quality','medium');form.set('output_format','webp');
          form.append('image[]',new Blob([person.bytes],{type:person.type}),'person.'+person.extension);
          for(const item of items){const bytes=await readFile(path.join(root,'assets/products',item.id+'.webp'));form.append('image[]',new Blob([bytes],{type:'image/webp'}),item.id+'.webp');}
          // No application logs, files or persistent cache contain uploaded photos or generated results.
          const upstream=await fetchImpl('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form,signal:controller.signal});
          if(!upstream.ok){await upstream.body?.cancel();throw new RequestError(upstream.status===429?429:502,upstream.status===429?'El servicio ha alcanzado su límite. Inténtalo más tarde.':'No se ha podido generar la prueba. Revisa la configuración del servicio o prueba con otra foto.');}
          const result=await upstream.json();const image=result?.data?.[0]?.b64_json;
          if(typeof image!=='string'||!image.length||image.length>32*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(image))throw new RequestError(502,'El servicio no ha devuelto una imagen válida.');
          if(!res.destroyed)return json(res,200,{image:`data:image/webp;base64,${image}`,generated:true});
        }finally{clearTimeout(timeout);active=false;}
        return;
      }
      if(url.pathname.startsWith('/api/'))throw new RequestError(404,'Servicio no encontrado.');
      if(req.method!=='GET'&&req.method!=='HEAD')throw new RequestError(405,'Método no permitido.');
      let relative=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
      const allowed=relative==='index.html'||/^assets\/[a-zA-Z0-9/_-]+\.(webp|json)$/.test(relative);
      if(!allowed)throw new RequestError(404,'Archivo no encontrado.');
      const filename=path.resolve(root,relative);if(!filename.startsWith(path.resolve(root)+path.sep))throw new RequestError(404,'Archivo no encontrado.');
      let bytes;try{bytes=await readFile(filename);}catch{throw new RequestError(404,'Archivo no encontrado.');}
      const type=relative.endsWith('.html')?'text/html; charset=utf-8':relative.endsWith('.json')?'application/json; charset=utf-8':'image/webp';
      res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);
    }catch(error){if(res.destroyed||res.headersSent)return;json(res,error.status||500,{error:error.status?error.message:error.name==='AbortError'?'La generación ha tardado demasiado. Inténtalo de nuevo.':'No se ha podido completar la solicitud.'});}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||8765);
  const server=await createApp();server.requestTimeout=300000;
  server.listen(port,'127.0.0.1',()=>console.log(`Percha: http://127.0.0.1:${port}\nPrueba con IA: ${process.env.OPENAI_API_KEY?'activada':'sin configurar; ejemplos disponibles'}`));
}
