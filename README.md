# Percha

Prototipo de app de moda en castellano. A partir de tu talla, número de calzado, estatura y estilo, propone cinco combinaciones de ropa y te dice en qué tienda de la península sale más barata cada prenda.

## Qué hace

- **Perfil:** colección (mujer, hombre o todo), talla, calzado (EU), estatura y de 1 a 4 estilos entre trece.
- **Cinco combinaciones por lote:** abrigo o chaqueta, prenda de arriba, pantalón o falda, calzado, bolso y cinturón opcional.
- **Dónde comprar:** comparación de precios entre tiendas españolas, con la existencia en tu talla.
- **Valoración y cambios:** cada combinación se valora de 1 a 5 y cada prenda se puede cambiar.
- **Modelo:** las prendas se dibujan sobre un maniquí o sobre una foto tuya en la que marcas 4 puntos.
- **Aprendizaje sin encasillar:** cada combinación sale de una muestra distinta de tus gustos (Thompson sampling), lo antiguo pierde peso en cada lote y siempre hay una combinación sorpresa. El nivel de sorpresa se puede ajustar.

## Limitaciones

- Precios, rebajas y tallas disponibles son **datos de ejemplo**. Los enlaces llevan a la página principal de cada tienda.
- Las prendas son ilustraciones, no fotos de producto. Para usar fotos reales hacen falta catálogos con licencia (programas de afiliación o acuerdos con las tiendas).
- La prueba sobre tu foto es aproximada, no fotorrealista.
- Las valoraciones se guardan solo en tu navegador (`localStorage`).
- La foto nunca sale del dispositivo: no se sube ni se guarda.

## Uso

Abre `index.html` en el navegador. No necesita instalación ni servidor.

## Publicación

Se publica con GitHub Pages desde la rama `main`, carpeta raíz.
