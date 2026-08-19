import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/pcp/PageHeader";
import { StatusPill } from "@/components/pcp/StageBadge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { clientsQuery, createWorkOrder, qk, workOrdersQuery } from "@/lib/pcp/api";
import { OS_STATUS_LABEL } from "@/lib/pcp/constants";
import { dateBR, daysLate, kg, pct } from "@/lib/pcp/format";

export const Route = createFileRoute("/_authenticated/ordens/")({
  head: () => ({
    meta: [
      { title: "Ordens de serviço — PCP Caldeiraria" },
      {
        name: "description",
        content: "Lista de ordens de serviço com peso total, peso concluído, prazo e avanço da produção.",
      },
      { property: "og:title", content: "Ordens de serviço — PCP Caldeiraria" },
      { property: "og:description", content: "Acompanhe prazos e avanço em peso de cada O.S." },
    ],
  }),
  component: OrdensPage,
});

function OrdensPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const orders = useQuery(workOrdersQuery());
  const clients = useQuery(clientsQuery());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", numero: "", pedido: "", prazo: "" });

  const create = useMutation({
    mutationFn: () => createWorkOrder(form),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.workOrders });
      setForm({ client_id: "", numero: "", pedido: "", prazo: "" });
      setOpen(false);
      toast.success("O.S. aberta");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = orders.data ?? [];

  return (
    <div>
      <PageHeader
        title="Ordens de serviço"
        subtitle="O peso total é calculado automaticamente pelos itens dos desenhos — nunca digitado."
        actions={
          auth.isPlanner ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="accent">
                  <Plus className="size-4" /> Nova O.S.
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova ordem de serviço</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Cliente *</Label>
                    <Select
                      value={form.client_id}
                      onValueChange={(v) => setForm({ ...form, client_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {(clients.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="os-num">Número da O.S. *</Label>
                    <Input
                      id="os-num"
                      value={form.numero}
                      onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="os-ped">Pedido do cliente</Label>
                    <Input
                      id="os-ped"
                      value={form.pedido}
                      onChange={(e) => setForm({ ...form, pedido: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="os-prazo">Prazo</Label>
                    <Input
                      id="os-prazo"
                      type="date"
                      value={form.prazo}
                      onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="accent"
                    disabled={!form.client_id || form.numero.trim().length < 1 || create.isPending}
                    onClick={() => create.mutate()}
                  >
                    Abrir O.S.
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma ordem de serviço"
          description="Abra uma O.S. para cadastrar desenhos, itens e lotes de produção."
        />
      ) : (
        <div className="panel divide-y divide-border">
          {rows.map((os) => {
            const progresso = pct(os.peso_concluido, os.peso_total);
            const atraso = daysLate(os.prazo);
            return (
              <div key={os.id} className="flex items-center gap-2 pr-3">
                <Link
                  to="/ordens/$id"
                  params={{ id: os.id }}
                  className="flex flex-1 items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display font-semibold">O.S. {os.numero}</p>
                      <StatusPill
                        label={OS_STATUS_LABEL[os.status] ?? os.status}
                        tone={os.status === "concluida" ? "success" : "primary"}
                      />
                      {atraso > 0 && os.status !== "concluida" ? (
                        <StatusPill label={`${atraso} dia(s) em atraso`} tone="destructive" />
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {os.clients?.name ?? "—"} · pedido {os.pedido ?? "—"} · aberta {dateBR(os.data_abertura)}
                      {os.prazo ? ` · prazo ${dateBR(os.prazo)}` : ""}
                    </p>
                    <div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progresso}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular">{kg(os.peso_concluido)}</p>
                    <p className="text-[11px] text-muted-foreground tabular">de {kg(os.peso_total)}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
                {auth.isPlanner ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEdit({ id: os.id, numero: os.numero })}
                    aria-label={`Editar número da O.S. ${os.numero}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar número da O.S.</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="os-edit-num">Número da O.S. *</Label>
            <Input
              id="os-edit-num"
              value={edit?.numero ?? ""}
              onChange={(e) => setEdit((p) => (p ? { ...p, numero: e.target.value } : p))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancelar
            </Button>
            <Button
              variant="accent"
              disabled={!edit || edit.numero.trim().length < 1 || rename.isPending}
              onClick={() => rename.mutate()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    </div>
  );
}
