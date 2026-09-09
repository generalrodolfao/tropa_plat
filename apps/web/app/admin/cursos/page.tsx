"use client"

import { useEffect, useState } from "react"
import { BookOpen, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  level: string | null
  status: string
  xpTotal: number
  publishedAt: string | null
  modules?: any[]
}

export default function AdminCursosPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: "", slug: "", description: "", level: "Iniciante" })

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/content/courses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCourses(Array.isArray(data) ? data : [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function createCourse() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/content/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(newCourse),
      })
      if (res.ok) {
        setShowCreate(false)
        setNewCourse({ title: "", slug: "", description: "", level: "Iniciante" })
        loadCourses()
      }
    } catch {
      // silently fail
    }
  }

  async function publishCourse(courseId: string) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/content/courses/${courseId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      loadCourses()
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gerenciar Cursos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie, edite e publique cursos da plataforma.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="size-4" /> Novo Curso
        </Button>
      </div>

      {showCreate && (
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Criar Novo Curso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground">Título</label>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Ex: SQL do Zero"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Slug</label>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={newCourse.slug}
                  onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value })}
                  placeholder="sql-do-zero"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Descrição</label>
              <textarea
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createCourse}>Criar</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Curso</th>
                  <th className="px-4 py-3 font-medium">Nível</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">XP</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
                ) : courses.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum curso encontrado.</td></tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <BookOpen className="size-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-foreground">{course.title}</div>
                            <div className="text-xs text-muted-foreground">{course.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{course.level ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={course.status === "published" ? "default" : "secondary"}>
                          {course.status === "published" ? "Publicado" : course.status === "draft" ? "Rascunho" : "Arquivado"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{course.xpTotal}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {course.status !== "published" && (
                            <Button variant="ghost" size="sm" onClick={() => publishCourse(course.id)}>
                              <Eye className="size-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Edit className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
