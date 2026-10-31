# Progreso

## Bloque 0

- [x] Reglas en `.cursor/rules/comunidad-rol.mdc`
- [x] Tipos alineados con el esquema y `p_exclude` opcional en el cliente
- [x] Higiene de gitignore, entornos y `build:ci`
- [x] `docs/GIT_FLOW.md`
- [ ] Pegar migraciones 001, 002 y 003 (pendiente del alumno; no están en el repo)

## Bloque 1

- [x] Matriz `PERMISSIONS` y `puede()`
- [x] `SessionStore` y `CommunityStore` con `@ngrx/signals`
- [x] `adminGuard`, `serverMemberGuard`, `permissionGuard`
- [x] Página `/forbidden`
- [x] Directiva `*appPuede`
- [x] `SqlApiService` e interceptor (apikey, Bearer, 401, toast)
- [x] Menú lateral y barra inferior según rol
- [x] Servicios `Community`, `Member`, `Character`, `Invite` y detalle partido
- [x] Crear, miembros, código, tema y eliminar con confirmación escrita
- [x] `ng build --configuration production`, `ng lint`, `ng test --configuration ci`

## Bloque 2

- [x] Formularios reactivos y OnPush en todos los componentes
- [x] Validadores asíncronos con debounce (slug, personaje, evento con `p_exclude`, invitación)
- [x] Estados de comprobación y atributos aria
- [x] `model()` en `app-buscador` con `[(valor)]`
- [x] `ng build --configuration production`, `ng lint`, `ng test --configuration ci`

## Bloque 3

- [x] `tabla-datos`, `calendario-mes`, `tablon-eventos`, `ficha-personaje`, `widget-estadistica`, `exportar-informe` (`input()`/`output()`, sin servicios de datos)
- [x] Calendario, panel y ficha de comunidad usan esos componentes
- [x] `ng build --configuration production` (avisos de presupuesto CSS), `ng lint`, `ng test --configuration ci` (3 tests)

## Bloque 4

- [x] Página `/servers/:id/personajes` con ficha (FormArray de rasgos), aprobación y edición solo del dueño
- [x] Calendario global: filtro, detalle del día, asistencia `yes|maybe|no` con recuento y `aria-pressed`
- [x] Anuncios en `doc_feed` (`kind = announcement`): publicar y borrar
- [x] `ng build --configuration production` (avisos CSS), `ng lint`, `ng test --configuration ci` (3 tests)
- [ ] Probar el flujo con tres cuentas y `seed_demo_v2.sql` (pendiente del alumno; no hay semilla en el repo)

## Bloque 5

- [x] `DocumentStoreService` sobre `doc_feed` y `doc_dice`, Realtime filtrado y `removeChannel`
- [x] Página `/servers/:id/tablon` con `aria-live`, anuncios y noticias automáticas
- [x] `tirador-dados` con `crypto.getRandomValues`
- [x] Nota de NoSQL simulado en `docs/ARQUITECTURA.md`
- [x] `ng build --configuration production` (avisos CSS), `ng lint`, `ng test --configuration ci` (3 tests)
- [ ] Comprobar dos navegadores en directo (pendiente del alumno; hace falta la migración de `doc_*` y Realtime)

## Bloque 6

- [x] `/admin/dashboard` con `adminGuard`, KPIs, 4 gráficos (Chart.js, `role="img"`, "Ver como tabla") y filtros con `computed()`
- [x] Carga con `forkJoin` (SQL REST + conteos de `doc_feed` y `doc_dice`)
- [x] CSV (`;`, BOM, saneado) y PDF (jspdf + autotable) en `exportar-informe`
- [x] Panel de usuario con comunidades, próximas sesiones y personajes pendientes reales
- [x] `ng build --configuration production` (avisos CSS y CommonJS de jspdf), `ng lint`, `ng test --configuration ci` (4 tests, incluido el saneado CSV)
- [ ] Abrir el PDF y el CSV descargados en un programa externo (pendiente del alumno)

## Bloque 7

- [x] Modo claro, oscuro y sistema (`prefers-color-scheme`, `localStorage`) y tamaño de texto A-/A+
- [x] 12 presets; el editor rechaza paletas por debajo de 4.5:1 (texto) y 3:1 (componente)
- [x] `shared/utils/contrast.ts` y tests de los 12 presets en ambos modos
- [x] Tipografía Source Sans 3 y Source Serif 4 autoalojada, skip link, foco, 44 px, tablas con caption/scope, `prefers-reduced-motion` y cortes a 360/768/1280
- [x] `ng build --configuration production` (avisos CSS y CommonJS), `ng lint`, `ng test --configuration ci` (6 tests)
- [ ] Revisión visual a 360, 768 y 1280 y Lighthouse (pendiente del alumno)

## Bloque 8

- [x] Tests de contraste, permisos, validadores, guards, CSV e informes (12 tests)
- [x] PWA: manifest, iconos, `ngsw-config.json` y service worker solo en producción
- [x] `vercel.json`, `scripts/set-env.js`, `build:ci` y `.github/workflows/ci.yml`
- [x] `ng build --configuration production` (genera `ngsw-worker.js`; avisos CSS y CommonJS), `ng lint`, `ng test --configuration ci`
- [ ] Conectar Vercel, secretos de GitHub y la protección de `Main` (pendiente del alumno)

## Bloque 9

- [x] TSDoc de clase en servicios, stores, guards y componentes
- [x] Compodoc (`npm run docs` generó `documentation/`; esa carpeta no se versiona)
- [x] `README.md` sin claves, `docs/MANUAL_USUARIO.md` y `/ayuda` con acordeones
- [x] `docs/ARQUITECTURA.md` con capas, guards, esquema y decisiones
- [x] `ng build --configuration production` (avisos CSS y CommonJS), `ng lint`, `ng test --configuration ci` (12 tests)

## Bloque 10

- [x] Búsqueda: sin `*ngIf`/`*ngFor`, sin `console.log`, sin `: any` ni `$any`, sin `service_role` en `src`; los `@Component` encontrados usan OnPush
- [x] `console.debug` de auth solo fuera de producción y sin imprimir la contraseña
- [x] `supabase/APLICAR_EN_ORDEN.md`, `ENTREGA_CHECKLIST.md` y `docs/COBERTURA_RUBRICA.md`
- [x] Cierre: `ng lint`, `ng test --configuration ci` (12 tests) y `ng build --configuration production` (avisos CSS y CommonJS de jsPDF)
- [ ] Aplicar SQL, Vercel, Lighthouse y el PDF (pendiente del alumno)
