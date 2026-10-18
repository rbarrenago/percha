# Pruebas fotográficas sobre modelo

## Lo que funciona sin servicio de IA

Abre `index.html`. El botón **Ver 5 looks de ejemplo**, dentro de **Tu modelo**, carga cinco combinaciones con fotografías generadas previamente de la misma modelo adulta ficticia. Incluyen todas sus cinco o seis prendas y accesorios. Puedes ampliar las fotos, valorar los looks, comparar ofertas y alternar entre modelo y collage.

Las imágenes de ejemplo solo se muestran cuando coinciden exactamente las prendas y el modelo de referencia. Al cambiar una prenda o seleccionar una foto personal, la imagen anterior deja de mostrarse. Los perfiles existentes con valoraciones se conservan; puedes cargar los ejemplos con su botón.

Puedes cargar y quitar tu foto sin activar el servicio. Hasta que generes una prueba, esa imagen se muestra claramente como **foto de referencia, todavía sin esta combinación**. No se presenta como si llevara las prendas.

## Activar las pruebas de nuevas combinaciones y fotos personales

Hace falta Node.js 22 o posterior y una clave de OpenAI con acceso a GPT Image 2 y facturación disponible. No necesita paquetes npm. La app usa la API de edición de imágenes con la foto de referencia y las fotos de las cinco o seis prendas.

1. Copia `.env.example` a `.env`, dentro de la carpeta del proyecto.
2. Introduce tu clave en `OPENAI_API_KEY` dentro de `.env`. No la pegues en el chat, el HTML ni GitHub. `.env` está excluido de Git.
3. Ejecuta:

```sh
node --env-file=.env server.mjs
```

4. Abre http://127.0.0.1:8765.
5. En **Tu modelo**, elige el modelo de estudio o carga una foto de cuerpo entero. Autoriza el envío de la foto y las prendas a OpenAI.
6. Pulsa **Generar prueba con IA** en cada combinación pendiente. La generación puede tardar unos minutos y usa el servicio de pago de tu cuenta.

También puedes iniciar `node server.mjs` sin clave para ver la demo y comprobar el aviso de servicio sin activar.

El servidor incluido escucha únicamente en el dispositivo local. GitHub Pages sirve las cinco fotografías de ejemplo, el catálogo y la interfaz, pero no ejecuta este servidor ni mantiene claves privadas. Un despliegue público del generador requerirá un servidor adecuado con acceso controlado y límites de uso; este servidor está pensado para demostraciones locales.

## Fotos personales y límites

- La selección de una foto no la envía automáticamente. Se prepara en memoria en esta pestaña, a un máximo de 1600 px por lado, sin sus metadatos originales.
- Generar una prueba envía esa foto y las fotos de producto a OpenAI, a través del servidor local. Hace falta autorización explícita en la interfaz.
- La aplicación y el servidor no escriben las fotos personales ni los resultados nuevos en archivos, registros o `localStorage`. Su tratamiento por OpenAI depende de las condiciones de la cuenta y del proveedor.
- Las pruebas nuevas viven en memoria; cerrar o recargar la pestaña las elimina. Quitar tu foto elimina también sus resultados y cancela la petición activa. Una cancelación no retira una solicitud que ya hubiera llegado al proveedor ni garantiza que no se haya consumido servicio.
- Cada imagen se vincula al conjunto exacto de prendas y a la persona seleccionada. Las respuestas tardías de una foto o combinación anterior no sustituyen la vista actual.
- La IA puede variar detalles y no calcula la talla real ni garantiza el ajuste. Conservamos las fotos originales junto al resultado para poder compararlas.
- Nunca compartas una clave de servicio mediante el navegador o un repositorio.

## Comprobaciones

```sh
node tests/catalog.test.cjs --assets
node tests/tryon-client.test.cjs --assets
node --test tests/tryon-server.test.mjs
```

Las pruebas de servidor usan respuestas simuladas; no envían fotos a OpenAI ni consumen generaciones. Comprueban el envío de seis o siete referencias, consentimiento, validación, errores, disponibilidad sin clave y exclusión de archivos privados. Las pruebas de cliente comprueban que las imágenes antiguas no se reutilizan tras cambiar prendas o persona.

Referencia oficial de la integración: https://developers.openai.com/api/reference/resources/images/methods/edit
