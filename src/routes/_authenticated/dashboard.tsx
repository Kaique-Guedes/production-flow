import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CircleCheck, Layers, Scale } from "lucide-react";
import { useState } from "react";

import { EmptyState, PageHeader } from "@/components/pcp/PageHeader";
import { StageBadge } from "@/components/pcp/StageBadge";
import { ProgressBar, StatCard } from "@/components/pcp/StatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lotsQuery, workOrdersQuery } from "@/lib/pcp/api";
import { ETAPAS_PRODUTIVAS, ETAPA_LABEL, ETAPA_STYLE, OS_STATUS_LABEL } from "@/lib/pcp/constants";
import { dateBR, daysLate, kg, pct } from "@/lib/pcp/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PCP Caldeiraria" },
      {
        name: "description",
        content: "Carga por etapa, peso total em produção e ordens de serviço em andamento.",
      },
      { property: "og:title", content: "Dashboard — PCP Caldeiraria" },
      {
        property: "og:description",
        content: "Indicadores de carga por setor e situação das ordens de serviço.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const lots = useQuery(lotsQuery());
  const wos = useQuery(workOrdersQuery());
  const [osFilter, setOsFilter] = useState<string>("todas");

  const allWos = wos.data ?? [];
  const allLots = lots.data ?? [];
  const all =
    osFilter === "todas" ? allLots : allLots.filter((l) => l.drawings?.work_order_id === osFilter);
  const emProducao = all.filter((l) => l.etapa_atual !== "concluido");
  const pesoTotal = all.reduce((s, l) => s + Number(l.peso), 0);
  const pesoConcluido = all
    .filter((l) => l.etapa_atual === "concluido")
    .reduce((s, l) => s + Number(l.peso), 0);
  const pesoProducao = pesoTotal - pesoConcluido;

  const porEtapa = ETAPAS_PRODUTIVAS.map((etapa) => {
    const lotesEtapa = emProducao.filter((l) => l.etapa_atual === etapa);
    return {
      etapa,
      lotes: lotesEtapa.length,
      peso: lotesEtapa.reduce((s, l) => s + Number(l.peso), 0),
    };
  });

  const wosFiltradas = osFilter === "todas" ? allWos : allWos.filter((w) => w.id === osFilter);
  const atrasadas = wosFiltradas.filter((w) => w.status !== "concluida" && daysLate(w.prazo) > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Dashboard de produção"
          subtitle="Cada lote aparece em uma única etapa. O peso é calculado a partir dos itens e nunca digitado por setor."
        />
        <div className="w-full max-w-[220px] sm:w-auto">
          <Select value={osFilter} onValueChange={setOsFilter}>
            <SelectTrigger aria-label="Filtrar por O.S.">
              <SelectValue placeholder="Filtrar por O.S." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as O.S.</SelectItem>
              {allWos.map((wo) => (
                <SelectItem key={wo.id} value={wo.id}>
                  O.S. {wo.numero}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Peso total cadastrado" value={kg(pesoTotal)} icon={Scale} />
        <StatCard label="Peso em produção" value={kg(pesoProducao)} icon={Layers} tone="warning" />
        <StatCard
          label="Peso concluído"
          value={kg(pesoConcluido)}
          icon={CircleCheck}
          tone="success"
          hint={`${pct(pesoConcluido, pesoTotal)}% do peso cadastrado`}
        />
        <StatCard
          label="O.S. atrasadas"
          value={String(atrasadas.length)}
          icon={AlertTriangle}
          tone={atrasadas.length ? "destructive" : "default"}
        />
      </div>

      <section>
        <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Carga por etapa
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {porEtapa.map((row) => (
            <Link
              key={row.etapa}
              to="/setor/$etapa"
              params={{ etapa: row.etapa }}
              className="panel space-y-3 p-4 transition-colors hover:border-primary"
            >
              <StageBadge etapa={row.etapa} />
              <p className="font-display text-2xl font-bold tabular">{kg(row.peso)}</p>
              <p className="text-xs text-muted-foreground">
                {row.lotes} lote(s) em {ETAPA_LABEL[row.etapa].toLowerCase()}
              </p>
              <ProgressBar
                value={pct(row.peso, pesoProducao)}
                barClassName={ETAPA_STYLE[row.etapa].bar}
              />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Ordens de serviço
          </h2>
          <Link to="/ordens" className="text-xs font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        {wosFiltradas.length === 0 ? (
          <EmptyState
            title={
              osFilter === "todas"
                ? "Nenhuma ordem de serviço cadastrada"
                : "Nenhuma O.S. encontrada para o filtro selecionado"
            }
            description="Cadastre um cliente e depois abra a primeira O.S. no menu Ordens de serviço."
          />
        ) : (
          <div className="panel divide-y divide-border">
            {wosFiltradas.slice(0, 8).map((wo) => {
              const late = daysLate(wo.prazo);
              return (
                <Link
                  key={wo.id}
                  to="/ordens/$id"
                  params={{ id: wo.id }}
                  className="block p-4 transition-colors hover:bg-secondary"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-base font-semibold uppercase">
                        O.S. {wo.numero}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {wo.clients?.name} · prazo {dateBR(wo.prazo)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular">
                        {kg(wo.peso_concluido)} / {kg(wo.peso_total)}
                      </p>
                      <p
                        className={
                          late > 0 && wo.status !== "concluida"
                            ? "text-xs font-semibold text-destructive"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {late > 0 && wo.status !== "concluida"
                          ? `${late} dia(s) em atraso`
                          : (OS_STATUS_LABEL[wo.status] ?? wo.status)}
                      </p>
                    </div>
                  </div>
                  <ProgressBar value={pct(wo.peso_concluido, wo.peso_total)} className="mt-3" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
