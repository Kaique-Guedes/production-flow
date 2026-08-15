alter function public.role_for_etapa(public.etapa_producao) set search_path = public;
alter function public.next_etapa(public.etapa_producao) set search_path = public;
alter function public.prev_etapa(public.etapa_producao) set search_path = public;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
  loop
    execute format('revoke all on function %s from public, anon', r.sig);
  end loop;
end $$;

grant execute on function public.start_stage(uuid,text) to authenticated;
grant execute on function public.complete_stage(uuid,text) to authenticated;
grant execute on function public.return_stage(uuid,text) to authenticated;
grant execute on function public.set_lot_item_status(uuid,text,text) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_planner(uuid) to authenticated;
grant execute on function public.next_etapa(public.etapa_producao) to authenticated;
grant execute on function public.prev_etapa(public.etapa_producao) to authenticated;
grant execute on function public.role_for_etapa(public.etapa_producao) to authenticated;
grant execute on function public.can_work_etapa(uuid, public.etapa_producao) to authenticated;