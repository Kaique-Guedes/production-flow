import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/pcp/PageHeader";
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
import { clientsQuery, createClientRow, deleteClientRow, qk } from "@/lib/pcp/api";
import { dateBR } from "@/lib/pcp/format";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — PCP Caldeiraria" },
      {
        name: "description",
        content: "Cadastro de clientes da caldeiraria, base da hierarquia cliente, O.S., desenho e lote.",
      },
      { property: "og:title", content: "Clientes — PCP Caldeiraria" },
      { property: "og:description", content: "Cadastro e consulta de clientes do PCP." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const clients = useQuery(clientsQuery());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", cnpj: "", contact: "" });

  const create = useMutation({
    mutationFn: () => createClientRow(form),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.clients });
      setForm({ name: "", cnpj: "", contact: "" });
      setOpen(false);
      toast.success("Cliente cadastrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteClientRow(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.clients });
      toast.success("Cliente removido");
    },
    onError: () => toast.error("Não foi possível remover: existem O.S. vinculadas."),
  });

  const rows = clients.data ?? [];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Primeiro nível da estrutura: cliente → O.S. → desenho → itens → lote → etapa."
        actions={
          auth.isPlanner ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="accent">
                  <Plus className="size-4" /> Novo cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cli-name">Nome *</Label>
                    <Input
                      id="cli-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cli-cnpj">CNPJ</Label>
                    <Input
                      id="cli-cnpj"
                      value={form.cnpj}
                      onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cli-contact">Contato</Label>
                    <Input
                      id="cli-contact"
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="accent"
                    disabled={form.name.trim().length < 2 || create.isPending}
                    onClick={() => create.mutate()}
                  >
                    Cadastrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Nenhum cliente cadastrado" description="Cadastre o primeiro cliente para abrir ordens de serviço." />
      ) : (
        <div className="panel divide-y divide-border">
          {rows.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.cnpj ?? "sem CNPJ"} · {c.contact ?? "sem contato"} · desde {dateBR(c.created_at)}
                </p>
              </div>
              {auth.isPlanner ? (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remover ${c.name}`}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(c.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
