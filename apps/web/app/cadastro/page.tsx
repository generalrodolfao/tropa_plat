"use client"

import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CadastroPage() {
  return (
    <div className="noise-bg grid min-h-screen place-items-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 grid size-14 place-items-center rounded-full bg-primary/10">
            <ShieldCheck className="size-7 text-primary" />
          </div>
          <CardTitle>Cadastro fechado</CardTitle>
          <CardDescription>
            Durante a fase de testes, os logins são emitidos pela equipe Tropa.
            Se você tem um convite, fale com o time de operações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
