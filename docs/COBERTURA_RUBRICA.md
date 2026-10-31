# Cobertura de la rúbrica

Qué hay en el repositorio y qué no he podido comprobar. No he medido Lighthouse, no he entrado en Vercel y no he ejecutado SQL en Supabase.

## RA1 Arquitectura y roles (20%)

Evidencia: `core/permissions/permissions.ts`, stores, guards (`adminGuard`, `serverMemberGuard`, `permissionGuard`), directiva `*appPuede`, servicios separados y `docs/ARQUITECTURA.md`. Los tests de permisos y guards están en `ng test`.

No comprobado: que las políticas RLS dejen pasar o bloqueen cada acción con las tres cuentas. Ocultar un botón no demuestra la base.

## RA2 Formularios (15%)

Evidencia: Reactive Forms en login, registro, comunidades, personaje (con `FormArray` de rasgos), evento, anuncio e invitación. Validadores asíncronos con debounce y tests con dobles. Estados de «comprobando» y `aria-invalid`.

No comprobado: las RPC en vivo. `p_exclude` fallará hasta aplicar la migración 003.

## RA3 Componentes (15%)

Evidencia: `tabla-datos`, `calendario-mes`, `tablon-eventos`, `ficha-personaje`, `widget-estadistica`, `exportar-informe`, `grafico` y `tirador-dados`, con `input()` y `output()`. Las páginas de calendario, panel, personajes y administración los usan.

No comprobado: el teclado del calendario en un navegador real en esta tanda.

## RA4 Usabilidad y WCAG (15%)

Evidencia: modo claro, oscuro y sistema; doce presets; `shared/utils/contrast.ts` con tests en ambos modos; tipografía autoalojada; skip link; `lang="es"`; `title` por ruta; foco visible; áreas de 2,75 rem; tablas con `caption` y `scope`; A-/A+; `prefers-reduced-motion`; cortes de estilo a 360, 768 y 1280 px.

No comprobado: Lighthouse, el contraste medido con una herramienta externa, ni la revisión visual a esas tres anchuras. El objetivo de 95 puntos no está medido.

## RA5 Datos e informes (15%)

Evidencia: calendario con asistencia, tablón Realtime, `DocumentStoreService`, `/admin/dashboard` con Chart.js y `forkJoin`, CSV con `;`, BOM y saneado (test) y PDF con jsPDF. El panel de usuario usa conteos reales.

No comprobado: dos navegadores viendo el tablón a la vez, ni abrir el PDF y el CSV en un programa externo. Los totales de `doc_feed` y `doc_dice` no cambian con el filtro de fechas.

## RA6 Documentación (10%)

Evidencia: TSDoc de clase, `npm run docs` (Compodoc generó `documentation/` en local; no se versiona), `README.md`, `docs/MANUAL_USUARIO.md`, `/ayuda` y `docs/ARQUITECTURA.md`.

No comprobado: que Compodoc cubra cada método con `@param`. La cobertura que muestra Compodoc no la copié como porcentaje porque el HTML la calcula en el navegador.

## RA7 Git y despliegue (10%)

Evidencia: ramas `feature/*`, commits convencionales, `vercel.json`, `scripts/set-env.js`, `build:ci`, service worker de producción y `.github/workflows/ci.yml`.

No comprobado: GitHub Actions en verde, la protección de `Main` y el sitio en Vercel. No he hecho push.
