import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { LotActions, LotMeta } from "@/components/pcp/LotCard";
import { EmptyState, PageHeader } from "@/components/pcp/PageHeader";
import { StageBadge, StatusPill } from "@/components/pcp/StageBadge";
import { StatCard } from "@/components/pcp/StatCard";
import { PreparativoItems } from "@/components/pcp/PreparativoItems";
import { lotsQuery } from "@/lib/pcp/api";
import { ETAPAS_PRODUTIVAS, ETAPA_LABEL, LOT_STATUS_LABEL, type EtapaProdutiva } from "@/lib/pcp/constants";
import { duration, kg } from "@/lib/pcp/format";

export const Route = createFileRoute("/_authenticated/setor/$etapa")({
  beforeLoad: ({ params }) => {
    if (!ETAPAS_PRODUTIVAS.includes(params.etapa as EtapaProdutiva)) throw notFound();
  },
  head: ({ params }) => {
    const label = ETAPA_LABEL[params.etapa as EtapaProdutiva] ?? "Setor";
    return {
      meta: [
        { title: `${label} — PCP Caldeiraria` },
        { name: "description", content: `Apontamento de produção do setor de ${label.toLowerCase()}.` },
        { property: "og:title", content: `${label} — PCP Caldeiraria` },
        { property: "og:description", content: `Lotes na etapa de ${label.toLowerCase()} com peso e tempo na etapa.` },
      ],
    };
  },
  component: SetorPage,
});

function SetorPage() {
  const { etapa } = Route.useParams();
  const etapaTyped = etapa as EtapaProdutiva;
  const lots = useQuery(lotsQuery());

  const fila = (lots.data ?? []).filter((l) => l.etapa_atual === etapaTyped);
  const peso = fila.reduce((s, l) => s + Number(l.peso), 0);
  const emExecucao = fila.filter((l) => l.status === "em_execucao");
  const isPreparativo = etapaTyped === "preparativo";

  return (
    <div className="space-y-6">
      <PageHeader
        title={ETAPA_LABEL[etapaTyped]}
        subtitle={
          isPreparativo
            ? "Neste setor o apontamento é item por item. O lote só avança quando todos os itens obrigatórios estiverem concluídos."
            : "Neste setor o apontamento é por lote inteiro."
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Lotes na etapa" value={String(fila.length)} tone="primary" />
        <StatCard label="Peso na etapa" value={kg(peso)} tone="accent" />
        <StatCard label="Em execução" value={String(emExecucao.length)} tone="warning" />
      </div>

      {fila.length === 0 ? (
        <EmptyState
          title="Nenhum lote nesta etapa"
          description="Os lotes aparecem aqui quando a etapa anterior é concluída."
        />
      ) : (
        <div className="space-y-4">
          {fila.map((lot) => (
            <div key={lot.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-bold uppercase">Lote {lot.numero_lote}</p>
                  <p className="font-display text-2xl font-bold tabular text-accent">{kg(lot.peso)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {duration(lot.etapa_desde)} nesta etapa
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StageBadge etapa={lot.etapa_atual} />
                  <StatusPill
                    label={LOT_STATUS_LABEL[lot.status] ?? lot.status}
                    tone={lot.status === "em_execucao" ? "warning" : "muted"}
                  />
                </div>
              </div>

              <div className="mt-4">
                <LotMeta lot={lot} />
              </div>

              {isPreparativo ? (
                <div className="mt-4">
                  <PreparativoItems lotId={lot.id} />
                </div>
              ) : null}

              <div className="mt-5">
                <LotActions lot={lot} size="lg" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
