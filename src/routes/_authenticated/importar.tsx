import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldAlert, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/pcp/PageHeader";
import { StatusPill } from "@/components/pcp/StageBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  clientsQuery,
  createClientRow,
  createDrawing,
  createDrawingItemsBulk,
  createLot,
  createWorkOrder,
  drawingsQuery,
  qk,
  workOrdersQuery,
} from "@/lib/pcp/api";
import { kg, num } from "@/lib/pcp/format";

export const Route = createFileRoute("/_authenticated/importar")({
  head: () => ({
    meta: [
      { title: "Importar planilha — PCP Caldeiraria" },
      {
        name: "description",
        content:
          "Importa uma planilha de produção (Des. n°, Denominação, POS., QT., Peso) e gera desenhos, itens e lotes automaticamente.",
      },
    ],
  }),
  component: ImportarPage,
});

/* --------------------------------- parsing --------------------------------- */

const COLS = {
  des: "Des. n°",
  den: "Denominação",
  pos: "POS.",
  qt: "QT.",
  peso: "Peso",
} as const;

interface ImportItem {
  codigoItem: string;
  descricao: string;
  quantidade: number;
  pesoUnitario: number;
}
interface ImportDrawing {
  codigo: string;
  itens: ImportItem[];
  pesoTotal: number;
}
interface ParsedImport {
  fileName: string;
  osNumero: string;
  drawings: ImportDrawing[];
  totalItens: number;
  totalPeso: number;
}

function parseRows(
  rows: Record<string, unknown>[],
  fileName: string,
): { data?: ParsedImport; error?: string } {
  const sample = rows[0] ?? {};
  const missing = Object.values(COLS).filter((c) => !(c in sample));
  if (missing.length > 0) {
    return {
      error: `Colunas não encontradas na planilha: ${missing.join(", ")}. Confira se os nomes das colunas batem exatamente (incluindo maiúsculas e pontuação).`,
    };
  }

  const byDrawing = new Map<string, ImportDrawing & { osNumero: string }>();
  const osNumeros = new Set<string>();

  rows.forEach((row) => {
    const desN = String(row[COLS.des] ?? "").trim();
    if (!desN || !desN.includes("/")) return;
    const [osRaw, ...rest] = desN.split("/");
    const os = (osRaw ?? "").trim();
    const codigo = rest.join("/").trim();
    if (!os || !codigo) return;
    osNumeros.add(os);

    const key = `${os}/${codigo}`;
    if (!byDrawing.has(key)) byDrawing.set(key, { osNumero: os, codigo, itens: [], pesoTotal: 0 });
    const entry = byDrawing.get(key)!;

    const qt = Number(row[COLS.qt]) || 0;
    const pesoLinha = Number(row[COLS.peso]) || 0;
    entry.itens.push({
      codigoItem: String(row[COLS.pos] ?? "").trim() || "ITEM",
      descricao: String(row[COLS.den] ?? "").trim(),
      quantidade: qt,
      pesoUnitario: qt > 0 ? pesoLinha / qt : pesoLinha,
    });
    entry.pesoTotal += pesoLinha;
  });

  if (osNumeros.size > 1) {
    return {
      error: `Esta planilha tem mais de uma O.S. na coluna "Des. n°" (${[...osNumeros].join(", ")}). Importe uma O.S. por vez — separe o arquivo se precisar.`,
    };
  }

  const drawings = [...byDrawing.values()];
  if (drawings.length === 0) {
    return {
      error:
        "Nenhuma linha válida encontrada (confira a coluna 'Des. n°', formato esperado OS/DESENHO, ex: 225001/4250).",
    };
  }

  return {
    data: {
      fileName,
      osNumero: drawings[0]!.osNumero,
      drawings: drawings.map(({ osNumero: _os, ...d }) => d),
      totalItens: drawings.reduce((a, d) => a + d.itens.length, 0),
      totalPeso: drawings.reduce((a, d) => a + d.pesoTotal, 0),
    },
  };
}

