import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Pause, Play } from "lucide-react";

import { StatusPill } from "@/components/pcp/StageBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLotActions } from "@/hooks/use-lot-actions";
import { lotItemsQuery } from "@/lib/pcp/api";
import { ITEM_STATUS_LABEL } from "@/lib/pcp/constants";
import { kg, num } from "@/lib/pcp/format";

export function PreparativoItems({ lotId }: { lotId: string }) {
  const auth = useAuth();
  const items = useQuery(lotItemsQuery(lotId));
  const { setItemStatus } = useLotActions();
  const canWork = auth.canWork("preparativo");

  const rows = items.data ?? [];
  const pendentes = rows.filter((i) => i.obrigatorio && i.status !== "concluido").length;

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        Nenhum item vinculado a este lote.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Itens do lote — apontamento individual
        </p>
        <StatusPill
          label={
            pendentes === 0
              ? "Itens obrigatórios concluídos"
              : `${pendentes} obrigatório(s) pendente(s)`
          }
          tone={pendentes === 0 ? "success" : "warning"}
        />
      </div>

      <div className="divide-y divide-border rounded-md border border-border">
        {rows.map((item) => {
          const di = item.drawing_items;
          const pesoItem = Number(item.quantidade) * Number(di?.peso_unitario ?? 0);
          const busy = setItemStatus.isPending;
          return (
            <div key={item.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {di?.codigo_item ?? "Item"}{" "}
                  {item.obrigatorio ? null : (
                    <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {di?.descricao ?? "—"} · qtde {num(item.quantidade)} · {kg(pesoItem)}
                </p>
              </div>

              <StatusPill
                label={ITEM_STATUS_LABEL[item.status] ?? item.status}
                tone={
                  item.status === "concluido"
                    ? "success"
                    : item.status === "em_preparacao"
                      ? "warning"
                      : "muted"
                }
              />

              <div className="flex gap-2">
                {item.status !== "concluido" ? (
                  <>
                    {item.status === "em_preparacao" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canWork || busy}
                        onClick={() =>
                          setItemStatus.mutate({ lotItemId: item.id, status: "pausado" })
                        }
                      >
                        <Pause className="size-4" /> Pausar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canWork || busy}
                        onClick={() =>
                          setItemStatus.mutate({ lotItemId: item.id, status: "em_preparacao" })
                        }
                      >
                        <Play className="size-4" /> Iniciar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="accent"
                      disabled={!canWork || busy}
                      onClick={() =>
                        setItemStatus.mutate({ lotItemId: item.id, status: "concluido" })
                      }
                    >
                      <CircleCheck className="size-4" /> Concluir
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!canWork || busy}
                    onClick={() =>
                      setItemStatus.mutate({ lotItemId: item.id, status: "em_preparacao" })
                    }
                  >
                    Reabrir
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
