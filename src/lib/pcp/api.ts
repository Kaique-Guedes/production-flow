import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import type { AppRole, Etapa } from "./constants";

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const qk = {
  session: ["session"] as const,
  roles: (userId: string | undefined) => ["roles", userId] as const,
  profiles: ["profiles"] as const,
  clients: ["clients"] as const,
  workOrders: ["work-orders"] as const,
  workOrder: (id: string) => ["work-order", id] as const,
  drawings: (workOrderId: string) => ["drawings", workOrderId] as const,
  drawingItems: (drawingId: string) => ["drawing-items", drawingId] as const,
  lots: ["lots"] as const,
  lot: (id: string) => ["lot", id] as const,
  lotItems: (lotId: string) => ["lot-items", lotId] as const,
  lotStages: (lotId: string) => ["lot-stages", lotId] as const,
  history: (lotId?: string) => ["history", lotId ?? "all"] as const,
};

/* ---------------------------------- tipos --------------------------------- */

export interface Client {
  id: string;
  name: string;
  cnpj: string | null;
  contact: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  client_id: string;
  numero: string;
  pedido: string | null;
  status: string;
  data_abertura: string;
  prazo: string | null;
  peso_total: number;
  peso_concluido: number;
  is_demo: boolean;
  created_at: string;
  clients?: { name: string } | null;
}

export interface Drawing {
  id: string;
  work_order_id: string;
  codigo: string;
  descricao: string | null;
  revisao: string | null;
  peso_total: number;
  is_demo: boolean;
}

export interface DrawingItem {
  id: string;
  drawing_id: string;
  codigo_item: string;
  descricao: string | null;
  quantidade: number;
  peso_unitario: number;
  peso_total: number | null;
}

export interface Lot {
  id: string;
  drawing_id: string;
  numero_lote: string;
  quantidade: number;
  peso: number;
  etapa_atual: Etapa;
  status: string;
  responsavel_id: string | null;
  etapa_iniciada_em: string | null;
  etapa_desde: string;
  concluido_em: string | null;
  is_demo: boolean;
  created_at: string;
  drawings?: {
    id: string;
    codigo: string;
    revisao: string | null;
    work_order_id: string;
    work_orders?: {
      id: string;
      numero: string;
      prazo: string | null;
      clients?: { name: string } | null;
    } | null;
  } | null;
}

export interface LotItem {
  id: string;
  lot_id: string;
  drawing_item_id: string;
  quantidade: number;
  obrigatorio: boolean;
  status: string;
  responsavel_id: string | null;
  iniciado_em: string | null;
  concluido_em: string | null;
  observacao: string | null;
  drawing_items?: DrawingItem | null;
}

export interface LotStage {
  id: string;
  lot_id: string;
  etapa: Etapa;
  data_inicio: string | null;
  data_fim: string | null;
  usuario_id: string | null;
}

export interface HistoryEntry {
  id: string;
  lot_id: string;
  acao: string;
  etapa_anterior: Etapa | null;
  etapa_nova: Etapa | null;
  usuario_id: string | null;
  observacao: string | null;
  created_at: string;
  production_lots?: {
    numero_lote: string;
    drawings?: {
      codigo: string;
      work_orders?: { numero: string } | null;
    } | null;
  } | null;
}

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
}

const LOT_SELECT =
  "*, drawings(id, codigo, revisao, work_order_id, work_orders(id, numero, prazo, clients(name)))";

/* --------------------------------- queries -------------------------------- */

export const clientsQuery = () =>
  queryOptions({
    queryKey: qk.clients,
    queryFn: async () =>
      unwrap<Client[]>(
        await supabase.from("clients").select("*").order("name", { ascending: true }),
      ),
  });

export const workOrdersQuery = () =>
  queryOptions({
    queryKey: qk.workOrders,
    queryFn: async () =>
      unwrap<WorkOrder[]>(
        await supabase
          .from("work_orders")
          .select("*, clients(name)")
          .order("created_at", { ascending: false }),
      ),
  });