/* --------------------------------- página ---------------------------------- */

function ImportarPage() {
  const auth = useAuth();

  if (!auth.loading && !auth.isPlanner) {
    return (
      <div>
        <PageHeader title="Importar planilha" />
        <div className="panel flex flex-col items-center gap-2 p-10 text-center">
          <ShieldAlert className="size-8 text-warning" />
          <p className="font-display text-base font-semibold uppercase">Acesso restrito</p>
          <p className="text-sm text-muted-foreground">
            Somente planejamento e administradores podem importar planilhas.
          </p>
        </div>
      </div>
    );
  }

  return <ImportarContent />;
}

function ImportarContent() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<ParsedImport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");

  const clients = useQuery(clientsQuery());
  const workOrders = useQuery(workOrdersQuery());

  const existingWO = pending
    ? workOrders.data?.find((w) => w.numero.trim() === pending.osNumero)
    : undefined;

  const existingDrawings = useQuery({
    ...drawingsQuery(existingWO?.id ?? ""),
    enabled: !!existingWO,
  });

  const existingCodes = new Set((existingDrawings.data ?? []).map((d) => d.codigo.trim()));
  const statusPorDesenho = (pending?.drawings ?? []).map((d) => ({
    ...d,
    jaExiste: existingWO ? existingCodes.has(d.codigo) : false,
  }));
  const novos = statusPorDesenho.filter((d) => !d.jaExiste).length;
  const jaExistentes = statusPorDesenho.filter((d) => d.jaExiste).length;

  function resetPicker() {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setImportError(null);
    setPending(null);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
      if (!sheet) {
        setImportError("A planilha não tem nenhuma aba com dados.");
        return;
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const result = parseRows(rows, file.name);
      if (result.error) setImportError(result.error);
      else setPending(result.data ?? null);
    } catch (err) {
      setImportError(
        "Não consegui ler esse arquivo: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!pending) throw new Error("Selecione uma planilha primeiro.");

      let workOrderId = existingWO?.id;
      if (!workOrderId) {
        let clientId = selectedClientId;
        if (!clientId) {
          if (!newClientName.trim()) {
            throw new Error("Selecione um cliente existente ou informe o nome de um novo cliente.");
          }
          clientId = await createClientRow({ name: newClientName.trim() });
        }
        workOrderId = await createWorkOrder({ client_id: clientId, numero: pending.osNumero });
      }

      let criados = 0;
      let ignorados = 0;
      let itensCriados = 0;
      let pesoCriado = 0;

      for (const d of pending.drawings) {
        if (existingCodes.has(d.codigo)) {
          ignorados++;
          continue;
        }
        const drawingId = await createDrawing({ work_order_id: workOrderId, codigo: d.codigo });
        await createDrawingItemsBulk(
          drawingId,
          d.itens.map((it) => ({
            codigo_item: it.codigoItem,
            descricao: it.descricao,
            quantidade: it.quantidade || 1,
            peso_unitario: it.pesoUnitario,
          })),
        );
        await createLot({ drawing_id: drawingId, numero_lote: d.codigo, quantidade: 1 });
        criados++;
        itensCriados += d.itens.length;
        pesoCriado += d.pesoTotal;
      }

      return { workOrderId, criados, ignorados, itensCriados, pesoCriado };
    },
    onSuccess: async (result) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.clients }),
        qc.invalidateQueries({ queryKey: qk.workOrders }),
        qc.invalidateQueries({ queryKey: qk.lots }),
        qc.invalidateQueries({ queryKey: qk.drawings(result.workOrderId) }),
      ]);
      toast.success(
        `Importação concluída: ${result.criados} lote(s) novo(s)` +
          (result.ignorados > 0
            ? `, ${result.ignorados} desenho(s) já existente(s) ignorado(s)`
            : "") +
          ` — ${result.itensCriados} itens, ${kg(result.pesoCriado)}.`,
      );
      setPending(null);
      setSelectedClientId("");
      setNewClientName("");
      resetPicker();
      void navigate({ to: "/ordens/$id", params: { id: result.workOrderId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function cancelImport() {
    setPending(null);
    setImportError(null);
    setSelectedClientId("");
    setNewClientName("");
    resetPicker();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar planilha"
        subtitle="Carrega uma planilha de produção e gera desenhos, itens e lotes automaticamente no preparativo."
      />

      {importError ? (
        <div className="panel border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {importError}
        </div>
      ) : null}

      {!pending ? (
        <div className="panel space-y-3 p-6">
          <p className="text-sm font-medium">Selecione a planilha (.xlsx)</p>
          <p className="text-xs text-muted-foreground">
            Colunas esperadas: <span className="mono font-mono">Des. n°</span> (formato OS/DESENHO,
            ex: 225001/4250), <span className="font-mono">Denominação</span>,{" "}
            <span className="font-mono">POS.</span>, <span className="font-mono">QT.</span>,{" "}
            <span className="font-mono">Peso</span>. Cada desenho vira um lote novo no preparativo,
            com os itens prontos para apontamento.
          </p>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            A leitura acontece no próprio navegador — o arquivo não é enviado para nenhum lugar
            antes de você confirmar a importação.
          </p>
        </div>
      ) : (
        <div className="panel space-y-5 p-6">
          <div>
            <p className="text-sm font-semibold">Pré-visualização: {pending.fileName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              O.S. detectada: <span className="font-mono font-semibold">{pending.osNumero}</span> ·{" "}
              {pending.drawings.length} desenho(s) · {pending.totalItens} item(ns) ·{" "}
              {kg(pending.totalPeso)} no total
              {jaExistentes > 0 ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-warning-foreground">
                    {jaExistentes} já existente(s), será(ão) ignorado(s)
                  </span>
                </>
              ) : null}
            </p>
          </div>

          {existingWO ? (
            <StatusPill
              tone="primary"
              label={`O.S. já cadastrada — cliente ${existingWO.clients?.name ?? "—"}`}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Cliente existente</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={(v) => {
                    setSelectedClientId(v);
                    setNewClientName("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="novo-cliente">Ou cadastrar novo cliente</Label>
                <Input
                  id="novo-cliente"
                  placeholder="Ex: Metalúrgica Vale Alto"
                  value={newClientName}
                  onChange={(e) => {
                    setNewClientName(e.target.value);
                    if (e.target.value) setSelectedClientId("");
                  }}
                />
              </div>
            </div>
          )}

          <div className="divide-y divide-border rounded-md border border-border">
            <div className="grid grid-cols-4 gap-2 p-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Desenho</span>
              <span>Itens</span>
              <span>Peso</span>
              <span>Situação</span>
            </div>
            {statusPorDesenho.map((d) => (
              <div key={d.codigo} className="grid grid-cols-4 items-center gap-2 p-3 text-sm">
                <span className="font-mono font-semibold">{d.codigo}</span>
                <span>{num(d.itens.length, 0)}</span>
                <span className="tabular">{kg(d.pesoTotal)}</span>
                <StatusPill
                  label={d.jaExiste ? "Já existe" : "Novo"}
                  tone={d.jaExiste ? "muted" : "success"}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="success"
              className="flex-1"
              disabled={importMutation.isPending || novos === 0}
              onClick={() => importMutation.mutate()}
            >
              <Upload className="size-4" />
              {importMutation.isPending ? "Importando…" : "Confirmar importação"}
            </Button>
            <Button variant="outline" disabled={importMutation.isPending} onClick={cancelImport}>
              Cancelar
            </Button>
          </div>
          {novos === 0 ? (
            <p className="text-xs text-muted-foreground">
              Todos os desenhos desta planilha já existem no sistema — nada para importar.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
