-- ========== ENUMS ==========
create type public.app_role as enum ('administrador','planejamento','preparativo','montagem','solda','acabamento');
create type public.etapa_producao as enum ('preparativo','montagem','solda','acabamento','concluido');

-- ========== PROFILES ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_planner(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('administrador','planejamento'))
$$;

create or replace function public.role_for_etapa(_etapa public.etapa_producao)
returns public.app_role language sql immutable as $$
  select case _etapa
    when 'preparativo' then 'preparativo'::public.app_role
    when 'montagem' then 'montagem'::public.app_role
    when 'solda' then 'solda'::public.app_role
    when 'acabamento' then 'acabamento'::public.app_role
    else null end
$$;

create or replace function public.can_work_etapa(_user_id uuid, _etapa public.etapa_producao)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'administrador')
      or public.has_role(_user_id, public.role_for_etapa(_etapa))
$$;

create policy "profiles_select_auth" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_self_or_admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'administrador'));

create policy "roles_select_auth" on public.user_roles for select to authenticated using (true);
create policy "roles_insert_admin_or_bootstrap" on public.user_roles for insert to authenticated
  with check (
    public.has_role(auth.uid(),'administrador')
    or (not exists (select 1 from public.user_roles) and user_id = auth.uid() and role = 'administrador')
  );
create policy "roles_delete_admin" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(),'administrador'));

-- ========== CLIENTES ==========
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  contact text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;
create policy "clients_select_auth" on public.clients for select to authenticated using (true);
create policy "clients_write_planner" on public.clients for all to authenticated
  using (public.is_planner(auth.uid())) with check (public.is_planner(auth.uid()));

-- ========== ORDENS DE SERVICO ==========
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  numero text not null unique,
  pedido text,
  status text not null default 'aberta' check (status in ('aberta','em_producao','atrasada','concluida')),
  data_abertura date not null default current_date,
  prazo date,
  peso_total numeric(14,2) not null default 0,
  peso_concluido numeric(14,2) not null default 0,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.work_orders to authenticated;
grant all on public.work_orders to service_role;
alter table public.work_orders enable row level security;
create policy "wo_select_auth" on public.work_orders for select to authenticated using (true);
create policy "wo_write_planner" on public.work_orders for all to authenticated
  using (public.is_planner(auth.uid())) with check (public.is_planner(auth.uid()));

