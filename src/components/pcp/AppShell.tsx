import { Link, useRouterState } from "@tanstack/react-router";
import {
  ClipboardList,
  Factory,
  Flame,
  Gauge,
  Hammer,
  History,
  LogOut,
  Menu,
  Sparkles,
  Upload,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABEL } from "@/lib/pcp/constants";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Gauge;
  visible: (ctx: ReturnType<typeof useAuth>) => boolean;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge, visible: () => true },
  { to: "/producao", label: "Controle de produção", icon: Factory, visible: () => true },
  { to: "/ordens", label: "Ordens de serviço", icon: ClipboardList, visible: () => true },
  {
    to: "/setor/preparativo",
    label: "Preparativo",
    icon: Wrench,
    visible: (a) => a.canWork("preparativo") || a.isPlanner,
  },
  {
    to: "/setor/montagem",
    label: "Montagem",
    icon: Hammer,
    visible: (a) => a.canWork("montagem") || a.isPlanner,
  },
  {
    to: "/setor/solda",
    label: "Solda",
    icon: Flame,
    visible: (a) => a.canWork("solda") || a.isPlanner,
  },
  {
    to: "/setor/acabamento",
    label: "Acabamento",
    icon: Sparkles,
    visible: (a) => a.canWork("acabamento") || a.isPlanner,
  },
  { to: "/clientes", label: "Clientes", icon: Users, visible: (a) => a.isPlanner },
  { to: "/historico", label: "Histórico", icon: History, visible: () => true },
  { to: "/importar", label: "Importar planilha", icon: Upload, visible: (a) => a.isPlanner },
  { to: "/usuarios", label: "Usuários", icon: Users, visible: (a) => a.isAdmin },
];

export function AppShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV.filter((item) => item.visible(auth));

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground">
            <Factory className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold uppercase tracking-wider">
              PCP Caldeiraria
            </p>
            <p className="text-[11px] text-sidebar-foreground/60">Planejamento e controle</p>
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <p className="truncate text-sm font-medium">{auth.fullName || auth.user?.email}</p>
          <p className="mb-3 text-[11px] text-sidebar-foreground/60">
            {auth.roles.length ? auth.roles.map((r) => ROLE_LABEL[r]).join(" · ") : "Sem função"}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => void auth.signOut()}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <span className="font-display text-sm font-bold uppercase">PCP Caldeiraria</span>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
