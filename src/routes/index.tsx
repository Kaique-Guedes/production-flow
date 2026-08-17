import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Factory, Flame, Hammer, Layers, Sparkles, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PCP Caldeiraria — Controle de produção por lote" },
      {
        name: "description",
        content:
          "Controle o fluxo real da caldeiraria: cliente, ordem de serviço, desenho, itens, lote e etapas de preparativo, montagem, solda e acabamento.",
      },
      { property: "og:title", content: "PCP Caldeiraria — Controle de produção por lote" },
      {
        property: "og:description",
        content:
          "Sistema industrial de planejamento e controle de produção com apontamento por lote e por item.",
      },
    ],
  }),
  component: Landing,
});

const FLUXO = [
  { label: "Preparativo", icon: Wrench, nota: "Apontamento item por item" },
  { label: "Montagem", icon: Hammer, nota: "Apontamento por lote" },
  { label: "Solda", icon: Flame, nota: "Apontamento por lote" },
  { label: "Acabamento", icon: Sparkles, nota: "Apontamento por lote" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded bg-primary text-primary-foreground">
              <Factory className="size-5" />
            </div>
            <span className="font-display text-base font-bold uppercase tracking-wider">
              PCP Caldeiraria
            </span>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">
              Entrar no sistema <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Planejamento e Controle de Produção
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold uppercase leading-tight md:text-5xl">
          O sistema acompanha o fluxo físico da fábrica, não uma lista de tarefas
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Cliente → ordem de serviço → desenho → itens → lote de produção → etapa. O lote é a
          unidade física de movimentação e carrega o peso: cada quilo aparece em uma única etapa,
          calculado automaticamente.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Acessar</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard">Ir para o dashboard</Link>
          </Button>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
            Fluxo de produção
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FLUXO.map((etapa) => (
              <div key={etapa.label} className="panel p-4">
                <etapa.icon className="size-5 text-primary" />
                <p className="font-display mt-3 text-base font-semibold uppercase">{etapa.label}</p>
                <p className="text-sm text-muted-foreground">{etapa.nota}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-3 md:grid-cols-3">
          {[
            {
              t: "Peso sem duplicação",
              d: "O peso do lote é somado a partir dos itens e contabilizado apenas na etapa atual.",
              i: Layers,
            },
            {
              t: "Movimentação controlada",
              d: "Somente a sequência válida avança. Retorno exige justificativa registrada.",
              i: ArrowRight,
            },
            {
              t: "Histórico completo",
              d: "Usuário, data, hora, etapa anterior, nova etapa, ação e observação.",
              i: Factory,
            },
          ].map((c) => (
            <div key={c.t} className="panel p-5">
              <c.i className="size-5 text-accent" />
              <p className="font-display mt-3 text-base font-semibold uppercase">{c.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