-- ========== DESENHOS ==========
create table public.drawings (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  codigo text not null,
  descricao text,
  revisao text,
  peso_total numeric(14,2) not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.drawings to authenticated;
grant all on public.drawings to service_role;
alter table public.drawings enable row level security;
create policy "dw_select_auth" on public.drawings for select to authenticated using (true);
create policy "dw_write_planner" on public.drawings for all to authenticated
  using (public.is_planner(auth.uid())) with check (public.is_planner(auth.uid()));

-- ========== ITENS DO DESENHO ==========
create table public.drawing_items (
  id uuid primary key default gen_random_uuid(),
  drawing_id uuid not null references public.drawings(id) on delete cascade,
  codigo_item text not null,
  descricao text,
  quantidade numeric(12,2) not null default 1,
  peso_unitario numeric(12,3) not null default 0,
  peso_total numeric(14,3) generated always as (quantidade * peso_unitario) stored,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.drawing_items to authenticated;
grant all on public.drawing_items to service_role;
alter table public.drawing_items enable row level security;
create policy "di_select_auth" on public.drawing_items for select to authenticated using (true);
create policy "di_write_planner" on public.drawing_items for all to authenticated
  using (public.is_planner(auth.uid())) with check (public.is_planner(auth.uid()));

-- ========== LOTES ==========
create table public.production_lots (
  id uuid primary key default gen_random_uuid(),
  drawing_id uuid not null references public.drawings(id) on delete cascade,
  numero_lote text not null,
  quantidade numeric(12,2) not null default 1,
  peso numeric(14,2) not null default 0,
  etapa_atual public.etapa_producao not null default 'preparativo',
  status text not null default 'aguardando' check (status in ('aguardando','em_execucao','concluido')),
  responsavel_id uuid references auth.users(id),
  etapa_iniciada_em timestamptz,
  etapa_desde timestamptz not null default now(),
  concluido_em timestamptz,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (drawing_id, numero_lote)
);
grant select, insert, update, delete on public.production_lots to authenticated;
grant all on public.production_lots to service_role;
alter table public.production_lots enable row level security;
create policy "lot_select_auth" on public.production_lots for select to authenticated using (true);
create policy "lot_write_planner" on public.production_lots for all to authenticated
  using (public.is_planner(auth.uid())) with check (public.is_planner(auth.uid()));

-- ========== ITENS DO LOTE ==========
create table public.lot_items (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.production_lots(id) on delete cascade,
  drawing_item_id uuid not null references public.drawing_items(id) on delete cascade,
  quantidade numeric(12,2) not null default 1,
  obrigatorio boolean not null default true,
  status text not null default 'aguardando' check (status in ('aguardando','em_preparacao','pausado','concluido')),
  responsavel_id uuid references auth.users(id),
  iniciado_em timestamptz,
  concluido_em timestamptz,
  observacao text,
  created_at timestamptz not null default now(),
  unique (lot_id, drawing_item_id)
);
grant select, insert, update, delete on public.lot_items to authenticated;
grant all on public.lot_items to service_role;
alter table public.lot_items enable row level security;
create policy "li_select_auth" on public.lot_items for select to authenticated using (true);
create policy "li_write_planner" on public.lot_items for all to authenticated
  using (public.is_planner(auth.uid())) with check (public.is_planner(auth.uid()));

-- ========== ETAPAS (TEMPOS) ==========
create table public.lot_stages (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.production_lots(id) on delete cascade,
  etapa public.etapa_producao not null,
  data_inicio timestamptz,
  data_fim timestamptz,
  usuario_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (lot_id, etapa)
);
grant select on public.lot_stages to authenticated;
grant all on public.lot_stages to service_role;
alter table public.lot_stages enable row level security;
create policy "ls_select_auth" on public.lot_stages for select to authenticated using (true);

-- ========== HISTORICO ==========
create table public.lot_history (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.production_lots(id) on delete cascade,
  acao text not null,
  etapa_anterior public.etapa_producao,
  etapa_nova public.etapa_producao,
  usuario_id uuid references auth.users(id),
  observacao text,
  created_at timestamptz not null default now()
);
grant select on public.lot_history to authenticated;
grant all on public.lot_history to service_role;
alter table public.lot_history enable row level security;
create policy "lh_select_auth" on public.lot_history for select to authenticated using (true);

-- ========== PESOS AUTOMATICOS ==========
create or replace function public.recalc_drawing_weight(_drawing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.drawings d
     set peso_total = coalesce((select sum(peso_total) from public.drawing_items where drawing_id = d.id),0)
   where d.id = _drawing_id;
  update public.work_orders w
     set peso_total = coalesce((select sum(peso_total) from public.drawings where work_order_id = w.id),0)
   where w.id = (select work_order_id from public.drawings where id = _drawing_id);
end; $$;

create or replace function public.recalc_lot_weight(_lot_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.production_lots l
     set peso = coalesce((
          select sum(li.quantidade * di.peso_unitario)
            from public.lot_items li
            join public.drawing_items di on di.id = li.drawing_item_id
           where li.lot_id = l.id),0),
         quantidade = coalesce((select sum(quantidade) from public.lot_items where lot_id = l.id), l.quantidade)
   where l.id = _lot_id;
end; $$;

create or replace function public.recalc_work_order(_wo_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_total numeric; v_done numeric; v_lots int; v_lots_done int; v_prazo date; v_status text;
begin
  select coalesce(sum(l.peso),0), coalesce(sum(case when l.etapa_atual='concluido' then l.peso else 0 end),0),
         count(l.id), count(case when l.etapa_atual='concluido' then 1 end)
    into v_total, v_done, v_lots, v_lots_done
    from public.production_lots l
    join public.drawings d on d.id = l.drawing_id
   where d.work_order_id = _wo_id;

  select prazo into v_prazo from public.work_orders where id = _wo_id;

  if v_lots > 0 and v_lots_done = v_lots then
    v_status := 'concluida';
  elsif v_prazo is not null and v_prazo < current_date then
    v_status := 'atrasada';
  elsif exists (select 1 from public.production_lots l join public.drawings d on d.id=l.drawing_id
                where d.work_order_id=_wo_id and (l.status <> 'aguardando' or l.etapa_atual <> 'preparativo')) then
    v_status := 'em_producao';
  else
    v_status := 'aberta';
  end if;

  update public.work_orders set peso_concluido = v_done, status = v_status where id = _wo_id;
end; $$;

create or replace function public.trg_drawing_items_weight()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_dw uuid;
begin
  v_dw := coalesce(new.drawing_id, old.drawing_id);
  perform public.recalc_drawing_weight(v_dw);
  return null;
end; $$;
create trigger drawing_items_weight after insert or update or delete on public.drawing_items
  for each row execute function public.trg_drawing_items_weight();

create or replace function public.trg_lot_items_weight()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_lot uuid; v_wo uuid;
begin
  v_lot := coalesce(new.lot_id, old.lot_id);
  perform public.recalc_lot_weight(v_lot);
  select d.work_order_id into v_wo from public.production_lots l join public.drawings d on d.id=l.drawing_id where l.id=v_lot;
  if v_wo is not null then perform public.recalc_work_order(v_wo); end if;
  return null;
end; $$;
create trigger lot_items_weight after insert or update or delete on public.lot_items
  for each row execute function public.trg_lot_items_weight();

create or replace function public.trg_lots_wo()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_wo uuid;
begin
  select work_order_id into v_wo from public.drawings where id = coalesce(new.drawing_id, old.drawing_id);
  if v_wo is not null then perform public.recalc_work_order(v_wo); end if;
  return null;
end; $$;
create trigger lots_wo_recalc after insert or update or delete on public.production_lots
  for each row execute function public.trg_lots_wo();

-- log de criacao do lote
create or replace function public.trg_lot_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.lot_history (lot_id, acao, etapa_nova, usuario_id, observacao)
  values (new.id, 'Lote criado', new.etapa_atual, auth.uid(), null);
  return new;
end; $$;
create trigger lot_created after insert on public.production_lots
  for each row execute function public.trg_lot_created();

-- ========== REGRAS DE MOVIMENTACAO ==========
create or replace function public.next_etapa(_e public.etapa_producao)
returns public.etapa_producao language sql immutable as $$
  select case _e
    when 'preparativo' then 'montagem'::public.etapa_producao
    when 'montagem' then 'solda'::public.etapa_producao
    when 'solda' then 'acabamento'::public.etapa_producao
    when 'acabamento' then 'concluido'::public.etapa_producao
    else null end
$$;

create or replace function public.prev_etapa(_e public.etapa_producao)
returns public.etapa_producao language sql immutable as $$
  select case _e
    when 'montagem' then 'preparativo'::public.etapa_producao
    when 'solda' then 'montagem'::public.etapa_producao
    when 'acabamento' then 'solda'::public.etapa_producao
    when 'concluido' then 'acabamento'::public.etapa_producao
    else null end
$$;

create or replace function public.start_stage(p_lot_id uuid, p_observacao text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_lot public.production_lots;
begin
  select * into v_lot from public.production_lots where id = p_lot_id for update;
  if v_lot.id is null then raise exception 'Lote não encontrado'; end if;
  if not public.can_work_etapa(auth.uid(), v_lot.etapa_atual) then
    raise exception 'Seu perfil não pode apontar na etapa %', v_lot.etapa_atual;
  end if;
  if v_lot.etapa_atual = 'concluido' then raise exception 'Lote já concluído'; end if;
  if v_lot.status = 'em_execucao' then raise exception 'Etapa já iniciada'; end if;

  update public.production_lots
     set status = 'em_execucao', etapa_iniciada_em = now(), responsavel_id = auth.uid()
   where id = p_lot_id;

  insert into public.lot_stages (lot_id, etapa, data_inicio, usuario_id)
  values (p_lot_id, v_lot.etapa_atual, now(), auth.uid())
  on conflict (lot_id, etapa) do update set data_inicio = coalesce(public.lot_stages.data_inicio, now()), usuario_id = auth.uid();

  insert into public.lot_history (lot_id, acao, etapa_anterior, etapa_nova, usuario_id, observacao)
  values (p_lot_id, 'Etapa iniciada', v_lot.etapa_atual, v_lot.etapa_atual, auth.uid(), p_observacao);
end; $$;

create or replace function public.complete_stage(p_lot_id uuid, p_observacao text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_lot public.production_lots; v_next public.etapa_producao; v_pend int;
begin
  select * into v_lot from public.production_lots where id = p_lot_id for update;
  if v_lot.id is null then raise exception 'Lote não encontrado'; end if;
  if v_lot.etapa_atual = 'concluido' then raise exception 'Lote já concluído'; end if;
  if not public.can_work_etapa(auth.uid(), v_lot.etapa_atual) then
    raise exception 'Seu perfil não pode apontar na etapa %', v_lot.etapa_atual;
  end if;
  if v_lot.status <> 'em_execucao' then raise exception 'Inicie a etapa antes de concluir'; end if;

  if v_lot.etapa_atual = 'preparativo' then
    select count(*) into v_pend from public.lot_items
     where lot_id = p_lot_id and obrigatorio and status <> 'concluido';
    if v_pend > 0 then raise exception 'Existem % item(ns) obrigatório(s) pendente(s) no preparativo', v_pend; end if;
  end if;

  v_next := public.next_etapa(v_lot.etapa_atual);

  update public.lot_stages set data_fim = now()
   where lot_id = p_lot_id and etapa = v_lot.etapa_atual;

  insert into public.lot_history (lot_id, acao, etapa_anterior, etapa_nova, usuario_id, observacao)
  values (p_lot_id, 'Etapa concluída', v_lot.etapa_atual, v_lot.etapa_atual, auth.uid(), p_observacao);

  update public.production_lots
     set etapa_atual = v_next,
         status = case when v_next = 'concluido' then 'concluido' else 'aguardando' end,
         etapa_desde = now(),
         etapa_iniciada_em = null,
         concluido_em = case when v_next = 'concluido' then now() else null end,
         responsavel_id = null
   where id = p_lot_id;

  insert into public.lot_history (lot_id, acao, etapa_anterior, etapa_nova, usuario_id, observacao)
  values (p_lot_id,
          case when v_next = 'concluido' then 'Lote concluído' else 'Enviado para ' || v_next::text end,
          v_lot.etapa_atual, v_next, auth.uid(), null);
end; $$;

create or replace function public.return_stage(p_lot_id uuid, p_justificativa text)
returns void language plpgsql security definer set search_path = public as $$
declare v_lot public.production_lots; v_prev public.etapa_producao;
begin
  if p_justificativa is null or length(btrim(p_justificativa)) < 5 then
    raise exception 'Justificativa obrigatória para retorno de etapa';
  end if;
  select * into v_lot from public.production_lots where id = p_lot_id for update;
  if v_lot.id is null then raise exception 'Lote não encontrado'; end if;
  v_prev := public.prev_etapa(v_lot.etapa_atual);
  if v_prev is null then raise exception 'Lote está na primeira etapa'; end if;
  if not (public.is_planner(auth.uid()) or public.can_work_etapa(auth.uid(), v_lot.etapa_atual)) then
    raise exception 'Seu perfil não pode retornar este lote';
  end if;

  update public.production_lots
     set etapa_atual = v_prev, status = 'aguardando', etapa_desde = now(),
         etapa_iniciada_em = null, concluido_em = null, responsavel_id = null
   where id = p_lot_id;

  update public.lot_stages set data_fim = null where lot_id = p_lot_id and etapa = v_prev;

  insert into public.lot_history (lot_id, acao, etapa_anterior, etapa_nova, usuario_id, observacao)
  values (p_lot_id, 'Retorno de etapa', v_lot.etapa_atual, v_prev, auth.uid(), p_justificativa);
end; $$;

create or replace function public.set_lot_item_status(p_lot_item_id uuid, p_status text, p_observacao text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_lot public.production_lots; v_item public.lot_items;
begin
  select * into v_item from public.lot_items where id = p_lot_item_id for update;
  if v_item.id is null then raise exception 'Item não encontrado'; end if;
  select * into v_lot from public.production_lots where id = v_item.lot_id;
  if v_lot.etapa_atual <> 'preparativo' then raise exception 'Apontamento de item somente no preparativo'; end if;
  if not public.can_work_etapa(auth.uid(), 'preparativo') then raise exception 'Seu perfil não pode apontar itens'; end if;
  if p_status not in ('aguardando','em_preparacao','pausado','concluido') then raise exception 'Status inválido'; end if;

  update public.lot_items
     set status = p_status,
         responsavel_id = auth.uid(),
         iniciado_em = case when p_status = 'em_preparacao' then coalesce(iniciado_em, now()) else iniciado_em end,
         concluido_em = case when p_status = 'concluido' then now() else null end,
         observacao = coalesce(p_observacao, observacao)
   where id = p_lot_item_id;

  insert into public.lot_history (lot_id, acao, etapa_anterior, etapa_nova, usuario_id, observacao)
  values (v_item.lot_id,
          'Item ' || (select codigo_item from public.drawing_items where id = v_item.drawing_item_id) || ' → ' || p_status,
          'preparativo', 'preparativo', auth.uid(), p_observacao);
end; $$;

revoke all on function public.start_stage(uuid,text) from public;
revoke all on function public.complete_stage(uuid,text) from public;
revoke all on function public.return_stage(uuid,text) from public;
revoke all on function public.set_lot_item_status(uuid,text,text) from public;
grant execute on function public.start_stage(uuid,text) to authenticated;
grant execute on function public.complete_stage(uuid,text) to authenticated;
grant execute on function public.return_stage(uuid,text) to authenticated;
grant execute on function public.set_lot_item_status(uuid,text,text) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_planner(uuid) to authenticated;