"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, X } from "lucide-react"
import { API_BASE, getAuthHeaders } from "@/lib/api/client"

interface StepCVProps {
  data: any
  onUpdate: (data: any) => void
}

export function StepCV({ data, onUpdate }: StepCVProps) {
  const [file, setFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState(data.cvText || "")
  const [parsedData, setParsedData] = useState(data.cvParsed || null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)

    try {
      // Extract text from PDF/DOCX (client-side or API)
      const formData = new FormData()
      formData.append("file", selectedFile)

      const extractRes = await fetch(`${API_BASE}/v1/content/cv/extract`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      })
      const extractResult = await extractRes.json()
      setExtractedText(extractResult.text)

      // Parse CV with AI
      const parseRes = await fetch(`${API_BASE}/v1/ai/cv/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ text: extractResult.text }),
      })
      const parsed = await parseRes.json()
      setParsedData(parsed)
      onUpdate({ cvText: extractResult.text, cvParsed: parsed })
    } catch (error) {
      console.error("Failed to process CV:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setExtractedText("")
    setParsedData(null)
    onUpdate({ cvText: null, cvParsed: null })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Seu Currículo</h3>
        <p className="text-slate-400 text-sm">
          Envie seu CV para análise inteligente. Aceitos: PDF, DOCX, TXT.
        </p>
      </div>

      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 transition-colors"
        >
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300">Clique para enviar seu CV</p>
          <p className="text-slate-500 text-sm mt-1">ou arraste e solte</p>
        </div>
      ) : (
        <Card className="bg-slate-700/50 border-slate-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-slate-400 text-sm">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemove}>
              <X className="h-4 w-4 text-slate-400" />
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          <span className="ml-3 text-slate-300">Processando CV...</span>
        </div>
      )}

      {parsedData && (
        <div className="space-y-4">
          <h4 className="text-white font-medium">Dados Extraídos:</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <p className="text-slate-400 text-sm">Nome</p>
              <p className="text-white">{parsedData.name}</p>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <p className="text-slate-400 text-sm">Email</p>
              <p className="text-white">{parsedData.email || "Não encontrado"}</p>
            </div>
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <p className="text-slate-400 text-sm">Skills Identificadas</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {parsedData.skills?.map((skill: any, i: number) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm"
                >
                  {skill.name} (Nível {skill.level})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
