# Comunidad de Rol

Aplicación para organizar partidas de rol: comunidades, personajes, calendario, tablón y dados. Está hecha con Ionic, Angular standalone y Supabase.

## Tecnologías

- Angular 22 e Ionic 9, componentes standalone y signals
- Supabase Auth, PostgreSQL y Realtime
- Chart.js para los gráficos del administrador
- jsPDF para los informes

## Instalación

```bash
npm ci
```

Copia `src/environments/environment.example.ts` a `src/environments/environment.ts` y a `src/environments/environment.prod.ts`. Rellena la URL del proyecto y la clave anónima (anon key). No uses la clave `service_role` y no subas esos archivos: están en `.gitignore`.

En integración continua las mismas variables se llaman `SUPABASE_URL` y `SUPABASE_ANON_KEY`. El script `npm run build:ci` las escribe antes de compilar.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm start` | Servidor de desarrollo |
| `npm run lint` | ESLint |
| `npm run test:ci` | Tests una sola vez |
| `npm run build` | Build de producción (necesita `environment.prod.ts`) |
| `npm run build:ci` | Genera los entornos y compila |
| `npm run docs` | Genera la documentación con Compodoc en `documentation/` |

## Roles

| Rol | Dónde | Qué puede hacer |
| --- | --- | --- |
| Administrador | Global | Panel, informes, todas las comunidades |
| Narrador | Una comunidad | Eventos, anuncios, aprobar personajes, miembros |
| Roleador | Una comunidad | Su personaje, asistencia y dados |
| Usuario | Global | Crear comunidad (hasta tres si no es administrador) |

La seguridad real son las políticas RLS. La interfaz solo oculta lo que ese rol no usa.

## NoSQL simulado

`doc_feed` y `doc_dice` son tablas PostgreSQL con jsonb y Realtime. No hay una base de documentos aparte. El detalle está en `docs/ARQUITECTURA.md`.

## Despliegue

El directorio de salida es `www`. En Vercel: Build Command `npm run build:ci`, Output Directory `www`, y las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY`. `vercel.json` reescribe las rutas a `index.html`.

El service worker solo se registra en el build de producción.

## Capturas

Aquí van las capturas de la portada, una comunidad, el calendario y el panel de administración. Las añado yo antes de la entrega.

## Enlaces

- Repositorio: el de esta entrega
- Producción: la URL de Vercel, cuando esté conectada
- Manual: `docs/MANUAL_USUARIO.md` y la página `/ayuda`
- Arquitectura: `docs/ARQUITECTURA.md`
