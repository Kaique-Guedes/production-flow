import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";

import { LotActions, LotMeta } from "@/components/pcp/LotCard";
import { EmptyState, PageHeader } from "@/components/pcp/PageHeader";
import { PreparativoItems } from "@/components/pcp/PreparativoItems";
import { StageBadge, StatusPill } from "@/components/pcp/StageBadge";
import { StatCard } from "@/components/pcp/StatCard";
import { historyQuery, lotQuery, lotStagesQuery } from "@/lib/pcp/api";
import { ETAPAS_PRODUTIVAS, ETAPA_LABEL, LOT_STATUS_LABEL } from "@/lib/pcp/constants";
import { dateTimeBR, duration, kg } from "@/lib/pcp/format";

export const Route = createFileRoute("/_authenticated/lotes/$id")({
  head: () => ({
    meta: [
      { title: "Lote — PCP Caldeiraria" },
      {
        name: "description",
        content:
          "Detalhe do lote: etapa atual, tempos por etapa e histórico completo de movimentações.",
      },
    ],
  }),
  component: LoteDetalhe,
});

function LoteDetalhe() {
  const { id } = Route.useParams();
  const lot = useQuery(lotQuery(id));
  const stages = useQuery(lotStagesQuery(id));
  const history = useQuery(historyQuery(id));

  if (lot.isLoading) {
    return (
      <div>
        <PageHeader title="Lote" />
        <EmptyState title="Carregando…" />
      </div>
    );
  }

  if (!lot.data) {
    return (
      <div>
        <PageHeader title="Lote" />
        <EmptyState
          title="Lote não encontrado"
          description="Verifique o link ou volte para a produção."
        />
      </div>
    );
  }

  const l = lot.data;
  const wo = l.drawings?.work_orders;
  const isPreparativo = l.etapa_atual === "preparativo";
  const stagesByEtapa = Object.fromEntries((stages.data ?? []).map((s) => [s.etapa, s]));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Lote ${l.numero_lote}`}
        {...(wo
          ? {
              subtitle: `O.S. ${wo.numero} · ${wo.clients?.name ?? "—"} · desenho ${l.drawings?.codigo ?? "—"}`,
              actions: (
                <Link
                  to="/ordens/$id"
                  params={{ id: wo.id }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver O.S. {wo.numero}
                </Link>
              ),
            }
          : {})}
      />

      <div className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-bold tabular text-accent">{kg(l.peso)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <Clock className="mr-1 inline size-3.5" />
              {duration(l.etapa_desde)} nesta etapa
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StageBadge etapa={l.etapa_atual} size="md" />
            <StatusPill
              label={LOT_STATUS_LABEL[l.status] ?? l.status}
              tone={l.status === "em_execucao" ? "warning" : "muted"}
            />
          </div>
        </div>

        <LotMeta lot={l} />

        {isPreparativo ? (
          <div className="border-t border-border pt-4">
            <PreparativoItems lotId={l.id} />
          </div>
        ) : null}

        <div className="border-t border-border pt-4">
          <LotActions lot={l} size="lg" />
        </div>
      </div>

      <section>
        <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Tempo por etapa
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPAS_PRODUTIVAS.map((etapa) => {
            const st = stagesByEtapa[etapa];
            const value = st?.data_inicio ? duration(st.data_inicio, st.data_fim) : "—";
            return (
              <StatCard
                key={etapa}
                label={ETAPA_LABEL[etapa]}
                value={value}
                tone={l.etapa_atual === etapa ? "primary" : "default"}
                hint={
                  st?.data_inicio
                    ? st.data_fim
                      ? `concluída ${dateTimeBR(st.data_fim)}`
                      : "em andamento"
                    : "não iniciada"
                }
              />
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Histórico do lote
        </h2>
        {(history.data ?? []).length === 0 ? (
          <EmptyState title="Sem movimentações registradas ainda" />
        ) : (
          <ol className="panel divide-y divide-border">
            {(history.data ?? []).map((h) => (
              <li key={h.id} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{h.acao}</p>
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
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
