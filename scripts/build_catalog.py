"""Optimize generated photos and export the fictional women's catalog. Requires Pillow."""
import json,re
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'assets/catalog-source.json').read_text())
styles={'cla':'Clásico','ele':'Elegante','cas':'Casual','rom':'Romántico','cre':'Creativo','dra':'Dramático','sex':'Seductor','stw':'Streetwear','ath':'Athleisure / Blokecore','min':'Minimalista','boh':'Boho','vin':'Vintage','roc':'Rocker'}
products=[]
missing=[]
for row in rows:
    ident,category,name,color,family,line,price,tags,*length=row
    source=ROOT/f'assets/products/{ident}.png'
    target=ROOT/f'assets/products/{ident}.webp'
    if source.exists():
        with Image.open(source) as image:
            image.thumbnail((720,720))
            image.convert('RGB').save(target,'WEBP',quality=86,method=6)
    elif not target.exists(): missing.append(ident)
    pairs=tags.split()
    products.append({'id':ident,'name':name,'category':category,'collection':'mujer','image':f'assets/products/{ident}.webp','imageOrigin':'AI-generated fictional product','color':color,'colorFamily':family,'referencePrice':price,'currency':'EUR','styles':{pairs[i]:float(pairs[i+1]) for i in range(0,len(pairs),2)},'length':length[0] if length else None,'demo':True,'purchaseUrl':None})
(ROOT/'assets/catalog.json').write_text(json.dumps({'name':'Percha Studio · colección mujer','version':1,'demo':True,'notice':'Productos ficticios e imágenes generadas con IA. Precios de referencia de demostración. No disponibles para compra. Las ofertas y existencias se simulan en la aplicación.','styles':styles,'products':products},ensure_ascii=False,indent=2)+'\n')
# Keep the buildless app's embedded catalog aligned with the editable source.
html_path=ROOT/'index.html'
html=html_path.read_text()
html=re.sub(r'const RAW = \[.*?;\nconst CATALOG',lambda _: 'const RAW = '+json.dumps(rows,ensure_ascii=False,indent=2)+';\nconst CATALOG',html,count=1,flags=re.S)
html_path.write_text(html)
print(f'{len(products)} products exported; {len(missing)} photos pending')
