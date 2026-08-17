import { useMutation } from "@tanstack/react-query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/pcp/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const auth = useAuth();

  const bootstrap = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: auth.user!.id, role: "administrador" });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await auth.refreshRoles();
      toast.success("Perfil de administrador ativado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!auth.loading && auth.user && auth.roles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
        <div className="panel max-w-md space-y-4 p-6 text-center">
          <ShieldAlert className="mx-auto size-8 text-warning" />
          <h1 className="font-display text-xl font-bold uppercase">Acesso sem perfil</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta ({auth.user.email}) ainda não possui um perfil de acesso. Solicite ao
            administrador a liberação do setor correspondente.
          </p>
          <p className="text-xs text-muted-foreground">
            Se este é o primeiro acesso do sistema, ative o perfil de administrador abaixo.
          </p>
          <div className="flex flex-col gap-2">
            <Button disabled={bootstrap.isPending} onClick={() => bootstrap.mutate()}>
              Ativar administrador (primeiro acesso)
            </Button>
            <Button variant="outline" onClick={() => void auth.signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
