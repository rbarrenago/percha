# Presentar Percha a una cadena de tiendas

## Recorrido de 5 minutos

1. Explica el alcance: «Esta es una demostración con productos ficticios y fotografías generadas con IA. Con vuestro catálogo, las mismas pantallas mostrarían vuestros artículos reales».
2. Introduce un perfil: talla M, calzado 38, estatura 168 cm, Casual y Minimalista. Pulsa «Ver mis combinaciones».
3. Muestra los cinco collages. La combinación Sorpresa demuestra que la personalización también permite descubrir estilos nuevos.
4. Valora un conjunto con 5 y otro con 1. Abre «Cambiar» para sustituir una prenda, mostrando las alternativas y el comodín.
5. Pulsa «Otras 5 combinaciones» para mostrar cómo las nuevas recomendaciones usan las señales recogidas.
6. Abre «Dónde comprar». Explica que los importes, existencias y tiendas están simulados. Para una cadena con varias tiendas, esta vista podría mostrar disponibilidad por ubicación o canal, según los datos que facilite.
7. Explora el catálogo y filtra por Romántico, Boho o Streetwear. Todas las imágenes corresponden al mismo producto conceptual que figura en cada ficha y conjunto.

## Qué solicitar a la tienda

Un pequeño catálogo autorizado sería suficiente para el primer piloto. Puede entregarse en CSV, JSON o mediante un feed/API. Para cada artículo:

| Campo | Ejemplo o finalidad |
| --- | --- |
| Identificador estable | SKU del producto y de sus variantes |
| Nombre y descripción | Nombre comercial, tejido y corte |
| Categoría y colección | Jersey, pantalón, botas; mujer |
| Imagen y permiso de uso | URL de producto y condiciones de visualización, copia o caché |
| Color | Color comercial y familia normalizada |
| Tallas y existencias | Disponibilidad por talla y canal o tienda |
| Precio y moneda | Precio vigente, rebaja y EUR |
| Enlace de producto | Página exacta donde comprar la variante |
| Fecha de actualización | Momento de la última sincronización |
| Identificadores compartidos | GTIN/EAN, marca y modelo si procede |

El producto y sus ofertas deben tener identidades separadas. Solo se compara el mismo modelo, color y talla entre vendedores cuando haya una identificación fiable; productos parecidos se presentan como alternativas.

## Sustituir el catálogo demo

1. Acordar el permiso de uso de datos e imágenes y los canales incluidos.
2. Normalizar las categorías, tallas, colores y etiquetas de estilo del catálogo.
3. Sustituir los productos ficticios y asociar imágenes reales a identificadores estables. No mantener valoraciones antiguas ligadas a identificadores reutilizados para otros productos.
4. Sustituir `offersFor()` e `inStock()` por ofertas reales y disponibilidad por variante. Mostrar cuándo se consultaron, envío y condiciones cuando se conozcan.
5. Incorporar importación periódica o un backend cuando sea necesario mantener precios y existencias al día. Mantener las claves de proveedor fuera del navegador.
6. Activar enlaces a fichas exactas y revisar los datos antes de cambiar las etiquetas de demostración.

El piloto actual no estima conversiones, ventas ni precisión de tallaje. Es una demostración funcional de navegación, descubrimiento y personalización local.
