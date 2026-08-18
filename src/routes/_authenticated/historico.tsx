import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { EmptyState, PageHeader } from "@/components/pcp/PageHeader";
import { historyQuery } from "@/lib/pcp/api";
import { ETAPA_LABEL } from "@/lib/pcp/constants";
import { dateTimeBR } from "@/lib/pcp/format";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — PCP Caldeiraria" },
      {
        name: "description",
        content:
          "Histórico completo de movimentações de todos os lotes: ação, etapa anterior, nova etapa, usuário e observação.",
      },
    ],
  }),
  component: HistoricoPage,
});

function HistoricoPage() {
  const history = useQuery(historyQuery());
  const rows = history.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico"
        subtitle="Todas as movimentações registradas nos lotes, mais recentes primeiro."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma movimentação registrada"
          description="O histórico é preenchido automaticamente conforme os lotes avançam pelas etapas."
        />
      ) : (
        <ol className="panel divide-y divide-border">
          {rows.map((h) => {
            const lot = h.production_lots;
            const wo = lot?.drawings?.work_orders;
            return (
              <li key={h.id} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{h.acao}</p>
                    {lot ? (
                      <Link
                        to="/lotes/$id"
                        params={{ id: h.lot_id }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Lote {lot.numero_lote}
                        {lot.drawings?.codigo ? ` · desenho ${lot.drawings.codigo}` : ""}
                        {wo?.numero ? ` · O.S. ${wo.numero}` : ""}
                      </Link>
                    ) : null}
                  </div>
                  {h.etapa_anterior && h.etapa_nova && h.etapa_anterior !== h.etapa_nova ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      {ETAPA_LABEL[h.etapa_anterior]}
                      <ArrowRight className="size-3" />
                      {ETAPA_LABEL[h.etapa_nova]}
                    </p>
                  ) : null}
                  {h.observacao ? (
                    <p className="mt-1 text-xs text-muted-foreground">“{h.observacao}”</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular">
                  {dateTimeBR(h.created_at)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
