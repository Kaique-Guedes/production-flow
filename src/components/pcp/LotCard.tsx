import { Link } from "@tanstack/react-router";
import { Clock, Play, SquareCheck, Undo2, User } from "lucide-react";
import { useState } from "react";

import { StageBadge, StatusPill } from "@/components/pcp/StageBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useLotActions } from "@/hooks/use-lot-actions";
import type { Lot } from "@/lib/pcp/api";
import { ETAPA_LABEL, LOT_STATUS_LABEL } from "@/lib/pcp/constants";
import { duration, kg, num } from "@/lib/pcp/format";

export function LotMeta({ lot }: { lot: Lot }) {
  const wo = lot.drawings?.work_orders;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>
        O.S. <span className="font-medium text-foreground">{wo?.numero ?? "—"}</span>
      </span>
      <span>
        Desenho <span className="font-medium text-foreground">{lot.drawings?.codigo ?? "—"}</span>
      </span>
      <span className="truncate">Cliente {wo?.clients?.name ?? "—"}</span>
      <span>
        Qtde <span className="font-medium text-foreground">{num(lot.quantidade)}</span>
      </span>
    </div>
  );
}

export function LotActions({
  lot,
  size = "default",
  showReturn = true,
}: {
  lot: Lot;
  size?: "default" | "lg";
  showReturn?: boolean;
}) {
  const auth = useAuth();
  const { start, complete, returnStage } = useLotActions();
  const [returnOpen, setReturnOpen] = useState(false);
  const [justificativa, setJustificativa] = useState("");

  const canAct = auth.canWork(lot.etapa_atual);
  const busy = start.isPending || complete.isPending;

  if (lot.etapa_atual === "concluido") {
    return (
      <div className="flex items-center gap-2">
        <StatusPill label="Lote concluído" tone="success" />
        {showReturn && auth.isPlanner ? (
          <ReturnButton onClick={() => setReturnOpen(true)} />
        ) : null}
        <ReturnDialog
          open={returnOpen}
          setOpen={setReturnOpen}
          justificativa={justificativa}
          setJustificativa={setJustificativa}
          pending={returnStage.isPending}
          onConfirm={() =>
            returnStage.mutate(
              { lotId: lot.id, justificativa },
              { onSuccess: () => (setReturnOpen(false), setJustificativa("")) },
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {lot.status === "em_execucao" ? (
        <Button
          size={size}
          variant="accent"
          disabled={!canAct || busy}
          onClick={() => complete.mutate({ lotId: lot.id })}
        >
          <SquareCheck className="size-4" />
          Concluir {ETAPA_LABEL[lot.etapa_atual].toLowerCase()}
        </Button>
      ) : (
        <Button size={size} disabled={!canAct || busy} onClick={() => start.mutate({ lotId: lot.id })}>
          <Play className="size-4" />
          Iniciar {ETAPA_LABEL[lot.etapa_atual].toLowerCase()}
        </Button>
      )}

      {showReturn && (auth.isPlanner || canAct) && lot.etapa_atual !== "preparativo" ? (
        <ReturnButton onClick={() => setReturnOpen(true)} />
      ) : null}

      {!canAct ? (
        <span className="text-xs text-muted-foreground">
          Seu perfil não aponta nesta etapa
        </span>
      ) : null}

      <ReturnDialog
        open={returnOpen}
        setOpen={setReturnOpen}
        justificativa={justificativa}
        setJustificativa={setJustificativa}
        pending={returnStage.isPending}
        onConfirm={() =>
          returnStage.mutate(
            { lotId: lot.id, justificativa },
            { onSuccess: () => (setReturnOpen(false), setJustificativa("")) },
          )
        }
      />
    </div>
  );
}

function ReturnButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Undo2 className="size-4" /> Retornar etapa
    </Button>
  );
}

function ReturnDialog({
  open,
  setOpen,
  justificativa,
  setJustificativa,
  pending,
  onConfirm,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  justificativa: string;
  setJustificativa: (v: string) => void;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retornar lote à etapa anterior</DialogTitle>
          <DialogDescription>
            O retorno é uma exceção ao fluxo e fica registrado no histórico. Justificativa
            obrigatória (mínimo 5 caracteres).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          placeholder="Motivo do retorno..."
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={pending || justificativa.trim().length < 5}
            onClick={onConfirm}
          >
            Confirmar retorno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LotCard({ lot, actions = true }: { lot: Lot; actions?: boolean }) {
  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to="/lotes/$id"
            params={{ id: lot.id }}
            className="font-display text-lg font-semibold uppercase hover:text-primary"
          >
            Lote {lot.numero_lote}
          </Link>
          <p className="font-display text-xl font-bold tabular text-accent">{kg(lot.peso)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StageBadge etapa={lot.etapa_atual} />
          <StatusPill
            label={LOT_STATUS_LABEL[lot.status] ?? lot.status}
            tone={lot.status === "em_execucao" ? "warning" : "muted"}
          />
        </div>
      </div>

      <LotMeta lot={lot} />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {duration(lot.etapa_desde)} na etapa
        </span>
        {lot.responsavel_id ? (
          <span className="inline-flex items-center gap-1">
            <User className="size-3.5" /> em execução
          </span>
        ) : null}
      </div>

      {actions ? <LotActions lot={lot} /> : null}
    </div>
  );
}
