# AutosDavid

Aplicación web para explorar un catálogo de vehículos y solicitar una cotización, una prueba de manejo o una simulación de financiamiento.

La aplicación está construida como una SPA: el catálogo, el detalle del vehículo y el formulario se muestran sin recargar la página.

## Ejecutar el proyecto

Necesitas Node.js 22.12 o superior de la rama 22 y npm.

Instala las dependencias:

```bash
npm ci
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre la dirección que aparece en la terminal, normalmente `http://localhost:5173`. Para detener el servidor, usa `Ctrl + C`.

Para probar una versión compilada, ejecuta primero `npm run build` y después `npm run preview`.

### Otros comandos

| Comando | Descripción |
| --- | --- |
| `npm run lint` | Revisa el código con Oxlint. |
| `npm run build` | Comprueba los tipos y genera la aplicación en `dist/`. |
| `npm run preview` | Permite probar la compilación localmente después de ejecutar `build`. |

## Funcionalidades

- Catálogo de vehículos con tarjetas, imágenes y datos principales.
- Búsqueda por marca y modelo.
- Filtros por categoría y marca, además de ordenamiento por precio.
- Vista detallada con galería, especificaciones, versiones, colores y simulador de financiamiento.
- Formulario para cotización formal, con simulación de financiamiento cuando aplica, y prueba de manejo.
- Validación de nombre, correo, teléfono y fecha de prueba de manejo.
- Estados de carga, error con reintento, catálogo vacío y búsqueda sin coincidencias.
- Navegación con teclado, foco visible y textos alternativos para las imágenes.

El envío del formulario está simulado de forma local. La pantalla genera un comprobante de demostración, pero todavía no guarda datos ni los envía a un CRM, correo o asesor real.

## Tecnologías

- React para construir la interfaz con componentes.
- TypeScript para definir los datos y detectar errores durante el desarrollo.
- Vite para el servidor local y la compilación.
- CSS para los estilos y la adaptación a distintos tamaños de pantalla.
- Oxlint para la revisión estática del código.

## Organización

```text
src/
  components/       # Secciones visuales y controles reutilizables.
  hooks/             # Lógica reutilizable para carga y animaciones.
  services/          # Acceso a datos y simulación del envío.
  types/             # Contratos TypeScript de vehículos y solicitudes.
  styles/            # Tokens, estilos globales y estilos por sección.
  App.tsx            # Estado de la SPA y composición de las vistas.
  main.tsx           # Punto de entrada de React.
public/
  data/              # Índice y fichas JSON del catálogo.
  images/            # Imágenes locales de los vehículos.
docs/
  FASES.md           # Plan y criterios de aceptación.
  ATRIBUCIONES.md    # Fuentes y atribuciones de las imágenes.
```

## Decisiones técnicas

Elegí React con TypeScript para trabajar con componentes pequeños y tener una estructura clara para los datos de vehículos y solicitudes. Vite permite empezar con poca configuración y preparar la aplicación para publicarla.

Para los estilos utilizo CSS convencional. El estado se maneja con las herramientas de React, ya que el alcance inicial no requiere una librería adicional. Los filtros y el ordenamiento se calculan a partir del catálogo cargado, sin guardar una copia duplicada. El acceso a los datos está separado en servicios para que más adelante pueda sustituirse el JSON por una API.

La arquitectura mantiene las vistas dentro de la SPA y controla la pantalla actual con estado local. Si en el futuro se necesitan enlaces compartibles para cada vehículo, se puede incorporar un router sin reorganizar toda la aplicación.

## Rendimiento

Para revisar la carga de la aplicación utilicé Lighthouse. En la última medición local obtuve 78 en rendimiento, 95 en accesibilidad, 100 en buenas prácticas y 92 en SEO. La revisión ayudó a identificar que las imágenes eran el principal punto de mejora, por lo que se prepararon versiones optimizadas para el catálogo.

La medición se puede repetir con este comando:

```bash
npx lighthouse http://localhost:4173 --view
```

## Próximos pasos

El avance detallado y los criterios de aceptación están en [docs/FASES.md](docs/FASES.md).

El código está disponible en [GitHub](https://github.com/david0909m/AutosDavid) y la aplicación publicada puede verse en [AutosDavid en GitHub Pages](https://david0909m.github.io/AutosDavid/).

## Mejoras futuras

- Conectar una API y guardar las solicitudes en un backend.
- Enviar confirmaciones por correo o WhatsApp mediante un servicio autorizado.
- Agregar un panel para administrar el catálogo.
- Permitir compartir enlaces al detalle de un vehículo.
- Añadir favoritos y comparación de vehículos.
- Generar más versiones optimizadas de las imágenes y probar formatos como WebP o AVIF.
- Cargar la información que el usuario necesite en cada momento para reducir el peso inicial.
- Ampliar las pruebas automatizadas y seguir revisando el rendimiento.
