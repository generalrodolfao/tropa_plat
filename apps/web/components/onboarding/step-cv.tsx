"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2, AlertTriangle, FileText, X } from "lucide-react"
import { aiApi } from "@/lib/api/service"

interface StepCVProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepCV({ data, onUpdate }: StepCVProps) {
  const [cvText, setCvText] = useState(data.cvText || "")
  const [parsedData, setParsedData] = useState(data.cvParsed || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleParse = async () => {
    setError(null)
    if (cvText.trim().length < 50) {
      setError("Cole o texto do seu CV (mínimo 50 caracteres).")
      return
    }
    setLoading(true)
    try {
      const parsed = await aiApi.parseCv(cvText)
      setParsedData(parsed)
      onUpdate({ cvText, cvParsed: parsed })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao analisar o CV.")
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setCvText("")
    setParsedData(null)
    onUpdate({ cvText: null, cvParsed: null })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-semibold text-white">Seu Currículo</h3>
        <p className="text-sm text-slate-400">
          Cole o conteúdo do seu CV para a IA extrair skills e experiência. Este passo é opcional.
        </p>
      </div>

      {!parsedData ? (
        <div className="space-y-3">
          <Textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="Cole aqui o texto do seu CV (experiência, skills, formação, projetos)..."
            className="min-h-52 border-slate-600 bg-slate-700/50 font-mono text-xs text-white placeholder:text-slate-500"
          />
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-slate-400"
              onClick={() => onUpdate({ cvText: null, cvParsed: null })}
            >
              Pular por agora
            </Button>
            <Button onClick={handleParse} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
              {loading ? "Analisando..." : "Analisar com IA"}
            </Button>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle className="size-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="border-slate-600 bg-slate-700/50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <FileText className="size-7 text-purple-400" />
                <div>
                  <p className="font-medium text-white">CV analisado</p>
                  <p className="text-sm text-slate-400">{cvText.length} caracteres processados</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemove}>
                <X className="size-4 text-slate-400" />
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-700/30 p-3">
              <p className="text-sm text-slate-400">Nome</p>
              <p className="text-white">{parsedData.name || "—"}</p>
            </div>
            <div className="rounded-lg bg-slate-700/30 p-3">
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-white">{parsedData.email || "Não encontrado"}</p>
            </div>
          </div>

          {parsedData.skills?.length > 0 && (
            <div className="rounded-lg bg-slate-700/30 p-3">
              <p className="text-sm text-slate-400">Skills identificadas</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {parsedData.skills.map((skill: any, i: number) => (
                  <span key={i} className="rounded bg-purple-500/20 px-2 py-1 text-sm text-purple-300">
                    {skill.name} (Nível {skill.level})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
