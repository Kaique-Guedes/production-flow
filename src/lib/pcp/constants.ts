export const ETAPAS = ["preparativo", "montagem", "solda", "acabamento", "concluido"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const ETAPAS_PRODUTIVAS = ["preparativo", "montagem", "solda", "acabamento"] as const;
export type EtapaProdutiva = (typeof ETAPAS_PRODUTIVAS)[number];

export const ROLES = [
  "administrador",
  "planejamento",
  "preparativo",
  "montagem",
  "solda",
  "acabamento",
] as const;
export type AppRole = (typeof ROLES)[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  administrador: "Administrador",
  planejamento: "Planejamento",
  preparativo: "Preparativo",
  montagem: "Montagem",
  solda: "Solda",
  acabamento: "Acabamento",
};

export const ETAPA_LABEL: Record<Etapa, string> = {
  preparativo: "Preparativo",
  montagem: "Montagem",
  solda: "Solda",
  acabamento: "Acabamento",
  concluido: "Concluído",
};

/** Classes de cor por etapa — sempre tokens do design system. */
export const ETAPA_STYLE: Record<Etapa, { dot: string; badge: string; bar: string }> = {
  preparativo: {
    dot: "bg-stage-prep",
    badge: "bg-stage-prep/12 text-stage-prep border-stage-prep/30",
    bar: "bg-stage-prep",
  },
  montagem: {
    dot: "bg-stage-mont",
    badge: "bg-stage-mont/12 text-stage-mont border-stage-mont/30",
    bar: "bg-stage-mont",
  },
  solda: {
    dot: "bg-stage-solda",
    badge: "bg-stage-solda/12 text-stage-solda border-stage-solda/30",
    bar: "bg-stage-solda",
  },
  acabamento: {
    dot: "bg-stage-acab",
    badge: "bg-stage-acab/12 text-stage-acab border-stage-acab/30",
    bar: "bg-stage-acab",
  },
  concluido: {
    dot: "bg-stage-done",
    badge: "bg-stage-done/12 text-stage-done border-stage-done/30",
    bar: "bg-stage-done",
  },
};

export const OS_STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_producao: "Em produção",
  atrasada: "Atrasada",
  concluida: "Concluída",
};

export const LOT_STATUS_LABEL: Record<string, string> = {
  aguardando: "Aguardando",
  em_execucao: "Em execução",
  concluido: "Concluído",
};

export const ITEM_STATUS_LABEL: Record<string, string> = {
  aguardando: "Aguardando",
  em_preparacao: "Em preparação",
  pausado: "Pausado",
  concluido: "Concluído",
};

/** Etapa seguinte na sequência obrigatória (espelha a regra do banco). */
export function nextEtapa(e: Etapa): Etapa | null {
  const i = ETAPAS.indexOf(e);
  return i >= 0 && i < ETAPAS.length - 1 ? ETAPAS[i + 1]! : null;
}

export function prevEtapa(e: Etapa): Etapa | null {
  const i = ETAPAS.indexOf(e);
  return i > 0 ? ETAPAS[i - 1]! : null;
}
