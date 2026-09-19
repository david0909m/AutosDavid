# Fases del proyecto

Fecha límite indicada: domingo 20 de septiembre de 2026.

## Objetivo y alcance

Construir una SPA pequeña, adaptable a móvil y fácil de explicar, con catálogo de vehículos, búsqueda, filtros, ordenamiento, detalle y solicitud de cotización o prueba de manejo. Incluir validaciones y estados de carga, error y ausencia de resultados.

El alcance inicial usa datos de demostración y envío simulado. La interfaz debe comunicarlo con claridad. No se incluyen autenticación, pagos, administración ni backend.

## Fase 0 — Base del proyecto

- [x] Preparar React, TypeScript estricto y Vite.
- [x] Crear una pantalla inicial y estilos base.
- [x] Documentar ejecución, arquitectura y convenciones.
- [x] Definir fases y decisiones técnicas.
- [x] Verificar instalación, lint y compilación.

Aceptación: el template inicia y las verificaciones terminan sin errores.

## Fase 1 — Catálogo y acceso a datos

- [x] Definir el tipo `Vehicle`: identificador, marca, modelo, año, precio, moneda, categoría, transmisión, combustible, descripción e imagen.
- [x] Preparar 20 vehículos de demostración con imágenes locales y textos alternativos.
- [x] Crear una función de carga con `fetch`, comprobación de respuesta HTTP y validación básica de los datos recibidos.
- [x] Crear tarjetas y una cuadrícula adaptable a móvil.
- [x] Mostrar estados de carga, error recuperable con reintento y catálogo vacío.

Aceptación: se ve el catálogo; una petición fallida muestra un mensaje útil y permite reintentar. El JSON vacío muestra un estado propio. Para verificar la carga se puede limitar la velocidad de red en las herramientas del navegador.

## Fase 2 — Búsqueda, filtros y ordenamiento

- [x] Buscar por marca y modelo ignorando mayúsculas y espacios sobrantes.
- [x] Filtrar por categoría y ordenar por precio ascendente o descendente.
- [x] Calcular resultados sin duplicar el catálogo en el estado ni modificar el arreglo original al ordenar.
- [x] Mostrar cantidad de resultados y un botón para limpiar filtros.
- [x] Mostrar un mensaje específico cuando no haya coincidencias.

Aceptación: búsqueda, filtro y orden funcionan juntos. Limpiar filtros restaura el catálogo; ningún resultado se presenta como un error de red.

## Fase 3 — Detalle del vehículo

- [x] Mostrar imagen, descripción y especificaciones del vehículo seleccionado.
- [x] Permitir volver al catálogo conservando los filtros durante la sesión.
- [x] Añadir la acción de cotización o prueba de manejo vinculada al vehículo.
- [x] Gestionar el foco al cambiar de vista y al regresar al catálogo.

Decisión inicial: una vista dentro de la SPA controlada por el vehículo seleccionado. Incorporar rutas solo si se decide que el detalle necesita una URL compartible.

Aceptación: cada tarjeta abre su detalle correcto; se puede navegar con teclado y volver al catálogo.

## Fase 4 — Formulario de solicitud

- [x] Definir el tipo de solicitud y las propiedades del formulario.
- [x] Añadir nombre, correo, teléfono y tipo de solicitud; fecha preferida si se selecciona prueba de manejo.
- [x] Validar campos obligatorios, correo, teléfono y fecha no pasada cuando aplique.
- [x] Asociar etiquetas y errores a sus campos; conservar los datos ante un fallo.
- [x] Separar las validaciones y el envío simulado de la presentación.
- [x] Gestionar envío en curso, éxito y error; impedir envíos duplicados mientras se procesa.
- [x] Indicar que es una demostración y que la solicitud todavía no se envía a una empresa.

Aceptación: los datos inválidos no se envían, los mensajes explican cómo corregirlos y el comprobante deja claro que el envío es local y simulado. Verificar el error mediante un mecanismo controlado de desarrollo, no mediante fallos aleatorios.

## Fase 5 — Calidad y presentación

- [x] Revisar móvil, tableta y escritorio, sin desbordamientos horizontales.
- [x] Revisar teclado, foco visible, etiquetas, textos alternativos y contraste.
- [x] Verificar manualmente carga lenta, error, reintento, catálogo vacío y filtros sin coincidencias.
- [x] Añadir pruebas proporcionadas de filtros y validaciones si su complejidad lo justifica.
- [x] Ejecutar lint y compilación; probar la compilación con `npm run preview`.
- [x] Revisar nombres, comentarios y responsabilidades; retirar código sin uso.

Aceptación: el flujo catálogo → detalle → solicitud funciona y todos los estados requeridos son comprobables.

## Fase 6 — Entrega y explicación

- [ ] Actualizar el README para reflejar solo funcionalidades realmente terminadas.
- [ ] Verificar que GitHub sea público y que no existan secretos ni datos personales en el repositorio.
- [ ] Publicar la SPA, comprobar la URL desde una ventana privada y añadirla al README.
- [ ] Comprobar una instalación limpia con `npm ci`.
- [ ] Documentar limitaciones, asistencia de IA y posibles mejoras.
- [ ] Preparar una explicación breve de componentes, tipos, estado, carga de datos y validaciones.

Aceptación: otra persona puede clonar, ejecutar y comprender el proyecto siguiendo el README.

## Distribución sugerida

| Día | Trabajo |
| --- | --- |
| Miércoles 16 / jueves 17 | Base, catálogo y estados de carga. |
| Viernes 18 | Búsqueda, filtros y detalle. |
| Sábado 19 | Formulario, validaciones y revisión visual. |
| Domingo 20 | Verificación final, documentación y publicación. |

## Cómo explicar las decisiones

1. React divide la interfaz en componentes y actualiza la pantalla al cambiar el estado.
2. TypeScript describe los datos esperados, pero los datos externos y entradas del usuario también requieren validación en ejecución.
3. Vite prepara el entorno y genera los archivos estáticos para publicar.
4. El estado local cubre el alcance y reduce conceptos adicionales.
5. La función de servicio separa la fuente de datos de la interfaz y facilita migrar a una API.
6. Los comentarios explican finalidad y decisiones, mientras que los nombres describen las acciones.

## Mejoras después de la entrega

Prioridad alta: API real, validación en servidor, persistencia de solicitudes y tratamiento adecuado de datos personales.

Prioridad media: rutas compartibles, filtros en URL, paginación, pruebas de integración y administración del catálogo.

Prioridad posterior: favoritos, comparador, optimización de imágenes y ampliación del catálogo a servicios.
