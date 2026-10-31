# Checklist de entrega

Lo que queda fuera del código. No lo he hecho yo.

## Base de datos

- [ ] Pegar y ejecutar `001`, `002` y `003` en ese orden. Ver `supabase/APLICAR_EN_ORDEN.md`.
- [ ] Ejecutar `seed_demo_v2.sql` si lo tienes. No está en el repositorio.
- [ ] Crear tres usuarios de prueba y anotar correo, contraseña y comunidad de cada uno: administrador, narrador y roleador. Esas credenciales van solo en el PDF de entrega, no en el repositorio.
- [ ] Dar el rol global `admin` con la función `admin_set_global_role` al usuario administrador. El narrador es el creador de su comunidad o un miembro con rol `narrator`.

## Git y GitHub

- [ ] Abrir los pull requests en este orden, hacia `develop`: `feature/bloque-0` (si aún no está), `feature/arquitectura-permisos`, `feature/formularios-reactivos`, `feature/componentes`, `feature/personajes-calendario`, `feature/realtime-docs`, `feature/dashboard-informes`, `feature/a11y-estetica`, `feature/pwa-ci`, `feature/documentacion`, `feature/cierre`.
- [ ] Fusionar cada uno antes de abrir el siguiente, o usar como base la rama anterior. Si los abres todos contra `develop` a la vez, los últimos arrastran los commits anteriores.
- [ ] Nada de esto está pusheado desde aquí.
- [ ] La rama principal se llama `Main`, no `main`. No la he renombrado.
- [ ] Proteger `Main`: Settings → Branches → Branch protection → exigir pull request y el check `verificar` de `.github/workflows/ci.yml` en verde. El workflow necesita los secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
- [ ] No reescribir el historial. El commit antiguo de `Main` puede seguir conteniendo un `environment.ts` de antes del `.gitignore`. Compruébalo y, si hace falta rotar la clave anónima, hazlo en el panel de Supabase.

## Vercel

- [ ] Importar el repositorio. Framework: Other.
- [ ] Build Command: `npm run build:ci`
- [ ] Output Directory: `www`
- [ ] Variables: `SUPABASE_URL` y `SUPABASE_ANON_KEY` (la anon key, nunca `service_role`).
- [ ] `vercel.json` ya reescribe las rutas a `/index.html`.
- [ ] No he comprobado que el despliegue funcione.

## Lighthouse y PDF

- [ ] En la URL de producción, ventana de incógnito, móvil y escritorio: Lighthouse de Accessibility y Best Practices. Guardar las capturas.
- [ ] El ZIP `APELLIDOS_NOMBRE_DI_PROYECTO.zip` lleva solo el PDF.
- [ ] El PDF incluye: URL del repositorio, URL de producción, credenciales de prueba (admin, narrador, roleador y su comunidad), informe Lighthouse y el enlace o la carpeta de Compodoc más el manual.
- [ ] Compodoc se regenera con `npm run docs` en `documentation/`. Esa carpeta no está en git.
- [ ] Las capturas del README las pones tú.

## Lo que sí quedó ejecutado en local

Build de producción, lint y `npm run test:ci` (12 tests) en el cierre. El build avisa del presupuesto CSS de cuatro hojas y de módulos CommonJS de jsPDF. No abrí la app en el navegador en esta tanda.
