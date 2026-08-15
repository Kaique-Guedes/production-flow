export function kg(value: number | null | undefined): string {
  const v = Number(value ?? 0);
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
}

export function num(value: number | null | undefined, digits = 2): string {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function pct(part: number | null | undefined, total: number | null | undefined): number {
  const t = Number(total ?? 0);
  if (t <= 0) return 0;
  return Math.min(100, Math.round((Number(part ?? 0) / t) * 100));
}

export function dateBR(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  return d.toLocaleDateString("pt-BR");
}

export function dateTimeBR(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Duração legível entre duas datas (ou até agora). */
export function duration(start: string | null | undefined, end?: string | null): string {
  if (!start) return "—";
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  if (ms < 0) return "—";
  const min = Math.floor(ms / 60000);
  const days = Math.floor(min / 1440);
  const hours = Math.floor((min % 1440) / 60);
  const mins = min % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}

export function daysLate(prazo: string | null | undefined): number {
  if (!prazo) return 0;
  const d = new Date(`${prazo}T12:00:00`).getTime();
  return Math.floor((Date.now() - d) / 86400000);
}
