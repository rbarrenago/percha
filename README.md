# Percha · colección mujer

Prototipo en castellano para presentar a tiendas de moda de la península. Propone cinco combinaciones a partir de talla, calzado, estatura y de uno a cuatro estilos. El catálogo contiene **51 productos ficticios de mujer con fotografías generadas con IA**, cubriendo trece estilos.

## Abrir la demo

Abre `index.html` directamente en el navegador. No necesita instalación, backend ni claves API. Mantén la carpeta `assets/` junto al HTML. Las fuentes de Google requieren conexión; sin ella se usan fuentes del sistema y el resto funciona con archivos locales.

Para una vista mediante servidor local:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Abre http://127.0.0.1:8765. GitHub Pages puede servir `index.html` y `assets/` desde la raíz del repositorio. Esta actualización no publica ni sube cambios automáticamente.

## Qué incluye

- Perfil de mujer: XS–XXL, calzado EU 35–47, estatura 140–210 cm y trece estilos.
- Cinco combinaciones con abrigo o chaqueta, prenda de arriba, pantalón o falda, calzado, bolso y cinturón opcional.
- Collages y fichas con fotos de producto; cada foto del collage abre el comparador demo.
- Valoraciones de 1 a 5, sustituciones y eliminación opcional del cinturón.
- Aprendizaje local por estilo, color, categoría y rango de precio; exploración por muestreo, olvido gradual y una o dos combinaciones sorpresa por lote.
- Catálogo navegable, búsqueda por nombre, filtro por estilo y descarga JSON.
- Comparación ficticia de cuatro tiendas demo. Las ofertas sin talla se separan; los totales parciales se indican.
- Diseño adaptable, tema oscuro según el sistema, controles de teclado y texto alternativo en las imágenes.

## Límites de la demostración

Los productos no existen: las fotografías son imágenes sintéticas generadas con ImageGen, no fotos de artículos disponibles en tiendas. Los nombres, materiales, tallas y precios describen conceptos de demostración. Las cuatro tiendas son ficticias; no existe relación con marcas reales, compra ni enlaces comerciales. Las existencias y descuentos se simulan de forma determinista; no incluyen gastos de envío.

El collage ayuda a visualizar una combinación, pero **no es una prueba virtual de ajuste**. La vista anterior de maniquí y subida de foto se ha sustituido por collages de producto. La estatura aporta una preferencia ligera por largos y no garantiza el ajuste físico.

El perfil, las preferencias y los conjuntos se guardan solo en `localStorage` con la clave `percha.women.photos.v2`. Los datos de la versión anterior permanecen intactos en su antigua clave, pero no se migran porque su catálogo era diferente. No hay cuentas, seguimiento entre dispositivos ni envío de valoraciones a un servidor.

## Archivos

- `index.html`: interfaz y recomendador en JavaScript sin dependencias.
- `assets/products/*.webp`: 51 imágenes optimizadas de hasta 720 × 720 px.
- `assets/catalog-source.json`: catálogo editable en el formato compacto utilizado por el prototipo.
- `assets/catalog.json`: exportación descriptiva para compartir y preparar una futura integración.
- `assets/image-prompts.json`: instrucciones utilizadas para generar las imágenes.
- `scripts/build_catalog.py`: optimización de imágenes y exportación del catálogo; requiere Pillow solo para mantenimiento.
- `tests/catalog.test.cjs`: comprobaciones del recomendador y estado; requiere Node.js solo para desarrollo.
- `DEMO-GUIDE.md`: recorrido de presentación y datos necesarios para conectar una tienda.

## Validar

```sh
node tests/catalog.test.cjs --assets
python3 scripts/build_catalog.py
```

La prueba recorre los trece estilos y los tres niveles de sorpresa, comprueba cinco conjuntos por lote, categorías, valoraciones, cambios, ordenación de ofertas, persistencia y recuperación de datos guardados inválidos. No requiere paquetes npm.
