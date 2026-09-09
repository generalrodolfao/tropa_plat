"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, Loader2, Terminal, Database, Copy, Check } from "lucide-react"

export type SandboxEngine = "sql" | "python"

interface SandboxEditorProps {
  engine: SandboxEngine
  initialCode?: string
  datasetUrl?: string
  datasetName?: string
  onRun?: (code: string) => Promise<void>
  onsubmit?: (code: string) => Promise<void>
  readOnly?: boolean
}

interface ExecutionResult {
  success: boolean
  output: string
  error?: string
  durationMs: number
  rowCount?: number
}

export function SandboxEditor({
  engine,
  initialCode = "",
  datasetUrl,
  datasetName,
  onRun,
  readOnly = false,
}: SandboxEditorProps) {
  // Templates por engine
  const templates: Record<SandboxEngine, string> = {
    sql: `-- Conecte-se ao dataset e explore os dados
-- Dataset: ${datasetName ?? "carregue um dataset primeiro"}

SELECT * FROM vendas LIMIT 10;

-- Conte linhas totais
-- SELECT COUNT(*) as total FROM vendas;

-- Agregue por coluna
-- SELECT estado, COUNT(*) as total, SUM(valor) as valor_total
-- FROM vendas
-- GROUP BY estado
-- ORDER BY valor_total DESC;`,
    python: `# Python com Pyodide (roda no navegador)
# Dataset: ${datasetName ?? "carregue um dataset primeiro"}

import pandas as pd

# Se houver um dataset CSV disponível:
# df = pd.read_csv("vendas.csv")
# print(df.head())
# print(f"Total de linhas: {len(df)}")

print("Olá do Sandbox Python!")
print("Execute código Python diretamente no navegador.")`,
  }

  const [code, setCode] = useState(() => initialCode || templates[engine])
  const [prevEngine, setPrevEngine] = useState(engine)
  if (prevEngine !== engine) {
    setPrevEngine(engine)
    setCode(initialCode || templates[engine])
  }
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleRun = useCallback(async () => {
    if (!code.trim() || running) return

    setRunning(true)
    setResult(null)
    const startTime = performance.now()

    try {
      // Enviar código para execução via Web Worker
      const executionResult = await executeCode(code, engine, datasetUrl)
      const durationMs = performance.now() - startTime

      setResult({
        success: true,
        output: executionResult.output,
        durationMs,
        rowCount: executionResult.rowCount,
      })
    } catch (error: any) {
      const durationMs = performance.now() - startTime
      setResult({
        success: false,
        output: "",
        error: error.message || "Erro desconhecido",
        durationMs,
      })
    } finally {
      setRunning(false)
    }
  }, [code, engine, datasetUrl, running])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter para executar
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      handleRun()
    }
    // Tab para indentar
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = e.currentTarget as HTMLTextAreaElement
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      setCode(code.substring(0, start) + "  " + code.substring(end))
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-accent" />
          <span className="font-mono text-xs font-semibold text-foreground">
            Sandbox — {engine.toUpperCase()}
          </span>
          {datasetName && (
            <Badge variant="secondary" className="gap-1 px-2 py-0 font-mono text-[10px]">
              <Database className="size-3" /> {datasetName}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={running || readOnly}
            className="gap-1.5"
          >
            {running ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
            {running ? "Executando..." : "Executar (Ctrl+Enter)"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-border/70 bg-background/60">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-500/60" />
            <div className="size-2.5 rounded-full bg-yellow-500/60" />
            <div className="size-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">sandbox.{engine === "sql" ? "sql" : "py"}</span>
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          className="min-h-[300px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          placeholder={`Digite seu código ${engine.toUpperCase()} aqui...`}
          spellCheck={false}
        />
      </div>

      {/* Output */}
      {result && (
        <Card className={`border ${result.success ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {result.success ? "Saída" : "Erro"}
                </span>
                {result.rowCount !== undefined && (
                  <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[10px]">
                    {result.rowCount} linhas
                  </Badge>
                )}
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {result.durationMs.toFixed(0)}ms
              </span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
              {result.success ? result.output : result.error}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------- Execution Engine ----------

async function executeCode(
  code: string,
  engine: SandboxEngine,
  datasetUrl?: string,
): Promise<{ output: string; rowCount?: number }> {
  if (engine === "sql") {
    return executeSQL(code, datasetUrl)
  } else if (engine === "python") {
    return executePython(code)
  }
  throw new Error(`Engine não suportada: ${engine}`)
}

async function executeSQL(code: string, datasetUrl?: string): Promise<{ output: string; rowCount?: number }> {
  // Usar DuckDB-WASM via dynamic import
  // @ts-ignore - duckdb-wasm não tem declarações de tipo
  const duckdb = await import("@duckdb/duckdb-wasm")

  const bundles = duckdb.getJsDelivrBundles()
  const bundle = await duckdb.selectBundle(bundles)

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" })
  )
  const worker = new Worker(worker_url)
  const logger = new duckdb.ConsoleLogger()
  const db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)

  const conn = await db.connect()

  try {
    // Se houver dataset, registrar como tabela
    if (datasetUrl) {
      const response = await fetch(datasetUrl)
      const buffer = await response.arrayBuffer()
      const fileName = datasetUrl.split("/").pop() ?? "dataset.csv"
      await db.registerFileBuffer(fileName, new Uint8Array(buffer))
      await conn.query(`CREATE TABLE IF NOT EXISTS vendas AS SELECT * FROM read_csv_auto('${fileName}')`)
    }

    const results: string[] = []
    let rowCount = 0

    // Separar por vírgulas e executar cada statement
    const statements = code.split(";").filter((s) => s.trim())

    for (const stmt of statements) {
      const trimmed = stmt.trim()
      if (!trimmed || trimmed.startsWith("--")) continue

      const result = await conn.query(trimmed)
      if (result.toArray().length > 0) {
        const rows = result.toArray()
        rowCount += rows.length
        // Formatar como tabela
        const columns = result.schema.fields.map((f: any) => f.name)
        const header = columns.join(" | ")
        const separator = columns.map(() => "---").join(" | ")
        const data = rows.slice(0, 100).map((row: any) =>
          columns.map((col: any) => String(row[col])).join(" | ")
        )
        results.push([header, separator, ...data].join("\n"))
        if (rows.length > 100) {
          results.push(`\n... (${rows.length - 100} linhas adicionais)`)
        }
      }
    }

    return {
      output: results.join("\n\n") || "Comando executado com sucesso.",
      rowCount,
    }
  } finally {
    await conn.close()
    await db.terminate()
    URL.revokeObjectURL(worker_url)
  }
}

async function executePython(code: string): Promise<{ output: string }> {
  // Usar Pyodide via dynamic import
  // @ts-ignore - pyodide não tem declarações de tipo
  const pyodideModule = await import("pyodide")

  const runtime = await pyodideModule.loadPyodide()

  try {
    // Capturar stdout/redirecionar para capturar output
    const setupCode = `
import sys
from io import StringIO
_old_stdout = sys.stdout
_sys_stdout = sys.stdout
sys.stdout = _captured = StringIO()
`

    await runtime.runPythonAsync(setupCode)
    await runtime.runPythonAsync(code)

    const captured = runtime.runPython("_captured.getvalue()")
    runtime.runPython("sys.stdout = _old_stdout")

    return { output: captured || "Código executado com sucesso." }
  } finally {
    // typos do pyodide não expõem destroy() (gap conhecido) — existe no runtime
    ;(runtime as any).destroy()
  }
}
