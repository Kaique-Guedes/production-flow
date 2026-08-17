import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { LotCard } from "@/components/pcp/LotCard";
import { EmptyState, PageHeader } from "@/components/pcp/PageHeader";
import { StageBadge } from "@/components/pcp/StageBadge";
import { lotsQuery } from "@/lib/pcp/api";
import { ETAPAS } from "@/lib/pcp/constants";
import { kg } from "@/lib/pcp/format";

export const Route = createFileRoute("/_authenticated/producao")({
  head: () => ({
    meta: [
      { title: "Controle de produção — PCP Caldeiraria" },
      { name: "description", content: "Quadro kanban de lotes por etapa: preparativo, montagem, solda, acabamento e concluído." },
      { property: "og:title", content: "Controle de produção — PCP Caldeiraria" },
      { property: "og:description", content: "Visualize e movimente os lotes de produção por etapa." },
    ],
  }),
  component: Producao,
});

function Producao() {
  const lots = useQuery(lotsQuery());
  const all = lots.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de produção"
        subtitle="Quadro por etapa. Cada lote ocupa uma única coluna — a etapa atual."
      />

      {all.length === 0 ? (
        <EmptyState
          title="Nenhum lote em produção"
          description="Crie lotes a partir de um desenho na tela da ordem de serviço."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {ETAPAS.map((etapa) => {
            const col = all.filter((l) => l.etapa_atual === etapa);
            const peso = col.reduce((s, l) => s + Number(l.peso), 0);
            return (
              <div key={etapa} className="flex min-w-0 flex-col gap-3">
                <div className="panel flex items-center justify-between p-3">
                  <StageBadge etapa={etapa} />
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular">{kg(peso)}</p>
                    <p className="text-[11px] text-muted-foreground">{col.length} lote(s)</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {col.map((lot) => (
                    <LotCard key={lot.id} lot={lot} actions={etapa !== "concluido"} />
                  ))}
                  {col.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Sem lotes
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
