# Arquitectura

La aplicación es Angular standalone. Los componentes no hablan con Supabase: lo hacen los servicios y los stores.

## Dos clientes para la misma base

- `supabase-js` crea, actualiza y se suscribe (auth, RPC, escrituras).
- `SqlApiService` lee por HTTP (`/rest/v1`) en el panel. `supabaseInterceptor` añade `apikey` y `Authorization` solo a esa URL, cierra sesión ante un 401 y muestra un toast si la petición falla.

Conviven porque el enunciado pide una fuente SQL por HTTP y, a la vez, el cliente oficial cubre auth y RPC sin reimplementarlas.

## Permisos

`core/permissions/permissions.ts` es la única matriz. `CommunityStore.can` la aplica con el rol activo: administrador global, o el rol en la comunidad abierta. Ocultar un botón no sustituye a RLS.

## NoSQL simulado

Supabase es PostgreSQL. El enunciado permite simular un segundo almacén de documentos, así que `doc_feed` y `doc_dice` guardan jsonb y avisan con Realtime (`postgres_changes`, filtro `server_id`). No hay una base NoSQL aparte. `DocumentStoreService` es el único cliente de esas tablas: lista, inserta y cierra el canal con `removeChannel` al salir de la página.

Los anuncios son filas `kind = 'announcement'`. Las noticias `character_created`, `event_created` y `attendance` las escriben los servicios al crear un personaje, publicar una sesión o guardar la asistencia.

## Capas

Las páginas componen la vista y llaman a servicios. Los componentes de `shared/components` reciben datos con `input()` y emiten con `output()`. Los stores guardan la sesión y la comunidad activa. Los guards esperan a `auth.initialize()` antes de decidir.

## Guards e interceptor

- `authGuard` exige sesión. Si no la hay, va a `/login`.
- `adminGuard` deja pasar solo al administrador global. El resto va a `/forbidden`.
- `serverMemberGuard` exige ser miembro de `servers/:id`, o administrador.
- `permissionGuard` consulta la matriz.
- `supabaseInterceptor` añade `apikey` y `Authorization` a la URL de Supabase, cierra la sesión en un 401 y muestra un toast si la petición falla.

## Esquema y RLS

Las tablas son `profiles`, `servers`, `server_invites`, `server_members`, `characters`, `events`, `event_attendance`, `doc_feed` y `doc_dice`. No hay claves foráneas: las referencias son uuid. Las políticas RLS son la seguridad. El cliente no usa `service_role`.

Las funciones usadas son `invite_code_valid`, `join_server`, `create_community`, `delete_community`, `regenerate_invite_code`, `character_name_available`, `event_conflict` y `admin_set_global_role`. `p_exclude` llega al editar un nombre o un evento y depende de la migración 003.

## Decisiones

- Reactive Forms y OnPush en los componentes.
- Dos clientes de datos, descritos arriba, porque el enunciado pide HTTP y también auth, RPC y Realtime.
- El contraste de los 12 presets se comprueba con funciones puras antes de guardar un tema.
- El service worker solo se registra en producción.

## Stores

`SessionStore` guarda sesión y perfil. `CommunityStore` guarda membresías y la comunidad activa.
