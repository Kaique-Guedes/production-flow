import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/pcp/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { grantRole, profilesQuery, qk, revokeRole, rolesQuery } from "@/lib/pcp/api";
import { ROLE_LABEL, ROLES, type AppRole } from "@/lib/pcp/constants";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — PCP Caldeiraria" },
      {
        name: "description",
        content:
          "Gestão de perfis de acesso: administrador, planejamento, preparativo, montagem, solda e acabamento.",
      },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const auth = useAuth();

  if (!auth.loading && !auth.isAdmin) {
    return (
      <div>
        <PageHeader title="Usuários" />
        <div className="panel flex flex-col items-center gap-2 p-10 text-center">
          <ShieldAlert className="size-8 text-warning" />
          <p className="font-display text-base font-semibold uppercase">Acesso restrito</p>
          <p className="text-sm text-muted-foreground">
            Somente administradores podem gerenciar perfis de acesso.
          </p>
        </div>
      </div>
    );
  }

  return <UsuariosContent />;
}

function UsuariosContent() {
  const qc = useQueryClient();
  const profiles = useQuery(profilesQuery());
  const roles = useQuery(rolesQuery());

  const invalidate = () => qc.invalidateQueries({ queryKey: ["all-roles"] });

  const grant = useMutation({
    mutationFn: (vars: { userId: string; role: AppRole }) => grantRole(vars.userId, vars.role),
    onSuccess: () => {
      invalidate();
      toast.success("Função concedida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (roleRowId: string) => revokeRole(roleRowId),
    onSuccess: () => {
      invalidate();
      toast.success("Função removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rolesByUser = new Map<string, { id: string; role: AppRole }[]>();
  for (const r of roles.data ?? []) {
    const list = rolesByUser.get(r.user_id) ?? [];
    list.push(r);
    rolesByUser.set(r.user_id, list);
  }

  const rows = profiles.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        subtitle="Cada perfil libera o apontamento no setor correspondente. Administrador acessa tudo."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum usuário cadastrado"
          description="Os usuários aparecem aqui após o primeiro acesso ao sistema."
        />
      ) : (
        <div className="panel divide-y divide-border">
          {rows.map((p) => {
            const userRoles = rolesByUser.get(p.id) ?? [];
            const available = ROLES.filter((r) => !userRoles.some((ur) => ur.role === r));
            return (
              <UserRow
                key={p.id}
                name={p.full_name || "Usuário"}
                userRoles={userRoles}
                available={available}
                onGrant={(role) => grant.mutate({ userId: p.id, role })}
                onRevoke={(id) => revoke.mutate(id)}
                busy={grant.isPending || revoke.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserRow({
  name,
  userRoles,
  available,
  onGrant,
  onRevoke,
  busy,
}: {
  name: string;
  userRoles: { id: string; role: AppRole }[];
  available: AppRole[];
  onGrant: (role: AppRole) => void;
  onRevoke: (id: string) => void;
  busy: boolean;
}) {
  const [picked, setPicked] = useState<string>("");

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {userRoles.length === 0 ? (
            <span className="text-xs text-muted-foreground">sem função</span>
          ) : (
            userRoles.map((ur) => (
              <span
                key={ur.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
              >
                {ROLE_LABEL[ur.role]}
                <button
                  aria-label={`Remover função ${ROLE_LABEL[ur.role]}`}
                  disabled={busy}
                  onClick={() => onRevoke(ur.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {available.length > 0 ? (
        <div className="flex items-center gap-2">
          <Select value={picked} onValueChange={setPicked}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Nova função" />
            </SelectTrigger>
            <SelectContent>
              {available.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="accent"
            disabled={!picked || busy}
            onClick={() => {
              onGrant(picked as AppRole);
              setPicked("");
            }}
          >
            Adicionar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