export const workOrderQuery = (id: string) =>
  queryOptions({
    queryKey: qk.workOrder(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*, clients(name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as WorkOrder | null;
    },
  });

export const drawingsQuery = (workOrderId: string) =>
  queryOptions({
    queryKey: qk.drawings(workOrderId),
    queryFn: async () =>
      unwrap<Drawing[]>(
        await supabase
          .from("drawings")
          .select("*")
          .eq("work_order_id", workOrderId)
          .order("codigo"),
      ),
  });

export const drawingItemsQuery = (drawingId: string) =>
  queryOptions({
    queryKey: qk.drawingItems(drawingId),
    queryFn: async () =>
      unwrap<DrawingItem[]>(
        await supabase
          .from("drawing_items")
          .select("*")
          .eq("drawing_id", drawingId)
          .order("codigo_item"),
      ),
  });

export const lotsQuery = () =>
  queryOptions({
    queryKey: qk.lots,
    queryFn: async () =>
      unwrap<Lot[]>(await supabase.from("production_lots").select(LOT_SELECT).order("numero_lote")),
  });

export const lotQuery = (id: string) =>
  queryOptions({
    queryKey: qk.lot(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_lots")
        .select(LOT_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Lot | null;
    },
  });

export const lotItemsQuery = (lotId: string) =>
  queryOptions({
    queryKey: qk.lotItems(lotId),
    queryFn: async () =>
      unwrap<LotItem[]>(
        await supabase
          .from("lot_items")
          .select("*, drawing_items(*)")
          .eq("lot_id", lotId)
          .order("created_at"),
      ),
  });

export const lotStagesQuery = (lotId: string) =>
  queryOptions({
    queryKey: qk.lotStages(lotId),
    queryFn: async () =>
      unwrap<LotStage[]>(await supabase.from("lot_stages").select("*").eq("lot_id", lotId)),
  });

export const historyQuery = (lotId?: string) =>
  queryOptions({
    queryKey: qk.history(lotId),
    queryFn: async () => {
      let q = supabase
        .from("lot_history")
        .select("*, production_lots(numero_lote, drawings(codigo, work_orders(numero)))")
        .order("created_at", { ascending: false })
        .limit(lotId ? 300 : 200);
      if (lotId) q = q.eq("lot_id", lotId);
      return unwrap<HistoryEntry[]>(await q);
    },
  });

export const profilesQuery = () =>
  queryOptions({
    queryKey: qk.profiles,
    queryFn: async () =>
      unwrap<Profile[]>(await supabase.from("profiles").select("*").order("full_name")),
  });

export const rolesQuery = () =>
  queryOptions({
    queryKey: ["all-roles"] as const,
    queryFn: async () =>
      unwrap<{ id: string; user_id: string; role: AppRole }[]>(
        await supabase.from("user_roles").select("id, user_id, role"),
      ),
  });

/* -------------------------------- mutações -------------------------------- */

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function rpcStartStage(lotId: string, observacao?: string) {
  const args: { p_lot_id: string; p_observacao?: string } = { p_lot_id: lotId };
  if (observacao) args.p_observacao = observacao;
  check((await supabase.rpc("start_stage", args)).error);
}

export async function rpcCompleteStage(lotId: string, observacao?: string) {
  const args: { p_lot_id: string; p_observacao?: string } = { p_lot_id: lotId };
  if (observacao) args.p_observacao = observacao;
  check((await supabase.rpc("complete_stage", args)).error);
}

export async function rpcReturnStage(lotId: string, justificativa: string) {
  check(
    (await supabase.rpc("return_stage", { p_lot_id: lotId, p_justificativa: justificativa })).error,
  );
}

export async function rpcSetLotItemStatus(
  lotItemId: string,
  status: "aguardando" | "em_preparacao" | "pausado" | "concluido",
  observacao?: string,
) {
  const args: { p_lot_item_id: string; p_status: string; p_observacao?: string } = {
    p_lot_item_id: lotItemId,
    p_status: status,
  };
  if (observacao) args.p_observacao = observacao;
  check((await supabase.rpc("set_lot_item_status", args)).error);
}

/* ------------------------------ CRUD (planejamento) ----------------------- */

export async function createClientRow(input: { name: string; cnpj?: string; contact?: string }) {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      cnpj: input.cnpj?.trim() ? input.cnpj : null,
      contact: input.contact?.trim() ? input.contact : null,
    })
    .select("id")
    .single();
  check(error);
  return (data as { id: string }).id;
}

