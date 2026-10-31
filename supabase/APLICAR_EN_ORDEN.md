# SQL que hay que aplicar a mano

No ejecuté nada de esto. Los archivos `001`, `002`, `003` y `seed_demo_v2.sql` no están en el repositorio. El SQL de otro laboratorio (`clients`, `profiles.role`) no sirve para esta aplicación.

## Orden

1. Pega en `supabase/migrations/` los tres scripts con estos nombres, si todavía no los tienes:
   - `001_esquema_inicial.sql`
   - `002_comunidades_usuarios.sql`
   - `003_validaciones_editar.sql`
2. En el editor SQL de Supabase, ejecuta **001**, espera a que termine, luego **002** y después **003**. No cambies el orden.
3. Si tienes `seed_demo_v2.sql`, ejecútalo el último. Tampoco está en este repositorio. Sin esa semilla no hay usuarios ni comunidades de prueba.
4. **`004_razas_y_retratos.sql`** (en `supabase/migrations/`): tabla `community_races`, políticas RLS y bucket `retratos`. **Ya aplicada** en el proyecto de referencia; ejecútala solo si tu instancia aún no la tiene.
5. **`005_permiso_razas.sql`**: concede `SELECT/INSERT/UPDATE/DELETE` en `community_races` al rol `authenticated` (la RLS sigue filtrando). **Pendiente**: ejecútala en el editor SQL después de la 004 si al listar razas ves «permission denied» o el aviso de la migración 005 en la app.

El cliente ya llama a `character_name_available` y `event_conflict` con `p_exclude` al editar. Hasta que la 003 esté aplicada, esa edición responde con un error de parámetro.

## Comprobación

Después de la 003, estas consultas deben cuadrar con el esquema de `.cursor/rules/comunidad-rol.mdc`.

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles', 'servers', 'server_invites', 'server_members',
    'characters', 'events', 'event_attendance', 'doc_feed', 'doc_dice'
  )
order by table_name;
```

Deben salir las nueve tablas. No debe existir `announcements`.

```sql
select proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'invite_code_valid', 'join_server', 'create_community', 'delete_community',
    'regenerate_invite_code', 'character_name_available', 'event_conflict',
    'admin_set_global_role'
  )
order by proname;
```

`character_name_available` y `event_conflict` tienen que listar `p_exclude`. Si no aparece, la 003 no está aplicada.

```sql
select relname, relrowsecurity
from pg_class
where relname in (
  'profiles', 'servers', 'server_members', 'characters',
  'events', 'event_attendance', 'doc_feed', 'doc_dice', 'community_races'
);
```

`relrowsecurity` tiene que ser `true` en todas. No desactives RLS.
