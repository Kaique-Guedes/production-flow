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
        await supabase.from("drawing_items").select("*").eq("drawing_id", drawingId).order("codigo_item"),
      ),
  });

export const lotsQuery = () =>
  queryOptions({
    queryKey: qk.lots,
    queryFn: async () =>
      unwrap<Lot[]>(
        await supabase.from("production_lots").select(LOT_SELECT).order("numero_lote"),
      ),
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
      unwrap<LotStage[]>(
        await supabase.from("lot_stages").select("*").eq("lot_id", lotId),
      ),
  });

export const historyQuery = (lotId?: string) =>
  queryOptions({
    queryKey: qk.history(lotId),
    queryFn: async () => {
      let q = supabase
        .from("lot_history")
        .select("*")
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
  check((await supabase.rpc("return_stage", { p_lot_id: lotId, p_justificativa: justificativa })).error);
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