export async function deleteClientRow(id: string) {
  check((await supabase.from("clients").delete().eq("id", id)).error);
}

export async function createWorkOrder(input: {
  client_id: string;
  numero: string;
  pedido?: string;
  prazo?: string;
}) {
  const { data, error } = await supabase
    .from("work_orders")
    .insert({
      client_id: input.client_id,
      numero: input.numero,
      pedido: input.pedido?.trim() ? input.pedido : null,
      prazo: input.prazo?.trim() ? input.prazo : null,
    })
    .select("id")
    .single();
  check(error);
  return (data as { id: string }).id;
}

export async function updateWorkOrderStatus(id: string, status: string) {
  check((await supabase.from("work_orders").update({ status }).eq("id", id)).error);
}

export async function createDrawing(input: {
  work_order_id: string;
  codigo: string;
  descricao?: string;
  revisao?: string;
}) {
  const { data, error } = await supabase
    .from("drawings")
    .insert({
      work_order_id: input.work_order_id,
      codigo: input.codigo,
      descricao: input.descricao?.trim() ? input.descricao : null,
      revisao: input.revisao?.trim() ? input.revisao : null,
    })
    .select("id")
    .single();
  check(error);
  return (data as { id: string }).id;
}

export async function createDrawingItem(input: {
  drawing_id: string;
  codigo_item: string;
  descricao?: string;
  quantidade: number;
  peso_unitario: number;
}) {
  check(
    (
      await supabase.from("drawing_items").insert({
        drawing_id: input.drawing_id,
        codigo_item: input.codigo_item,
        descricao: input.descricao?.trim() ? input.descricao : null,
        quantidade: input.quantidade,
        peso_unitario: input.peso_unitario,
      })
    ).error,
  );
}

/** Insere vários itens do desenho de uma vez (usado pela importação de planilha). */
export async function createDrawingItemsBulk(
  drawingId: string,
  items: { codigo_item: string; descricao?: string; quantidade: number; peso_unitario: number }[],
) {
  if (items.length === 0) return;
  check(
    (
      await supabase.from("drawing_items").insert(
        items.map((it) => ({
          drawing_id: drawingId,
          codigo_item: it.codigo_item,
          descricao: it.descricao?.trim() ? it.descricao : null,
          quantidade: it.quantidade,
          peso_unitario: it.peso_unitario,
        })),
      )
    ).error,
  );
}

export async function deleteDrawingItem(id: string) {
  check((await supabase.from("drawing_items").delete().eq("id", id)).error);
}

/** Cria o lote e replica os itens do desenho como itens do lote (apontamento do preparativo). */
export async function createLot(input: {
  drawing_id: string;
  numero_lote: string;
  quantidade: number;
}) {
  const { data, error } = await supabase
    .from("production_lots")
    .insert({
      drawing_id: input.drawing_id,
      numero_lote: input.numero_lote,
      quantidade: input.quantidade,
    })
    .select("id")
    .single();
  check(error);
  const lotId = (data as { id: string }).id;

  const items = unwrap<DrawingItem[]>(
    await supabase.from("drawing_items").select("*").eq("drawing_id", input.drawing_id),
  );
  if (items.length > 0) {
    check(
      (
        await supabase.from("lot_items").insert(
          items.map((it) => ({
            lot_id: lotId,
            drawing_item_id: it.id,
            quantidade: Number(it.quantidade) * input.quantidade,
            obrigatorio: true,
          })),
        )
      ).error,
    );
  }
  return lotId;
}

export async function deleteLot(id: string) {
  check((await supabase.from("lot_items").delete().eq("lot_id", id)).error);
  check((await supabase.from("production_lots").delete().eq("id", id)).error);
}

export async function grantRole(userId: string, role: AppRole) {
  check((await supabase.from("user_roles").insert({ user_id: userId, role })).error);
}

export async function revokeRole(roleRowId: string) {
  check((await supabase.from("user_roles").delete().eq("id", roleRowId)).error);
}
