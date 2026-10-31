# Migraciones

La fuente de verdad del esquema es esta carpeta. Los scripts `001_esquema_inicial.sql` y `002_comunidades_usuarios.sql` no estaban en el repositorio ni en Descargas (el SQL de `Dei/supabase/sql` es de otro laboratorio, con `clients` y `profiles.role`, y no coincide con la base vigente). Hay que pegarlos aquí antes de darlos por versionados.

`003_validaciones_editar.sql` tampoco se ha pegado. El cliente envía `p_exclude` al editar un personaje o un evento. Hasta que esa migración se ejecute en Supabase, esa edición puede fallar con un error de parámetro.
