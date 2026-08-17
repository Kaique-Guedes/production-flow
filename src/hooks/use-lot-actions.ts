import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  rpcCompleteStage,
  rpcReturnStage,
  rpcSetLotItemStatus,
  rpcStartStage,
} from "@/lib/pcp/api";

/** Invalida tudo que depende de lotes (pesos e status são recalculados no banco). */
function useInvalidateProduction() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["lots"] });
    void qc.invalidateQueries({ queryKey: ["lot"] });
    void qc.invalidateQueries({ queryKey: ["lot-items"] });
    void qc.invalidateQueries({ queryKey: ["lot-stages"] });
    void qc.invalidateQueries({ queryKey: ["history"] });
    void qc.invalidateQueries({ queryKey: ["work-orders"] });
    void qc.invalidateQueries({ queryKey: ["work-order"] });
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Falha na operação";
}

export function useLotActions() {
  const invalidate = useInvalidateProduction();

  const start = useMutation({
    mutationFn: (vars: { lotId: string; observacao?: string }) =>
      rpcStartStage(vars.lotId, vars.observacao),
    onSuccess: () => {
      invalidate();
      toast.success("Etapa iniciada");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const complete = useMutation({
    mutationFn: (vars: { lotId: string; observacao?: string }) =>
      rpcCompleteStage(vars.lotId, vars.observacao),
    onSuccess: () => {
      invalidate();
      toast.success("Etapa concluída — lote movido para a etapa seguinte");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const returnStage = useMutation({
    mutationFn: (vars: { lotId: string; justificativa: string }) =>
      rpcReturnStage(vars.lotId, vars.justificativa),
    onSuccess: () => {
      invalidate();
      toast.success("Lote retornado à etapa anterior");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const setItemStatus = useMutation({
    mutationFn: (vars: {
      lotItemId: string;
      status: "aguardando" | "em_preparacao" | "pausado" | "concluido";
      observacao?: string;
    }) => rpcSetLotItemStatus(vars.lotItemId, vars.status, vars.observacao),
    onSuccess: () => {
      invalidate();
      toast.success("Apontamento registrado");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return { start, complete, returnStage, setItemStatus };
}
