import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Factory } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — PCP Caldeiraria" },
      { name: "description", content: "Acesse o sistema de planejamento e controle de produção da caldeiraria." },
      { property: "og:title", content: "Entrar — PCP Caldeiraria" },
      { property: "og:description", content: "Acesso restrito aos setores de produção e planejamento." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  const signIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void navigate({ to: "/dashboard" }),
    onError: (e: Error) => toast.error(e.message),
  });

  const signUp = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: fullName },
        },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => toast.success("Conta criada. Faça login para continuar."),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex size-10 items-center justify-center rounded bg-primary text-primary-foreground">
            <Factory className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold uppercase tracking-wider">PCP Caldeiraria</p>
            <p className="text-xs text-muted-foreground">Planejamento e controle de produção</p>
          </div>
        </div>

        <div className="panel p-6">
          <Tabs defaultValue="entrar">
            <TabsList className="w-full">
              <TabsTrigger value="entrar" className="flex-1">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="criar" className="flex-1">
                Criar conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entrar" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={signIn.isPending || !email || !password}
                onClick={() => signIn.mutate()}
              >
                Entrar
              </Button>
            </TabsContent>

            <TabsContent value="criar" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email2">E-mail</Label>
                <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password2">Senha</Label>
                <Input
                  id="password2"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                variant="accent"
                disabled={signUp.isPending || !email || password.length < 6 || !fullName}
                onClick={() => signUp.mutate()}
              >
                Criar conta
              </Button>
              <p className="text-xs text-muted-foreground">
                O primeiro usuário cadastrado assume o perfil de administrador e libera os demais
                acessos.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
