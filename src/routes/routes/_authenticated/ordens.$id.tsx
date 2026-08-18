import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/pcp/PageHeader";
import { StageBadge, StatusPill } from "@/components/pcp/StageBadge";
import { ProgressBar } from "@/components/pcp/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  createDrawing,
  createDrawingItem,
  createLot,
  deleteDrawingItem,
  deleteLot,
  drawingItemsQuery,
  drawingsQuery,
  lotsQuery,
  qk,
  updateWorkOrderStatus,
  workOrderQuery,
  type Drawing,
  type Lot,
} from "@/lib/pcp/api";
import { OS_STATUS_LABEL } from "@/lib/pcp/constants";
import { dateBR, daysLate, kg, num, pct } from "@/lib/pcp/format";

export const Route = createFileRoute("/_authenticated/ordens/$id")({
  head: () => ({
    meta: [
      { title: "Ordem de serviço — PCP Caldeiraria" },
      {
        name: "description",
        content:
          "Detalhe da O.S.: desenhos, itens e lotes de produção com peso calculado automaticamente.",
      },
    ],
  }),
  component: OrdemDetalhe,
});

function OrdemDetalhe() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const qc = useQueryClient();
  const wo = useQuery(workOrderQuery(id));
  const drawings = useQuery(drawingsQuery(id));
  const lots = useQuery(lotsQuery());

  const [drawingOpen, setDrawingOpen] = useState(false);
  const [drawingForm, setDrawingForm] = useState({ codigo: "", descricao: "", revisao: "" });

  const createDrawingMut = useMutation({
    mutationFn: () => createDrawing({ work_order_id: id, ...drawingForm }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.drawings(id) });
      setDrawingForm({ codigo: "", descricao: "", revisao: "" });
      setDrawingOpen(false);
      toast.success("Desenho cadastrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeIfDone = useMutation({
    mutationFn: () => updateWorkOrderStatus(id, "concluida"),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.workOrder(id) });
      toast.success("O.S. marcada como concluída");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (wo.isLoading) {
    return (
      <div>
        <PageHeader title="Ordem de serviço" />
        <EmptyState title="Carregando…" />
      </div>
    );
  }

  if (!wo.data) {
    return (
      <div>
        <PageHeader title="Ordem de serviço" />
        <EmptyState
          title="O.S. não encontrada"
          description="Verifique o link ou volte para a lista de ordens."
        />
      </div>
    );
  }

  const os = wo.data;
  const progresso = pct(os.peso_concluido, os.peso_total);
  const atraso = daysLate(os.prazo);
  const lotsByDrawing = (drawingId: string) =>
    (lots.data ?? []).filter((l) => l.drawing_id === drawingId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`O.S. ${os.numero}`}
        subtitle={`${os.clients?.name ?? "—"} · pedido ${os.pedido ?? "—"} · aberta ${dateBR(os.data_abertura)}${os.prazo ? ` · prazo ${dateBR(os.prazo)}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill
              label={OS_STATUS_LABEL[os.status] ?? os.status}
              tone={os.status === "concluida" ? "success" : "primary"}
            />
            {atraso > 0 && os.status !== "concluida" ? (
              <StatusPill label={`${atraso} dia(s) em atraso`} tone="destructive" />
            ) : null}
            {auth.isPlanner ? (
              <Dialog open={drawingOpen} onOpenChange={setDrawingOpen}>
                <DialogTrigger asChild>
                  <Button variant="accent">
                    <Plus className="size-4" /> Novo desenho
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo desenho</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dw-cod">Código *</Label>
                      <Input
                        id="dw-cod"
                        value={drawingForm.codigo}
                        onChange={(e) => setDrawingForm({ ...drawingForm, codigo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dw-rev">Revisão</Label>
                      <Input
                        id="dw-rev"
                        value={drawingForm.revisao}
                        onChange={(e) =>
                          setDrawingForm({ ...drawingForm, revisao: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dw-desc">Descrição</Label>
                      <Input
                        id="dw-desc"
                        value={drawingForm.descricao}
                        onChange={(e) =>
                          setDrawingForm({ ...drawingForm, descricao: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="accent"
                      disabled={drawingForm.codigo.trim().length < 1 || createDrawingMut.isPending}
                      onClick={() => createDrawingMut.mutate()}
                    >
                      Cadastrar desenho
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        }
      />

      <div className="panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Avanço em peso da O.S.
          </p>
          <p className="text-sm font-semibold tabular">
            {kg(os.peso_concluido)} de {kg(os.peso_total)} ({progresso}%)
          </p>
        </div>
        <ProgressBar value={progresso} />
        {auth.isPlanner && os.status !== "concluida" && progresso >= 100 ? (
          <Button size="sm" variant="success" onClick={() => closeIfDone.mutate()}>
            Marcar O.S. como concluída
          </Button>
        ) : null}
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Desenhos
        </h2>

        {(drawings.data ?? []).length === 0 ? (
          <EmptyState
            title="Nenhum desenho cadastrado"
            description="Cadastre um desenho para lançar os itens e gerar lotes de produção."
          />
        ) : (
          <div className="space-y-4">
            {(drawings.data ?? []).map((d) => (
              <DrawingCard
                key={d.id}
                drawing={d}
                lots={lotsByDrawing(d.id)}
                canEdit={auth.isPlanner}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DrawingCard({
  drawing,
  lots,
  canEdit,
}: {
  drawing: Drawing;
  lots: Lot[];
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const items = useQuery({ ...drawingItemsQuery(drawing.id), enabled: expanded });

  const [itemOpen, setItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    codigo_item: "",
    descricao: "",
    quantidade: "1",
    peso_unitario: "0",
  });
  const [lotOpen, setLotOpen] = useState(false);
  const [lotForm, setLotForm] = useState({ numero_lote: "", quantidade: "1" });

  const createItem = useMutation({
    mutationFn: () =>
      createDrawingItem({
        drawing_id: drawing.id,
        codigo_item: itemForm.codigo_item,
        descricao: itemForm.descricao,
        quantidade: Number(itemForm.quantidade || 0),
        peso_unitario: Number(itemForm.peso_unitario || 0),
      }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.drawingItems(drawing.id) }),
        qc.invalidateQueries({ queryKey: qk.drawings(drawing.work_order_id) }),
        qc.invalidateQueries({ queryKey: qk.workOrder(drawing.work_order_id) }),
      ]);
      setItemForm({ codigo_item: "", descricao: "", quantidade: "1", peso_unitario: "0" });
      setItemOpen(false);
      toast.success("Item cadastrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => deleteDrawingItem(itemId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.drawingItems(drawing.id) }),
        qc.invalidateQueries({ queryKey: qk.drawings(drawing.work_order_id) }),
        qc.invalidateQueries({ queryKey: qk.workOrder(drawing.work_order_id) }),
      ]);
      toast.success("Item removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createLotMut = useMutation({
    mutationFn: () =>
      createLot({
        drawing_id: drawing.id,
        numero_lote: lotForm.numero_lote,
        quantidade: Number(lotForm.quantidade || 1),
      }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.lots }),
        qc.invalidateQueries({ queryKey: qk.workOrder(drawing.work_order_id) }),
      ]);
      setLotForm({ numero_lote: "", quantidade: "1" });
      setLotOpen(false);
      toast.success("Lote criado — itens replicados para o preparativo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeLot = useMutation({
    mutationFn: (lotId: string) => deleteLot(lotId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.lots });
      toast.success("Lote removido");
    },
    onError: () => toast.error("Não foi possível remover: existe histórico vinculado ao lote."),
  });

  const rows = items.data ?? [];

  return (
    <div className="panel p-0">
      <button
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0">
          <p className="font-display font-semibold uppercase">
            Desenho {drawing.codigo}
            {drawing.revisao ? ` · rev. ${drawing.revisao}` : ""}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {drawing.descricao ?? "sem descrição"} · {kg(drawing.peso_total)}
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-5 border-t border-border p-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Itens do desenho
              </p>
              {canEdit ? (
                <Dialog open={itemOpen} onOpenChange={setItemOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="size-4" /> Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo item do desenho</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="it-cod">Código do item *</Label>
                        <Input
                          id="it-cod"
                          value={itemForm.codigo_item}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, codigo_item: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="it-desc">Descrição</Label>
                        <Input
                          id="it-desc"
                          value={itemForm.descricao}
                          onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="it-qtd">Quantidade *</Label>
                          <Input
                            id="it-qtd"
                            type="number"
                            min="0"
                            step="0.01"
                            value={itemForm.quantidade}
                            onChange={(e) =>
                              setItemForm({ ...itemForm, quantidade: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="it-peso">Peso unitário (kg) *</Label>
                          <Input
                            id="it-peso"
                            type="number"
                            min="0"
                            step="0.001"
                            value={itemForm.peso_unitario}
                            onChange={(e) =>
                              setItemForm({ ...itemForm, peso_unitario: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="accent"
                        disabled={itemForm.codigo_item.trim().length < 1 || createItem.isPending}
                        onClick={() => createItem.mutate()}
                      >
                        Cadastrar item
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>

            {rows.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                Nenhum item cadastrado neste desenho.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border">
                {rows.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{it.codigo_item}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {it.descricao ?? "—"} · qtde {num(it.quantidade)} ·{" "}
                        {num(it.peso_unitario, 3)} kg/un · {kg(it.peso_total)}
                      </p>
                    </div>
                    {canEdit ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remover item ${it.codigo_item}`}
                        disabled={removeItem.isPending}
                        onClick={() => removeItem.mutate(it.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Lotes de produção
              </p>
              {canEdit ? (
                <Dialog open={lotOpen} onOpenChange={setLotOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={rows.length === 0}>
                      <Plus className="size-4" /> Lote
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo lote de produção</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        O lote nasce no preparativo com os itens do desenho replicados para
                        apontamento individual. O peso é calculado automaticamente.
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor="lt-num">Número do lote *</Label>
                        <Input
                          id="lt-num"
                          value={lotForm.numero_lote}
                          onChange={(e) => setLotForm({ ...lotForm, numero_lote: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lt-qtd">Quantidade (multiplicador dos itens) *</Label>
                        <Input
                          id="lt-qtd"
                          type="number"
                          min="1"
                          step="1"
                          value={lotForm.quantidade}
                          onChange={(e) => setLotForm({ ...lotForm, quantidade: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="accent"
                        disabled={lotForm.numero_lote.trim().length < 1 || createLotMut.isPending}
                        onClick={() => createLotMut.mutate()}
                      >
                        Criar lote
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>

            {lots.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                Nenhum lote criado para este desenho ainda.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border">
                {lots.map((lot) => (
                  <div key={lot.id} className="flex items-center gap-3 p-3">
                    <Link
                      to="/lotes/$id"
                      params={{ id: lot.id }}
                      className="min-w-0 flex-1 hover:text-primary"
                    >
                      <p className="truncate text-sm font-semibold">Lote {lot.numero_lote}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        qtde {num(lot.quantidade)} · {kg(lot.peso)}
                      </p>
                    </Link>
                    <StageBadge etapa={lot.etapa_atual} />
                    {canEdit &&
                    lot.etapa_atual === "preparativo" &&
                    lot.status !== "em_execucao" ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remover lote ${lot.numero_lote}`}
                        disabled={removeLot.isPending}
                        onClick={() => removeLot.mutate(lot.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
