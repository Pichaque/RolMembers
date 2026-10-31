-- Migración 005: expone community_races a usuarios autenticados (RLS sigue aplicando).
-- Ejecutar en el editor SQL después de la 004.

grant select, insert, update, delete on table public.community_races to authenticated;
notify pgrst, 'reload schema';
