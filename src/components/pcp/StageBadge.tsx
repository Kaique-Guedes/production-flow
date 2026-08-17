import { cn } from "@/lib/utils";
import { ETAPA_LABEL, ETAPA_STYLE, type Etapa } from "@/lib/pcp/constants";

export function StageBadge({
  etapa,
  className,
  size = "sm",
}: {
  etapa: Etapa;
  className?: string;
  size?: "sm" | "md";
}) {
  const style = ETAPA_STYLE[etapa];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        style.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {ETAPA_LABEL[etapa]}
    </span>
  );
}

export function StatusPill({
  label,
  tone = "muted",
  className,
}: {
  label: string;
  tone?: "muted" | "success" | "warning" | "destructive" | "primary";
  className?: string;
}) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground border-border",
    success: "bg-success/12 text-success border-success/30",
    warning: "bg-warning/15 text-warning-foreground border-warning/40",
    destructive: "bg-destructive/12 text-destructive border-destructive/30",
    primary: "bg-primary/10 text-primary border-primary/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
